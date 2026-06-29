"use client";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../utils/baseURL";

const useGetQuestion = (id, limit, page) => {
  return useQuery({
    queryKey: [`/api/v1/question/${id}?limit=${limit}&page=${page}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/question/${id}?limit=${limit}&page=${page}`);
      const data = await res.json();
      return data;
    },
  });
};

export default useGetQuestion;
