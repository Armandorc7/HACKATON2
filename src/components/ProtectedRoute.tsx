import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { LoadingBlock } from "./Status";

export function ProtectedRoute() {
  const { token, restoring } = useAuth();
  const location = useLocation();

  if (restoring) {
    return (
      <div className="center-screen">
        <LoadingBlock label="Restaurando sesion" />
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
