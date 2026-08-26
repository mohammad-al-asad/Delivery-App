import { Router } from "express";
import { authMiddleware, paymentController } from "../../container";

const paymentRoute = Router();

// Public Webhooks & Redirects
paymentRoute.post("/webhook/stripe", paymentController.webhook);
paymentRoute.post("/webhook/tap", paymentController.webhook);
paymentRoute.get("/stripe-connect/return", paymentController.handleConnectReturn);
paymentRoute.get("/stripe-connect/refresh", paymentController.handleConnectRefresh);

// Authenticated Routes
paymentRoute.use(authMiddleware.authenticate);

// User Payments
paymentRoute.post("/initiate", paymentController.initiatePayment);
paymentRoute.post("/create-intent", paymentController.initiatePayment);
paymentRoute.post("/verify", paymentController.verifyPayment);
paymentRoute.get("/history", paymentController.getPaymentHistory);

// Driver Stripe Connect & Payout Routes
paymentRoute.get("/driver/stripe-account", paymentController.getDriverStripeAccount);
paymentRoute.post("/driver/stripe-account", paymentController.createDriverStripeAccount);
paymentRoute.post("/driver/onboarding-link", paymentController.getStripeOnboardingLink);
paymentRoute.post("/driver/login-link", paymentController.getStripeLoginLink);
paymentRoute.post("/driver/retry-transfer/:orderId", paymentController.retryTransfer);

export default paymentRoute;
