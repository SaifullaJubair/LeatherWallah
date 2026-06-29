import { useState } from "react";
import { MdDeleteForever } from "react-icons/md";
import { FiEdit } from "react-icons/fi";
import { FiPlus, FiChevronRight, FiChevronDown } from "react-icons/fi";
import Swal from "sweetalert2-optimized";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import NoDataFound from "../../shared/NoDataFound/NoDataFound";
import TableLoadingSkeleton from "../common/loadingSkeleton/TableLoadingSkeleton";
import AddCategory from "./AddCategory";
import UpDateCategory from "./UpDateCategory";

// Nested category tree manager (Phase 0.5). Reads /category/tree (root nodes
// with nested `children`) and lets the admin drill down + add a child under any
// node, edit, delete, and toggle status — replacing the old flat table + the
// retired SubCategory/ChildCategory pages.

const patchCategory = async (body) => {
  const res = await fetch(`${BASE_URL}/category`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  return res.json();
};

const CategoryTreeNode = ({ node, depth, user, refetch, onAddChild, onEdit }) => {
  const [open, setOpen] = useState(false);
  const children = node?.children ?? [];
  const hasChildren = children.length > 0;

  const handleDelete = () => {
    Swal.fire({
      title: "Are you sure?",
      text: `Delete "${node?.category_name}"? Only leaf categories with no products can be deleted.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (!result.isConfirmed) return;
      try {
        const res = await fetch(`${BASE_URL}/category`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            _id: node?._id,
            category_logo_key: node?.category_logo_key,
          }),
        });
        const data = await res.json();
        if (data?.statusCode === 200 && data?.success === true) {
          refetch();
          Swal.fire({
            title: "Deleted!",
            text: `${node?.category_name} has been deleted!`,
            icon: "success",
          });
        } else {
          toast.error(data?.message || "Delete failed", { autoClose: 1500 });
        }
      } catch {
        toast.error("Network error or server is down", { autoClose: 1500 });
      }
    });
  };

  const handleStatusToggle = async () => {
    const data = await patchCategory({
      _id: node?._id,
      category_status:
        node?.category_status === "active" ? "in-active" : "active",
    });
    if (data?.statusCode === 200 && data?.success === true) refetch();
    else toast.error(data?.message || "Status update failed", { autoClose: 1500 });
  };

  return (
    <>
      <div
        className="flex items-center gap-2 border-b border-gray-100 py-2 hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 24 + 8}px` }}
      >
        {/* expander */}
        <button
          type="button"
          className={`text-gray-500 ${hasChildren ? "" : "invisible"}`}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <FiChevronDown size={18} /> : <FiChevronRight size={18} />}
        </button>

        {node?.category_logo ? (
          <img
            src={node.category_logo}
            alt=""
            className="w-7 h-7 rounded object-cover"
          />
        ) : (
          <div className="w-7 h-7 rounded bg-gray-100" />
        )}

        <span className="font-medium text-gray-800">{node?.category_name}</span>
        <span className="text-xs text-gray-400">#{node?.category_serial}</span>

        <button
          type="button"
          onClick={handleStatusToggle}
          className={`ml-2 text-[11px] px-2 py-0.5 rounded ${
            node?.category_status === "active"
              ? "bg-bgBtnActive text-btnActiveColor"
              : "bg-bgBtnInactive text-btnInactiveColor"
          }`}
        >
          {node?.category_status === "active" ? "Active" : "In-Active"}
        </button>

        <div className="ml-auto flex items-center gap-2 pr-3">
          {user?.role_id?.category_post === true && (
            <button
              type="button"
              title="Add sub-category"
              onClick={() => onAddChild(node)}
              className="text-primaryColor hover:opacity-70"
            >
              <FiPlus size={20} />
            </button>
          )}
          {user?.role_id?.category_update === true && (
            <button
              type="button"
              title="Edit"
              onClick={() => onEdit(node)}
              className="text-gray-500 hover:text-gray-300"
            >
              <FiEdit size={18} />
            </button>
          )}
          {user?.role_id?.category_delete === true && (
            <button
              type="button"
              title="Delete"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-300"
            >
              <MdDeleteForever size={20} />
            </button>
          )}
        </div>
      </div>

      {open &&
        children.map((child) => (
          <CategoryTreeNode
            key={child?._id}
            node={child}
            depth={depth + 1}
            user={user}
            refetch={refetch}
            onAddChild={onAddChild}
            onEdit={onEdit}
          />
        ))}
    </>
  );
};

const CategoryTree = ({ tree = [], isLoading, refetch, user }) => {
  // create-modal state: parent === null → root, else child under that node
  const [createParent, setCreateParent] = useState(undefined); // undefined = closed
  const [editData, setEditData] = useState(null);

  if (isLoading) return <TableLoadingSkeleton />;

  return (
    <div className="mt-6">
      {Array.isArray(tree) && tree.length > 0 ? (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          {tree.map((node) => (
            <CategoryTreeNode
              key={node?._id}
              node={node}
              depth={0}
              user={user}
              refetch={refetch}
              onAddChild={(parent) => setCreateParent(parent)}
              onEdit={(node) => setEditData(node)}
            />
          ))}
        </div>
      ) : (
        <NoDataFound />
      )}

      {/* Add child under a node (createParent is the parent node) */}
      {createParent !== undefined && (
        <AddCategory
          setCategoryCreateModal={() => setCreateParent(undefined)}
          refetch={refetch}
          user={user}
          parentId={createParent?._id ?? null}
          parentName={createParent?.category_name ?? null}
        />
      )}

      {editData && (
        <UpDateCategory
          setCategoryUpdateModal={() => setEditData(null)}
          categoryUpdateData={editData}
          refetch={refetch}
          user={user}
        />
      )}
    </div>
  );
};

export default CategoryTree;
