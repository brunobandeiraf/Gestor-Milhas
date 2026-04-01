import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export const useBanksQuery = () => {
  return useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const { data } = await api.get("/banks");
      return data;
    },
  });
};

export const useCreateBankMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post("/banks", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
};

export const useDeactivateBankMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/banks/${id}`, { active: false });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banks"] });
    },
  });
};
