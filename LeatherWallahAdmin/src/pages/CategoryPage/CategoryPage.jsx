import { useContext, useState } from "react";
import CategoryTree from "../../components/Category/CategoryTree";
import AddCategory from "../../components/Category/AddCategory";
import { BASE_URL } from "../../utils/baseURL";
import { useQuery } from "@tanstack/react-query";
import { AuthContext } from "./../../context/AuthProvider";

function CategoryPage() {
  const [categoryCreateModal, setCategoryCreateModal] = useState(false);
  const { user } = useContext(AuthContext);

  // Fetch the full nested category tree (root nodes with nested children).
  const {
    data: treeRes = {},
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [`/api/v1/category/tree`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/category/tree`, {
        credentials: "include",
      });
      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(`Error: ${res.status} ${res.statusText} - ${errorData}`);
      }
      return res.json();
    },
  });

  const tree = treeRes?.data ?? [];

  return (
    <>
      {user?.role_id?.category_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Category</h1>
              <p className="text-sm text-gray-500 mt-1">
                Nested categories — expand a node and use{" "}
                <span className="text-primaryColor font-medium">+</span> to add a
                sub-category under it.
              </p>
            </div>

            {user?.role_id?.category_post === true && (
              <div>
                <button
                  type="button"
                  className="rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-sm"
                  onClick={() => setCategoryCreateModal(true)}
                >
                  Create Root Category
                </button>
              </div>
            )}
          </div>

          {/* Nested tree view */}
          <CategoryTree
            tree={tree}
            isLoading={isLoading}
            refetch={refetch}
            user={user}
          />

          {/* Create ROOT category modal (no parent) */}
          {categoryCreateModal && (
            <AddCategory
              refetch={refetch}
              setCategoryCreateModal={setCategoryCreateModal}
              user={user}
            />
          )}
        </div>
      )}
    </>
  );
}

export default CategoryPage;
