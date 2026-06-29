import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import ImageUploader from "../../common/ImageUploader";
import { BASE_URL } from "../../../utils/baseURL";
import MiniSpinner from "../../../shared/MiniSpinner/MiniSpinner";

const CardInformation = ({ refetch, getInitialCurrencyData }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();
  const handleShippingPost = async (data) => {
    setLoading(true);
    // Helper function to check if a value is empty
    const isEmpty = (value) => {
      if (value instanceof FileList) {
        return value?.length === 0; // Check if no file is selected
      }
      return value === null || value === undefined || value === "";
    };

    // Define rows with their respective field names
    const rows = [
      {
        logo: data?.card_one_logo,
        title: data?.card_one_title,
        logoField: "Card One Logo",
        titleField: "Card One Title",
      },
      {
        logo: data?.card_two_logo,
        title: data?.card_two_title,
        logoField: "Card Two Logo",
        titleField: "Card Two Title",
      },
      {
        logo: data?.card_three_logo,
        title: data?.card_three_title,
        logoField: "Card Three Logo",
        titleField: "Card Three Title",
      },
      {
        logo: data?.card_four_logo,
        title: data?.card_four_title,
        logoField: "Card Four Logo",
        titleField: "Card Four Title",
      },
    ];

    // Check if all rows are empty
    const allRowsEmpty = rows?.every(
      (row) => isEmpty(row?.logo) && isEmpty(row?.title)
    );

    if (allRowsEmpty) {
      toast.warn(
        "At least one row (logo and title) must be completely filled."
      );
      setLoading(false);
      return;
    }

    // Check if any row is partially filled
    for (const row of rows) {
      if (!isEmpty(row.logo) && isEmpty(row.title)) {
        toast.warn(`${row.titleField} must be filled.`);
        setLoading(false);
        return;
      }

      if (isEmpty(row.logo) && !isEmpty(row.title)) {
        toast.warn(`${row.logoField} must be filled.`);
        setLoading(false);
        return;
      }
    }

    // Proceed with API call or other operations here
    try {
      let card_one_logo;
      let card_two_logo;
      let card_three_logo;
      let card_four_logo;
      if (data?.card_one_logo?.[0]) {
        const card_one_logoUpload = await ImageUploader(
          data?.card_one_logo?.[0]
        );
        card_one_logo = card_one_logoUpload[0];
      }
      if (data?.card_two_logo?.[0]) {
        const card_two_logoUpload = await ImageUploader(
          data?.card_two_logo?.[0]
        );
        card_two_logo = card_two_logoUpload[0];
      }
      if (data?.card_three_logo?.[0]) {
        const card_three_logoUpload = await ImageUploader(
          data?.card_three_logo?.[0]
        );
        card_three_logo = card_three_logoUpload[0];
      }
      if (data?.card_four_logo?.[0]) {
        const card_four_logoUpload = await ImageUploader(
          data?.card_four_logo?.[0]
        );
        card_four_logo = card_four_logoUpload[0];
      }
      const sendData = {
        card_one_logo: card_one_logo || getInitialCurrencyData?.card_one_logo,
        card_one_title:
          data?.card_one_title || getInitialCurrencyData?.card_one_title,
        card_two_logo: card_two_logo || getInitialCurrencyData?.card_two_logo,
        card_two_title:
          data?.card_two_title || getInitialCurrencyData?.card_two_title,
        card_three_logo:
          card_three_logo || getInitialCurrencyData?.card_three_logo,
        card_three_title:
          data?.card_three_title || getInitialCurrencyData?.card_three_title,
        card_four_logo:
          card_four_logo || getInitialCurrencyData?.card_four_logo,
        card_four_title:
          data?.card_four_title || getInitialCurrencyData?.card_four_title,
        _id: getInitialCurrencyData?._id,
      };
      const response = await fetch(`${BASE_URL}/setting`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sendData),
      });
      const result = await response.json();
      if (result?.statusCode === 200 && result?.success === true) {
        toast.success(
          result?.message
            ? result?.message
            : "Sowtware Information update successfully",
          {
            autoClose: 1000,
          }
        );
        refetch();
        setLoading(false);
      } else {
        toast.error(result?.message || "Something went wrong", {
          autoClose: 1000,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("An error occurred while submitting the data.");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit(handleShippingPost)} className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              className="block text-xs font-medium text-gray-700"
              htmlFor="card_one_logo"
            >
              Card One Logos
            </label>
            <input
              {...register("card_one_logo", {
                validate: (value) => {
                  if (value && value.length > 0) {
                    return (
                      value[0].type.startsWith("image/") ||
                      "Only image files are allowed"
                    );
                  }
                },
              })}
              id="card_one_logo"
              type="file"
              accept="image/*"
              className="mt-2 w-full file:bg-blue-600 file:border-none file:text-white rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 file:rounded cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor=""
              className="block text-xs font-medium text-gray-700"
            >
              Card One Title
            </label>
            <input
              {...register("card_one_title")}
              type="text"
              placeholder="Enter Title"
              defaultValue={getInitialCurrencyData?.card_one_title}
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium text-gray-700"
              htmlFor="card_two_logo"
            >
              Card Two Logo
            </label>
            <input
              {...register("card_two_logo", {
                validate: (value) => {
                  if (value && value.length > 0) {
                    return (
                      value[0].type.startsWith("image/") ||
                      "Only image files are allowed"
                    );
                  }
                },
              })}
              id="card_two_logo"
              type="file"
              accept="image/*"
              className="mt-2 w-full file:bg-blue-600 file:border-none file:text-white rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 file:rounded cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor=""
              className="block text-xs font-medium text-gray-700"
            >
              Card Two Title
            </label>
            <input
              {...register("card_two_title")}
              type="text"
              placeholder="Enter Title"
              defaultValue={getInitialCurrencyData?.card_two_title}
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium text-gray-700"
              htmlFor="card_three_logo"
            >
              Card Three Logo
            </label>
            <input
              {...register("card_three_logo", {
                validate: (value) => {
                  if (value && value.length > 0) {
                    return (
                      value[0].type.startsWith("image/") ||
                      "Only image files are allowed"
                    );
                  }
                },
              })}
              id="card_three_logo"
              type="file"
              accept="image/*"
              className="mt-2 w-full file:bg-blue-600 file:border-none file:text-white rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 file:rounded cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor=""
              className="block text-xs font-medium text-gray-700"
            >
              Card Three Title
            </label>
            <input
              {...register("card_three_title")}
              type="text"
              placeholder="Enter Title"
              defaultValue={getInitialCurrencyData?.card_three_title}
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>

          <div>
            <label
              className="block text-xs font-medium text-gray-700"
              htmlFor="card_four_logo"
            >
              Card Four Logo
            </label>
            <input
              {...register("card_four_logo", {
                validate: (value) => {
                  if (value && value.length > 0) {
                    return (
                      value[0].type.startsWith("image/") ||
                      "Only image files are allowed"
                    );
                  }
                },
              })}
              id="card_four_logo"
              type="file"
              accept="image/*"
              className="mt-2 w-full file:bg-blue-600 file:border-none file:text-white rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2 file:rounded cursor-pointer"
            />
          </div>

          <div>
            <label
              htmlFor=""
              className="block text-xs font-medium text-gray-700"
            >
              Card Four Title
            </label>
            <input
              {...register("card_four_title")}
              type="text"
              placeholder="Enter Title"
              defaultValue={getInitialCurrencyData?.card_four_title}
              className="mt-2 w-full rounded-md border-gray-200 shadow-sm sm:text-sm p-2 border-2"
            />
          </div>
        </div>
        <div className="flex gap-6 mt-4 justify-end">
          {loading == true ? (
            <div className="px-10 py-2 flex items-center justify-center  bg-primaryColor text-white rounded">
              <MiniSpinner />
            </div>
          ) : (
            <>
              {getInitialCurrencyData?._id ? (
                <button
                  className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                  type="submit"
                >
                  Update
                </button>
              ) : (
                <button
                  className="px-10 py-2  bg-primaryColor hover:bg-blue-500 duration-200 text-white rounded"
                  type="submit"
                >
                  Save
                </button>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default CardInformation;
