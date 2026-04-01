import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { BonusPurchaseFormData } from "../utils/schemas";

export const useBonusPurchasesQuery = () => {
  return useQuery({
    queryKey: ["bonus-purchases"],
    queryFn: async () => {
      const { data } = await api.get("/bonus-purchases");
      return data;
    },
  });
};

export const useCreateBonusPurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: BonusPurchaseFormData) => {
      const { data } = await api.post("/bonus-purchases", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bonus-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};
