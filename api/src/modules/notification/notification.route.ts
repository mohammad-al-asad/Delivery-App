import { Router } from "express";
import { authMiddleware, commonController } from "../../container";

const notificationRoute = Router();

notificationRoute.use(authMiddleware.authenticate);

notificationRoute.get("/", commonController.getMyNotifications);
notificationRoute.patch("/read-all", commonController.markAllNotificationsRead);
notificationRoute.patch("/:notificationId/read", commonController.updateNotificationRead);

export default notificationRoute;
