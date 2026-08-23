import { Ride } from "../types";

export type BackendRide = Ride & {
  backendStatus?:
    | "Pending"
    | "Accepted"
    | "ArrivedPickup"
    | "InProgress"
    | "Completed"
    | "Cancelled";
  distanceFromDriverKm?: number | null;
  vehicleType?: "Bike" | "Car" | "Truck";
};

export const getUserName = (user: any) => {
  const fullName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || user?.name || "Customer";
};

export const getAddress = (point: any) => {
  return point?.addressLine || point?.label || "Unknown location";
};

export const mapOrderToRide = (order: any): BackendRide => {
  const status =
    order.status === "Pending"
      ? "pending"
      : order.status === "Completed"
        ? "completed"
        : "active";

  return {
    id: String(order._id || order.id),
    passenger: {
      id: String(order.user?._id || order.user || ""),
      name: getUserName(order.user),
      phone: order.user?.phoneNumber || "",
      rating: order.review?.rating || 5,
    },
    pickup: {
      address: getAddress(order.pickup),
      latitude: order.pickup?.latitude || 0,
      longitude: order.pickup?.longitude || 0,
    },
    dropoff: {
      address: getAddress(order.dropoff),
      latitude: order.dropoff?.latitude || 0,
      longitude: order.dropoff?.longitude || 0,
    },
    status,
    fare: Number(order.driverEarningsAmount ?? order.price ?? 0),
    distance: Number(order.distanceFromDriverKm ?? order.distanceKm ?? 0),
    duration: 0,
    requestedAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    startedAt: order.tripStartedAt ? new Date(order.tripStartedAt) : undefined,
    completedAt: order.completedAt ? new Date(order.completedAt) : undefined,
    rating: order.review?.rating,
    backendStatus: order.status,
    distanceFromDriverKm: order.distanceFromDriverKm ?? null,
    vehicleType: order.vehicleType,
  };
};
