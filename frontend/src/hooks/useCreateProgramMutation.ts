import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";

interface CreateProgramPayload {
  name: string;
  type: "BANK" | "AIRLINE";
  airlineId?: string;
  cpfLimit?: number;
}

export const useCreateProgramMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProgramPayload) => {
      const { data } = await api.post("/programs", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
    },
  });
};
