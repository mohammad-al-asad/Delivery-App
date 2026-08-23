import { NextFunction, Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  initiatePayment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const data = await this.paymentService.initiatePayment(userId, req.body);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Payment charge initiated successfully",
        data,
      });
    }
  );

  verifyPayment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { chargeId } = req.body;
      const data = await this.paymentService.verifyPayment(chargeId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Payment verified successfully",
        data,
      });
    }
  );

  getPaymentHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const result = await this.paymentService.getPaymentHistory(userId, req.query);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Payment history fetched successfully",
        data: result.data,
        total: result.total,
      });
    }
  );

  webhook = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      await this.paymentService.handleWebhook(req.body);
      res.status(HttpCodes.Ok).json({
        success: true,
      });
    }
  );
}
