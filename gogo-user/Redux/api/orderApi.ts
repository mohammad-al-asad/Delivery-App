import { baseApi } from "./baseApi";

export type OrdersQuery = {
  page?: number;
  limit?: number;
  status?: string;
};

export type EstimateOrderPriceRequest = {
  distanceKm: number;
  durationMin: number;
  vehicleType?: "Bike" | "Car" | "Truck";
};

export type EstimateOrderPriceResponse = {
  success: boolean;
  message: string;
  data: {
    distanceKm: number;
    durationMin: number;
    vehicleType?: "Bike" | "Car" | "Truck";
    price: number;
    currency: string;
    baseCharge?: number;
    ratePerKm?: number;
  };
};

export type CreateOrderRequest = {
  pickup: {
    latitude: number;
    longitude: number;
    addressLine?: string;
    label?: string;
  };
  dropoff: {
    latitude: number;
    longitude: number;
    addressLine?: string;
    label?: string;
  };
  stoppages?: Array<{
    latitude: number;
    longitude: number;
    addressLine?: string;
    label?: string;
  }>;
  price: number;
  vehicleType?: "Bike" | "Car" | "Truck";
  distanceKm?: number;
  notes?: string;
  paymentMethod?: "Card" | "Cash";
};

export type CreateOrderResponse = {
  success: boolean;
  message: string;
  data: {
    _id: string;
    [key: string]: any;
  };
};

export type CancelOrderPayload = {
  id: string;
  reason?: string;
};

export type CancelOrderRequest = string | CancelOrderPayload;

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: (params: OrdersQuery | void) => ({
        url: "orders",
        params: params ?? { page: 1, limit: 20 },
      }),
      providesTags: ["orders"],
    }),
    estimateOrderPrice: builder.query<
      EstimateOrderPriceResponse,
      EstimateOrderPriceRequest
    >({
      query: (body) => ({
        url: "orders/estimate-price",
        method: "POST",
        body,
      }),
    }),
    createOrder: builder.mutation<CreateOrderResponse, CreateOrderRequest>({
      query: (body) => ({
        url: "orders",
        method: "POST",
        body,
      }),
      invalidatesTags: ["orders"],
    }),
    getOrderById: builder.query<any, string>({
      query: (id) => `orders/${id}`,
      transformResponse: (response: { data: any }) => response.data,
      providesTags: (result, error, id) => [{ type: "orders", id }],
    }),
    cancelOrder: builder.mutation<any, CancelOrderRequest>({
      query: (payload) => {
        const request =
          typeof payload === "string" ? { id: payload } : payload;

        return {
          url: `orders/${request.id}/cancel`,
          method: "PATCH",
          body: request.reason ? { reason: request.reason } : {},
        };
      },
      invalidatesTags: (result, error, payload) => {
        const id = typeof payload === "string" ? payload : payload.id;

        return ["orders", { type: "orders", id }];
      },
    }),
    addReview: builder.mutation<any, { orderId: string; rating: number; comment?: string }>({
      query: ({ orderId, ...body }) => ({
        url: `orders/${orderId}/review`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { orderId }) => [{ type: "orders", id: orderId }],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useEstimateOrderPriceQuery,
  useCreateOrderMutation,
  useGetOrderByIdQuery,
  useCancelOrderMutation,
  useAddReviewMutation,
} = orderApi;

export default orderApi;
