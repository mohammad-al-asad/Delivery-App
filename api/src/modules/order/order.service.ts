import { OrderRepository } from "./order.repository";
import Settings from "../common/settings.model";
import { apiError } from "../../errors/api-error";
import User from "../user/user.model";
import {
  buildDriverOnboardingStatus,
  normalizeVehicleType,
} from "../../utils/driver-onboarding";

export class OrderService {
  constructor(private orderRepo: OrderRepository) {}

  private getSplit = async (price: number) => {
    const settingsDoc = await Settings.findOne().lean();
    const commissionPercent =
      settingsDoc?.deliverySettings?.adminCommissionPercent ?? 10;
    const adminCommissionAmount =
      Math.round(price * (commissionPercent / 100) * 100) / 100;
    const driverEarningsAmount =
      Math.round((price - adminCommissionAmount) * 100) / 100;

    return {
      adminCommissionPercent: commissionPercent,
      adminCommissionAmount,
      driverEarningsAmount,
    };
  };

  estimatePrice = async (distanceKm: number, durationMin: number, vehicleType?: string) => {
    const settingsDoc = await Settings.findOne().lean();
    const deliverySettings = settingsDoc?.deliverySettings;

    let base = deliverySettings?.baseDeliveryCharge ?? 5.0;
    let rate = deliverySettings?.chargePerMile ?? 2.5;

    if (vehicleType === "Bike") {
      rate = rate * 0.72;
      base = base * 0.7;
    } else if (vehicleType === "Truck") {
      rate = rate * 2.0;
      base = base * 2.4;
    }

    const calculatedPrice = base + (distanceKm * rate);
    const roundedPrice = Math.round(calculatedPrice * 100) / 100;

    return {
      distanceKm,
      durationMin,
      vehicleType: vehicleType as any,
      price: roundedPrice,
      currency: "AED",
      baseCharge: base,
      ratePerKm: rate,
    };
  };

  createOrder = async (userId: string, orderData: any) => {
    const split = await this.getSplit(Number(orderData.price || 0));
    const paymentMethod = orderData.paymentMethod === "Cash" ? "Cash" : "Card";
    return await this.orderRepo.createOrder({
      ...orderData,
      user: userId,
      status: "Pending",
      paymentMethod,
      paymentStatus: paymentMethod === "Cash" ? "Pending" : "Unpaid",
      payoutStatus: "NotReady",
      settlementStatus: "Unsettled",
      ...split,
    });
  };

  getOrderById = async (id: string) => {
    return await this.orderRepo.getOrderById(id);
  };

  getOrders = async (user: any, query: any) => {
    const params: any = { ...query };

    if (user.role === "Rider") {
      params.riderId = user.userId;
      if (query.scope === "available") {
        const [rider, settingsDoc] = await Promise.all([
          User.findById(user.userId).lean(),
          Settings.findOne().lean(),
        ]);

        if (!rider) {
          return { data: [], total: 0 };
        }

        const riderVehicleType = normalizeVehicleType(rider.vehicle?.type);
        const onboarding = buildDriverOnboardingStatus(rider);
        const activeOrder = await this.orderRepo.findActiveOrderByRider(user.userId);

        if (
          !riderVehicleType ||
          !onboarding.canGoOnline ||
          !rider.isOnline ||
          activeOrder
        ) {
          return { data: [], total: 0 };
        }

        params.riderVehicleType = riderVehicleType;
        params.riderLocation = rider?.location;
        params.requestVisibilityInfinite =
          settingsDoc?.deliverySettings?.requestVisibilityInfinite ?? true;
        params.requestVisibilityDistanceMeters =
          settingsDoc?.deliverySettings?.requestVisibilityDistanceMeters ?? null;
      }
    } else if (user.role === "User") {
      params.userId = user.userId;
    }

    return await this.orderRepo.getOrders(params);
  };

  getOrderSummary = async () => {
    return await this.orderRepo.getOrderSummary();
  };

  cancelOrder = async (id: string, reason?: string) => {
    return await this.orderRepo.cancelOrder(id, reason);
  };

  assignRider = async (id: string, riderId: string) => {
    const [rider, order] = await Promise.all([
      User.findById(riderId).lean(),
      this.orderRepo.getRawOrderById(id),
    ]);

    if (!rider) {
      throw new apiError(404, "Driver not found");
    }

    if (!order) {
      throw new apiError(404, "Order not found");
    }

    if (order.status !== "Pending" || order.rider) {
      throw new apiError(400, "This request is no longer available.");
    }

    if (order.paymentMethod === "Card" && order.paymentStatus !== "Paid") {
      throw new apiError(400, "Online payment must be completed before accepting this request.");
    }

    const riderVehicleType = normalizeVehicleType(rider.vehicle?.type);
    if (!riderVehicleType || riderVehicleType !== order.vehicleType) {
      throw new apiError(
        400,
        `This request requires a ${order.vehicleType} driver.`
      );
    }

    const onboarding = buildDriverOnboardingStatus(rider);
    if (!onboarding.canGoOnline) {
      throw new apiError(
        400,
        `Please complete all required onboarding steps and wait for admin approval before going online. Missing: ${onboarding.missingRequirements.join(", ")}`
      );
    }

    if (!rider.isOnline) {
      throw new apiError(400, "Driver is offline. Go online to accept rides.");
    }

    const activeOrder = await this.orderRepo.findActiveOrderByRider(riderId);
    if (activeOrder) {
      throw new apiError(
        400,
        "You already have an active order. Complete it before accepting another request."
      );
    }

    return await this.orderRepo.assignRider(id, riderId);
  };

  updateStatus = async (id: string, status: string) => {
    return await this.orderRepo.updateOrderStatus(id, status);
  };

  addCheckpoint = async (id: string, checkpoint: any) => {
    return await this.orderRepo.addCheckpoint(id, checkpoint);
  };

  submitCompletionProof = async (id: string, completionProof: string) => {
    return await this.orderRepo.setCompletionProof(id, completionProof);
  };

  addReview = async (id: string, rating: number, comment?: string) => {
    return await this.orderRepo.addReview(id, { rating, comment });
  };
}
