import { NextFunction, Request, Response } from "express";
import { PaymentService } from "./payment.service";
import { StripeConnectService } from "./stripe-connect.service";
import { asyncHandler } from "../../utils/async-handler";
import { HttpCodes } from "../../constants/status-codes";

export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private stripeConnectService: StripeConnectService
  ) {}

  initiatePayment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const userId = req.user!.userId;
      const data = await this.paymentService.initiatePayment(userId, req.body);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Payment intent initiated successfully",
        data,
      });
    }
  );

  verifyPayment = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { paymentIntentId, chargeId } = req.body;
      const idToVerify = paymentIntentId || chargeId;
      const data = await this.paymentService.verifyPayment(idToVerify);
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
      const sig = req.headers["stripe-signature"] as string | undefined;
      await this.paymentService.handleWebhook(req.body, sig);
      res.status(HttpCodes.Ok).json({
        success: true,
        received: true,
      });
    }
  );

  // Driver Stripe Connect Endpoints
  getDriverStripeAccount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const driverId = req.user!.userId;
      const account = await this.stripeConnectService.syncAccountStatus(driverId);
      const data = await this.stripeConnectService.getOrCreateConnectedAccount(driverId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver Stripe account status fetched successfully",
        data: {
          stripeAccountId: data.stripeAccountId,
          payoutAccount: req.user,
          account,
        },
      });
    }
  );

  createDriverStripeAccount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const driverId = req.user!.userId;
      const result = await this.stripeConnectService.getOrCreateConnectedAccount(driverId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Driver Stripe Connected Account ready",
        data: result,
      });
    }
  );

  getStripeOnboardingLink = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const driverId = req.user!.userId;
      const { returnUrl, refreshUrl } = req.body || {};
      const result = await this.stripeConnectService.generateOnboardingLink(
        driverId,
        returnUrl,
        refreshUrl
      );
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Stripe onboarding link generated successfully",
        data: result,
      });
    }
  );

  getStripeLoginLink = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const driverId = req.user!.userId;
      const result = await this.stripeConnectService.generateLoginLink(driverId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Stripe Express dashboard login link generated",
        data: result,
      });
    }
  );

  retryTransfer = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const orderId = String(req.params.orderId);
      const result = await this.stripeConnectService.transferDeliveryEarnings(orderId);
      res.status(HttpCodes.Ok).json({
        success: true,
        message: "Stripe split transfer executed successfully",
        data: result,
      });
    }
  );
}
