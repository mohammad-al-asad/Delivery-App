import { Schema, model } from "mongoose";

const addressSchema = new Schema({
  label: String,
  addressLine: String,
  latitude: Number,
  longitude: Number,
});

const vehicleSchema = new Schema(
  {
    type: {
      type: String,
      default: "Car",
    },
    make: String,
    model: String,
    year: String,
    plateNumber: String,
    color: String,
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: false,
    },
    firstName: {
      type: String,
      required: false,
    },
    lastName: {
      type: String,
      required: false,
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Admin", "User", "Rider"],
    },
    status: {
      type: String,
      enum: ["Active", "Approved", "Pending", "Blocked", "Rejected"],
      default: "Active",
    },
    password: {
      type: String,
      required: false,
    },
    companyName: String,
    trnVatNo: String,
    emaratesId: String,
    drivingLicense: String,
    vehicleRegistration: String,
    referralCode: String,
    location: {
      latitude: Number,
      longitude: Number,
      updatedAt: Date,
    },
    addresses: [addressSchema],
    profileImage: {
      type: String,
      required: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    vehicle: {
      type: vehicleSchema,
      required: false,
    },
    payoutAccount: {
      provider: { type: String, default: "Tap" },
      status: {
        type: String,
        enum: ["NotConnected", "Pending", "Connected", "Rejected"],
        default: "NotConnected",
      },
      tapMerchantId: String,
      accountHolderName: String,
      bankName: String,
      iban: String,
      accountNumberLast4: String,
      country: { type: String, default: "AE" },
      currency: { type: String, default: "AED" },
      rejectionReason: String,
      connectedAt: Date,
      updatedAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("fullName").get(function (this: any) {
  if (this.firstName || this.lastName) {
    return `${this.firstName || ""} ${this.lastName || ""}`.trim();
  }
  return this.name;
});

const User = model("User", userSchema);

export default User;
