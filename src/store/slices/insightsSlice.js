import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchInsightsOverview,
  fetchProductAnalysis,
} from "../../api/insights";

function emptyOverview() {
  return {
    kpis: {
      cashIn: 0,
      cashOut: 0,
      productsSold: 0,
      customers: 0,
      pendingInvoicesAmount: 0,
      invoicesCreated: 0,
    },
    totals: {
      sales: 0,
      expenses: 0,
      indirectIncome: 0,
    },
    reportsSeries: [],
    paymentsBreakdown: [],
    pendingInvoices: [],
    weeklyRevenue: [],
  };
}

export const loadInsightsOverview = createAsyncThunk(
  "insights/loadOverview",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchInsightsOverview(params, auth.token);
      return data || emptyOverview();
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load insights");
    }
  },
);

export const loadProductAnalysis = createAsyncThunk(
  "insights/loadProductAnalysis",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchProductAnalysis(params, auth.token);
      return data || { products: [], series: [] };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load product analysis",
      );
    }
  },
);

const insightsSlice = createSlice({
  name: "insights",
  initialState: {
    overview: emptyOverview(),
    productAnalysis: { products: [], series: [] },
    overviewStatus: "idle",
    productStatus: "idle",
    overviewError: null,
    productError: null,
    overviewRange: { fromDate: null, toDate: null },
    productRange: { fromDate: null, toDate: null },
  },
  reducers: {
    clearInsightsErrors(state) {
      state.overviewError = null;
      state.productError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInsightsOverview.pending, (state, action) => {
        state.overviewStatus = "loading";
        state.overviewError = null;
        state.overviewRange = {
          fromDate: action.meta.arg?.fromDate || null,
          toDate: action.meta.arg?.toDate || null,
        };
      })
      .addCase(loadInsightsOverview.fulfilled, (state, action) => {
        state.overviewStatus = "succeeded";
        state.overview = {
          ...emptyOverview(),
          ...action.payload,
          kpis: { ...emptyOverview().kpis, ...action.payload?.kpis },
          totals: { ...emptyOverview().totals, ...action.payload?.totals },
          reportsSeries: action.payload?.reportsSeries || [],
          paymentsBreakdown: action.payload?.paymentsBreakdown || [],
          pendingInvoices: action.payload?.pendingInvoices || [],
          weeklyRevenue: action.payload?.weeklyRevenue || [],
        };
      })
      .addCase(loadInsightsOverview.rejected, (state, action) => {
        state.overviewStatus = "failed";
        state.overviewError = action.payload;
        state.overview = emptyOverview();
      })
      .addCase(loadProductAnalysis.pending, (state, action) => {
        state.productStatus = "loading";
        state.productError = null;
        state.productRange = {
          fromDate: action.meta.arg?.fromDate || null,
          toDate: action.meta.arg?.toDate || null,
        };
      })
      .addCase(loadProductAnalysis.fulfilled, (state, action) => {
        state.productStatus = "succeeded";
        state.productAnalysis = {
          products: action.payload?.products || [],
          series: action.payload?.series || [],
        };
      })
      .addCase(loadProductAnalysis.rejected, (state, action) => {
        state.productStatus = "failed";
        state.productError = action.payload;
        state.productAnalysis = { products: [], series: [] };
      });
  },
});

export const { clearInsightsErrors } = insightsSlice.actions;
export default insightsSlice.reducer;
