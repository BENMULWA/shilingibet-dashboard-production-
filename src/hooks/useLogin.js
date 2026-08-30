import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login } from "../services/AuthServices";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  isValidStaffSession,
  normalizeStaffRole,
} from "../utils/authSession";
import { useAuthState } from "../context/AuthContext";

export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dispatch } = useAuthState();

  const { mutate: logInFn, isPending: isLoading } = useMutation({
    mutationFn: ({ phone, password }) => login({ phone, password }),
    onSuccess: (data) => {
      if (!data || !data.user) return;

      const userRole = normalizeStaffRole(data.user);

      const userWithRole = {
        ...data.user,
        token: data.token,
        loginRole: userRole,
      };

      if (!isValidStaffSession(userWithRole)) {
        toast.error("Access denied. Admin accounts only.");
        sessionStorage.removeItem("user");
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(userWithRole));
      dispatch({ type: "createAccount", payload: userWithRole });
      queryClient.setQueryData(["user"], userWithRole);
      toast.success("Login successful");

      // Navigate based on actual user role from API
      if (userRole === "support") {
        navigate("/agent/support");
      } else {
        navigate("/dashboard");
      }
    },
    onError: (error) => {
      console.error(error);
      toast.error(error?.message);
    },
  });
  return { logInFn, isLoading };
}
