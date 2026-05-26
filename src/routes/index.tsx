import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../types";
import Login from "../pages/auth/Login";
import Layout from "../components/common/Layout";
import AdminDashboard from "../pages/admin/Dashboard";
import UsersPage from "../pages/admin/Users";
import AdminRestaurants from "../pages/admin/Restaurants";
import AdminBookings from "../pages/admin/Bookings";
import AdminRequests from "../pages/admin/Requests";
import OwnerDashboard from "../pages/owner/Dashboard";
import OwnerRestaurants from "../pages/owner/Restaurants";
import RestaurantDetail from "../pages/owner/RestaurantDetail";
import OwnerBookings from "../pages/owner/Bookings";
import OwnerRequests from "../pages/owner/Requests";

// Read auth from localStorage as well — React state may not have propagated
// yet on the first render immediately after login + navigate().
function getLocalAuth(): { token: string | null; user: AuthUser | null } {
  try {
    const token = localStorage.getItem("token");
    const raw = localStorage.getItem("user");
    const user: AuthUser | null = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { isAuthenticated, user: ctxUser } = useAuth();
  const { token: lsToken, user: lsUser } = getLocalAuth();

  // Prefer context state; fall back to localStorage for the first render after login
  const authenticated = isAuthenticated || (!!lsToken && !!lsUser);
  const user = ctxUser ?? lsUser;

  if (!authenticated) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user?.role ?? ""))
    return <Navigate to="/unauthorized" replace />;
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated, user: ctxUser } = useAuth();
  const { token: lsToken, user: lsUser } = getLocalAuth();

  const authenticated = isAuthenticated || (!!lsToken && !!lsUser);
  const user = ctxUser ?? lsUser;

  if (!authenticated) return <Navigate to="/login" replace />;
  if (user?.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === "owner") return <Navigate to="/owner/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<RootRedirect />} />
      <Route
        path="/unauthorized"
        element={
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">403</h1>
              <p className="text-slate-500">
                You don't have permission to access this page.
              </p>
              <a href="/" className="btn-primary mt-4 inline-flex">
                Go Home
              </a>
            </div>
          </div>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout />
          </ProtectedRoute>
        }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="restaurants" element={<AdminRestaurants />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="requests" element={<AdminRequests />} />
      </Route>

      {/* Owner routes */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <Layout />
          </ProtectedRoute>
        }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="restaurants" element={<OwnerRestaurants />} />
        <Route path="restaurants/:id" element={<RestaurantDetail />} />
        <Route path="bookings" element={<OwnerBookings />} />
        <Route path="requests" element={<OwnerRequests />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
