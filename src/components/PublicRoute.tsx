import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({ children, redirectTo = "/dashboard" }: PublicRouteProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.token);
  const userRole = useSelector((state: RootState) => state.auth.authData.role);
  const token = localStorage.getItem("token");
  const storedRole = localStorage.getItem("userRole");

  // If user is authenticated, redirect based on role
  if (isAuthenticated || token) {
    const role = userRole || storedRole || 'retailer';
    
    // Redirect admin to admin panel, others to dashboard
    if (role.toLowerCase() === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

