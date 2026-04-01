import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { CardFormData } from "../utils/schemas";

export const useCardsQuery = () => {
  return useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      const { data } = await api.get("/cards");
      return data;
    },
  });
};

export const useCreateCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: CardFormData) => {
      const { data } = await api.post("/cards", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });
};
