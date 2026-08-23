import Order from "./order.model";
import { calculateDistanceMeters } from "../../utils/distance-utils";
import { ACTIVE_ORDER_STATUSES } from "../../utils/driver-onboarding";
import User from "../user/user.model";

export class OrderRepository {
  createOrder = async (orderData: any) => {
    const order = new Order(orderData);
    await order.save();
    return order;
  };

  getOrderById = async (id: string) => {
    const order = await Order.findById(id).populate("user rider").lean();
    if (order && order.rider) {
      const riderId = order.rider._id;
      const reviews = await Order.find({
        rider: riderId,
        status: "Completed",
        "review.rating": { $exists: true }
      }).select("review.rating").lean();

      let avgRating = 5.0;
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, curr) => acc + (curr.review?.rating || 0), 0);
        avgRating = Math.round((sum / reviews.length) * 10) / 10;
      }
      (order.rider as any).rating = avgRating.toFixed(1);
      (order as any).driver = {
        ...((order as any).driver || {}),
        rating: avgRating.toFixed(1),
      };
    }
    return order;
  };

  getRawOrderById = async (id: string) => {
    return await Order.findById(id).lean();
  };

  getOrders = async (query: {
    userId?: string;
    riderId?: string;
    status?: string;
    scope?: string;
    page?: number;
    limit?: number;
    riderVehicleType?: string | null;
    riderLocation?: { latitude?: number; longitude?: number };
    requestVisibilityDistanceMeters?: number | null;
    requestVisibilityInfinite?: boolean;
  }) => {
    const page = Number(query.page) || 1;
    const requestedLimit = Number(query.limit);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.status) {
      filter.status = query.status;
    }

    if (query.scope === "available") {
      if (!query.riderVehicleType) {
        return { data: [], total: 0 };
      }

      filter.status = "Pending";
      filter.$and = [
        { $or: [{ rider: { $exists: false } }, { rider: null }] },
        {
          $or: [
            { paymentMethod: "Cash" },
            { paymentMethod: "Card", paymentStatus: "Paid" },
          ],
        },
      ];
      filter.vehicleType = query.riderVehicleType;

      const rawOrders = await Order.find(filter)
        .populate("user rider")
        .sort({ createdAt: -1 })
        .lean();

      const ordersWithDistance = rawOrders
        .map((order: any) => {
          const distanceFromDriverMeters = calculateDistanceMeters(
            query.riderLocation,
            order.pickup
          );
          return {
            ...order,
            distanceFromDriverMeters,
            distanceFromDriverKm:
              distanceFromDriverMeters == null
                ? null
                : Math.round((distanceFromDriverMeters / 1000) * 100) / 100,
          };
        })
        .filter((order: any) => {
          if (query.requestVisibilityInfinite) return true;
          if (query.requestVisibilityDistanceMeters == null) return true;
          if (order.distanceFromDriverMeters == null) return false;
          return order.distanceFromDriverMeters <= query.requestVisibilityDistanceMeters;
        })
        .sort((a: any, b: any) => {
          const aDistance = a.distanceFromDriverMeters ?? Number.POSITIVE_INFINITY;
          const bDistance = b.distanceFromDriverMeters ?? Number.POSITIVE_INFINITY;
          return aDistance - bDistance;
        });

      const hasExplicitLimit =
        query.limit !== undefined && Number.isFinite(requestedLimit) && requestedLimit > 0;

      return {
        data: hasExplicitLimit
          ? ordersWithDistance.slice(skip, skip + limit)
          : ordersWithDistance,
        total: ordersWithDistance.length,
      };
    } else if (query.riderId) {
      filter.rider = query.riderId;
    } else if (query.userId) {
      filter.user = query.userId;
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user rider")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return { data: orders, total };
  };

  getOrderSummary = async () => {
    const summary = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      completed: 0,
      cancelled: 0,
      inProgress: 0,
      accepted: 0,
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0
    };

    let total = 0;
    summary.forEach((item) => {
      const status = item._id.toLowerCase();
      total += item.count;
      if (status === "pending") {
        result.pending = item.count;
        result.pendingOrders = item.count;
      }
      else if (status === "completed") {
        result.completed = item.count;
        result.completedOrders = item.count;
      }
      else if (status === "cancelled") result.cancelled = item.count;
      else if (status === "inprogress") result.inProgress = item.count;
      else if (status === "accepted") result.accepted = item.count;
    });

    result.totalOrders = total;
    return result;
  };

  updateOrderStatus = async (id: string, status: string) => {
    const order = await Order.findById(id).lean();
    const update: any = { status };
    if (status === "Completed") {
      update.completedAt = new Date();
      update.paymentStatus =
        order?.paymentMethod === "Cash" ? "Paid" : order?.paymentStatus;
      update.payoutStatus =
        order?.paymentMethod === "Cash" ? "Paid" : "Pending";
      update.settlementStatus = "Unsettled";
    }
    return await Order.findByIdAndUpdate(id, update, { new: true });
  };

  assignRider = async (id: string, riderId: string) => {
    const rider: any = await User.findById(riderId).lean();
    return await Order.findByIdAndUpdate(
      id,
      {
        rider: riderId,
        status: "Accepted",
        acceptedAt: new Date(),
        payoutAccountSnapshot: rider?.payoutAccount
          ? {
              provider: rider.payoutAccount.provider,
              tapMerchantId: rider.payoutAccount.tapMerchantId,
              status: rider.payoutAccount.status,
              accountNumberLast4: rider.payoutAccount.accountNumberLast4,
              iban: rider.payoutAccount.iban,
              bankName: rider.payoutAccount.bankName,
            }
          : undefined,
      },
      { new: true }
    );
  };

  addCheckpoint = async (id: string, checkpoint: any) => {
    const order = await Order.findById(id);
    if (!order) return null;

    const updateQuery: any = {
      $push: { checkpoints: checkpoint },
    };

    if (checkpoint.pointType === "pickup") {
      updateQuery.$set = {
        status: "ArrivedPickup",
        pickupReachedAt: checkpoint.timestamp || new Date(),
      };
    } else if (checkpoint.pointType === "dropoff") {
      const isCash = order.paymentMethod === "Cash";
      updateQuery.$set = {
        status: "Completed",
        completedAt: checkpoint.timestamp || new Date(),
        dropoffReachedAt: checkpoint.timestamp || new Date(),
        paymentStatus: isCash ? "Paid" : order.paymentStatus,
        payoutStatus: isCash ? "Paid" : "Pending",
        settlementStatus: "Unsettled",
      };
    } else if (checkpoint.pointType === "stoppage" && checkpoint.stoppageId) {
      updateQuery.$set = {
        status: "InProgress",
        "stoppages.$[elem].reachedAt": checkpoint.timestamp || new Date(),
      };
      if (!order.tripStartedAt) {
        updateQuery.$set.tripStartedAt = new Date();
      }
    }

    const arrayFilters = checkpoint.pointType === "stoppage" && checkpoint.stoppageId
      ? [{ "elem._id": checkpoint.stoppageId }]
      : undefined;

    return await Order.findByIdAndUpdate(
      id,
      updateQuery,
      { new: true, arrayFilters }
    );
  };

  addReview = async (id: string, review: { rating: number; comment?: string }) => {
    return await Order.findByIdAndUpdate(id, { review }, { new: true });
  };

  cancelOrder = async (id: string, reason?: string) => {
    return await Order.findByIdAndUpdate(
      id,
      { status: "Cancelled", cancellationReason: reason },
      { new: true }
    );
  };

  setCompletionProof = async (id: string, completionProof: string) => {
    const order = await Order.findById(id);
    if (!order) return null;

    const updateQuery: any = { completionProof };

    return await Order.findByIdAndUpdate(id, updateQuery, { new: true });
  };

  findActiveOrderByRider = async (riderId: string) => {
    return await Order.findOne({
      rider: riderId,
      status: { $in: [...ACTIVE_ORDER_STATUSES] },
    }).lean();
  };
}
