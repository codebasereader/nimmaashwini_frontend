import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createVendor as createVendorApi,
  deleteVendor as deleteVendorApi,
  fetchVendorById as fetchVendorByIdApi,
  fetchVendors as fetchVendorsApi,
  updateVendor as updateVendorApi,
} from "../../api/vendors";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadVendors = createAsyncThunk(
  "vendors/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchVendorsApi({ limit: 100, ...params }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load vendors");
    }
  },
);

export const loadVendorById = createAsyncThunk(
  "vendors/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchVendorByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load vendor");
    }
  },
);

export const addVendor = createAsyncThunk(
  "vendors/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createVendorApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create vendor");
    }
  },
);

export const editVendor = createAsyncThunk(
  "vendors/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateVendorApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update vendor");
    }
  },
);

export const removeVendor = createAsyncThunk(
  "vendors/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteVendorApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete vendor");
    }
  },
);

const vendorsSlice = createSlice({
  name: "vendors",
  initialState: crudInitialState,
  reducers: {
    clearVendorErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearVendorCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadVendors,
    loadOne: loadVendorById,
    add: addVendor,
    edit: editVendor,
    remove: removeVendor,
    getId: getEntityId,
  }),
});

export const { clearVendorErrors, clearVendorCurrent } = vendorsSlice.actions;
export default vendorsSlice.reducer;
