import { Navigate } from "react-router-dom";
import { useAuth, ROLE_ROUTES } from "../context/AuthContext";

/**
 * ProtectedRoute
 * allowedRoles: مصفوفة الـ roles المسموح لها — مثال: ["admin", "consultant"]
 * لو مش مسجل → يروح /login
 * لو مسجل لكن دوره مش مسموح → يتوجه لمساحته الخاصة
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // مش مسجل
  if (!user) return <Navigate to="/login" replace />;

  // مسجل لكن دوره مش مسموح
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectTo = ROLE_ROUTES[user.role] || "/login";
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
