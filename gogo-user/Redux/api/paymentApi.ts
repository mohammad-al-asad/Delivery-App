import { baseApi } from "./baseApi";

export type InitiatePaymentRequest = {
  orderId: string;
  amount?: number;
  currency?: string;
  description?: string;
  redirectUrl?: string;
  postUrl?: string;
  sourceId?: string;
  customer?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneCountryCode?: string;
    phoneNumber?: string;
  };
};

export type InitiatePaymentResponse = {
  success: boolean;
  message: string;
  data: {
    payment: any;
    chargeId: string;
    tapStatus: string;
    transactionUrl: string;
    response: any;
  };
};

export type VerifyPaymentRequest = {
  chargeId: string;
};

export type VerifyPaymentResponse = {
  success: boolean;
  message: string;
  data: {
    payment: any;
    tapStatus: string;
    response: any;
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
  useVerifyPaymentMutation,
} = paymentApi;

export default paymentApi;
