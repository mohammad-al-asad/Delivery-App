import { Router } from "express";
import { authMiddleware, paymentController } from "../../container";

const paymentRoute = Router();

// Webhook is public
paymentRoute.post("/webhook/tap", paymentController.webhook);

// Authenticated routes
paymentRoute.use(authMiddleware.authenticate);

paymentRoute.post("/initiate", paymentController.initiatePayment);
paymentRoute.post("/verify", paymentController.verifyPayment);
paymentRoute.get("/history", paymentController.getPaymentHistory);

export default paymentRoute;
