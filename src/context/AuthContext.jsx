import { createContext, useCallback, useContext, useEffect, useReducer } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  IDLE_TIMEOUT_MS,
  readStoredUser,
  tokenExpiresAt,
} from "../utils/authSession";
import { disconnectSocket } from "../services/socketService";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "touchstart", "scroll"];

const AuthContext = createContext();
const initialState = { user: null, isAuthenticated: false, isLoading: false };

function initializeAuthState() {
  const user = readStoredUser();
  return { ...initialState, user, isAuthenticated: Boolean(user) };
}
function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return { ...state, isLoading: true };
    case "loaded":
      return { ...state, isLoading: false };
    case "createAccount":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
      };
    case "currUser":
      return { ...state, user: action.payload };
    case "updateAuthState":
      return { ...state, isAuthenticated: action.payload };
    default:
      throw new Error("Something went wrong");
  }
}

function AuthProvider({ children }) {
  const [{ user, isAuthenticated, isLoading }, dispatch] = useReducer(
    reducer,
    initialState,
    initializeAuthState,
  );

  const queryClient = useQueryClient();

  const logout = useCallback(() => {
    dispatch({ type: "loading" });
    dispatch({ type: "createAccount", payload: null });
    sessionStorage.removeItem("user");
    // Drop cached player and money data so the next person at this browser
    // never sees the previous staff member's screens.
    queryClient.clear();
    disconnectSocket();
    dispatch({ type: "loaded" });
  }, [queryClient]);

  // Force sign-out when the token expires or the session sits idle.
  useEffect(() => {
    if (!user?.token) return undefined;

    const endSession = () => {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.assign("/login?reason=expired");
      }
    };

    const expiresAt = tokenExpiresAt(user.token);
    const expiryTimer = expiresAt
      ? setTimeout(endSession, Math.max(expiresAt - Date.now(), 0))
      : null;

    let idleTimer = setTimeout(endSession, IDLE_TIMEOUT_MS);
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(endSession, IDLE_TIMEOUT_MS);
    };
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, resetIdle, { passive: true })
    );

    return () => {
      clearTimeout(expiryTimer);
      clearTimeout(idleTimer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetIdle));
    };
  }, [user?.token, logout]);

  function getCurrentUser() {
    const currentUser = readStoredUser();
    dispatch({ type: "currUser", payload: currentUser });
    dispatch({ type: "updateAuthState", payload: Boolean(currentUser) });
    return currentUser;
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, isLoading, dispatch, logout, getCurrentUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
function useAuthState() {
  const context = useContext(AuthContext);
  if (context === undefined) return;

  return context;
}
export { AuthProvider, useAuthState };
