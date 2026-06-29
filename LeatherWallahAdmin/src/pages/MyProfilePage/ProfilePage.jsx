import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthProvider";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { FiSettings } from "react-icons/fi";
import { FaRegEdit, FaUser } from "react-icons/fa";
import ProfileSetting from "./ProfileSetting";

const ProfilePage = () => {
  const { user, loading: userLoading } = useContext(AuthContext);
  const [userupdateModalOpen, setUserupdateModalOpen] = useState(false);

  //updateUser function
  const handleUpdateUser = () => {
    setUserupdateModalOpen(true);
  };

  if (userLoading) {
    return <LoaderOverlay />;
  }
  console.log("user", user);
  return (
    <div>
      <h4 className=" bg-blue-800  p-4 flex items-center gap-3 text-white mb-2 max-w-5xl mx-auto rounded">
        <FiSettings className="text-2xl text-white" />
        <span className="text-2xl">Profile Details</span>
      </h4>
      <div className="my-10 bg-slate-100 shadow relative max-w-5xl mx-auto rounded">
        <button
          className="absolute right-5 top-5 flex items-center text-xl gap-2 font-semibold text-gray-500 hover:text-gray-900"
          onClick={() => handleUpdateUser()}
        >
          Edit <FaRegEdit size={30} className="" />
        </button>
        <div className="p-10 flex justify-center items-center sm:gap-x-10 flex-wrap">
          <div className=" ">
            {user?.user_logo ? (
              <>
                {" "}
                <img
                  src={user?.user_logo}
                  alt=""
                  className="w-[180px] h-[180px] object-cover rounded-full"
                />
              </>
            ) : (
              <FaUser className="w-[180px] h-[180px]" />
            )}
          </div>
          <div className="mt-4 sm:mt-0">
            <p className="text-2xl font-medium uppercase">{user?.admin_name}</p>
            <p className="text-2xl font-medium uppercase mt-3">
              {user?.admin_phone}
            </p>
            <p className="text-2xl font-medium uppercase mt-3">
              {user?.role_id?.role_name}
            </p>

            <p className="text-2xl font-medium mt-3">
              {" "}
              <span>{user?.admin_address}</span>, {user?.admin_country}
            </p>
          </div>
        </div>
      </div>

      {userupdateModalOpen && (
        <ProfileSetting
          setUserupdateModalOpen={setUserupdateModalOpen}
          user={user}
        />
      )}
    </div>
  );
};

export default ProfilePage;
