import { stripe, STRIPE_CONNECT_REFRESH_URL, STRIPE_CONNECT_RETURN_URL, STRIPE_CURRENCY } from "../../config/stripe";
import User from "../user/user.model";
import Order from "../order/order.model";
import Payment from "./payment.model";
import Settings from "../common/settings.model";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";
import { logger } from "../../utils/logger";

export class StripeConnectService {
  /**
   * Create or retrieve a Stripe Express Connected Account for a driver.
   */
  getOrCreateConnectedAccount = async (driverId: string) => {
    const driver = await User.findById(driverId);
    if (!driver) {
      throw new apiError(Errors.NotFound.code, "Driver not found");
    }
    if (driver.role !== "Rider") {
      throw new apiError(Errors.BadRequest.code, "User is not a driver/rider");
    }

    // Return existing if already created
    if (driver.payoutAccount?.stripeAccountId) {
      const account = await this.syncAccountStatus(driverId);
      return {
        stripeAccountId: driver.payoutAccount.stripeAccountId,
        account,
        isNew: false,
      };
    }

    try {
      const nameParts = [driver.firstName, driver.lastName].filter(Boolean);
      const businessProfileName = nameParts.length ? nameParts.join(" ") : driver.name || "GOGO Driver";

      const account = await stripe.accounts.create({
        type: "express",
        country: driver.payoutAccount?.country || "AE",
        email: driver.email,
        business_type: "individual",
        capabilities: {
          transfers: { requested: true },
        },
        business_profile: {
          name: businessProfileName,
          product_description: "Delivery and Ride driver partner on GOGO",
        },
        metadata: {
          driverId: driver._id.toString(),
          email: driver.email,
        },
      });

      driver.payoutAccount = {
        provider: "Stripe",
        status: "Pending",
        stripeAccountId: account.id,
        chargesEnabled: account.charges_enabled || false,
        payoutsEnabled: account.payouts_enabled || false,
        detailsSubmitted: account.details_submitted || false,
        country: account.country || "AE",
        currency: account.default_currency ? account.default_currency.toUpperCase() : "AED",
        connectedAt: new Date(),
        updatedAt: new Date(),
      };
      await driver.save();

      return {
        stripeAccountId: account.id,
        account,
        isNew: true,
      };
    } catch (error: any) {
      logger.error({ error, driverId }, "Error creating Stripe Connected Account");
      throw new apiError(
        Errors.BadRequest.code,
        error.message || "Failed to create Stripe Connected Account"
      );
    }
  };

  /**
   * Generate an Account Link URL for the driver to complete Stripe onboarding.
   */
  generateOnboardingLink = async (driverId: string, customReturnUrl?: string, customRefreshUrl?: string) => {
    const { stripeAccountId } = await this.getOrCreateConnectedAccount(driverId);

    try {
      const accountLink = await stripe.accountLinks.create({
        account: stripeAccountId,
        refresh_url: customRefreshUrl || STRIPE_CONNECT_REFRESH_URL,
        return_url: customReturnUrl || STRIPE_CONNECT_RETURN_URL,
        type: "account_onboarding",
      });

      return {
        url: accountLink.url,
        expiresAt: accountLink.expires_at,
        stripeAccountId,
      };
    } catch (error: any) {
      logger.error({ error, driverId }, "Error generating Stripe onboarding link");
      throw new apiError(
        Errors.BadRequest.code,
        error.message || "Failed to generate onboarding link"
      );
    }
  };

  /**
   * Generate a Login Link for the driver to view their Stripe Express Dashboard.
   */
  generateLoginLink = async (driverId: string) => {
    const driver = await User.findById(driverId).lean();
    const stripeAccountId = driver?.payoutAccount?.stripeAccountId;
    if (!stripeAccountId) {
      throw new apiError(
        Errors.BadRequest.code,
        "Driver does not have a Stripe account connected yet"
      );
    }

    try {
      const loginLink = await stripe.accounts.createLoginLink(stripeAccountId);
      return {
        url: loginLink.url,
      };
    } catch (error: any) {
      logger.error({ error, driverId }, "Error generating Stripe Express login link");
      throw new apiError(
        Errors.BadRequest.code,
        error.message || "Failed to generate Stripe Express login link"
      );
    }
  };

