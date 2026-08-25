import Payment from "./payment.model";
import Order from "../order/order.model";
import Settings from "../common/settings.model";
import { stripe, STRIPE_CURRENCY } from "../../config/stripe";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { logger } from "../../utils/logger";
import { StripeConnectService } from "./stripe-connect.service";

export class PaymentService {
  private stripeConnectService = new StripeConnectService();

  private async getPaymentSplit(amount: number) {
    const settingsDoc = await Settings.findOne().lean();
    const adminCommissionPercent =
      settingsDoc?.deliverySettings?.adminCommissionPercent ?? 10;
    const adminCommissionAmount =
      Math.round(amount * (adminCommissionPercent / 100) * 100) / 100;
    const driverEarningsAmount =
      Math.round((amount - adminCommissionAmount) * 100) / 100;

    return {
      adminCommissionPercent,
      adminCommissionAmount,
      driverEarningsAmount,
    };
  }

  /**
   * Create a Stripe PaymentIntent for the user order checkout.
   */
  initiatePayment = async (userId: string, body: any) => {
    const {
      orderId,
      amount,
      currency = STRIPE_CURRENCY,
      description = "GOGO Delivery Payment",
    } = body;

    const order = await Order.findById(orderId);
    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    const payableAmount = Number(order.price || amount || 0);
    const split = await this.getPaymentSplit(payableAmount);

    await Order.findByIdAndUpdate(orderId, {
      paymentMethod: "Card",
      paymentStatus: "Pending",
      ...split,
    });

    const amountInCents = Math.round(payableAmount * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        description,
        metadata: {
          orderId,
          userId,
          adminCommissionPercent: String(split.adminCommissionPercent),
          adminCommissionAmount: String(split.adminCommissionAmount),
          driverEarningsAmount: String(split.driverEarningsAmount),
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      const payment = await Payment.findOneAndUpdate(
        { order: orderId },
        {
          user: userId,
          order: orderId,
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
          amount: payableAmount,
          currency: currency.toUpperCase(),
          status: "Initiated",
          payoutStatus: "NotReady",
          ...split,
        },
        { upsert: true, new: true }
      );

      await Order.findByIdAndUpdate(orderId, {
        stripePaymentIntentId: paymentIntent.id,
      });

      return {
        payment,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || "",
        amount: payableAmount,
        currency: currency.toUpperCase(),
        status: paymentIntent.status,
      };
    } catch (error: any) {
      logger.error({ error, orderId }, "Stripe PaymentIntent Creation Error");
      throw new apiError(
        Errors.BadRequest.code,
        error.message || "Failed to initiate Stripe payment"
      );
    }
  };

  /**
   * Verify and confirm Stripe PaymentIntent status.
   */
  verifyPayment = async (paymentIntentId: string) => {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (!paymentIntent) {
        throw new apiError(Errors.NotFound.code, "Payment intent not found on Stripe");
      }

      const payment = await Payment.findOne({
        $or: [{ paymentIntentId }, { chargeId: paymentIntentId }],
      });

      if (!payment) {
        throw new apiError(Errors.NotFound.code, "Payment transaction record not found");
      }

      const isSucceeded = paymentIntent.status === "succeeded";
      payment.status = isSucceeded ? "Succeeded" : "RequiresAction";
      payment.tapStatus = isSucceeded ? "CAPTURED" : paymentIntent.status;
      await payment.save();

      if (isSucceeded) {
        const split = await this.getPaymentSplit(payment.amount);
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: "Paid",
          ...split,
        });
      }

      return {
        payment,
        status: paymentIntent.status,
        isPaid: isSucceeded,
        tapStatus: isSucceeded ? "CAPTURED" : paymentIntent.status,
      };
    } catch (error: any) {
      logger.error({ error, paymentIntentId }, "Error verifying Stripe payment");
      throw error;
    }
  };

  /**
   * Get user payment history.
   */
  getPaymentHistory = async (userId: string, query: any) => {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };
    if (query.status) {
      filter.status = query.status;
    }

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("order")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return { data: payments, total };
  };

  /**
   * Handle incoming Stripe webhooks.
   */
  handleWebhook = async (rawBody: any, signature?: string) => {
    let event: any = rawBody;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret && signature) {
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err: any) {
        logger.error({ err }, "Stripe Webhook Signature Verification Failed");
        throw new apiError(Errors.BadRequest.code, `Webhook signature verification failed: ${err.message}`);
      }
    }

    logger.info({ eventType: event.type }, "Stripe Webhook Event Received");

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ paymentIntentId: paymentIntent.id });
        if (payment) {
          payment.status = "Succeeded";
          payment.tapStatus = "CAPTURED";
          await payment.save();

          const split = await this.getPaymentSplit(payment.amount);
          await Order.findByIdAndUpdate(payment.order, {
            paymentStatus: "Paid",
            ...split,
          });
        }
        break;
      }
      case "account.updated": {
        const account = event.data.object;
        const driverId = account.metadata?.driverId;
        if (driverId) {
          await this.stripeConnectService.syncAccountStatus(driverId);
        }
        break;
      }
      default:
        break;
    }
  };
}
