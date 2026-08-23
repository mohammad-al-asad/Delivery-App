import { Request, Response, NextFunction } from "express";
import { ReportService } from "./report.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";

export class ReportController {
  constructor(private reportService: ReportService) {}

  createReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.reportService.createReport(req.body);
      res.status(HttpCodes.Created).json({
        success: true,
        message: "Report submitted successfully",
        data,
      });
    }
  );

  getReports = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await this.reportService.getReports(page, limit);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Reports fetched successfully",
        data,
      });
    }
  );

  resolveReport = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const data = await this.reportService.resolveReport(id);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Report resolved successfully",
        data,
      });
    }
  );
}
