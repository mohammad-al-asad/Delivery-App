import { NextFunction, Request, Response } from "express";
import { OrderService } from "./order.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";
import { uploadToS3 } from "../../utils/s3-upload";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";

export class OrderController {
  constructor(private orderService: OrderService) {}

  estimatePrice = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { distanceKm, durationMin, vehicleType } = req.body;
      const data = await this.orderService.estimatePrice(distanceKm, durationMin, vehicleType);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Price estimation generated successfully",
        data,
      });
    }
  );

  createOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const order = await this.orderService.createOrder(userId, req.body);
      res.status(HttpCodes.Created).json({
        success: true,
        message: "Order created successfully",
        data: order,
      });
    }
  );

  getOrderById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const order = await this.orderService.getOrderById(id);
      if (!order) {
        throw new apiError(Errors.NotFound.code, "Order not found");
      }
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Order fetched successfully",
        data: order,
      });
    }
  );

  getOrders = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const user = req.user!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await this.orderService.getOrders(user, req.query);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Orders fetched successfully",
        data: {
          meta: { page, limit, total: result.total },
          result: result.data,
        },
      });
    }
  );

  getOrderSummary = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const data = await this.orderService.getOrderSummary();
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Order summary fetched successfully",
        data,
      });
    }
  );

  cancelOrder = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { reason } = req.body;
      const updatedOrder = await this.orderService.cancelOrder(id, reason);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Order cancelled successfully",
        data: updatedOrder,
      });
    }
  );

  assignRider = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { riderId } = req.body;
      const updatedOrder = await this.orderService.assignRider(id, riderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver assigned successfully",
        data: updatedOrder,
      });
    }
  );

  updateStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { status } = req.body;
      const updatedOrder = await this.orderService.updateStatus(id, status);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Order status updated successfully",
        data: updatedOrder,
      });
    }
  );

  addCheckpoint = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const updatedOrder = await this.orderService.addCheckpoint(id, req.body);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Checkpoint marked successfully",
        data: updatedOrder,
      });
    }
  );

  submitCompletionProof = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      if (!req.file) {
        throw new apiError(Errors.BadRequest.code, "Completion proof file is required");
      }

      const fileUrl = await uploadToS3(
        req.file.buffer,
        `proofs/${req.file.originalname}`,
        req.file.mimetype
      );

      const updatedOrder = await this.orderService.submitCompletionProof(id, fileUrl);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Completion proof submitted successfully",
        data: updatedOrder,
      });
    }
  );

  addReview = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const updatedOrder = await this.orderService.addReview(id, rating, comment);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Review added successfully",
        data: updatedOrder,
      });
    }
  );
}
