import { useContext, useEffect, useState } from "react";
import AttributeTable from "../../components/Attribute/AttributeTable";

import AddAttribute from "../../components/Attribute/AddAttribute";
import useGetCategory from "../../hooks/useGetCategory";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";

import { AuthContext } from "../../context/AuthProvider";
import useDebounced from "../../hooks/useDebounced";

const AttributePage = () => {
  const [addAttributeModal, setAddAttributeModal] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useContext(AuthContext);
  // handle item search function....
  const searchText = useDebounced({ searchQuery: searchValue, delay: 500 });
  useEffect(() => {
    setSearchTerm(searchText);
  }, [searchText]);

  // handle item search function....
  const handleSearchValue = (value) => {
    setSearchValue(value);
    setLimit(10);
    setPage(1);
  };

  //get Category data
  // const { data: categoryTypes } = useGetCategory();

  //data fetching of Child Category by TansTeck Query
  const {
    data: attributeTypes = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/attribute/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/attribute/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.text(); // Get more info about the error
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
          );
        }

        const data = await res.json();
        return data;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error; // Rethrow to propagate the error to react-query
      }
    },
  });

  return (
    <>
      {" "}
      {user?.role_id?.attribute_show && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Attribute</h1>
            </div>
            {user?.role_id?.attribute_post && (
              <div>
                <button
                  type="button"
                  className="h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200  text-white text-sm"
                  onClick={() => setAddAttributeModal(true)}
                >
                  Create Attribute
                </button>
              </div>
            )}
          </div>
          {/* search Attribute... */}
          <div className="mt-3">
            <input
              type="text"
              defaultValue={searchTerm}
              onChange={(e) => handleSearchValue(e.target.value)}
              placeholder="Search Attribute..."
              className="w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
            />
          </div>

          {/* show Attribute table update and create attribute Value */}
          <AttributeTable
            attributeTypes={attributeTypes}
            setPage={setPage}
            setLimit={setLimit}
            setSearchTerm={setSearchTerm}
            refetch={refetch}
            totalData={attributeTypes?.totalData}
            page={page}
            limit={limit}
            // categoryTypes={categoryTypes}
            user={user}
            isLoading={isLoading}
          />

          {/* show Add Attribute Modal */}

          {addAttributeModal && (
            <AddAttribute
              setAddAttributeModal={setAddAttributeModal}
              // categoryTypes={categoryTypes}
              refetch={refetch}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
};

export default AttributePage;
