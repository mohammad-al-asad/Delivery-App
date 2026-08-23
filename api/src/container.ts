import { HashUtils } from "./utils/hash-utils";
import { JwtUtils } from "./utils/jwt-utils";
import { Mailer } from "./utils/mailer-utils";
import { CommonRepository } from "./modules/common/common.repository";
import { CommonService } from "./modules/common/common.service";
import { CommonController } from "./modules/common/common.controller";
import { UserRepository } from "./modules/user/user.repository";
import { UserService } from "./modules/user/user.service";
import { UserController } from "./modules/user/user.controller";
import { AuthMiddleware } from "./middlewares/auth.middleware";
import { AuthRepository } from "./modules/auth/auth.repository";
import { AuthService } from "./modules/auth/auth.service";
import { AuthController } from "./modules/auth/auth.controller";
import { buildDynamicSearch } from "./utils/dynamic-search-utils";
import { OrderRepository } from "./modules/order/order.repository";
import { OrderService } from "./modules/order/order.service";
import { OrderController } from "./modules/order/order.controller";
import { PaymentService } from "./modules/payment/payment.service";
import { PaymentController } from "./modules/payment/payment.controller";
import { DashboardService } from "./modules/dashboard/dashboard.service";
import { DashboardController } from "./modules/dashboard/dashboard.controller";
import { ReportRepository } from "./modules/report/report.repository";
import { ReportService } from "./modules/report/report.service";
import { ReportController } from "./modules/report/report.controller";

export const hashUtils = new HashUtils();
export const jwtUtils = new JwtUtils();
export const mailer = new Mailer();

export const commonRepository = new CommonRepository();

export const userRepository = new UserRepository(buildDynamicSearch);
export const userService = new UserService(userRepository, hashUtils, mailer);
export const userController = new UserController(userService);

export const authRepo = new AuthRepository();
export const authService = new AuthService(
  authRepo,
  userRepository,
  hashUtils,
  jwtUtils,
  mailer
);
export const authMiddleware = new AuthMiddleware(jwtUtils, userRepository);
export const authController = new AuthController(authService);

export const commonService = new CommonService(commonRepository);
export const commonController = new CommonController(commonService, commonRepository);

export const orderRepository = new OrderRepository();
export const orderService = new OrderService(orderRepository);
export const orderController = new OrderController(orderService);

export const paymentService = new PaymentService();
export const paymentController = new PaymentController(paymentService);

export const dashboardService = new DashboardService();
export const dashboardController = new DashboardController(dashboardService);

export const reportRepository = new ReportRepository();
export const reportService = new ReportService(reportRepository);
export const reportController = new ReportController(reportService);
