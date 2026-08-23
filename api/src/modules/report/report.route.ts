import { Router } from "express";
import { authMiddleware, reportController } from "../../container";

const reportRoute = Router();

reportRoute.use(authMiddleware.authenticate);

// Riders/Users
reportRoute.post("/", reportController.createReport);

// Admins
reportRoute.get("/", authMiddleware.authorize(["Admin"]), reportController.getReports);
reportRoute.patch("/:id/resolve", authMiddleware.authorize(["Admin"]), reportController.resolveReport);

export default reportRoute;
