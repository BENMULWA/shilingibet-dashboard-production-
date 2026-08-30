import { Navigate, Outlet } from "react-router-dom";
import { readStoredUser } from "../utils/authSession";

function AppLayout() {
  const user = readStoredUser();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export default AppLayout;
