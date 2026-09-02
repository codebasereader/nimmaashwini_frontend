import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createAdminUser as createApi,
  deleteAdminUser as deleteApi,
  fetchAdminUserById as fetchByIdApi,
  fetchAdminUsers as fetchApi,
  updateAdminUser as updateApi,
} from "../../api/adminUsers";
import {
  createCrudSliceHandlers,
  crudInitialState,
  getEntityId,
  normalizeListResponse,
} from "./crudHelpers";

export const loadAdminUsers = createAsyncThunk(
  "adminUsers/load",
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const data = await fetchApi({ limit: 100, ...params }, auth.token);
      return normalizeListResponse(data);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load users");
    }
  },
);

export const loadAdminUserById = createAsyncThunk(
  "adminUsers/loadById",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await fetchByIdApi(id, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to load user");
    }
  },
);

export const addAdminUser = createAsyncThunk(
  "adminUsers/add",
  async (payload, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await createApi(payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to create user");
    }
  },
);

export const editAdminUser = createAsyncThunk(
  "adminUsers/edit",
  async ({ id, payload }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      return await updateApi(id, payload, auth.token);
    } catch (error) {
      return rejectWithValue(error.message || "Failed to update user");
    }
  },
);

export const removeAdminUser = createAsyncThunk(
  "adminUsers/remove",
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await deleteApi(id, auth.token);
      return id;
    } catch (error) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  },
);

const adminUsersSlice = createSlice({
  name: "adminUsers",
  initialState: crudInitialState,
  reducers: {
    clearAdminUserErrors(state) {
      state.error = null;
      state.detailError = null;
      state.mutationError = null;
    },
    clearAdminUserCurrent(state) {
      state.current = null;
      state.detailStatus = "idle";
      state.detailError = null;
    },
  },
  extraReducers: createCrudSliceHandlers({
    load: loadAdminUsers,
    loadOne: loadAdminUserById,
    add: addAdminUser,
    edit: editAdminUser,
    remove: removeAdminUser,
    getId: getEntityId,
  }),
});

export const { clearAdminUserErrors, clearAdminUserCurrent } =
  adminUsersSlice.actions;
export default adminUsersSlice.reducer;
