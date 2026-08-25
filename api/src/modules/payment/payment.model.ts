import { Schema, model } from "mongoose";

const paymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    paymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    clientSecret: String,
    chargeId: {
      type: String,
      sparse: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "AED",
    },
    status: {
      type: String,
      enum: ["Initiated", "RequiresAction", "Succeeded", "Failed", "Canceled", "Refunded"],
      default: "Initiated",
    },
    tapStatus: {
      type: String,
    },
    adminCommissionPercent: {
      type: Number,
      default: 10,
    },
    adminCommissionAmount: {
      type: Number,
      default: 0,
    },
    driverEarningsAmount: {
      type: Number,
      default: 0,
    },
    stripeTransferId: {
      type: String,
      index: true,
    },
    payoutStatus: {
      type: String,
      enum: ["NotReady", "Pending", "Transferred", "Paid", "Failed"],
      default: "NotReady",
    },
    transferredAt: Date,
    transferError: String,
  },
  {
    timestamps: true,
  }
);

const Payment = model("Payment", paymentSchema);

export default Payment;
