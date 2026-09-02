import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createAdminOrder as createAdminOrderRequest,
  fetchAdminOrderById,
  fetchAdminOrders,
  updateAdminOrderStatus,
} from "../../api/adminOrders";

const initialPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

export const loadAdminOrders = createAsyncThunk(
  "adminOrders/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchAdminOrders(
        { page: 1, limit: 20, ...params },
        auth.token,
      );
      return {
        items: data?.items || [],
        pagination: data?.pagination || initialPagination,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load orders");
    }
  },
);

export const loadAdminOrderById = createAsyncThunk(
  "adminOrders/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchAdminOrderById(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load order");
    }
  },
);

export const editAdminOrderStatus = createAsyncThunk(
  "adminOrders/editStatus",
  async ({ id, status }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateAdminOrderStatus(id, { status }, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update order status");
    }
  },
);

export const createAdminOrder = createAsyncThunk(
  "adminOrders/create",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createAdminOrderRequest(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create order");
    }
  },
);

const adminOrdersSlice = createSlice({
  name: "adminOrders",
  initialState: {
    items: [],
    pagination: initialPagination,
    status: "idle",
    mutationStatus: "idle",
    error: null,
    mutationError: null,
    selected: null,
    detailStatus: "idle",
    detailError: null,
  },
  reducers: {
    clearAdminOrderDetail(state) {
      state.selected = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
    clearAdminOrderErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAdminOrders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadAdminOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(loadAdminOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loadAdminOrderById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
      })
      .addCase(loadAdminOrderById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.selected = action.payload;
      })
      .addCase(loadAdminOrderById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
      })
      .addCase(editAdminOrderStatus.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(editAdminOrderStatus.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const updated = action.payload;
        const updatedId = updated?.id || updated?._id;
        state.items = state.items.map((item) =>
          (item?.id || item?._id) === updatedId ? { ...item, ...updated } : item,
        );
        if ((state.selected?.id || state.selected?._id) === updatedId) {
          state.selected = { ...state.selected, ...updated };
        }
      })
      .addCase(editAdminOrderStatus.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(createAdminOrder.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(createAdminOrder.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const created = action.payload;
        if (created) {
          state.items = [created, ...state.items];
          state.pagination = {
            ...state.pagination,
            total: (state.pagination.total || 0) + 1,
          };
        }
      })
      .addCase(createAdminOrder.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearAdminOrderDetail, clearAdminOrderErrors } =
  adminOrdersSlice.actions;
export default adminOrdersSlice.reducer;
