import { Router } from "express";
import { authMiddleware, orderController } from "../../container";

const statisticsRoute = Router();

statisticsRoute.use(authMiddleware.authenticate);

// Admin Bookings List
statisticsRoute.get(
  "/admin-bookings",
  authMiddleware.authorize(["Admin"]),
  orderController.getOrders
);

export default statisticsRoute;
