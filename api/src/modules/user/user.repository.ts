import { Types } from "mongoose";
import User from "./user.model";
import { logger } from "../../utils/logger";

export class UserRepository {
  constructor(private buildDynamicSearch: any) { }

  findUserById = async (id: string) => {
    return await User.findById(id).lean();
  };

  findUserByEmail = async (email: string) => {
    const user = await User.findOne({ email }).lean();
    return user;
  };

  findUserByPhone = async (phoneNumber: string) => {
    return await User.findOne({ phoneNumber }).lean();
  };

  createUser = async (userBody: any) => {
    logger.info({ userBody }, "UserRepository - createUser");

    const newUser = new User(userBody);
    await newUser.save();

    return newUser;
  };

  getAllUsers = async (query: any) => {
    const { filter, search, options } = this.buildDynamicSearch(User, query);

    const baseQuery = {
      role: { $ne: "admin" },
      ...filter,
      ...search,
    };

    // Run both queries concurrently
    const [users, total] = await Promise.all([
      User.find(baseQuery, null, options),
      User.countDocuments(baseQuery),
    ]);

    return { data: users, total };
  };

  updateUserPassword = async (id: Types.ObjectId, hashedPassword: string) => {
    return await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );
  };

  updateMyProfile = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };

  updateUser = async (id: string, body: any) => {
    return await User.findByIdAndUpdate(id, body, { new: true });
  };

  deleteUser = async (id: string) => {
    return await User.findByIdAndDelete(id);
  };

  updateLocation = async (id: string, latitude: number, longitude: number) => {
    return await User.findByIdAndUpdate(
      id,
      {
        location: {
          latitude,
          longitude,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );
  };

  updateDriverDocuments = async (
    id: string,
    docs: { emaratesId?: string; drivingLicense?: string; vehicleRegistration?: string }
  ) => {
    return await User.findByIdAndUpdate(
      id,
      { $set: docs },
      { new: true }
    );
  };

  updatePayoutAccount = async (id: string, payoutAccount: any) => {
    return await User.findByIdAndUpdate(
      id,
      { $set: { payoutAccount } },
      { new: true }
    );
  };

  getAddresses = async (id: string) => {
    const user = await User.findById(id).select("addresses");
    return user?.addresses || [];
  };

  addAddress = async (id: string, address: any) => {
    return await User.findByIdAndUpdate(
      id,
      { $push: { addresses: address } },
      { new: true }
    );
  };

  updateAddress = async (userId: string, addressId: string, addressBody: any) => {
    const updateObj: any = {};
    for (const key of Object.keys(addressBody)) {
      updateObj[`addresses.$.${key}`] = addressBody[key];
    }
    return await User.findOneAndUpdate(
      { _id: userId, "addresses._id": addressId },
      { $set: updateObj },
      { new: true }
    );
  };

  deleteAddress = async (userId: string, addressId: string) => {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );
  };
}
