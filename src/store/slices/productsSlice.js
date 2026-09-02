import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createProduct as createProductApi,
  deleteProduct as deleteProductApi,
  fetchAdminProductById as fetchAdminProductByIdApi,
  fetchAdminProducts as fetchAdminProductsApi,
  updateProduct as updateProductApi,
} from "../../api/products";
import { getEntityId } from "./crudHelpers";

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  return [];
}

export const loadProducts = createAsyncThunk(
  "products/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchAdminProductsApi(
        { limit: 100, ...params },
        auth.token,
      );
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load products");
    }
  },
);

export const loadProductById = createAsyncThunk(
  "products/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchAdminProductByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load product");
    }
  },
);

export const addProduct = createAsyncThunk(
  "products/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await createProductApi(payload, auth.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create product");
    }
  },
);

export const editProduct = createAsyncThunk(
  "products/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await updateProductApi(id, payload, auth.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update product");
    }
  },
);

export const removeProduct = createAsyncThunk(
  "products/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteProductApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  },
);

const productsSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    current: null,
    status: "idle",
    detailStatus: "idle",
    mutationStatus: "idle",
    error: null,
    detailError: null,
    mutationError: null,
  },
  reducers: {
    clearProductErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearProductCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loadProductById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
        state.current = null;
      })
      .addCase(loadProductById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.current = action.payload;
        const id = getEntityId(action.payload);
        const index = state.items.findIndex((item) => getEntityId(item) === id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(loadProductById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
        state.current = null;
      })
      .addCase(addProduct.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(addProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = [action.payload, ...state.items];
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(editProduct.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(editProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const id = getEntityId(action.payload);
        state.items = state.items.map((item) =>
          getEntityId(item) === id ? action.payload : item,
        );
        if (getEntityId(state.current) === id) state.current = action.payload;
      })
      .addCase(editProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(removeProduct.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(removeProduct.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter(
          (item) => getEntityId(item) !== action.payload,
        );
        if (getEntityId(state.current) === action.payload) state.current = null;
      })
      .addCase(removeProduct.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearProductErrors, clearProductCurrent } = productsSlice.actions;
export default productsSlice.reducer;
