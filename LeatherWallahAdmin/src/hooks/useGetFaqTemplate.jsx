import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

export const useGetFaqTemplates = ({ page = 1, limit = 50, category, is_active, search } = {}) => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (category) params.set("category", category);
  if (is_active !== undefined && is_active !== "") params.set("is_active", String(is_active));
  if (search) params.set("search", search);

  return useQuery({
    queryKey: [`/api/v1/faq-template?${params.toString()}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/faq-template?${params.toString()}`, {
        credentials: "include",
      });
      return res.json();
    },
  });
};

// Distinct topic labels in use — powers the free-text datalist suggestions.
export const useGetFaqTemplateTopics = () =>
  useQuery({
    queryKey: ["/api/v1/faq-template/topics"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/faq-template/topics`, {
        credentials: "include",
      });
      return res.json();
    },
  });

// Distinct FAQ placeholder keys across the catalog ({ core, fromProducts }) —
// powers the clickable placeholder chips in the template editor.
export const useGetFaqPlaceholderKeys = () =>
  useQuery({
    queryKey: ["/api/v1/product/faq-placeholder-keys"],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/product/faq-placeholder-keys`, {
        credentials: "include",
      });
      return res.json();
    },
  });
