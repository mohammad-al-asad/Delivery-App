import { CommonService } from "./common.service";
import { asyncHandler } from "../../utils/async-handler";
import { Request, Response, NextFunction } from "express";
import { HttpCodes } from "../../constants/status-codes";
import { CommonRepository } from "./common.repository";

const getPeriodParams = (query: any) => {
  const { periodType, date } = query || {};
  const normalizedPeriod = periodType
    ? String(periodType).toLowerCase()
    : undefined;
  if (
    normalizedPeriod &&
    !["day", "week", "month", "year"].includes(normalizedPeriod)
  ) {
    return { error: "Invalid periodType" };
  }
  const baseDate = date ? new Date(String(date)) : new Date();
  if (normalizedPeriod && Number.isNaN(baseDate.getTime())) {
    return { error: "Invalid date" };
  }
  return {
    periodType: normalizedPeriod,
    date: normalizedPeriod ? baseDate : undefined,
  };
};

const normalizeDeliverySettings = (body: any) => {
  const next = { ...body };
  const numericFields = [
    "baseDeliveryCharge",
    "chargePerMile",
    "minimumDistanceMiles",
    "baseFee",
    "perKmRate",
    "serviceRadius",
    "adminCommissionPercent",
    "requestVisibilityDistanceMeters",
  ];

  numericFields.forEach((field) => {
    if (next[field] !== undefined && next[field] !== null && next[field] !== "") {
      next[field] = Number(next[field]);
    }
  });

  if (next.adminCommissionPercent !== undefined) {
    next.adminCommissionPercent = Math.min(
      100,
      Math.max(0, next.adminCommissionPercent)
    );
  }

  if (typeof next.requestVisibilityInfinite === "string") {
    next.requestVisibilityInfinite = next.requestVisibilityInfinite === "true";
  }

  if (next.requestVisibilityInfinite) {
    next.requestVisibilityDistanceMeters = null;
  }

  return next;
};

export class CommonController {
  constructor(
    private commonService: CommonService,
    private commonRepository: CommonRepository
  ) { }

  getNotification = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const q = req.query;
      const page = parseInt(q.page as string) || 1;
      const limit = parseInt(q.limit as string) || 10;
      const notifications = await this.commonService.getNotification(q);
      res.status(HttpCodes.Ok).send({
        success: true,
        message: "Notification fetched successfully",
        data: {
          meta: { page, limit, total: notifications.total },
          result: notifications.data,
        },
      });
    }
  );

  getMyNotifications = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const q = { ...req.query, forUser: user.userId };
      const notifications = await this.commonService.getNotification(q as any);
      res.status(HttpCodes.Ok).send({
        success: true,
        message: "My notifications fetched successfully",
        data: {
          meta: { page, limit, total: notifications.total },
          result: notifications.data,
        },
      });
    }
  );

  updateNotificationRead = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user!;
      const { notificationId } = req.params;
      const updatedNotification = await this.commonService.markNotificationRead(
        notificationId,
        user.userId
      );
      res.status(HttpCodes.Ok).send({
        success: true,
        message: "Notification updated successfully",
        data: updatedNotification,
      });
    }
  );

  markAllNotificationsRead = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user!;
      await this.commonService.markAllNotificationsRead(user.userId);
      res.status(HttpCodes.Ok).send({
        success: true,
        message: "All notifications marked as read",
        data: null,
      });
    }
  );

  getSettings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const settings = await this.commonService.getSettings();
      res.status(HttpCodes.Ok).json({
        success: true,
        data: settings,
      });
    }
  );

  updateContent = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const updated = await this.commonService.updateSettings(req.body);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Content updated successfully",
        data: updated,
      });
    }
  );

  updateDeliverySettings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const updated = await this.commonService.updateSettings({
        deliverySettings: normalizeDeliverySettings(req.body),
      });
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Delivery settings updated successfully",
        data: updated,
      });
    }
  );

  getMyStats = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user!;
      const { error, periodType, date } = getPeriodParams(req.query);
      if (error) {
        return res.status(400).json({ message: error });
      }
      const stats = await this.commonService.getMyStats(
        user,
        periodType,
        date
      );
      res.status(200).json({
        success: true,
        message: "My stats retrieved successfully",
        data: stats,
      });
    }
  );

  getUserStatsById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { userId } = req.params;
      const { error, periodType, date } = getPeriodParams(req.query);
      if (error) {
        return res.status(400).json({ message: error });
      }
      const stats = await this.commonService.getUserStatsById(
        userId,
        periodType,
        date
      );
      res.status(200).json({
        success: true,
        message: "User stats retrieved successfully",
        data: stats,
      });
    }
  );
}
