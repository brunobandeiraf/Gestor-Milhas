import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useAdminDashboardQuery = () => {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard/admin");
      return data;
    },
  });
};
