import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api";
import type { ClubFormData } from "../utils/schemas";

export const useClubsQuery = () => {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: async () => {
      const { data } = await api.get("/clubs");
      return data;
    },
  });
};

export const useCreateClubMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: ClubFormData) => {
      const { data } = await api.post("/clubs", formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clubs"] });
    },
  });
};
