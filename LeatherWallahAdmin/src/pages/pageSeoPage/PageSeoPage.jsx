import { useContext, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import PageSeoTable from "./../../components/PageSeo/PageSeoTable";
import { BASE_URL } from "../../utils/baseURL";
import { AuthContext } from "../../context/AuthProvider";

const PageSeoPage = () => {
  const { user } = useContext(AuthContext);

  // Fetch Page SEO data

  const {
    data: pageSeoData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["/api/v1/page-seo"],
    queryFn: async () => {
      try {
        const res = await fetch(`${BASE_URL}/page-seo`, {
          credentials: "include",
        });

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`,
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    },
  });

  return (
    <>
      {user?.role_id?.page_seo_show === true && (
        <div className="py-6 px-4">
          <div className="flex justify-between mt-6 bg-white rounded-lg p-4 shadow">
            <div>
              <h1 className="text-2xl">Page SEO Management</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage meta titles, descriptions, and indexing for all pages
              </p>
            </div>
          </div>

          {/* Page SEO Data Table */}
          <div className="bg-white rounded-lg shadow py-6 px-4 mt-6">
            <PageSeoTable
              pageSeoData={pageSeoData?.data}
              refetch={refetch}
              user={user}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default PageSeoPage;
