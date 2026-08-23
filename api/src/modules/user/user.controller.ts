import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { logger } from "../../utils/logger";
import { UserService } from "./user.service";
import User from "./user.model";
import { HttpCodes } from "../../constants/status-codes";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { updateOtherRoleUserType } from "./user.type";
import {
  TypedRequestBody,
  TypedRequestBodyWithFile,
} from "../../types/request.type";
import { createUserType } from "./user.type";
import { uploadToS3 } from "../../utils/s3-upload";

export class UserController {
  constructor(private userService: UserService) { }
  createUser = asyncHandler(
    async (
      req: TypedRequestBody<createUserType>,
      res: Response,
      next: NextFunction
    ) => {
      const body = req.body;
      logger.info({ user: req.user, body }, "Creating user");
      const user = await this.userService.createUser(body);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User created successfully",
        data: user,
      });
    }
  );

  getAllUsers = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const query = { ...req.query, role: "User" } as any;
      const page = parseInt(query.page as string) || 1;
      const limit = parseInt(query.limit as string) || 10;
      const users = await this.userService.getAllUsers(query);
      const [totalUsers, activeUsers, blockedUsers] = await Promise.all([
        User.countDocuments({ role: "User" }),
        User.countDocuments({ role: "User", status: { $ne: "Blocked" } }),
        User.countDocuments({ role: "User", status: "Blocked" }),
      ]);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "All users fetched successfully",
        data: {
          meta: { page, limit, total: users.total },
          result: users.data,
        },
        stats: {
          totalUsers,
          activeUsers,
          blockedUsers,
        },
      });
    }
  );

  getRiders = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const query = { ...req.query, role: "Rider" };
      const users = await this.userService.getAllUsers(query as any);
      const [totalRiders, activeRiders, pendingRiders, blockedRiders, rejectedRiders] = await Promise.all([
        User.countDocuments({ role: "Rider" }),
        User.countDocuments({ role: "Rider", status: { $in: ["Active", "Approved"] } }),
        User.countDocuments({ role: "Rider", status: "Pending" }),
        User.countDocuments({ role: "Rider", status: "Blocked" }),
        User.countDocuments({ role: "Rider", status: "Rejected" }),
      ]);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "All riders fetched successfully",
        data: {
          meta: { page, limit, total: users.total },
          result: users.data,
        },
        stats: {
          totalRiders,
          activeRiders,
          pendingRiders,
          blockedRiders,
          rejectedRiders,
        },
      });
    }
  );

  getUserById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    }
  );

  // getSalesReps=asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
  //   const salesReps=await this.userService.getSalesReps(req.query)
  //   res.status(HttpCodes.Ok).json({
  //       success:true,
  //       message:"Sales reps fetched successfully",
  //       data:salesReps.data,
  //       total:salesReps.total
  //   })
  // })

  deleteUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const user = await this.userService.deleteUser(id);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User deleted successfully",
        data: user,
      });
    }
  );

  deleteMyAccount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
      }

      const user = await this.userService.deleteMyAccount(userId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Account deleted successfully",
        data: user,
      });
    }
  );

  getMyProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user?.userId;
      if (!userId) {
        throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
      }
      const user = await this.userService.getUserProfile(userId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User profile fetched successfully",
        data: user,
      });
    }
  );

  updateUser = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params
      const body = req.body
      const user = await this.userService.updateUser(id, body)
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User updated successfully",
        data: user
      })
    }
  );

  updateMyProfile = asyncHandler(
    async (
      req: TypedRequestBodyWithFile<updateOtherRoleUserType>,
      res: Response,
      next: NextFunction
    ) => {
      const userId = req.user?.userId;
      const body = req.body;

      logger.info({ body }, "UserController.updateProfile")

      if (!userId) {
        throw new apiError(Errors.NotFound.code, Errors.NotFound.message);
      }

      // If a file is uploaded, attach its URL to the body
      if (req.file) {
        (body as any).profileImage = req.file.fileUrl;
      }

      logger.info({ body }, "UserController.updateProfile")

      logger.info({ user: req.user, body }, "Updating user profile");

      const updatedUser = await this.userService.updateMyProfile(userId, body);

      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    }
  );

  updateLocation = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const { latitude, longitude } = req.body;
      const updatedUser = await this.userService.updateLocation(userId, latitude, longitude);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Location updated successfully",
        data: updatedUser,
      });
    }
  );

  updatePayoutAccount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const updatedUser = await this.userService.updatePayoutAccount(
        userId,
        req.body
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Payout account updated successfully",
        data: updatedUser,
      });
    }
  );

  updateDriverDocuments = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const docs: any = {};
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      
      if (files) {
        if (files.emaratesId?.[0]) {
          docs.emaratesId = await uploadToS3(files.emaratesId[0].buffer, `uploads/${files.emaratesId[0].originalname}`, files.emaratesId[0].mimetype);
        }
        if (files.drivingLicense?.[0]) {
          docs.drivingLicense = await uploadToS3(files.drivingLicense[0].buffer, `uploads/${files.drivingLicense[0].originalname}`, files.drivingLicense[0].mimetype);
        }
        if (files.vehicleRegistration?.[0]) {
          docs.vehicleRegistration = await uploadToS3(files.vehicleRegistration[0].buffer, `uploads/${files.vehicleRegistration[0].originalname}`, files.vehicleRegistration[0].mimetype);
        }
      }
      
      const updatedUser = await this.userService.updateDriverDocuments(userId, docs);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver documents updated successfully",
        data: updatedUser,
      });
    }
  );

  getAddresses = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const addresses = await this.userService.getAddresses(userId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Saved addresses fetched successfully",
        data: addresses,
      });
    }
  );

  addAddress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const address = req.body;
      const updatedUser = await this.userService.addAddress(userId, address);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Address added successfully",
        data: updatedUser,
      });
    }
  );

  updateAddress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const { addressId } = req.params;
      const addressBody = req.body;
      const updatedUser = await this.userService.updateAddress(userId, addressId, addressBody);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Address updated successfully",
        data: updatedUser,
      });
    }
  );

  deleteAddress = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const { addressId } = req.params;
      const updatedUser = await this.userService.deleteAddress(userId, addressId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Address deleted successfully",
        data: updatedUser,
      });
    }
  );
}
