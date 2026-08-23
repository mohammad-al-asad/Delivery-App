type ApiResponse<T> = {
  data?: T;
  total?: number;
};

type GeoPoint = {
  label?: string;
  addressLine?: string;
};

type Order = {
  _id?: string;
  id?: string;
  status?: string;
  pickup?: GeoPoint;
  dropoff?: GeoPoint;
  price?: number;
  vehicleType?: string;
  createdAt?: string;
};

const STATUS_LABELS: Record<string, string> = {
  Pending: "Pending",
  Accepted: "Accepted",
  ArrivedPickup: "Arrived Pickup",
  InProgress: "In Transit",
  Completed: "Delivered",
  Cancelled: "Cancelled",
};

export const getOrderArray = (response: unknown): Order[] => {
  if (Array.isArray(response)) {
    return response;
  }

  const data = (response as any)?.data;
  if (Array.isArray(data?.result)) return data.result;
  return Array.isArray(data) ? data : [];
};

export const getOrderTotal = (response: unknown) => {
  const total = (response as ApiResponse<Order[]> | undefined)?.total;
  return typeof total === "number" ? total : getOrderArray(response).length;
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return { date: "Unknown date", time: "" };
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { date: value, time: "" };
  }

  return {
    date: date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
};

const getLocationText = (point?: GeoPoint) =>
  point?.addressLine || point?.label || "Unknown location";

export const toOrderItem = (order: Order) => {
  const id = order._id ?? order.id ?? "";
  const { date, time } = formatDateTime(order.createdAt);

  return {
    id,
    status: STATUS_LABELS[order.status ?? ""] ?? order.status ?? "Pending",
    date,
    time,
    from: getLocationText(order.pickup),
    to: getLocationText(order.dropoff),
    price: `AED ${Number(order.price ?? 0).toFixed(2)}`,
    vehicle: order.vehicleType ?? "Bike",
    orderId: id ? `#ORD-${id.slice(-6).toUpperCase()}` : "#ORD",
  };
};
