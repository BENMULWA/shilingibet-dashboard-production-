import { createContext, useContext, useReducer } from "react";
import { readStoredUser } from "../utils/authSession";

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

  function logout() {
    dispatch({ type: "loading" });
    dispatch({ type: "createAccount", payload: null });
    sessionStorage.removeItem("user");

    dispatch({ type: "loaded" });
  }

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
