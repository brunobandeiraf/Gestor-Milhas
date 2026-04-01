import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { TransactionFormData } from "../utils/schemas";

export const useTransactionsQuery = () => {
  return useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data } = await api.get("/transactions");
      return data;
    },
  });
};

export const useCreateTransactionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: TransactionFormData) => {
      const payload: Record<string, unknown> = {
        programId: formData.programId,
        type: formData.type,
        miles: formData.miles,
        date: formData.date,
        paymentMethod: formData.paymentMethod,
      };
      if (formData.costMode === "VM") {
        payload.costPerK = formData.costValue;
      } else {
        payload.totalCost = formData.costValue;
      }
      const { data } = await api.post("/transactions", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};
