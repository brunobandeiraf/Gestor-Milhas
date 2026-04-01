import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

export const useAirlinesQuery = () => {
  return useQuery({
    queryKey: ["airlines"],
    queryFn: async () => {
      const { data } = await api.get("/airlines");
      return data;
    },
  });
};

export const useCreateAirlineMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string }) => {
      const { data } = await api.post("/airlines", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airlines"] });
    },
  });
};

export const useDeactivateAirlineMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.patch(`/airlines/${id}`, { active: false });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["airlines"] });
    },
  });
};
