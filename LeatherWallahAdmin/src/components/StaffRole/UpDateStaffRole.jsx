import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useState, useEffect, useContext } from "react";
import { RxCross1 } from "react-icons/rx";
import permissionsData from "../../data/permissionData";
import PermissionSections from "./PermissionSections";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { BASE_URL } from "../../utils/baseURL";
import { AuthContext } from "./../../context/AuthProvider";

const UpDateStaffRole = ({ setUpdateModal, updateModalValue, refetch }) => {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    defaultValues: updateModalValue, // Set default values here
  });

  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  const watchAllFields = watch();

  useEffect(() => {
    reset(updateModalValue); // Reset the form with default values on mount
  }, [reset, updateModalValue]);

  // Add role permission
  const handleDataPost = async (data) => {
    setLoading(true);
    const sendData = {
      role_updated_by: user?._id,
      _id: updateModalValue?._id,
      role_name: data.role_name,
    };

    permissionsData?.forEach((section) => {
      section?.Type?.forEach((permission) => {
        sendData[permission?.type_value] =
          data[permission?.type_value] || false;
      });
    });

    try {
      const response = await fetch(`${BASE_URL}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(result?.message || "Role Update successfully", {
          autoClose: 1000,
        });
        refetch();
        setLoading(false);
        setUpdateModal(false);
        reset();
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
      }
    } catch (error) {
      toast.error("Network error or server is down", {
        autoClose: 1000,
      });
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white shadow-xl xl:w-[1150px] lg:w-[950px] md:w-[760px] sm:w-[600px] w-[550px] p-6 max-h-[100vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3
            className="text-[26px] font-bold text-gray-800 capitalize"
            id="modal-title"
          >
            Update Role Information
          </h3>
          <button
            type="button"
            onClick={() => setUpdateModal(false)}
            className="btn bg-white  p-1 absolute right-3 rounded-full top-3 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
          >
            <RxCross1 size={20} />
          </button>
        </div>

        <hr className="mt-2 mb-4" />

        <form onSubmit={handleSubmit(handleDataPost)}>
          <div className="mt-4 max-w-lg">
            <p className="ml-1 text-sm font-semibold py-1 text-gray-700">
              Role Name
            </p>
            <input
              placeholder="Role Name"
              {...register("role_name", { required: "Role Name is required" })}
              id="role_name"
              type="text"
              defaultValue={updateModalValue?.role_name}
              className="block w-full px-2 py-1.5 text-gray-700 bg-white border border-gray-200 rounded"
            />
            {errors.role_name && (
              <p className="text-red-600">{errors.role_name.message}</p>
            )}
          </div>

          {/* Permissions — grouped by sidebar section (see PermissionSections).
              The checkboxes get their state from useForm's defaultValues +
              reset(updateModalValue) above, so no defaultChecked here; react-hook-form
              owns the value and the two would fight over it. */}
          <div className="mt-4">
            <h4 className="text-md font-semibold mb-1">Permissions</h4>
            <p className="text-xs text-gray-500 mb-3">
              Grouped the same way the sidebar is. Give a staff member the sections
              they work in — &quot;Select all&quot; grants a whole section at once.
            </p>
            <PermissionSections
              register={register}
              watchAllFields={watchAllFields}
              setValue={setValue}
            />
          </div>

          <div className="flex gap-8 mt-6 justify-end">
            <button
              className="px-10 py-2 border  rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setUpdateModal(false)}
            >
              Cancel
            </button>
            {loading ? (
              <div className="px-10 py-2  bg-primaryColor text-white rounded flex justify-center items-center">
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                type="Submit"
              >
                Update
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpDateStaffRole;
