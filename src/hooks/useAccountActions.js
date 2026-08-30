// src/hooks/useAccountActions.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  pauseAccount,
  activateAccount,
  pauseWithdrawal,
  activateWithdrawal,
  pauseDeposit,
  activateDeposit,
  zeroBalance,
} from "../services/UsersActions";
import toast from "react-hot-toast";

const useAccountActions = () => {
  const queryClient = useQueryClient();

  // Helper to update user in all cached queries
  const updateUserInCache = (userId, updates) => {
    queryClient.setQueriesData({ queryKey: ["users"] }, (old) => {
      if (!old?.users) return old;
      return {
        ...old,
        users: old.users.map(user =>
          user._id === userId ? { ...user, ...updates } : user
        )
      };
    });
  };

  // Account Activation/Pause
  const { mutate: pauseAccountFn, isPending: isPausingAccount } = useMutation({
    mutationFn: pauseAccount,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      updateUserInCache(userId, { accountStatus: "blocked" });
    },
    onSuccess: () => {
      toast.success("Account paused successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.error(err.message || "Failed to pause account");
    },
  });

  const { mutate: activateAccountFn, isPending: isActivatingAccount } =
    useMutation({
      mutationFn: activateAccount,
      onMutate: async (userId) => {
        await queryClient.cancelQueries({ queryKey: ["users"] });
        updateUserInCache(userId, { accountStatus: "active" });
      },
      onSuccess: () => {
        toast.success("Account activated successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
      onError: (err) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.error(err.message || "Failed to activate account");
      },
    });

  // Withdrawal Activation/Pause
  const { mutate: pauseWithdrawalFn, isPending: isPausingWithdrawal } =
    useMutation({
      mutationFn: pauseWithdrawal,
      onMutate: async (userId) => {
        await queryClient.cancelQueries({ queryKey: ["users"] });
        updateUserInCache(userId, { withdrawalPaused: true });
      },
      onSuccess: () => {
        toast.success("Withdrawal deactivated successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
      onError: (err) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.error(err.message || "Failed to deactivate withdrawal");
      },
    });

  const { mutate: activateWithdrawalFn, isPending: isActivatingWithdrawal } =
    useMutation({
      mutationFn: activateWithdrawal,
      onMutate: async (userId) => {
        await queryClient.cancelQueries({ queryKey: ["users"] });
        updateUserInCache(userId, { withdrawalPaused: false });
      },
      onSuccess: () => {
        toast.success("Withdrawal activated successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
      onError: (err) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.error(err.message || "Failed to activate withdrawal");
      },
    });

  // Deposit Activation/Pause
  const { mutate: pauseDepositFn, isPending: isPausingDeposit } = useMutation({
    mutationFn: pauseDeposit,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      updateUserInCache(userId, { depositPaused: true });
    },
    onSuccess: () => {
      toast.success("Deposit paused successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.error(err.message || "Failed to pause deposit");
    },
  });

  const { mutate: activateDepositFn, isPending: isActivatingDeposit } =
    useMutation({
      mutationFn: activateDeposit,
      onMutate: async (userId) => {
        await queryClient.cancelQueries({ queryKey: ["users"] });
        updateUserInCache(userId, { depositPaused: false });
      },
      onSuccess: () => {
        toast.success("Deposit activated successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
      onError: (err) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        toast.error(err.message || "Failed to activate deposit");
      },
    });

  const { mutate: zeroBalanceFn, isPending: isZeroingBalance } = useMutation({
    mutationFn: zeroBalance,
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      updateUserInCache(userId, {
        balance: 0,
        bonusBalance: 0,
        wallet: {
          balance: 0,
          totalBalance: 0,
          bonusBalance: 0,
          withdrawableBalance: 0,
          currency: "KES",
        },
      });
    },
    onSuccess: () => {
      toast.success("Total and bonus balances set to zero");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.error(err.message || "Failed to zero balance");
    },
  });

  return {
    pauseAccountFn,
    activateAccountFn,
    pauseWithdrawalFn,
    activateWithdrawalFn,
    pauseDepositFn,
    activateDepositFn,
    zeroBalanceFn,
    isPausingAccount,
    isActivatingAccount,
    isPausingWithdrawal,
    isActivatingWithdrawal,
    isPausingDeposit,
    isActivatingDeposit,
    isZeroingBalance,
  };
};

export default useAccountActions;
