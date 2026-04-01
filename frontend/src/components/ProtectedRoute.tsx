import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const ProtectedRoute = ({ allowPending = false }: { allowPending?: boolean }) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    !allowPending &&
    user?.registrationStatus === "PENDING" &&
    location.pathname !== "/completar-cadastro"
  ) {
    return <Navigate to="/completar-cadastro" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
