import { Schema, model } from "mongoose";

const driverPayoutSchema = new Schema(
  {
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
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
      enum: ["Pending", "Paid", "Failed"],
      default: "Pending",
      index: true,
    },
    provider: {
      type: String,
      default: "Manual",
    },
    referenceId: String,
    transactionId: String,
    periodStart: Date,
    periodEnd: Date,
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    adminCommission: {
      type: Number,
      default: 0,
    },
    paidEarningsBefore: {
      type: Number,
      default: 0,
    },
    pendingEarningsBefore: {
      type: Number,
      default: 0,
    },
    processedAt: Date,
    paidAt: Date,
    errorMessage: String,
    response: Schema.Types.Mixed,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const DriverPayout = model("DriverPayout", driverPayoutSchema);

export default DriverPayout;
