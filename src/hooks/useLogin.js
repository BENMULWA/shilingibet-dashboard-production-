import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login, resendStaffLoginCode, verifyStaffLogin } from "../services/AuthServices";
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

  const completeLogin = (data) => {
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
    navigate(userRole === "support" ? "/agent/support" : "/dashboard");
  };

  const loginMutation = useMutation({
    mutationFn: ({ phone, password }) => login({ phone, password }),
    onError: (error) => {
      toast.error(error?.message);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyStaffLogin,
    onSuccess: completeLogin,
    onError: (error) => toast.error(error?.message),
  });

  const resendMutation = useMutation({
    mutationFn: resendStaffLoginCode,
    onSuccess: () => toast.success("A new code was sent"),
    onError: (error) => toast.error(error?.message),
  });

  return {
    logInFn: loginMutation.mutate,
    verifyCodeFn: verifyMutation.mutate,
    resendCodeFn: resendMutation.mutate,
    resetLogin: () => {
      loginMutation.reset();
      verifyMutation.reset();
      resendMutation.reset();
    },
    challenge: loginMutation.data,
    isLoading: loginMutation.isPending,
    isVerifying: verifyMutation.isPending,
    isResending: resendMutation.isPending,
  };
}
