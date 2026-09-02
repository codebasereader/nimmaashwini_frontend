import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchGstr1B2cs,
  fetchGstr1Consolidated,
  fetchGstr1HsnSummary,
} from "../../api/gstr1";

const initialPagination = {
  total: 0,
  page: 1,
  limit: 20,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
};

const initialSummary = {
  totalOrders: 0,
  totalInvoiceValue: 0,
  totalTaxableValue: 0,
  totalCgstAmount: 0,
  totalSgstAmount: 0,
  totalIgstAmount: 0,
  incompleteOrders: 0,
};

function initialReportState() {
  return {
    items: [],
    pagination: initialPagination,
    summary: initialSummary,
    status: "idle",
    error: null,
  };
}

export const loadGstr1Consolidated = createAsyncThunk(
  "gstr1/loadConsolidated",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchGstr1Consolidated(
        { page: 1, limit: 25, ...params },
        auth.token,
      );
      return {
        items: data?.items || [],
        pagination: data?.pagination || initialPagination,
        summary: data?.summary || initialSummary,
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load consolidated GSTR-1 report",
      );
    }
  },
);

export const loadGstr1B2cs = createAsyncThunk(
  "gstr1/loadB2cs",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchGstr1B2cs(
        { page: 1, limit: 25, ...params },
        auth.token,
      );
      return {
        items: data?.items || [],
        pagination: data?.pagination || initialPagination,
        summary: data?.summary || initialSummary,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load B2CS report");
    }
  },
);

export const loadGstr1HsnSummary = createAsyncThunk(
  "gstr1/loadHsnSummary",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchGstr1HsnSummary(
        { page: 1, limit: 25, ...params },
        auth.token,
      );
      return {
        items: data?.items || [],
        pagination: data?.pagination || initialPagination,
        summary: data?.summary || initialSummary,
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load HSN (B2C) summary report",
      );
    }
  },
);

const gstr1Slice = createSlice({
  name: "gstr1",
  initialState: {
    consolidated: initialReportState(),
    b2cs: initialReportState(),
    hsnSummary: initialReportState(),
  },
  reducers: {
    clearGstr1Errors(state) {
      state.consolidated.error = null;
      state.b2cs.error = null;
      state.hsnSummary.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadGstr1Consolidated.pending, (state) => {
        state.consolidated.status = "loading";
        state.consolidated.error = null;
      })
      .addCase(loadGstr1Consolidated.fulfilled, (state, action) => {
        state.consolidated.status = "succeeded";
        state.consolidated.items = action.payload.items;
        state.consolidated.pagination = action.payload.pagination;
        state.consolidated.summary = action.payload.summary;
      })
      .addCase(loadGstr1Consolidated.rejected, (state, action) => {
        state.consolidated.status = "failed";
        state.consolidated.error = action.payload;
      })
      .addCase(loadGstr1B2cs.pending, (state) => {
        state.b2cs.status = "loading";
        state.b2cs.error = null;
      })
      .addCase(loadGstr1B2cs.fulfilled, (state, action) => {
        state.b2cs.status = "succeeded";
        state.b2cs.items = action.payload.items;
        state.b2cs.pagination = action.payload.pagination;
        state.b2cs.summary = action.payload.summary;
      })
      .addCase(loadGstr1B2cs.rejected, (state, action) => {
        state.b2cs.status = "failed";
        state.b2cs.error = action.payload;
      })
      .addCase(loadGstr1HsnSummary.pending, (state) => {
        state.hsnSummary.status = "loading";
        state.hsnSummary.error = null;
      })
      .addCase(loadGstr1HsnSummary.fulfilled, (state, action) => {
        state.hsnSummary.status = "succeeded";
        state.hsnSummary.items = action.payload.items;
        state.hsnSummary.pagination = action.payload.pagination;
        state.hsnSummary.summary = action.payload.summary;
      })
      .addCase(loadGstr1HsnSummary.rejected, (state, action) => {
        state.hsnSummary.status = "failed";
        state.hsnSummary.error = action.payload;
      });
  },
});

export const { clearGstr1Errors } = gstr1Slice.actions;
export default gstr1Slice.reducer;
