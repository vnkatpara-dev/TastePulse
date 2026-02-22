import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: "owner" | "customer";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to appropriate login based on required role
    return <Navigate to={requiredRole === "owner" ? "/owner/login" : "/customer/login"} state={{ from: location }} replace />;
  }

  if (role !== requiredRole) {
    // Redirect to the correct dashboard based on user's actual role
    if (role === "owner") {
      return <Navigate to="/owner/dashboard" replace />;
    } else if (role === "customer") {
      return <Navigate to="/customer/dashboard" replace />;
    }
    // If role is unknown, redirect to login
    return <Navigate to="/customer/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
