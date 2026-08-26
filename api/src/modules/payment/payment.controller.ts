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

  handleConnectReturn = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>GOGO Driver - Payout Setup</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F8FAFC; color: #1E293B; text-align: center; padding: 20px; box-sizing: border-box; }
          .card { background: white; padding: 32px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; width: 100%; }
          .icon { width: 64px; height: 64px; background: #DCFCE7; color: #16A34A; border-radius: 32px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; }
          h1 { font-size: 20px; margin: 0 0 8px; color: #0F172A; }
          p { font-size: 14px; color: #64748B; margin: 0 0 24px; line-height: 1.5; }
          .btn { display: inline-block; background: #2D8C3C; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✓</div>
          <h1>Payout Setup Complete!</h1>
          <p>Your Stripe account has been processed. You can now return to the GOGO Driver app to start receiving deliveries.</p>
          <a class="btn" href="gogodriver://stripe-connect/success">Return to GOGO Driver App</a>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = "gogodriver://stripe-connect/success";
          }, 800);
        </script>
      </body>
      </html>
    `);
  };

  handleConnectRefresh = (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>GOGO Driver - Refresh Setup</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #F8FAFC; color: #1E293B; text-align: center; padding: 20px; box-sizing: border-box; }
          .card { background: white; padding: 32px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); max-width: 400px; width: 100%; }
          .icon { width: 64px; height: 64px; background: #FEF3C7; color: #D97706; border-radius: 32px; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px; }
          h1 { font-size: 20px; margin: 0 0 8px; color: #0F172A; }
          p { font-size: 14px; color: #64748B; margin: 0 0 24px; line-height: 1.5; }
          .btn { display: inline-block; background: #2D8C3C; color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 700; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">↻</div>
          <h1>Session Expired</h1>
          <p>Please return to the GOGO Driver app to generate a fresh link.</p>
          <a class="btn" href="gogodriver://stripe-connect/refresh">Return to GOGO Driver App</a>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = "gogodriver://stripe-connect/refresh";
          }, 800);
        </script>
      </body>
      </html>
    `);
  };
}
