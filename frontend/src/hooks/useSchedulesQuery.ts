import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useSchedulesQuery = () => {
  return useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data } = await api.get("/schedules");
      return data;
    },
  });
};
