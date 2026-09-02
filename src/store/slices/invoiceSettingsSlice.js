import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchInvoiceSettings,
  updateInvoiceSettings,
} from "../../api/invoiceSettings";

const emptySettings = {
  prefix: "NA",
  year: null,
  nextSequence: null,
  padding: 5,
  nextInvoiceNumber: null,
  lastIssuedInvoiceNumber: null,
  updatedAt: null,
};

export const loadInvoiceSettings = createAsyncThunk(
  "invoiceSettings/load",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchInvoiceSettings(auth.token);
      return data || emptySettings;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load invoice settings",
      );
    }
  },
);

export const saveInvoiceSettings = createAsyncThunk(
  "invoiceSettings/save",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await updateInvoiceSettings(payload, auth.token);
      return data || emptySettings;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update invoice settings",
      );
    }
  },
);

const invoiceSettingsSlice = createSlice({
  name: "invoiceSettings",
  initialState: {
    settings: emptySettings,
    status: "idle",
    error: null,
    mutationStatus: "idle",
    mutationError: null,
  },
  reducers: {
    clearInvoiceSettingsErrors(state) {
      state.error = null;
      state.mutationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadInvoiceSettings.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadInvoiceSettings.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.settings = { ...emptySettings, ...action.payload };
      })
      .addCase(loadInvoiceSettings.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load invoice settings";
      })
      .addCase(saveInvoiceSettings.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(saveInvoiceSettings.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.settings = { ...emptySettings, ...action.payload };
      })
      .addCase(saveInvoiceSettings.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError =
          action.payload || "Failed to update invoice settings";
      });
  },
});

export const { clearInvoiceSettingsErrors } = invoiceSettingsSlice.actions;
export default invoiceSettingsSlice.reducer;
