import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware";
import { createUserSchema, loginUserSchema, changePasswordSchema } from "./auth.schema";
import { authController, authMiddleware } from "../../container";

const authRoute = Router();


// Register route
authRoute.post(
  "/register",
  validate(createUserSchema),
  authController.register
);

authRoute.post("/login", validate(loginUserSchema), authController.loginUser);
authRoute.post("/admin/login", validate(loginUserSchema), authController.loginUser);
authRoute.post("/admin/forgot-password", authController.sendOtp);
authRoute.post("/admin/verify-reset-otp", authController.verifyOtp);
authRoute.post("/admin/reset-password", authController.setNewPassword);
authRoute.post(
  "/admin/change-password",
  authMiddleware.authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

authRoute.post("/check-user", authController.checkUser);

authRoute.post(
  "/change-password",
  authMiddleware.authenticate,
  validate(changePasswordSchema),
  authController.changePassword
);

authRoute.post("/send-otp", authController.sendOtp);
authRoute.post("/verify-otp", authController.verifyOtp);
authRoute.post("/set-new-password", authController.setNewPassword);
authRoute.post("/refresh-token", authController.refreshToken);
authRoute.post("/logout", authController.logout);

export default authRoute;
