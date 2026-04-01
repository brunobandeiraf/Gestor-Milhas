import { useQuery } from "@tanstack/react-query";
import api from "../services/api";

export const useLoyaltyAccountsQuery = () => {
  return useQuery({
    queryKey: ["loyalty-accounts"],
    queryFn: async () => {
      const { data } = await api.get("/loyalty-accounts");
      return data;
    },
  });
};
