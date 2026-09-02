import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createMasterProduct as createApi,
  deleteMasterProduct as deleteApi,
  fetchMasterProductById as fetchByIdApi,
  fetchMasterProducts as fetchApi,
  updateMasterProduct as updateApi,
} from "../../api/masterProducts";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadMasterProducts = createAsyncThunk(
  "masterProducts/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchApi({ limit: 100, ...params }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load products");
    }
  },
);

export const loadMasterProductById = createAsyncThunk(
  "masterProducts/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load product");
    }
  },
);

export const addMasterProduct = createAsyncThunk(
  "masterProducts/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create product");
    }
  },
);

export const editMasterProduct = createAsyncThunk(
  "masterProducts/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update product");
    }
  },
);

export const removeMasterProduct = createAsyncThunk(
  "masterProducts/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  },
);

const masterProductsSlice = createSlice({
  name: "masterProducts",
  initialState: crudInitialState,
  reducers: {
    clearMasterProductErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearMasterProductCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadMasterProducts,
    loadOne: loadMasterProductById,
    add: addMasterProduct,
    edit: editMasterProduct,
    remove: removeMasterProduct,
    getId: getEntityId,
  }),
});

export const { clearMasterProductErrors, clearMasterProductCurrent } =
  masterProductsSlice.actions;
export default masterProductsSlice.reducer;
