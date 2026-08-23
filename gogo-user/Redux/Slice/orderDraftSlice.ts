import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type DraftCoordinate = {
  latitude: number;
  longitude: number;
};

export type DraftLocation = {
  address: string;
  details: string;
  personName: string;
  phone: string;
  coordinate: DraftCoordinate | null;
};

export type DraftStop = {
  id: string;
  address: string;
  coordinate: DraftCoordinate | null;
};

type OrderDraftState = {
  pickup: DraftLocation | null;
  dropoff: DraftLocation | null;
  stops: DraftStop[];
  selectedVehicleId: string | null;
  routeDistanceKm: number | null;
  routeDurationMin: number | null;
};

const initialState: OrderDraftState = {
  pickup: null,
  dropoff: null,
  selectedVehicleId: null,
  routeDistanceKm: null,
  routeDurationMin: null,
  stops: [],
};

export const orderDraftSlice = createSlice({
  name: "orderDraft",
  initialState,
  reducers: {
    setPickupLocation: (state, action: PayloadAction<DraftLocation>) => {
      state.pickup = action.payload;
    },
    setDropoffLocation: (state, action: PayloadAction<DraftLocation>) => {
      state.dropoff = action.payload;
    },
    setDraftStops: (state, action: PayloadAction<DraftStop[]>) => {
      state.stops = action.payload;
    },
    setSelectedVehicle: (state, action: PayloadAction<string | null>) => {
      state.selectedVehicleId = action.payload;
    },
    setRouteEstimate: (
      state,
      action: PayloadAction<{
        distanceKm: number | null;
        durationMin: number | null;
      }>
    ) => {
      state.routeDistanceKm = action.payload.distanceKm;
      state.routeDurationMin = action.payload.durationMin;
    },
    swapPickupAndDropoff: (state) => {
      const currentPickup = state.pickup;
      state.pickup = state.dropoff;
      state.dropoff = currentPickup;
    },
    resetOrderDraft: () => initialState,
  },
});

export const {
  setPickupLocation,
  setDropoffLocation,
  setDraftStops,
  setSelectedVehicle,
  setRouteEstimate,
  swapPickupAndDropoff,
  resetOrderDraft,
} = orderDraftSlice.actions;

export default orderDraftSlice.reducer;
