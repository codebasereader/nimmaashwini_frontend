import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createExpenseCategory as createExpenseCategoryApi,
  deleteExpenseCategory as deleteExpenseCategoryApi,
  fetchExpenseCategories as fetchExpenseCategoriesApi,
  fetchExpenseCategoryById as fetchExpenseCategoryByIdApi,
  updateExpenseCategory as updateExpenseCategoryApi,
} from "../../api/expenseCategories";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadExpenseCategories = createAsyncThunk(
  "expenseCategories/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchExpenseCategoriesApi(
        { limit: 100, ...params },
        auth.token,
      );
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load expense categories",
      );
    }
  },
);

export const loadExpenseCategoryById = createAsyncThunk(
  "expenseCategories/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchExpenseCategoryByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to load expense category",
      );
    }
  },
);

export const addExpenseCategory = createAsyncThunk(
  "expenseCategories/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createExpenseCategoryApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to create expense category",
      );
    }
  },
);

export const editExpenseCategory = createAsyncThunk(
  "expenseCategories/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateExpenseCategoryApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update expense category",
      );
    }
  },
);

export const removeExpenseCategory = createAsyncThunk(
  "expenseCategories/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteExpenseCategoryApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to delete expense category",
      );
    }
  },
);

const expenseCategoriesSlice = createSlice({
  name: "expenseCategories",
  initialState: crudInitialState,
  reducers: {
    clearExpenseCategoryErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearExpenseCategoryCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadExpenseCategories,
    loadOne: loadExpenseCategoryById,
    add: addExpenseCategory,
    edit: editExpenseCategory,
    remove: removeExpenseCategory,
    getId: getEntityId,
  }),
});

export const { clearExpenseCategoryErrors, clearExpenseCategoryCurrent } =
  expenseCategoriesSlice.actions;
export default expenseCategoriesSlice.reducer;
