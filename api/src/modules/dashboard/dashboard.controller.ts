import { NextFunction, Request, Response } from "express";
import { DashboardService } from "./dashboard.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";

export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  getRiderStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const riderId = req.user!.userId;
      const data = await this.dashboardService.getRiderStats(riderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Rider daily stats fetched successfully",
        data,
      });
    }
  );

  getRiderEarnings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const riderId = req.user!.userId;
      const data = await this.dashboardService.getRiderEarnings(riderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Rider earnings fetched successfully",
        data,
      });
    }
  );

  getOverview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.getOverview();
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Dashboard overview fetched successfully",
        data,
      });
    }
  );

  getUserGrowth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { year, month } = req.query;
      const data = await this.dashboardService.getUserGrowth(
        year as string,
        month as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "User growth fetched successfully",
        data,
      });
    }
  );

  getRiderGrowth = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { year, month } = req.query;
      const data = await this.dashboardService.getRiderGrowth(
        year as string,
        month as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver growth fetched successfully",
        data,
      });
    }
  );

  getRevenueTrend = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { year, month } = req.query;
      const data = await this.dashboardService.getRevenueTrend(
        year as string,
        month as string
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Commission trend fetched successfully",
        data,
      });
    }
  );

  getAdminEarnings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.dashboardService.getAdminEarnings(page, limit);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Admin payments fetched successfully",
        data,
      });
    }
  );

  getDriverPayouts = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.getDriverPayouts(req.query);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver settlements fetched successfully",
        data,
      });
    }
  );

  getDriverPayoutHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.getDriverPayoutHistory(req.query);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver settlement history fetched successfully",
        data,
      });
    }
  );

  payDriver = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.dashboardService.payDriver(
        req.params.riderId,
        req.body,
        req.user?.userId
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver settlement completed successfully",
        data,
      });
    }
  );

  getHotAreas = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { timeframe } = req.query;
      const data = await this.dashboardService.getHotAreas(timeframe as string);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Hot areas fetched successfully",
        data,
      });
    }
  );
}
