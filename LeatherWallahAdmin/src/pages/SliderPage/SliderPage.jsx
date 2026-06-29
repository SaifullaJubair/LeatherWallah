import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthProvider";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "../../utils/baseURL";
import AddSlider from "./../../components/Slider/AddSlider";
import SliderTable from "./../../components/Slider/SliderTable";
import ShowSlider from "./../../components/Slider/ShowSlider";

const SliderPage = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  //const [searchValue, setSearchValue] = useState('')
  const [searchTerm, setSearchTerm] = useState("");
  const [openSliderCreateModal, setOpenSliderCreateModal] = useState(false);
  const { user } = useContext(AuthContext);

  // const searchText = useDebounced({ searchQuery: searchValue, delay: 500 })
  // useEffect(() => {
  //   setSearchTerm(searchText)
  // }, [searchText])

  // handle item search function....
  // const handleSearchValue = (value) => {
  //   setSearchValue(value)
  //   setLimit(10)
  //   setPage(1)
  // }

  // Fetch Slider data
  const {
    data: sliders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      `/api/v1/slider/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
    ],
    queryFn: async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/slider/dashboard?page=${page}&limit=${limit}&searchTerm=${searchTerm}`,
          {
            credentials: "include",
          }
        );

        if (!res.ok) {
          const errorData = await res.text();
          throw new Error(
            `Error: ${res.status} ${res.statusText} - ${errorData}`
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
      {user?.role_id?.slider_show === true && (
        <div className="bg-white rounded-lg py-6 px-4 shadow">
          <div className="flex justify-between mt-6 bg-white rounded-lg py-6 px-4 shadow">
            <div>
              <h1 className="text-2xl">Slider</h1>
            </div>
            {user?.role_id?.slider_create === true && (
              <div>
                <button
                  type="button"
                  className="rounded-[8px] py-[10px] px-[14px] bg-primaryColor hover:bg-blue-500 duration-200 text-white text-sm"
                  onClick={() => setOpenSliderCreateModal(true)}
                >
                  Create Slider
                </button>
              </div>
            )}
          </div>
          {/* search Slider... */}
          {/* <div className='mt-3'>
        <input
          type='text'
          defaultValue={searchTerm}
          onChange={(e) => handleSearchValue(e.target.value)}
          placeholder='Search Category...'
          className='w-full sm:w-[350px] px-4 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200'
        />
      </div> */}
          {/* Show banner like front end */}
          <div className="my-6 bg-white rounded-lg">
            <ShowSlider sliders={sliders} />
          </div>
          {/* Slider Data Show and update and delete operation file */}
          <div className=" bg-white rounded-lg shadow py-6 px-4 ">
            <SliderTable
              sliders={sliders?.data}
              setPage={setPage}
              setLimit={setLimit}
              page={page}
              limit={limit}
              totalData={sliders?.totalData}
              setSearchTerm={setSearchTerm}
              refetch={refetch}
              user={user}
              isLoading={isLoading}
            />
          </div>

          {/* Add Slider modal */}
          {openSliderCreateModal && (
            <AddSlider
              setOpenSliderCreateModal={setOpenSliderCreateModal}
              user={user}
              refetch={refetch}
            />
          )}
        </div>
      )}
    </>
  );
};

export default SliderPage;
