import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createCoupon as createCouponApi,
  deleteCoupon as deleteCouponApi,
  fetchCouponById as fetchCouponByIdApi,
  fetchCoupons as fetchCouponsApi,
  updateCoupon as updateCouponApi,
} from "../../api/coupons";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadCoupons = createAsyncThunk(
  "coupons/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchCouponsApi({ limit: 100, ...params }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load coupons");
    }
  },
);

export const loadCouponById = createAsyncThunk(
  "coupons/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchCouponByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load coupon");
    }
  },
);

export const addCoupon = createAsyncThunk(
  "coupons/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createCouponApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create coupon");
    }
  },
);

export const editCoupon = createAsyncThunk(
  "coupons/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateCouponApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update coupon");
    }
  },
);

export const removeCoupon = createAsyncThunk(
  "coupons/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteCouponApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete coupon");
    }
  },
);

const couponsSlice = createSlice({
  name: "coupons",
  initialState: crudInitialState,
  reducers: {
    clearCouponErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearCouponCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadCoupons,
    loadOne: loadCouponById,
    add: addCoupon,
    edit: editCoupon,
    remove: removeCoupon,
    getId: getEntityId,
  }),
});

export const { clearCouponErrors, clearCouponCurrent } = couponsSlice.actions;
export default couponsSlice.reducer;
