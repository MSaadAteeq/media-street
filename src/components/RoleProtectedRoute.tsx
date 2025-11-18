import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const RoleProtectedRoute = ({ 
  children, 
  allowedRoles = ["admin"],
  redirectTo = "/dashboard" 
}: RoleProtectedRouteProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.token);
  const userRole = useSelector((state: RootState) => state.auth.authData.role);
  const token = localStorage.getItem("token");

  // First check if user is authenticated
  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />;
  }

  // Then check if user has required role
  if (userRole && allowedRoles.length > 0 && !allowedRoles.includes(userRole.toLowerCase())) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

