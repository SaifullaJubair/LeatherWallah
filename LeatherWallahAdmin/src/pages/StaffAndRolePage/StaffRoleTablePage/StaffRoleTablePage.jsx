import { Link } from "react-router-dom";
import StaffRoleTable from "../../../components/StaffRole/StaffRoleTable";
import { AuthContext } from "../../../context/AuthProvider";
import { useContext } from "react";

const StaffRoleTablePage = () => {
  //Add Staff Role Modal State
  const { user } = useContext(AuthContext);
  return (
    <>
      {user?.role_id?.role_show === true && (
        <div className="bg-white rounded py-6 px-4 max-w-7xl mx-auto shadow">
          <div className="flex justify-between mt-6">
            <div>
              <h1 className="text-2xl">Staff Role</h1>
            </div>
            {user?.role_id?.role_create === true && (
              <div>
                <Link to="/create-staff-role">
                  <button className="w-[138px] h-[40px] rounded-[8px] py-[10px] px-[14px] bg-primaryColor  text-white text-sm">
                    Add Staff Role
                  </button>
                </Link>
              </div>
            )}
          </div>
          {/* Show Staff Role Table */}
          <StaffRoleTable user={user} />
        </div>
      )}
    </>
  );
};

export default StaffRoleTablePage;
