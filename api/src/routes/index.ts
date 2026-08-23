import { Router } from "express";
import userRoute from "../modules/user/user.route";
import authRoute from "../modules/auth/auth.route";
import commonRoute from "../modules/common/common.route";
import orderRoute from "../modules/order/order.route";
import paymentRoute from "../modules/payment/payment.route";
import dashboardRoute from "../modules/dashboard/dashboard.route";
import notificationRoute from "../modules/notification/notification.route";
import statisticsRoute from "../modules/statistics/statistics.route";
import reportRoute from "../modules/report/report.route";

const appRouter = Router();

const moduleRoutes = [
  {
    path: "/auth",
    router: authRoute,
  },
  {
    path: "/users",
    router: userRoute,
  },
  {
    path: "/common",
    router: commonRoute,
  },
  {
    path: "/orders",
    router: orderRoute,
  },
  {
    path: "/payments",
    router: paymentRoute,
  },
  {
    path: "/dashboard",
    router: dashboardRoute,
  },
  {
    path: "/notifications",
    router: notificationRoute,
  },
  {
    path: "/statistics",
    router: statisticsRoute,
  },
  {
    path: "/reports",
    router: reportRoute,
  },
];

moduleRoutes.forEach((route) => appRouter.use(route.path, route.router));

export default appRouter;
