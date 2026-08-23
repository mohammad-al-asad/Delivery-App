import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { CreateUserSchema, UpdateUserSchemaForOtherRoles } from "./user.schema";
import { authMiddleware, userController } from "../../container";
import { uploadFile } from "../../middlewares/upload.middleware";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });
const driverDocsUpload = upload.fields([
  { name: "emaratesId", maxCount: 1 },
  { name: "drivingLicense", maxCount: 1 },
  { name: "vehicleRegistration", maxCount: 1 }
]);

const userRoute = Router();

userRoute.use(authMiddleware.authenticate)

userRoute.post("/", authMiddleware.authorize(["Admin"]), validate(CreateUserSchema), userController.createUser);

userRoute.get("/", userController.getAllUsers);

userRoute.get(
  "/riders",
  authMiddleware.authorize(["Admin"]),
  userController.getRiders
);

userRoute.get(
  "/me",
  authMiddleware.authenticate,
  userController.getMyProfile
);

userRoute.patch(
  "/me",
  authMiddleware.authenticate,
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateMyProfile
);

userRoute.patch("/me/location", userController.updateLocation);
userRoute.patch("/me/documents", driverDocsUpload, userController.updateDriverDocuments);
userRoute.patch("/me/payout-account", userController.updatePayoutAccount);
userRoute.delete("/me", userController.deleteMyAccount);
userRoute.get("/me/addresses", userController.getAddresses);
userRoute.post("/me/addresses", userController.addAddress);
userRoute.patch("/me/addresses/:addressId", userController.updateAddress);
userRoute.delete("/me/addresses/:addressId", userController.deleteAddress);

userRoute.get("/:id", userController.getUserById);

userRoute.patch(
  "/:id",
  authMiddleware.authorize(["Admin"]),
  uploadFile({
    fieldName: "profileImage",
    uploadType: "single",
  }),
  userController.updateUser
);

userRoute.delete("/:id", authMiddleware.authorize(["Admin"]), userController.deleteUser);

export default userRoute;
