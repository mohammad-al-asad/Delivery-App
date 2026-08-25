import { baseApi } from "./baseApi";

export type InitiatePaymentRequest = {
  orderId: string;
  amount?: number;
  currency?: string;
  description?: string;
};

export type InitiatePaymentResponse = {
  success: boolean;
  message: string;
  data: {
    payment: any;
    paymentIntentId: string;
    clientSecret: string;
    publishableKey?: string;
    amount: number;
    currency: string;
    status: string;
    chargeId?: string;
    tapStatus?: string;
    transactionUrl?: string;
  };
};

export type VerifyPaymentRequest = {
  paymentIntentId?: string;
  chargeId?: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  data: {
    payment: any;
    status: string;
    isPaid: boolean;
    tapStatus?: string;
    response?: any;
  };
};

export type PaymentHistoryQuery = {
  page?: number;
  limit?: number;
  status?: string;
};

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentHistory: builder.query({
      query: (params: PaymentHistoryQuery | void) => ({
        url: "payments/history",
        params: params ?? { page: 1, limit: 20 },
      }),
      providesTags: ["payments"],
    }),
    initiatePayment: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({
        url: "payments/initiate",
        method: "POST",
        body,
      }),
      invalidatesTags: ["payments"],
    }),
    createPaymentIntent: builder.mutation<InitiatePaymentResponse, InitiatePaymentRequest>({
      query: (body) => ({
        url: "payments/create-intent",
        method: "POST",
        body,
      }),
      invalidatesTags: ["payments"],
    }),
    verifyPayment: builder.mutation<VerifyPaymentResponse, VerifyPaymentRequest>({
      query: (body) => ({
        url: "payments/verify",
        method: "POST",
        body,
      }),
      invalidatesTags: ["payments"],
    }),
  }),
});

export const {
  useGetPaymentHistoryQuery,
  useInitiatePaymentMutation,
  useCreatePaymentIntentMutation,
  useVerifyPaymentMutation,
} = paymentApi;

export default paymentApi;
