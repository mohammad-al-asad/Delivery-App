type ApiResponse<T> = {
  data?: T;
};

type Payment = {
  _id?: string;
  id?: string;
  status?: string;
  description?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  order?: {
    _id?: string;
    id?: string;
  };
};

export const getPaymentArray = (response: unknown): Payment[] => {
  if (Array.isArray(response)) {
    return response;
  }

  const data = (response as any)?.data;
  if (Array.isArray(data?.result)) return data.result;
  return Array.isArray(data) ? data : [];
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

export const toTransactionItem = (payment: Payment) => {
  const isRefund = payment.status === "Refunded";
  const currency = payment.currency ?? "AED";
  const amount = Number(payment.amount ?? 0).toFixed(2);
  const { date, time } = formatDateTime(payment.createdAt);
  const orderId = payment.order?._id ?? payment.order?.id;

  return {
    id: payment._id ?? payment.id ?? `${date}-${amount}`,
    type: isRefund ? "Refund" : "Payment",
    desc: payment.description ?? (orderId ? `Order #${orderId}` : payment.status ?? "Payment"),
    amount: `${isRefund ? "+" : "-"} ${currency} ${amount}`,
    date,
    time,
    icon: isRefund ? "add-circle-outline" : "remove-circle-outline",
    color: isRefund ? "#4CAF50" : "#F44336",
  };
};
