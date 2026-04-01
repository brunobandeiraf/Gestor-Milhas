import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useUserDashboardQuery = () => {
  return useQuery({
    queryKey: ["user-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/user");
      return data;
    },
  });
};
