import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createExpense as createExpenseApi,
  deleteExpense as deleteExpenseApi,
  fetchExpenseById as fetchExpenseByIdApi,
  fetchExpenses as fetchExpensesApi,
  updateExpense as updateExpenseApi,
} from "../../api/expenses";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadExpenses = createAsyncThunk(
  "expenses/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchExpensesApi({ limit: 100, ...params }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load expenses");
    }
  },
);

export const loadExpenseById = createAsyncThunk(
  "expenses/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchExpenseByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load expense");
    }
  },
);

export const addExpense = createAsyncThunk(
  "expenses/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createExpenseApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create expense");
    }
  },
);

export const editExpense = createAsyncThunk(
  "expenses/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateExpenseApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update expense");
    }
  },
);

export const removeExpense = createAsyncThunk(
  "expenses/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteExpenseApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete expense");
    }
  },
);

const expensesSlice = createSlice({
  name: "expenses",
  initialState: crudInitialState,
  reducers: {
    clearExpenseErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearExpenseCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadExpenses,
    loadOne: loadExpenseById,
    add: addExpense,
    edit: editExpense,
    remove: removeExpense,
    getId: getEntityId,
  }),
});

export const { clearExpenseErrors, clearExpenseCurrent } = expensesSlice.actions;
export default expensesSlice.reducer;
