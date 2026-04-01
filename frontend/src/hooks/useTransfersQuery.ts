import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { TransferFormData } from "../utils/schemas";

export const useTransfersQuery = () => {
  return useQuery({
    queryKey: ["transfers"],
    queryFn: async () => {
      const { data } = await api.get("/transfers");
      return data;
    },
  });
};

export const useCreateTransferMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: TransferFormData) => {
      const { data } = await api.post("/transfers", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transfers"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};
