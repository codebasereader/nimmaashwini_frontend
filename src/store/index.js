import { configureStore } from "@reduxjs/toolkit";
import adminOrdersReducer from "./slices/adminOrdersSlice";
import adminUsersReducer from "./slices/adminUsersSlice";
import authReducer from "./slices/authSlice";
import categoriesReducer from "./slices/categoriesSlice";
import expenseCategoriesReducer from "./slices/expenseCategoriesSlice";
import expensesReducer from "./slices/expensesSlice";
import gstr1Reducer from "./slices/gstr1Slice";
import insightsReducer from "./slices/insightsSlice";
import masterProductsReducer from "./slices/masterProductsSlice";
import productsReducer from "./slices/productsSlice";
import vendorsReducer from "./slices/vendorsSlice";
import customersReducer from "./slices/customersSlice";
import invoiceSettingsReducer from "./slices/invoiceSettingsSlice";
import couponsReducer from "./slices/couponsSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    categories: categoriesReducer,
    products: productsReducer,
    vendors: vendorsReducer,
    masterProducts: masterProductsReducer,
    expenses: expensesReducer,
    expenseCategories: expenseCategoriesReducer,
    insights: insightsReducer,
    adminUsers: adminUsersReducer,
    adminOrders: adminOrdersReducer,
    gstr1: gstr1Reducer,
    customers: customersReducer,
    invoiceSettings: invoiceSettingsReducer,
    coupons: couponsReducer,
  },
});

export default store;
