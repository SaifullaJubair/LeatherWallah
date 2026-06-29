import { IoMdClose, IoIosMenu } from "react-icons/io";
import { useContext, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { LoaderOverlay } from "../../components/common/loader/LoderOverley";
import { AuthContext } from "../../context/AuthProvider";
import { BASE_URL } from "../../utils/baseURL";
import { toast } from "react-toastify";

const DashBoardNavbar = ({
  setSidebarOpen,
  isSidebarOpen,
  setMinibarOpen,
  isMinibarOpen,
}) => {
  // Assuming you are using functional components with hooks
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [setIsFullscreen] = useState(false);
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  // const { logout } = useContext(AuthContext);
  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/authentication/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        navigate("/sign-in");
        window.location.reload();
        toast.success("Logged out successfully");
      }
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const menuRef = useRef(null);
  // const { user, loading } = useContext(AuthContext);
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  // FullScreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  if (loading) return <LoaderOverlay />;

  // console.log(233, user);

  return (
    <nav className="border-b">
      <div className="  py-1 px-4 sm:px-10 md:pl-3 md:pr-16">
        <div className="flex h-16 items-center gap-1 justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="flex-shrink-0 mr-5 hidden lg:block"
            >
              {isSidebarOpen ? (
                <IoMdClose className="text-lg sm:text-2xl text-bgray-900" />
              ) : (
                <IoIosMenu className="text-lg sm:text-2xl text-bgray-900" />
              )}
            </button>
          </div>

          <div className="-mr-2 flex">
            <div className="shrink-0">
              <div className="flex items-center gap-3">
                <div className="group hidden lg:block">
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="relative px-2 py-2 text-gray-500 focus:outline-none flex flex-col items-center rounded-md group-hover:bg-purple/20 hover:text-white transition duration-200 ease-in-out"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#5f6368"
                    >
                      <path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z" />
                    </svg>
                  </button>
                </div>

                <div className="relative px-1 py-1 ">
                  <div
                    className="flex items-center ml-4 gap-2 cursor-pointer"
                    onClick={() => {
                      toggleDropdown();
                    }}
                    ref={menuRef}
                  >
                    <div>
                      <h3 className="text-sm sm:text-[16px] -mb-1">
                        {user?.admin_name}
                      </h3>
                      <p className=" text-[#7b809a] text-xs sm:text-sm text-center mt-1.5">
                        ({user?.role_id?.role_name})
                      </p>
                    </div>
                    <button
                      className=" relative hidden sm:flex items-center rounded  text-sm focus:outline-none focus:ring-1 focus:ring-white focus:ring-offset-1 "
                      id="user-menu-button"
                    >
                      {user?.user_logo ? (
                        <>
                          {" "}
                          <img
                            src={user?.user_logo}
                            alt="user"
                            className="h-[40px] w-[40px] rounded-full"
                          />
                        </>
                      ) : (
                        <FaUser className="h-[40px] w-[40px] rounded-full" />
                      )}
                    </button>
                  </div>
                  {isDropdownOpen && (
                    <div
                      className={`absolute  ${
                        isDropdownOpen ? "right-0" : "hidden"
                      } z-10 mt-4 w-52 origin-top-right rounded bg-white shadow-2xl focus:outline-none`}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="user-menu-button"
                      tabIndex="-1"
                    >
                      <Link
                        to="/admin/my-profile"
                        className="block py-4 px-4  text-sm  w-full  hover:bg-blue-400 hover:text-white font-semibold text-center"
                        role="menuitem"
                        tabIndex="-1"
                        id="user-menu-item-0"
                      >
                        Your Profile
                      </Link>

                      <p
                        onClick={handleLogout}
                        className="block py-3 px-4 cursor-pointer text-sm w-full hover:hover:bg-blue-400 hover:text-white font-semibold text-center"
                        role="menuitem"
                        tabIndex="-1"
                        id="user-menu-item-2"
                      >
                        Sign out
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMinibarOpen(!isMinibarOpen)}
              className="relative inline-flex items-center justify-center rounded-md bg-white p-2 text-black lg:hidden "
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="absolute -inset-0.5"></span>
              <span className="sr-only">Open main menu</span>
              {isMinibarOpen ? (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default DashBoardNavbar;
