import Order from "../order/order.model";
import User from "../user/user.model";
import DriverPayout from "./driver-payout.model";
import { apiError } from "../../errors/api-error";
import { Errors } from "../../constants/error-codes";

const getDriverEarnings = (order: any) =>
  Number(order.driverEarningsAmount ?? order.price ?? 0);

const getAdminCommission = (order: any) =>
  Number(
    order.adminCommissionAmount ??
      ((order.price || 0) * ((order.adminCommissionPercent ?? 10) / 100))
  );

const roundMoney = (value: number) => Math.round(value * 100) / 100;

const getCompletedAt = (order: any) =>
  order.completedAt || order.updatedAt || order.createdAt || new Date();

export class DashboardService {
  private getDateRangeFilter = (dateFrom?: string, dateTo?: string) => {
    const dateFilter: any = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      if (!Number.isNaN(start.getTime())) dateFilter.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      if (!Number.isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }
    return Object.keys(dateFilter).length ? dateFilter : undefined;
  };

  private buildDriverSettlement = async (
    rider: any,
    dateFrom?: string,
    dateTo?: string
  ) => {
    const completedDateFilter = this.getDateRangeFilter(dateFrom, dateTo);
    const orderFilter: any = {
      rider: rider._id,
      status: "Completed",
    };
    if (completedDateFilter) {
      orderFilter.completedAt = completedDateFilter;
    }
    const payoutFilter: any = {
      rider: rider._id,
      status: "Paid",
    };
    if (completedDateFilter) {
      payoutFilter.paidAt = completedDateFilter;
    }

    const [orders, paidPayouts, lastPayout] = await Promise.all([
      Order.find(orderFilter).sort({ completedAt: -1 }).lean(),
      DriverPayout.find(payoutFilter).lean(),
      DriverPayout.findOne({
        rider: rider._id,
        status: "Paid",
      })
        .sort({ paidAt: -1, updatedAt: -1 })
        .lean(),
    ]);

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.price || 0),
      0
    );
    const totalEarnings = orders.reduce(
      (sum, order) => sum + getDriverEarnings(order),
      0
    );
    const adminCommission = orders.reduce(
      (sum, order) => sum + getAdminCommission(order),
      0
    );
    const cashPaidEarnings = orders
      .filter((order) => order.paymentMethod === "Cash")
      .reduce((sum, order) => sum + Number(order.price || 0), 0);
    const paidPayoutAmount = paidPayouts.reduce(
      (sum, payout) => sum + Number(payout.amount || 0),
      0
    );
    const paidEarnings = cashPaidEarnings + paidPayoutAmount;
    const pendingEarnings = totalEarnings - paidEarnings;

    const unsettledOrders = orders.filter(
      (order: any) => order.settlementStatus !== "Settled"
    );
    const cardPending = unsettledOrders
      .filter(
        (order: any) =>
          order.paymentMethod === "Card" && order.paymentStatus === "Paid"
      )
      .reduce((sum, order) => sum + getDriverEarnings(order), 0);
    const cashCommissionOffset = unsettledOrders
      .filter((order: any) => order.paymentMethod === "Cash")
      .reduce((sum, order) => sum + getAdminCommission(order), 0);
    const payoutDue = cardPending - cashCommissionOffset;

    return {
      rider,
      orders,
      unsettledOrders,
      totalRevenue: roundMoney(totalRevenue),
      totalEarnings: roundMoney(totalEarnings),
      adminCommission: roundMoney(adminCommission),
      paidEarnings: roundMoney(paidEarnings),
      cashPaidEarnings: roundMoney(cashPaidEarnings),
      pendingEarnings: roundMoney(pendingEarnings),
      payoutDue: roundMoney(payoutDue),
      lastPayoutDate: lastPayout?.paidAt || lastPayout?.updatedAt || null,
      payoutStatus:
        payoutDue > 0 ? "Ready" : payoutDue < 0 ? "OffsetDue" : "Settled",
    };
  };

  getRiderStats = async (riderId: string) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [todayRides, allRides] = await Promise.all([
      Order.find({
        rider: riderId,
        status: "Completed",
        $or: [
          { completedAt: { $gte: todayStart, $lte: todayEnd } },
          { completedAt: { $exists: false }, updatedAt: { $gte: todayStart, $lte: todayEnd } },
          { completedAt: null, updatedAt: { $gte: todayStart, $lte: todayEnd } }
        ]
      }).lean(),
      Order.find({
        rider: riderId,
        status: "Completed",
      }).lean(),
    ]);

    const todayEarnings = todayRides.reduce((sum, order) => sum + getDriverEarnings(order), 0);
    const totalEarnings = allRides.reduce((sum, order) => sum + getDriverEarnings(order), 0);

    const activeRide = await Order.findOne({
      rider: riderId,
      status: { $in: ["Accepted", "ArrivedPickup", "InProgress"] },
    }).lean();

    const reviewedRides = allRides.filter((o: any) => o.review?.rating != null);
    const averageRating = reviewedRides.length > 0
      ? Math.round((reviewedRides.reduce((sum, o: any) => sum + o.review.rating, 0) / reviewedRides.length) * 10) / 10
      : 5.0;

    return {
      todayEarnings,
      totalEarnings,
      todayRides: todayRides.length,
      totalRides: allRides.length,
      todayTripsCount: todayRides.length,
      totalTripsCount: allRides.length,
      activeRide,
      hoursOnline: 0,
      averageRating,
      acceptanceRate: 100,
    };
  };

  getRiderEarnings = async (riderId: string) => {
    const [completedRides, paidPayouts] = await Promise.all([
      Order.find({
        rider: riderId,
        status: "Completed",
      })
        .sort({ updatedAt: -1 })
        .lean(),
      DriverPayout.find({
        rider: riderId,
        status: "Paid",
      }).lean(),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayEarnings = completedRides
      .filter((ride) => {
        const rDate = new Date(ride.completedAt || ride.updatedAt);
        return rDate >= todayStart && rDate <= todayEnd;
      })
      .reduce((sum, ride) => sum + getDriverEarnings(ride), 0);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    oneWeekAgo.setHours(0, 0, 0, 0);

    const weekEarnings = completedRides
      .filter((ride) => new Date(ride.completedAt || ride.updatedAt) >= oneWeekAgo)
      .reduce((sum, ride) => sum + getDriverEarnings(ride), 0);

    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    oneMonthAgo.setHours(0, 0, 0, 0);

    const monthEarnings = completedRides
      .filter((ride) => new Date(ride.completedAt || ride.updatedAt) >= oneMonthAgo)
      .reduce((sum, ride) => sum + getDriverEarnings(ride), 0);

    const totalEarnings = completedRides.reduce((sum, ride) => sum + getDriverEarnings(ride), 0);
    const cashPaidEarnings = completedRides
      .filter((ride) => ride.paymentMethod === "Cash")
      .reduce((sum, ride) => sum + Number(ride.price || 0), 0);
    const paidPayoutAmount = paidPayouts.reduce(
      (sum, payout) => sum + Number(payout.amount || 0),
      0
    );
    const paidEarnings = cashPaidEarnings + paidPayoutAmount;
    const pendingEarnings = totalEarnings - paidEarnings;
    const pendingSettlement = Math.max(pendingEarnings, 0);
    const adminDue = Math.max(-pendingEarnings, 0);

    // Prepare dailyTrend for last 7 days
    const dailyTrend: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);

      const dayAmount = completedRides
        .filter((ride) => {
          const rDate = new Date(ride.completedAt || ride.updatedAt);
          return rDate >= startOfDay && rDate <= endOfDay;
        })
        .reduce((sum, ride) => sum + getDriverEarnings(ride), 0);

      dailyTrend.push({
        date: dateStr,
        amount: Math.round(dayAmount * 100) / 100,
      });
    }

    const transactions = completedRides.map((ride) => ({
      id: ride._id.toString(),
      type: "ride",
      amount: getDriverEarnings(ride),
      status:
        ride.paymentMethod === "Cash" || ride.payoutStatus === "Paid"
          ? "completed"
          : "pending",
      date: ride.completedAt || ride.updatedAt || new Date(),
      description:
        ride.paymentMethod === "Cash"
          ? `Cash received for ${ride.dropoff?.addressLine || "Destination"}`
          : `Ride to ${ride.dropoff?.addressLine || "Destination"}`,
      rideId: ride._id.toString(),
    }));

    const payoutTransactions = paidPayouts.map((payout) => ({
      id: payout._id.toString(),
      type: "payout",
      amount: Number(payout.amount || 0),
      status: "completed",
      date: payout.paidAt || payout.updatedAt || new Date(),
      description: `Manual settlement ${payout.referenceId || ""}`.trim(),
    }));

    return {
      total: roundMoney(totalEarnings),
      today: todayEarnings,
      week: weekEarnings,
      month: monthEarnings,
      paid: roundMoney(paidEarnings),
      pending: roundMoney(pendingSettlement),
      adminDue: roundMoney(adminDue),
      settlementBalance: roundMoney(pendingEarnings),
      cashPaid: roundMoney(cashPaidEarnings),
      dailyTrend,
      transactions: [...payoutTransactions, ...transactions].sort(
        (a: any, b: any) =>
          new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    };
  };

  getOverview = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalUsers, totalDrivers, totalOrders, completedOrders] = await Promise.all([
      User.countDocuments({ role: "User" }),
      User.countDocuments({ role: "Rider" }),
      Order.countDocuments(),
      Order.find({ status: "Completed" }).lean(),
    ]);

    const totalPayments = completedOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const totalCommission = completedOrders.reduce(
      (sum, order) => sum + getAdminCommission(order),
      0
    );

    const todayOrders = completedOrders
      .filter((order) => {
        const orderDate = new Date(order.completedAt || order.updatedAt);
        return orderDate >= todayStart && orderDate <= todayEnd;
      });
    const todayPayments = todayOrders.reduce((sum, order) => sum + (order.price || 0), 0);
    const todayCommission = todayOrders.reduce(
      (sum, order) => sum + getAdminCommission(order),
      0
    );

    const thisMonthOrders = completedOrders
      .filter((order) => {
        const orderDate = new Date(order.completedAt || order.updatedAt);
        return orderDate >= monthStart;
      });
    const thisMonthPayments = thisMonthOrders.reduce(
      (sum, order) => sum + (order.price || 0),
      0
    );
    const thisMonthCommission = thisMonthOrders.reduce(
      (sum, order) => sum + getAdminCommission(order),
      0
    );

    return {
      totalUsers,
      totalDrivers,
      totalRiders: totalDrivers,
      activeRiders: totalDrivers,
      totalOrders,
      totalRevenue: roundMoney(totalPayments),
      totalPayments: roundMoney(totalPayments),
      totalEarning: roundMoney(totalCommission),
      totalEarnings: roundMoney(totalCommission),
      todayRevenue: roundMoney(todayPayments),
      todayPayments: roundMoney(todayPayments),
      thisMonthRevenue: roundMoney(thisMonthPayments),
      thisMonthPayments: roundMoney(thisMonthPayments),
      totalCommission: roundMoney(totalCommission),
      todayCommission: roundMoney(todayCommission),
      thisMonthCommission: roundMoney(thisMonthCommission),
    };
  };

  getUserGrowth = async (year?: string, month?: string) => {
    const matchStage: any = { role: "User" };
    if (year) {
      const start = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
      const end = new Date(Number(year), month ? Number(month) : 12, 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const growth = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return growth.map((g) => ({ date: g._id, count: g.count }));
  };

  getRiderGrowth = async (year?: string, month?: string) => {
    const matchStage: any = { role: "Rider" };
    if (year) {
      const start = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
      const end = new Date(Number(year), month ? Number(month) : 12, 1);
      matchStage.createdAt = { $gte: start, $lt: end };
    }

    const growth = await User.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return growth.map((g) => ({ date: g._id, count: g.count }));
  };

  getRevenueTrend = async (year?: string, month?: string) => {
    const matchStage: any = { status: "Completed" };
    if (year) {
      const start = new Date(Number(year), month ? Number(month) - 1 : 0, 1);
      const end = new Date(Number(year), month ? Number(month) : 12, 1);
      matchStage.updatedAt = { $gte: start, $lt: end };
    }

    const trend = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          amount: {
            $sum: {
              $ifNull: [
                "$adminCommissionAmount",
                {
                  $multiply: [
                    { $ifNull: ["$price", 0] },
                    {
                      $divide: [
                        { $ifNull: ["$adminCommissionPercent", 10] },
                        100,
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return trend.map((t) => ({ date: t._id, amount: roundMoney(t.amount) }));
  };

  getAdminEarnings = async (page: number = 1, limit: number = 10) => {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      Order.find({ status: "Completed" })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("rider", "name firstName lastName email phoneNumber")
        .populate("user", "name firstName lastName email phoneNumber")
        .lean(),
      Order.countDocuments({ status: "Completed" }),
    ]);

    const result = orders.map((order: any) => ({
      ...order,
      totalPayment: roundMoney(Number(order.price || 0)),
      adminCommissionAmount: roundMoney(getAdminCommission(order)),
      driverEarningsAmount: roundMoney(getDriverEarnings(order)),
    }));

    return {
      meta: { total, page, limit },
      result,
    };
  };

  getDriverPayouts = async (query: any = {}) => {
    const riders = await User.find({ role: "Rider" })
      .sort({ createdAt: -1 })
      .lean();

    const settlements = await Promise.all(
      riders.map((rider) =>
        this.buildDriverSettlement(
          rider,
          query.dateFrom as string | undefined,
          query.dateTo as string | undefined
        )
      )
    );

    return settlements.map((settlement) => ({
      rider: {
        _id: settlement.rider._id,
        name:
          [settlement.rider.firstName, settlement.rider.lastName]
            .filter(Boolean)
            .join(" ") || settlement.rider.name,
        email: settlement.rider.email,
        phoneNumber: settlement.rider.phoneNumber,
        payoutAccount: settlement.rider.payoutAccount,
      },
      totalRevenue: settlement.totalRevenue,
      totalEarnings: settlement.totalEarnings,
      adminCommission: settlement.adminCommission,
      paidEarnings: settlement.paidEarnings,
      pendingEarnings: settlement.pendingEarnings,
      payoutDue: settlement.payoutDue,
      lastPayoutDate: settlement.lastPayoutDate,
      payoutStatus: settlement.payoutStatus,
    }));
  };

  getDriverPayoutHistory = async (query: any = {}) => {
    const filter: any = {};
    if (query.riderId) filter.rider = query.riderId;
    const dateFilter = this.getDateRangeFilter(query.dateFrom, query.dateTo);
    if (dateFilter) filter.createdAt = dateFilter;

    return DriverPayout.find(filter)
      .sort({ createdAt: -1 })
      .populate("rider", "name firstName lastName email phoneNumber payoutAccount")
      .populate("orders")
      .lean();
  };

  payDriver = async (riderId: string, body: any = {}, adminId?: string) => {
    const rider = await User.findById(riderId).lean();
    if (!rider) {
      throw new apiError(Errors.NotFound.code, "Driver not found");
    }

    const settlement = await this.buildDriverSettlement(
      rider,
      body.dateFrom,
      body.dateTo
    );
    if (settlement.payoutDue === 0) {
      throw new apiError(
        Errors.BadRequest.code,
        "No settlement amount is available"
      );
    }

    const orderIds = settlement.unsettledOrders.map((order: any) => order._id);
    const payout = await DriverPayout.create({
      rider: riderId,
      orders: orderIds,
      amount: settlement.payoutDue,
      currency: body.currency || "AED",
      status: "Paid",
      provider: "Manual",
      referenceId: body.referenceId || `manual_${Date.now()}`,
      transactionId: body.transactionId,
      periodStart: body.dateFrom ? new Date(body.dateFrom) : undefined,
      periodEnd: body.dateTo ? new Date(body.dateTo) : undefined,
      totalRevenue: settlement.totalRevenue,
      totalEarnings: settlement.totalEarnings,
      adminCommission: settlement.adminCommission,
      paidEarningsBefore: settlement.paidEarnings,
      pendingEarningsBefore: settlement.pendingEarnings,
      createdBy: adminId,
      processedAt: new Date(),
      paidAt: new Date(),
      response: {
        manual: true,
        paymentMethod: body.paymentMethod || "hand_to_hand",
        settlementDirection:
          settlement.payoutDue > 0 ? "AdminToDriver" : "DriverToAdmin",
        note: body.note,
      },
    });

    await Order.updateMany(
      { _id: { $in: orderIds } },
      {
        $set: {
          settlementStatus: "Settled",
          settlementId: payout._id,
          settledAt: payout.paidAt,
          payoutStatus: "Paid",
        },
      }
    );

    return payout.populate([
      { path: "rider", select: "name firstName lastName email phoneNumber payoutAccount" },
      { path: "orders" },
    ]);
  };

  getHotAreas = async (timeframe?: string) => {
    const areas = await Order.aggregate([
      { $match: { "pickup.addressLine": { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$pickup.addressLine",
          numberOfOrders: { $sum: 1 },
          riders: { $addToSet: "$rider" },
        },
      },
      {
        $project: {
          areaName: "$_id",
          numberOfOrders: 1,
          numberOfRiders: {
            $size: {
              $filter: {
                input: "$riders",
                as: "r",
                cond: { $ne: ["$$r", null] }
              }
            }
          }
        }
      },
      { $sort: { numberOfOrders: -1 } },
      { $limit: 10 },
    ]);

    return areas;
  };
}
