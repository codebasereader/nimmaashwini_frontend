import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createCategory as createCategoryApi,
  deleteCategory as deleteCategoryApi,
  fetchCategories as fetchCategoriesApi,
  fetchCategoryById as fetchCategoryByIdApi,
  updateCategory as updateCategoryApi,
} from "../../api/category";
import { getEntityId } from "./crudHelpers";

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (data?.items) return data.items;
  return [];
}

export const loadCategories = createAsyncThunk(
  "categories/load",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchCategoriesApi({ limit: 100 }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load categories");
    }
  },
);

export const loadCategoryById = createAsyncThunk(
  "categories/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchCategoryByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load category");
    }
  },
);

export const addCategory = createAsyncThunk(
  "categories/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await createCategoryApi(payload, auth.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create category");
    }
  },
);

export const editCategory = createAsyncThunk(
  "categories/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await updateCategoryApi(id, payload, auth.token);
      return data;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update category");
    }
  },
);

export const removeCategory = createAsyncThunk(
  "categories/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteCategoryApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete category");
    }
  },
);

const categoriesSlice = createSlice({
  name: "categories",
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
    clearCategoryErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearCategoryCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCategories.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadCategories.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(loadCategories.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(loadCategoryById.pending, (state) => {
        state.detailStatus = "loading";
        state.detailError = null;
        state.current = null;
      })
      .addCase(loadCategoryById.fulfilled, (state, action) => {
        state.detailStatus = "succeeded";
        state.current = action.payload;
        const id = getEntityId(action.payload);
        const index = state.items.findIndex((item) => getEntityId(item) === id);
        if (index >= 0) state.items[index] = action.payload;
      })
      .addCase(loadCategoryById.rejected, (state, action) => {
        state.detailStatus = "failed";
        state.detailError = action.payload;
        state.current = null;
      })
      .addCase(addCategory.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(addCategory.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = [action.payload, ...state.items];
      })
      .addCase(addCategory.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(editCategory.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(editCategory.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        const id = getEntityId(action.payload);
        state.items = state.items.map((item) =>
          getEntityId(item) === id ? action.payload : item,
        );
        if (getEntityId(state.current) === id) state.current = action.payload;
      })
      .addCase(editCategory.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      })
      .addCase(removeCategory.pending, (state) => {
        state.mutationStatus = "loading";
        state.mutationError = null;
      })
      .addCase(removeCategory.fulfilled, (state, action) => {
        state.mutationStatus = "succeeded";
        state.items = state.items.filter(
          (item) => getEntityId(item) !== action.payload,
        );
        if (getEntityId(state.current) === action.payload) state.current = null;
      })
      .addCase(removeCategory.rejected, (state, action) => {
        state.mutationStatus = "failed";
        state.mutationError = action.payload;
      });
  },
});

export const { clearCategoryErrors, clearCategoryCurrent } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
