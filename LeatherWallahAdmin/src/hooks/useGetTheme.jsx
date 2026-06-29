import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

export const useGetThemes = ({ page = 1, limit = 20, status, theme_for, search } = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (status) params.set("status", status);
  if (theme_for) params.set("theme_for", theme_for);
  if (search) params.set("search", search);

  return useQuery({
    queryKey: [`/api/v1/theme?${params.toString()}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/theme?${params.toString()}`, {
        credentials: "include",
      });
      return res.json();
    },
  });
};

export const useGetThemeById = (id) => {
  return useQuery({
    queryKey: [`/api/v1/theme/${id}`],
    enabled: !!id,
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/theme/${id}`, {
        credentials: "include",
      });
      return res.json();
    },
  });
};
