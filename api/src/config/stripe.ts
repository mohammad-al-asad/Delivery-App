import Stripe from "stripe";
import { logger } from "../utils/logger";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecretKey) {
  logger.warn("STRIPE_SECRET_KEY is not set in environment variables. Stripe operations will fail until it is configured.");
}

export const stripe = new Stripe(stripeSecretKey || "sk_test_placeholder", {
  apiVersion: "2025-02-24.acacia" as any,
  typescript: true,
});

export const STRIPE_CURRENCY = (process.env.STRIPE_CURRENCY || "aed").toLowerCase();
export const STRIPE_CONNECT_RETURN_URL =
  process.env.STRIPE_CONNECT_RETURN_URL || "gogodriver://stripe-connect/success";
export const STRIPE_CONNECT_REFRESH_URL =
  process.env.STRIPE_CONNECT_REFRESH_URL || "gogodriver://stripe-connect/refresh";
