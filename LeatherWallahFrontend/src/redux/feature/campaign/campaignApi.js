import { getFromLocalStorage } from "@/utils/local-storage";
import { baseApi } from "../../api/baseApi";
import { tagTypes } from "../../tag-types";
import { authKey } from "@/contants/storageKey";

const token = getFromLocalStorage(authKey);

export const campaignApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    //add Campaign
    addCampaign: build.mutation({
      query: (data) => ({
        url: `/campaign`,
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: data,
      }),
      invalidatesTags: [tagTypes.campaign],
    }),

    //update Campaign
    updateCampaign: build.mutation({
      query: (data) => ({
        url: `/campaign`,
        method: "PATCH",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: data,
      }),
      invalidatesTags: [tagTypes.campaign],
    }),

    //delete Campaign
    deleteCampaign: build.mutation({
      query: (data) => ({
        url: `/campaign`,
        method: "DELETE",
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: data,
      }),
      invalidatesTags: [tagTypes.campaign],
    }),
  }),
});

export const {
  useAddCampaignMutation,
  useDeleteCampaignMutation,
  useUpdateCampaignMutation
} = campaignApi;
