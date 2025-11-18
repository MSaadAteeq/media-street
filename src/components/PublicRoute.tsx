import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "@/store";

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const PublicRoute = ({ children, redirectTo = "/dashboard" }: PublicRouteProps) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.token);
  const token = localStorage.getItem("token");

  // If user is authenticated, redirect to dashboard (or specified route)
  if (isAuthenticated || token) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

