import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  backfillCustomers as backfillCustomersApi,
  fetchCustomerById,
  fetchCustomers,
} from "../../api/customers";

const initialPagination = {
  total: 0,
  page: 1,
  limit: 25,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const loadCustomers = createAsyncThunk(
  "customers/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchCustomers(
        { page: 1, limit: 25, sort: "lastOrderAt:desc", ...params },
        auth.token,
      );
      return {
        items: data?.items || [],
        pagination: data?.pagination || initialPagination,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load customers");
    }
  },
);

export const loadCustomerById = createAsyncThunk(
  "customers/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchCustomerById(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load customer");
    }
  },
);

export const runCustomerBackfill = createAsyncThunk(
  "customers/backfill",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await backfillCustomersApi(auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to backfill customers");
    }
  },
);

const customersSlice = createSlice({
  name: "customers",
  initialState: {
    items: [],
    pagination: initialPagination,
    status: "idle",
    error: null,
    selected: null,
    detailStatus: "idle",
    detailError: null,
    backfillStatus: "idle",
    backfillError: null,
    backfillResult: null,
  },
  reducers: {
    clearCustomerDetail(state) {
      state.selected = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearCustomerErrors(state) {
      state.error = null;
      state.detailError = null;
      state.backfillError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCustomers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadCustomers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(loadCustomers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loadCustomerById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(loadCustomerById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selected = action.payload;
      })
      .addCase(loadCustomerById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
      })
      .addCase(runCustomerBackfill.pending, (state) => {
        state.backfillStatus = "loading";
        state.backfillError = null;
        state.backfillResult = null;
      })
      .addCase(runCustomerBackfill.fulfilled, (state, action) => {
        state.backfillStatus = "succeeded";
        state.backfillResult = action.payload;
      })
      .addCase(runCustomerBackfill.rejected, (state, action) => {
        state.backfillStatus = "failed";
        state.backfillError = action.payload;
      });
  },
});

export const { clearCustomerDetail, clearCustomerErrors } =
  customersSlice.actions;
export default customersSlice.reducer;
