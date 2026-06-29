import { useForm } from "react-hook-form";
import { RxCross1 } from "react-icons/rx";
import { useState } from "react";
import { toast } from "react-toastify";
import { BASE_URL } from "../../utils/baseURL";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import "react-phone-number-input/style.css";
import PhoneInput, {
  formatPhoneNumber,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
} from "react-phone-number-input";
const UpdateSupplier = ({
  refetch,
  setUpdateModal,
  updateModalValue,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [supplier_phone, setSupplier_phone] = useState(
    updateModalValue?.supplier_phone
  );

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleDataPost = async (data) => {
    setLoading(true);

    if (supplier_phone) {
      const formatPhoneNumberValueCheck = formatPhoneNumber(supplier_phone);
      const isPossiblePhoneNumberValueCheck =
        isPossiblePhoneNumber(supplier_phone);
      const isValidPhoneNumberValueCheck = isValidPhoneNumber(supplier_phone);
      if (formatPhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
      if (isPossiblePhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
      if (isValidPhoneNumberValueCheck == false) {
        toast.error("Mobile number not valid !", {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setLoading(false);
        return;
      }
    }

    const sendData = {
      _id: updateModalValue?._id,
      supplier_name: data?.supplier_name,

      supplier_status: data?.supplier_status,
      supplier_phone: supplier_phone,
      supplier_updated_by: user?._id,
      panel_owner_id: user?.panel_owner_id?._id
        ? user?.panel_owner_id?._id
        : user?._id,
    };

    try {
      const response = await fetch(
        `${BASE_URL}/supplier`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(sendData),
        }
      );
      const result = await response.json();
      if (result?.statusCode == 200 && result?.success == true) {
        toast.success(
          result?.message ? result?.message : "suplier updated  successfully",
          {
            autoClose: 1000,
          }
        );
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
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3
            className="text-[26px] font-bold text-gray-800 capitalize"
            id="modal-title"
          >
            Update Supplier
          </h3>
          <button
            type="button"
            className="btn bg-white hover:bg-bgBtnInactive hover:text-btnInactiveColor  p-1 absolute right-3 rounded-full top-3"
            onClick={() => setUpdateModal(false)}
          >
            {" "}
            <RxCross1 size={20}></RxCross1>
          </button>
        </div>

        <hr className="mt-2 mb-4" />

        <form onSubmit={handleSubmit(handleDataPost)} className="">
          <div>
            <label
              htmlFor="supplier_name"
              className="block text-xs font-medium text-gray-700"
            >
              Supplier Name
            </label>

            <input
              {...register("supplier_name", {
                required: "Supplier name is required",
              })}
              type="text"
              defaultValue={updateModalValue?.supplier_name}
              placeholder="Enter Supplier name"
              id="supplier_name"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
            {errors.supplier_name && (
              <p className="text-red-600 text-sm">
                {errors.supplier_name?.message}
              </p>
            )}
          </div>

          <div className="mt-2">
            <label htmlFor="user_phone">Phone</label>
            <PhoneInput
              className="mt-2 w-full rounded-md border-white-light bg-white px-2 py-1  text-black ps-4 placeholder:text-white-dark text-xl custom-input border fo"
              placeholder="Enter phone number"
              id="user_phone"
              value={supplier_phone}
              defaultCountry="BD"
              international
              countryCallingCodeEditable={false}
              onChange={setSupplier_phone}
              error={
                supplier_phone
                  ? !isValidPhoneNumber(supplier_phone) &&
                    "Invalid phone number"
                  : "Phone number required"
              }
            />
          </div>

          <div className="mt-4 flex-1">
            <label
              htmlFor="supplier_address"
              className="block text-sm font-medium text-gray-700 mt-2"
            >
              Supplier Address
            </label>
            <textarea
              rows="5"
              {...register("supplier_address")}
              defaultValue={updateModalValue?.supplier_address}
              id="supplier_address"
              placeholder="Enter user password"
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>
          <div className="mt-4 flex-1">
            <label
              htmlFor="supplier_status"
              className="block text-xs font-medium text-gray-700"
            >
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("supplier_status", {
                required: " Status is required",
              })}
              className="mt-2 rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 w-full"
            >
              <option
                className="capitalize"
                disabled
                selected
                defaultValue={updateModalValue?.supplier_status}
              >
                {updateModalValue?.supplier_status}
              </option>
              <option value="active">Active</option>
              <option value="in-active">In-Active</option>
            </select>
            {errors.supplier_status && (
              <p className="text-red-600 text-sm">
                {errors.supplier_status.message}
              </p>
            )}
          </div>

          <div className="flex gap-6 mt-6 justify-end">
            <button
              className="px-10 py-2 border rounded hover:bg-bgBtnInactive hover:text-btnInactiveColor"
              onClick={() => setUpdateModal(false)}
              type="button"
            >
              Cancel
            </button>
            {loading ? (
              <div className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200  text-white text-sm rounded">
                Loading...
                <MiniSpinner />
              </div>
            ) : (
              <button
                className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200  text-white text-sm rounded"
                type="submit"
              >
                Update User
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateSupplier;
