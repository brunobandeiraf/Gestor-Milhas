import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { IssuanceFormData } from "../utils/schemas";

export const useIssuancesQuery = () => {
  return useQuery({
    queryKey: ["issuances"],
    queryFn: async () => {
      const { data } = await api.get("/issuances");
      return data;
    },
  });
};

export const useCreateIssuanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: IssuanceFormData) => {
      const { data } = await api.post("/issuances", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issuances"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["user-dashboard"] });
    },
  });
};
