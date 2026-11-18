import { Navigate, Outlet } from "react-router-dom";
import { canUser, homePathFor, readStoredUser } from "../utils/authSession";

function AgentAppLayout() {
  const user = readStoredUser();
  if (!user) return <Navigate to="/login" replace />;
  // Anyone whose role includes live chat can answer customers here.
  if (!canUser(user, "chat.agent", "chat.supervise")) {
    return <Navigate to={homePathFor(user)} replace />;
  }

  return <Outlet />;
}

export default AgentAppLayout;
