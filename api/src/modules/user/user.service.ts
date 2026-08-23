import { UserRepository } from "./user.repository";
import { logger } from "../../utils/logger";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { createUserType } from "./user.type";
import { hashUtils } from "../../container";
import { mailer } from "../../container";
import { HashUtils } from "../../utils/hash-utils";
import { Mailer } from "../../utils/mailer-utils";
import {
  ACTIVE_ORDER_STATUSES,
  buildDriverOnboardingStatus,
  normalizeVehicleType,
} from "../../utils/driver-onboarding";
import Order from "../order/order.model";

export class UserService {
  constructor(
    private userRepo: UserRepository,
    private hashUtils: HashUtils,
    private mailer: Mailer
  ) { }

  createUser = async (userBody: createUserType) => {
    const existingUser = await this.userRepo.findUserByEmail(userBody.email);

    if (existingUser) {
      throw new apiError(
        Errors.AlreadyExists.code,
        "User already exists with this email"
      );
    }

    const hashedPassword = await this.hashUtils.hashPassword(userBody.password);

    const user = {
      ...userBody,
      password: hashedPassword,
    };

    const newUser = await this.userRepo.createUser(user);
    //await this.mailerUtils.sendPassword(userBody.email, userBody.password);

    return newUser;
  };

  getUserProfile = async (id: string) => {
    const user = await this.userRepo.findUserById(id);
    if (!user) return user;

    if (user.role === "Rider") {
      return {
        ...user,
        onboarding: buildDriverOnboardingStatus(user),
      };
    }

    return user;
  };

  getAllUsers = async (query: any) => {
    const users = await this.userRepo.getAllUsers(query);
    if (query.role !== "Rider") {
      return users;
    }

    return {
      ...users,
      data: users.data.map((user: any) => {
        const userObject = user?.toObject?.() ?? user;
        return {
          ...userObject,
          onboarding: buildDriverOnboardingStatus(userObject),
        };
      }),
    };
  }
  getUserById = async (id: string) => {
    const user = await this.userRepo.findUserById(id);
    if (user?.role === "Rider") {
      return {
        ...user,
        onboarding: buildDriverOnboardingStatus(user),
      };
    }
    return user;
  }

  updateMyProfile = async (id: string, body: any) => {
    const currentUser = await this.userRepo.findUserById(id);
    if (!currentUser) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }

    const updateBody = { ...body };
    if (typeof updateBody.isOnline === "string") {
      updateBody.isOnline = updateBody.isOnline === "true";
    }

    if (updateBody.vehicle?.type) {
      updateBody.vehicle = {
        ...updateBody.vehicle,
        type: normalizeVehicleType(updateBody.vehicle.type),
      };
      if (!updateBody.vehicle.type) {
        throw new apiError(Errors.BadRequest.code, "Invalid vehicle type");
      }
    }

    if (currentUser.role === "Rider" && updateBody.isOnline === true) {
      const nextUser = { ...currentUser, ...updateBody };
      const onboarding = buildDriverOnboardingStatus(nextUser);
      if (!onboarding.canGoOnline) {
        throw new apiError(
          Errors.BadRequest.code,
          `Please complete all required onboarding steps and wait for admin approval before going online. Missing: ${onboarding.missingRequirements.join(", ")}`
        );
      }
    }

    const updatedUser = await this.userRepo.updateMyProfile(id, updateBody);
    if (updatedUser?.role === "Rider") {
      const userObject = (updatedUser as any).toObject?.() ?? updatedUser;
      return {
        ...userObject,
        onboarding: buildDriverOnboardingStatus(updatedUser),
      };
    }
    return updatedUser;
  };

  updateUser = async (id: string, body: any) => {
    const updateBody = { ...body };

    if (updateBody.vehicle?.type) {
      updateBody.vehicle = {
        ...updateBody.vehicle,
        type: normalizeVehicleType(updateBody.vehicle.type),
      };
      if (!updateBody.vehicle.type) {
        throw new apiError(Errors.BadRequest.code, "Invalid vehicle type");
      }
    }

    if (["Pending", "Blocked", "Rejected"].includes(updateBody.status)) {
      updateBody.isOnline = false;
    }

    const updatedUser = await this.userRepo.updateUser(id, updateBody);
    if (updatedUser?.role === "Rider") {
      const userObject = (updatedUser as any).toObject?.() ?? updatedUser;
      return {
        ...userObject,
        onboarding: buildDriverOnboardingStatus(userObject),
      };
    }
    return updatedUser;
  }

  // getSalesReps = async (query: any) => {
  //   return await this.userRepo.getSalesReps(query)
  // }
  deleteUser = async (id: string) => {
    return await this.userRepo.deleteUser(id)
  };

  deleteMyAccount = async (id: string) => {
    const user = await this.userRepo.findUserById(id);
    if (!user) {
      throw new apiError(Errors.NotFound.code, "User not found");
    }

    const activeOrderFilter =
      user.role === "Rider"
        ? {
            rider: id,
            status: { $in: [...ACTIVE_ORDER_STATUSES] },
          }
        : {
            user: id,
            status: { $nin: ["Completed", "Cancelled"] },
          };

    const activeOrder = await Order.findOne(activeOrderFilter).lean();
    if (activeOrder) {
      throw new apiError(
        Errors.BadRequest.code,
        "You cannot delete your account while you have an active order."
      );
    }

    return await this.userRepo.deleteUser(id);
  };

  updateLocation = async (id: string, latitude: number, longitude: number) => {
    return await this.userRepo.updateLocation(id, latitude, longitude);
  };

  updateDriverDocuments = async (id: string, docs: any) => {
    const updatedUser = await this.userRepo.updateDriverDocuments(id, docs);
    if (updatedUser?.role === "Rider") {
      const userObject = (updatedUser as any).toObject?.() ?? updatedUser;
      return {
        ...userObject,
        onboarding: buildDriverOnboardingStatus(updatedUser),
      };
    }
    return updatedUser;
  };

  updatePayoutAccount = async (id: string, body: any) => {
    const accountNumber = String(body.accountNumber || "").trim();
    const accountNumberLast4 =
      body.accountNumberLast4 ||
      (accountNumber ? accountNumber.slice(-4) : undefined);

    const payoutAccount = {
      provider: "Tap",
      status: "Connected",
      tapMerchantId: body.tapMerchantId,
      accountHolderName: body.accountHolderName,
      bankName: body.bankName,
      iban: body.iban,
      accountNumberLast4,
      country: body.country || "AE",
      currency: body.currency || "AED",
      connectedAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUser = await this.userRepo.updatePayoutAccount(
      id,
      payoutAccount
    );
    if (updatedUser?.role === "Rider") {
      const userObject = (updatedUser as any).toObject?.() ?? updatedUser;
      return {
        ...userObject,
        onboarding: buildDriverOnboardingStatus(updatedUser),
      };
    }
    return updatedUser;
  };

  getAddresses = async (id: string) => {
    return await this.userRepo.getAddresses(id);
  };

  addAddress = async (id: string, address: any) => {
    return await this.userRepo.addAddress(id, address);
  };

  updateAddress = async (userId: string, addressId: string, addressBody: any) => {
    return await this.userRepo.updateAddress(userId, addressId, addressBody);
  };

  deleteAddress = async (userId: string, addressId: string) => {
    return await this.userRepo.deleteAddress(userId, addressId);
  };
}
