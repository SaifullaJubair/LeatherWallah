import { useQuery } from "@tanstack/react-query";

const useGetOrderStatusSteadFast = ({ trackingCode }) => {
  return useQuery({
    queryKey: [
      `https://portal.packzy.com/api/v1/status_by_trackingcode/${trackingCode}`,
    ],
    queryFn: async () => {
      const res = await fetch(
        `https://portal.packzy.com/api/v1/status_by_trackingcode/${trackingCode}`,
        {
          method: "GET",
          headers: {
            "Api-Key": "lx1u0pjb8l0esiggmfvdor9lyzn0xsjc",
            "Secret-Key": "nxyegvprmvrtwpytjz00q2ts",
          },
        }
      );
      const data = await res.json();
      return data;
    },
  });
};

export default useGetOrderStatusSteadFast;
