import { baseApi } from "@/redux/api/baseApi";
import { tagTypes } from "@/redux/tag-types";

const AUTH_URL = "/user";

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    // Get user information
    userInfo: build.query({
      query: () => ({
        url: "/get_me",
        method: "GET",
        credentials: "include",
      }),
    }),

    //use registration
    userRegistration: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}`,
        method: "POST",
        credentials: "include",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    // user login
    userLogin: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/login`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    // //resend otp
    resendOtp: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/resend_otp`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    //forget password
    forgetPassword: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/forgetPassword`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    //forget password
    changePassword: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/setNewPassword`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    //verify account
    verify: build.mutation({
      query: (data) => ({
        url: `${AUTH_URL}/update_user_status`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [tagTypes.auth],
    }),

    // //change user password
    // changeUserPassword: build.mutation({
    //   query: (data) => ({
    //     url: `${AUTH_URL}`,
    //     method: "PATCH",
    //     body: data,
    //   }),
    //   invalidatesTags: [tagTypes.auth],
    // }),

    // //account status change
    // changeStatus: build.mutation({
    //   query: (data) => ({
    //     url: `${AUTH_URL}/update_user_status`,
    //     method: "PATCH",
    //     headers: {
    //       authorization: `Bearer ${token}`,
    //     },
    //     body: data,
    //   }),
    //   invalidatesTags: [tagTypes.auth],
    // }),

    // //delete a user
    // deleteUser: build.mutation({
    //   query: (data) => ({
    //     url: `${AUTH_URL}`,
    //     method: "DELETE",
    //     headers: {
    //       authorization: `Bearer ${token}`,
    //     },
    //     body: data,
    //   }),
    //   invalidatesTags: [tagTypes.auth],
    // }),
  }),
});

export const {
  useUserRegistrationMutation,
  useUserLoginMutation,
  useResendOtpMutation,
  useVerifyMutation,
  useForgetPasswordMutation,
  useChangePasswordMutation,
  useUserInfoQuery
  //   useChangeStatusMutation,
  //   useDeleteUserMutation,
  //   useChangeUserPasswordMutation,
} = authApi;
