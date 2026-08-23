import { Router } from "express";
import { authMiddleware, dashboardController } from "../../container";

const dashboardRoute = Router();

dashboardRoute.use(authMiddleware.authenticate);

dashboardRoute.get("/rider", dashboardController.getRiderStats);
dashboardRoute.get("/rider/earnings", dashboardController.getRiderEarnings);

// Admin Dashboard Routes
dashboardRoute.get(
  "/overview",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getOverview
);
dashboardRoute.get(
  "/user-growth",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getUserGrowth
);
dashboardRoute.get(
  "/rider-growth",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getRiderGrowth
);
dashboardRoute.get(
  "/revenue-trend",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getRevenueTrend
);
dashboardRoute.get(
  "/earnings",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getAdminEarnings
);
dashboardRoute.get(
  "/driver-payouts",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getDriverPayouts
);
dashboardRoute.get(
  "/driver-payouts/history",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getDriverPayoutHistory
);
dashboardRoute.post(
  "/driver-payouts/:riderId/pay",
  authMiddleware.authorize(["Admin"]),
  dashboardController.payDriver
);
dashboardRoute.get(
  "/hot-areas",
  authMiddleware.authorize(["Admin"]),
  dashboardController.getHotAreas
);

export default dashboardRoute;