  /**
   * Sync Stripe account status from Stripe to local MongoDB Driver doc.
   */
  syncAccountStatus = async (driverId: string) => {
    const driver = await User.findById(driverId);
    if (!driver || !driver.payoutAccount?.stripeAccountId) {
      return null;
    }

    try {
      const account = await stripe.accounts.retrieve(driver.payoutAccount.stripeAccountId);
      const isConnected = Boolean(account.payouts_enabled && account.details_submitted);

      let status: "Pending" | "Connected" | "Restricted" = "Pending";
      if (isConnected) {
        status = "Connected";
      } else if (account.requirements?.disabled_reason) {
        status = "Restricted";
      }

      driver.payoutAccount.status = status;
      driver.payoutAccount.chargesEnabled = account.charges_enabled || false;
      driver.payoutAccount.payoutsEnabled = account.payouts_enabled || false;
      driver.payoutAccount.detailsSubmitted = account.details_submitted || false;
      driver.payoutAccount.country = account.country || "AE";
      driver.payoutAccount.currency = account.default_currency ? account.default_currency.toUpperCase() : "AED";
      driver.payoutAccount.updatedAt = new Date();

      // Extract bank last4 if available
      const externalAccounts = account.external_accounts?.data || [];
      if (externalAccounts.length > 0) {
        const primary = externalAccounts[0] as any;
        driver.payoutAccount.bankName = primary.bank_name;
        driver.payoutAccount.accountNumberLast4 = primary.last4;
      }

      await driver.save();
      return account;
    } catch (error: any) {
      logger.error({ error, driverId }, "Error syncing Stripe account status");
      return null;
    }
  };

  /**
   * Perform automatic per-delivery split and transfer to driver's Stripe Connected Account.
   */
  transferDeliveryEarnings = async (orderId: string) => {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new apiError(Errors.NotFound.code, "Order not found");
    }

    if (order.paymentMethod !== "Card") {
      logger.info({ orderId }, "Order is Cash payment. Skipping Stripe transfer.");
      return { skipped: true, reason: "Cash payment" };
    }

    if (order.payoutStatus === "Transferred" && order.stripeTransferId) {
      logger.info({ orderId, transferId: order.stripeTransferId }, "Order earnings already transferred.");
      return { skipped: true, reason: "Already transferred" };
    }

    if (!order.rider) {
      throw new apiError(Errors.BadRequest.code, "No driver assigned to this order");
    }

    const driver = await User.findById(order.rider);
    if (!driver) {
      throw new apiError(Errors.NotFound.code, "Assigned driver not found");
    }

    const stripeAccountId = driver.payoutAccount?.stripeAccountId;
    if (!stripeAccountId) {
      order.payoutStatus = "Pending";
      order.settlementStatus = "Unsettled";
      await order.save();
      logger.warn({ orderId, driverId: driver._id }, "Driver has no Stripe Connected Account. Transfer queued as Pending.");
      return {
        pending: true,
        reason: "Driver has not connected a Stripe payout account yet",
      };
    }

    // Determine commission & driver earnings from Dashboard deliverySettings
    const settingsDoc = await Settings.findOne().lean();
    const adminCommissionPercent = settingsDoc?.deliverySettings?.adminCommissionPercent ?? 10;
    const price = Number(order.price || 0);
    const adminCommissionAmount = Math.round(price * (adminCommissionPercent / 100) * 100) / 100;
    const driverEarningsAmount = Math.round((price - adminCommissionAmount) * 100) / 100;

    order.adminCommissionPercent = adminCommissionPercent;
    order.adminCommissionAmount = adminCommissionAmount;
    order.driverEarningsAmount = driverEarningsAmount;

    // Convert AED to smallest currency unit (cents / fils: 1 AED = 100 fils)
    const amountInSmallestUnit = Math.round(driverEarningsAmount * 100);

    if (amountInSmallestUnit <= 0) {
      order.payoutStatus = "Transferred";
      order.settlementStatus = "Settled";
      await order.save();
      return { skipped: true, reason: "Zero driver earnings amount" };
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: amountInSmallestUnit,
        currency: STRIPE_CURRENCY,
        destination: stripeAccountId,
        description: `Earnings for GOGO Delivery #${order._id.toString()}`,
        metadata: {
          orderId: order._id.toString(),
          driverId: driver._id.toString(),
          adminCommissionPercent: String(adminCommissionPercent),
          adminCommissionAmount: String(adminCommissionAmount),
          driverEarningsAmount: String(driverEarningsAmount),
          totalPrice: String(price),
        },
      });

      order.stripeTransferId = transfer.id;
      order.payoutStatus = "Transferred";
      order.settlementStatus = "Settled";
      order.settledAt = new Date();
      await order.save();

      // Update matching Payment record if present
      await Payment.findOneAndUpdate(
        { order: order._id },
        {
          stripeTransferId: transfer.id,
          payoutStatus: "Transferred",
          transferredAt: new Date(),
          adminCommissionPercent,
          adminCommissionAmount,
          driverEarningsAmount,
        }
      );

      logger.info(
        { orderId, transferId: transfer.id, amount: driverEarningsAmount, driverId: driver._id },
        "Stripe split transfer to driver successful"
      );

      return {
        success: true,
        transferId: transfer.id,
        driverEarningsAmount,
        adminCommissionAmount,
      };
    } catch (error: any) {
      logger.error({ error, orderId, driverId: driver._id }, "Error executing Stripe transfer to driver");
      order.payoutStatus = "Failed";
      await order.save();
      await Payment.findOneAndUpdate(
        { order: order._id },
        { payoutStatus: "Failed", transferError: error.message }
      );
      throw new apiError(
        Errors.BadRequest.code,
        `Stripe transfer failed: ${error.message}`
      );
    }
  };
}
