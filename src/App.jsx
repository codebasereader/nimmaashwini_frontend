import { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import AdminLayout from "./admin/AdminLayout";
import ProtectedRoute from "./admin/components/ProtectedRoute";
import CategoriesPage from "./admin/pages/categories/CategoriesPage";
import ExpensesPage from "./admin/pages/expenses/ExpensesPage";
import ExpenseCategoriesPage from "./admin/pages/expenses/ExpenseCategoriesPage";
import Gstr1Page from "./admin/pages/gst/Gstr1Page";
import InsightsPage from "./admin/pages/insights/InsightsPage";
import MasterProductsPage from "./admin/pages/master-data/MasterProductsPage";
import UsersPage from "./admin/pages/master-data/UsersPage";
import InvoiceSettingsPage from "./admin/pages/master-data/InvoiceSettingsPage";
import VendorsPage from "./admin/pages/master-data/VendorsPage";
import OrdersPage from "./admin/pages/orders/OrdersPage";
import CustomersPage from "./admin/pages/customers/CustomersPage";
import ProductsPage from "./admin/pages/catalog/ProductsPage";
import CouponsPage from "./admin/pages/coupons/CouponsPage";
import AppLayout from "./components/layout/AppLayout";
import ScrollToTop from "./components/ScrollToTop";
import LogoLoader from "./components/sections/logoloader";
import useDocumentVisibilityTitle from "./hooks/useDocumentVisibilityTitle";
import HomePage from "./pages/HomePage";
import LegalPage from "./pages/LegalPage";
import LoginPage from "./pages/LoginPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";

function isStandaloneRoute(pathname) {
  return pathname === "/login" || pathname.startsWith("/admin");
}

const App = () => {
  const location = useLocation();
  const standalone = isStandaloneRoute(location.pathname);
  const [isLoading, setIsLoading] = useState(!standalone);

  useDocumentVisibilityTitle();

  if (isLoading && !standalone) {
    return <LogoLoader onComplete={() => setIsLoading(false)} />;
  }

  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="categories" replace />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="coupons" element={<CouponsPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="expense-categories" element={<ExpenseCategoriesPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="master-products" element={<MasterProductsPage />} />
        <Route path="insights" element={<InsightsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="invoice-number" element={<InvoiceSettingsPage />} />
        <Route path="gstr1" element={<Gstr1Page />} />
      </Route>

      <Route
        path="/"
        element={
          <AppLayout>
            <HomePage />
          </AppLayout>
        }
      />
      <Route
        path="/checkout"
        element={
          <AppLayout>
            <CheckoutPage />
          </AppLayout>
        }
      />
      <Route
        path="/payment-success"
        element={
          <AppLayout>
            <PaymentSuccessPage />
          </AppLayout>
        }
      />
      <Route
        path="/payment-failure"
        element={
          <AppLayout>
            <PaymentFailurePage />
          </AppLayout>
        }
      />
      <Route
        path="/checkout/success"
        element={<Navigate to="/payment-success" replace />}
      />
      <Route
        path="/cart"
        element={
          <AppLayout>
            <CartPage />
          </AppLayout>
        }
      />
      <Route
        path="/products/:slug"
        element={
          <AppLayout>
            <ProductPage />
          </AppLayout>
        }
      />
      <Route
        path="/terms"
        element={
          <AppLayout>
            <LegalPage pageKey="terms" />
          </AppLayout>
        }
      />
      <Route
        path="/privacy"
        element={
          <AppLayout>
            <LegalPage pageKey="privacy" />
          </AppLayout>
        }
      />
      <Route
        path="/refund-policy"
        element={
          <AppLayout>
            <LegalPage pageKey="refund" />
          </AppLayout>
        }
      />
      <Route
        path="/shipping-policy"
        element={
          <AppLayout>
            <LegalPage pageKey="shipping" />
          </AppLayout>
        }
      />
    </Routes>
    </>
  );
};

export default App;
