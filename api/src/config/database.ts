import mongoose from "mongoose";
import { logger } from "../utils/logger";

const connectDB = async (url: string) => {
  // logger.info({ url }, "Db URL");
  try {
    await mongoose.connect(url);
    logger.info("MongoDB connected");

    // Clean up legacy unique indexes that conflict with new payment flows
    try {
      await mongoose.connection.collection("payments").dropIndex("chargeId_1").catch(() => {});
    } catch {
      // Index might not exist or already dropped
    }
  } catch (error) {
    logger.error(error, "MongoDB connection error:");
    process.exit(1);
  }
};

export default connectDB;
