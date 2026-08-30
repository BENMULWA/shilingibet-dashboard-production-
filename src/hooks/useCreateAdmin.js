import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAdmin } from "../services/AuthServices";
import { message } from "antd";
import toast from "react-hot-toast";

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  const { mutate: createAdminFn, isPending: isLoading } = useMutation({
    mutationFn: ({ phone, password, role }) => createAdmin({ phone, password, role }),
    onSuccess: (user) => {
      if (!user?._id) {
        message.error("Failed to create admin");
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Staff account created successfully");
    },
    onError: (err) => {
      console.error("Admin creation error:", err);
      toast.error(err.message || "Failed to create admin. Please try again.");
    },
  });

  return { createAdminFn, isLoading };
}
