import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useProgramsQuery = () => {
  return useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data } = await api.get("/programs");
      return data;
    },
  });
};
