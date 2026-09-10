import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Payment from "./pages/Payment";
import AdminManagement from "./pages/AdminManagement";
import SupplierOrders from "./pages/SupplierOrders";
import SupplierPayments from "./pages/SupplierPayments";

function RequireRole({ role, children }) {
  const { user } = useAuth();
  const roles = Array.isArray(role) ? role : [role];

  if (!roles.includes(user?.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<Layout />}>
              <Route
                path="/home"
                element={
                  <RequireRole role={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <Home />
                  </RequireRole>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <RequireRole role={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <Dashboard />
                  </RequireRole>
                }
              />

              <Route
                path="/orders"
                element={
                  <RequireRole role={["EMPLOYEE", "MANAGER", "ADMIN"]}>
                    <Orders />
                  </RequireRole>
                }
              />

              <Route
                path="/products"
                element={
                  <RequireRole role={["EMPLOYEE", "MANAGER"]}>
                    <Products />
                  </RequireRole>
                }
              />

              <Route
                path="/payment"
                element={
                  <RequireRole role="ADMIN">
                    <Payment />
                  </RequireRole>
                }
              />

              <Route
                path="/management"
                element={
                  <RequireRole role="ADMIN">
                    <AdminManagement />
                  </RequireRole>
                }
              />

              <Route
                path="/supplier-orders"
                element={
                  <RequireRole role="SUPPLIER">
                    <SupplierOrders />
                  </RequireRole>
                }
              />

              <Route
                path="/supplier-payments"
                element={
                  <RequireRole role="SUPPLIER">
                    <SupplierPayments />
                  </RequireRole>
                }
              />

              <Route
                path="/supplier-products"
                element={
                  <RequireRole role="SUPPLIER">
                    <AdminManagement supplierMode />
                  </RequireRole>
                }
              />
            </Route>

            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;