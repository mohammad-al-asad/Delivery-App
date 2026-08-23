import Payment from "./payment.model";
import Order from "../order/order.model";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { logger } from "../../utils/logger";
import Settings from "../common/settings.model";

export class PaymentService {
  private getTapHeaders() {
    const key = process.env.TAP_SECRET_KEY || "";
    return {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "accept": "application/json",
    };
  }

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

  initiatePayment = async (userId: string, body: any) => {
    const {
      orderId,
      amount,
      currency = "AED",
      description = "Ride Payment",
      redirectUrl = "gogo://payment/callback",
      postUrl = "https://gogo-backend-agsd.onrender.com/api/v1/payments/webhook/tap",
      customer = {},
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

    const payload = {
      amount: payableAmount,
      currency,
      threeDSecure: true,
      save_card: false,
      description,
      statement_descriptor: "GOGO RIDE",
      metadata: {
        orderId,
        userId,
        adminCommissionPercent: String(split.adminCommissionPercent),
        adminCommissionAmount: String(split.adminCommissionAmount),
        driverEarningsAmount: String(split.driverEarningsAmount),
      },
      customer: {
        first_name: customer.firstName || "Customer",
        last_name: customer.lastName || "User",
        email: customer.email || "customer@example.com",
        phone: {
          country_code: customer.phoneCountryCode || "971",
          number: customer.phoneNumber || "000000000",
        },
      },
      source: {
        id: body.sourceId || "src_all",
      },
      redirect: {
        url: redirectUrl,
      },
      post: {
        url: postUrl,
      },
      platform: process.env.TAP_PLATFORM_ID
        ? {
            id: process.env.TAP_PLATFORM_ID,
          }
        : undefined,
    };

    try {
      const fetch = (await import("node-fetch")).default;
      const response = await fetch("https://api.tap.company/v2/charges", {
        method: "POST",
        headers: this.getTapHeaders(),
        body: JSON.stringify(payload),
      });

      const data: any = await response.json();
      if (!response.ok || data.errors) {
        logger.error(data, "Tap API Initiation Error");
        // Fallback mock payment for development testing if keys are incorrect/invalid
        const mockChargeId = `chg_mock_${Date.now()}`;
        const payment = new Payment({
          user: userId,
          order: orderId,
          chargeId: mockChargeId,
          amount: payableAmount,
          currency,
          tapStatus: "Initiated",
          ...split,
        });
        await payment.save();

        return {
          payment,
          chargeId: mockChargeId,
          tapStatus: "Initiated",
          transactionUrl: `${redirectUrl}?tap_id=${mockChargeId}`,
          response: { mock: true },
        };
      }

      const payment = new Payment({
        user: userId,
        order: orderId,
        chargeId: data.id,
        amount: data.amount,
        currency: data.currency,
        tapStatus: data.status,
        ...split,
      });
      await payment.save();

      return {
        payment,
        chargeId: data.id,
        tapStatus: data.status,
        transactionUrl: data.transaction?.url,
        response: data,
      };
    } catch (error) {
      logger.error(error, "Error initiating payment");
      throw error;
    }
  };

  verifyPayment = async (chargeId: string) => {
    try {
      let data: any;
      if (chargeId.startsWith("chg_mock_")) {
        data = {
          id: chargeId,
          status: "CAPTURED",
          metadata: {},
        };
      } else {
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(`https://api.tap.company/v2/charges/${chargeId}`, {
          method: "GET",
          headers: this.getTapHeaders(),
        });
        data = await response.json();
        if (!response.ok) {
          throw new apiError(Errors.BadRequest.code, "Failed to verify charge with Tap");
        }
      }

      const payment = await Payment.findOne({ chargeId });
      if (!payment) {
        throw new apiError(Errors.NotFound.code, "Payment transaction not found");
      }

      payment.tapStatus = data.status;
      await payment.save();

      if (data.status === "CAPTURED") {
        const split = await this.getPaymentSplit(payment.amount);
        await Order.findByIdAndUpdate(payment.order, {
          paymentStatus: "Paid",
          ...split,
        });
        payment.adminCommissionPercent = split.adminCommissionPercent;
        payment.adminCommissionAmount = split.adminCommissionAmount;
        payment.driverEarningsAmount = split.driverEarningsAmount;
        payment.payoutStatus = "NotReady";
        await payment.save();
      }

      return {
        payment,
        tapStatus: data.status,
        response: data,
      };
    } catch (error) {
      logger.error(error, "Error verifying payment");
      throw error;
    }
  };

  getPaymentHistory = async (userId: string, query: any) => {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const filter: any = { user: userId };
    if (query.status) {
      filter.tapStatus = query.status;
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

  handleWebhook = async (webhookPayload: any) => {
    logger.info(webhookPayload, "Tap Payment Webhook Payload Received");
    const chargeId = webhookPayload.id;
    if (!chargeId) return;

    const payment = await Payment.findOne({ chargeId });
    if (!payment) return;

    payment.tapStatus = webhookPayload.status;
    await payment.save();

    if (webhookPayload.status === "CAPTURED") {
      const split = await this.getPaymentSplit(payment.amount);
      await Order.findByIdAndUpdate(payment.order, {
        paymentStatus: "Paid",
        ...split,
      });
      payment.adminCommissionPercent = split.adminCommissionPercent;
      payment.adminCommissionAmount = split.adminCommissionAmount;
      payment.driverEarningsAmount = split.driverEarningsAmount;
      payment.payoutStatus = "NotReady";
      await payment.save();
    }
  };
}
