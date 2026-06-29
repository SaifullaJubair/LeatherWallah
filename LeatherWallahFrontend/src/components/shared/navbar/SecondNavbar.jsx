"use client";
import SearchForm from "@/components/frontend/searchForm/SearchForm";
import useGetSettingData from "@/components/lib/getSettingData";
import { Button } from "@/components/ui/button";
import { BASE_URL } from "@/components/utils/baseURL";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BiPurchaseTag } from "react-icons/bi";
import { FaUserCircle } from "react-icons/fa";
import { FiHeart, FiMenu, FiShoppingCart, FiUser } from "react-icons/fi";
import { IoSettingsOutline } from "react-icons/io5";
import { MdOutlineHome } from "react-icons/md";
import { SlUserFollowing } from "react-icons/sl";
import { TbJewishStar } from "react-icons/tb";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import MobileNavbar from "./MobileNavbar";
import SearchBar from "./SearchBar";
const Item = ({ isActive, href, label }) => (
  <Link
    href={href}
    className={` text-sm xl:text-base font-medium  xl:tracking-wide hover:text-primary-500  hover:underline hover:underline-offset-8 ${
      isActive
        ? "text-primary  underline underline-offset-8"
        : "text-text-default"
    }`}
  >
    {label}
  </Link>
);

const SecondNavbar = ({ menuData }) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCategory, setIsCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [isMenu, setIsMenu] = useState("");

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [wishlistLength, setWishlistLength] = useState(0);
  const { products } = useSelector((state) => state.cart);
  const [productLength, setProductLength] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [activeSubDropdown, setActiveSubDropdown] = useState(null);
  const [activeChildDropdown, setActiveChildDropdown] = useState(null);
  const { data: settingsData } = useGetSettingData();
  const router = useRouter();
  const footerData = settingsData?.data[0];
  // console.log(settingsData);
  const exploreData = menuData?.data?.filter(
    (item) => item?.category?.explore_category_show === true,
  );
  useEffect(() => {
    const saveDropDown = localStorage.getItem("activeDropdown");
    if (saveDropDown) {
      setActiveDropdown(saveDropDown);
    }
  }, []);
  //log out Function
  // const handleLogOut = () => {
  //   Cookies.remove("leather_wallah_token");

  //   router.push("/");
  //   window.location.reload();
  // };

  const handleLogOut = async () => {
    try {
      const res = await fetch(`${BASE_URL}/authentication/logout`, {
        method: "POST",
        credentials: "include", // cookie পাঠানোর জন্য
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res.ok) {
        // logout success -> redirect home
        router.push("/");
        window.location.reload();
        toast.success("Logout successfully");
      } else {
        const data = await res.json();
        console.error("Logout failed:", data.message);
      }
    } catch (error) {
      console.error("Something went wrong:", error);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (!event.target.closest(".modal-container")) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    const updateWishlistAndCart = () => {
      try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlistLength(wishlist.length);

        // const productList = JSON.parse(localStorage.getItem("cart")) || [];
        // setProductLength(productList?.products?.length || 0);
      } catch (error) {
        console.error("Error reading data from localStorage", error);
      }
    };

    // Initial load
    updateWishlistAndCart();

    // Listen for 'storage' events (cross-tab/local updates)
    window.addEventListener("storage", updateWishlistAndCart);

    // Listen for custom events (intra-tab updates)
    window.addEventListener("localStorageUpdated", updateWishlistAndCart);

    return () => {
      window.removeEventListener("storage", updateWishlistAndCart);
      window.removeEventListener("localStorageUpdated", updateWishlistAndCart);
    };
  }, []);
  useEffect(() => {
    setProductLength(products?.length || 0);
  }, [products]);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setIsMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const saveDropDown = localStorage.getItem("activeDropdown");
    if (saveDropDown) {
      setActiveDropdown(saveDropDown);
    }
    const saveSubDropDown = localStorage.getItem("activeSubDropdown");
    if (saveSubDropDown) {
      setActiveSubDropdown(saveSubDropDown);
    }
    const saveChildDropDown = localStorage.getItem("activeChildDropdown");
    if (saveChildDropDown) {
      setActiveChildDropdown(saveChildDropDown);
    }
  }, [activeDropdown, activeSubDropdown, activeChildDropdown]);
  const toggleDropdown = (dropdown) => {
    const newActiveDropdown = activeDropdown === dropdown ? null : dropdown;
    setActiveDropdown(newActiveDropdown);
    localStorage.setItem("activeDropdown", newActiveDropdown);
  };
  const toggleSubDropdown = (dropdown) => {
    const newActiveSubDropdown =
      activeSubDropdown === dropdown ? null : dropdown;
    setActiveSubDropdown(newActiveSubDropdown);
    localStorage.setItem("activeSubDropdown", newActiveSubDropdown);
  };
  const toggleChildDropdown = (dropdown) => {
    const newActiveChildDropdown =
      activeChildDropdown === dropdown ? null : dropdown;
    setActiveChildDropdown(newActiveChildDropdown);
    localStorage.setItem("activeChildDropdown", newActiveChildDropdown);
  };
  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    localStorage.removeItem("activeDropdown");
  };
  const closeAllSubDropdowns = () => {
    setActiveSubDropdown(null);
    localStorage.removeItem("activeSubDropdown");
  };
  const closeAllChildDropdowns = () => {
    setActiveChildDropdown(null);
    localStorage.removeItem("activeChildDropdown");
  };
  const closeSideBar = () => {
    setIsMobileMenuOpen(false);
  };

  const { data: userInfo, isLoading: userGetLoading } = useUserInfoQuery();
  const isActive = (route) => pathname === route;

  return (
    <div>
      <div className="max-w-[98%] mx-auto">
        <nav className="flex items-center  justify-between">
          {/* Left side: Logo */}
          <Link href={"/"} className=" gap-1 items-center hidden md:flex">
            <img src={footerData?.logo} className="h-16 p-1" alt="" />
            {/* <img
              src={
                "/assets/images/logo/Yellow and Black Simple Market Creative Logo.png"
              }
              className="h-16 w-40"
              alt=""
            /> */}
          </Link>

          <div className="hidden lg:flex items-center space-x-3  xl:space-x-8  whitespace-nowrap">
            <div className="relative">
              <Button
                variant="outline "
                size={"lg"}
                className="flex items-center "
                onMouseEnter={() => {
                  setIsCategoryOpen(true);
                  setSubCategories([]);
                  setSubSubCategories([]);
                  setIsCategory("");
                  setIsMenu("");
                }}
                onMouseLeave={() => {
                  setIsCategoryOpen(false);
                  setIsCategory("");
                  setIsMenu("");
                }}
              >
                <FiMenu className="" />
                <span className="">All Categories</span>
              </Button>
              {isCategoryOpen && (
                <div
                  onMouseEnter={() => {
                    setIsCategoryOpen(true);
                    setSubCategories([]);
                    setSubSubCategories([]);
                    setIsCategory("");
                    setIsMenu("");
                  }}
                  onMouseLeave={() => {
                    setIsCategoryOpen(false);
                    setIsCategory("");
                    setIsMenu("");
                  }}
                  className="absolute top-10 left-0  z-10 col-span-2 hidden lg:block bg-white border shadow-md py-3"
                >
                  <div className="  flex">
                    <nav className="w-[250px] border-r overflow-hidden">
                      <ul className="space-y-[1px] list-none max-h-[300px] overflow-y-auto scrollbar-thin">
                        {menuData?.data?.map((menu) => (
                          <Link
                            onClick={() => {
                              setIsCategoryOpen(false);
                              setIsCategory("");
                              setIsMenu("");
                            }}
                            key={menu?.category?._id}
                            href={`/category/${menu?.category?.category_slug}`}
                          >
                            <li
                              onMouseOver={() => {
                                setSubCategories(menu?.sub_categories);
                                setSubSubCategories([]);
                                setIsMenu(menu?.category?.category_slug);
                                setIsCategory("");
                              }}
                            >
                              <details className="group">
                                <summary className="flex cursor-pointer items-center justify-between  px-4 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                                  <span
                                    className={`text-sm font-medium group-hover:text-primary ${
                                      isMenu ===
                                        menu?.category?.category_slug &&
                                      "text-primary"
                                    }`}
                                  >
                                    {menu?.category?.category_name}
                                  </span>

                                  {menu?.sub_categories?.length > 0 && (
                                    <span
                                      className={`shrink-0 transition duration-300 group-hover:-rotate-90 ${
                                        isMenu ===
                                          menu?.category?.category_slug &&
                                        "-rotate-90"
                                      }`}
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 group-hover:text-primary ${
                                          isMenu ===
                                            menu?.category?.category_slug &&
                                          "text-primary"
                                        }`}
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </span>
                                  )}
                                </summary>
                              </details>
                            </li>
                          </Link>
                        ))}
                      </ul>
                    </nav>
                    {subCategories?.length > 0 && (
                      <nav className="w-[250px] border-r overflow-hidden">
                        <ul className="space-y-[1px] list-none max-h-[300px] overflow-y-auto scrollbar-thin">
                          {subCategories?.map((subCategory) => (
                            <Link
                              onClick={() => {
                                setIsCategoryOpen(false);
                                setIsCategory("");
                                setIsMenu("");
                              }}
                              href={`/category/${isMenu}/${subCategory?.sub_category_slug}`}
                              key={subCategory?.sub_category_name}
                            >
                              <li
                                onMouseOver={() => {
                                  setSubSubCategories(
                                    subCategory?.child_categories,
                                  );
                                  setIsCategory(subCategory?.sub_category_slug);
                                }}
                              >
                                <details className="group">
                                  <summary className="flex cursor-pointer items-center justify-between   px-4 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                                    <span
                                      className={`text-sm font-medium group-hover:text-primary ${
                                        isCategory ===
                                          subCategory?.sub_category_slug &&
                                        "text-primary"
                                      }`}
                                    >
                                      {subCategory?.sub_category_name}
                                    </span>

                                    {subCategory?.child_categories?.length >
                                      0 && (
                                      <span
                                        className={`shrink-0 transition duration-300 group-hover:-rotate-90 ${
                                          isCategory ===
                                            subCategory?.sub_category
                                              ?.sub_category_slug &&
                                          "-rotate-90"
                                        }`}
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className={`h-5 w-5 group-hover:text-primary ${
                                            isCategory ===
                                              subCategory?.sub_category
                                                ?.sub_category_slug &&
                                            "text-primary"
                                          }`}
                                          viewBox="0 0 20 20"
                                          fill="currentColor"
                                        >
                                          <path
                                            fillRule="evenodd"
                                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                            clipRule="evenodd"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                  </summary>
                                </details>
                              </li>
                            </Link>
                          ))}
                        </ul>
                      </nav>
                    )}

                    {subSubCategories?.length > 0 && (
                      <nav className="w-[250px] overflow-hidden">
                        <ul className="space-y-[1px] list-none max-h-[300px] overflow-y-auto scrollbar-thin">
                          {subSubCategories?.map((subSubCategory) => (
                            <Link
                              onClick={() => {
                                setIsCategoryOpen(false);
                                setIsCategory("");
                                setIsMenu("");
                              }}
                              key={subSubCategory?._id}
                              href={`/category/${isMenu}/${isCategory}/${subSubCategory?.child_category_slug}`}
                            >
                              <li>
                                <details className="group">
                                  <summary className="flex cursor-pointer items-center justify-between  px-4 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                                    <span className="text-sm font-medium group-hover:text-primary">
                                      {subSubCategory?.child_category_name}
                                    </span>
                                  </summary>
                                </details>
                              </li>
                            </Link>
                          ))}
                        </ul>
                      </nav>
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* <Item isActive={isActive("/")} href="/" label="Home" /> */}

            <Item
              isActive={isActive("/shop")}
              href="/shop"
              label="All Products"
            />
            {exploreData?.length > 0 &&
              exploreData?.map((category) => (
                <Item
                  key={category?._id}
                  isActive={isActive(
                    `/category/${category?.category?.category_slug}`,
                  )}
                  href={`/category/${category?.category?.category_slug}`}
                  label={category?.category?.category_name}
                />
              ))}

            <Item
              isActive={isActive("/orders/order-tracking")}
              href="/orders/order-tracking"
              label="Track Order"
            />
          </div>

          {/* Right side: Language Switch, Sign-In, and Mobile Menu Button */}
          <div className="md:flex hidden items-center space-x-4">
            <div className="flex flex-col text-text-semiLight relative items-center justify-center">
              <div className="md:flex hidden ">
                <SearchBar />
              </div>
            </div>
            <div className="h-6 w-px bg-primary-200 md:inline-flex hidden"></div>

            <Link
              href="/wishlist"
              className="hidden md:flex flex-col items-center justify-center  text-text-semiLight relative"
            >
              <FiHeart className="text-text-default" size={20} />
              <span className="text-xs bg-primary-400 text-white rounded-full  w-4 h-4 flex items-center justify-center absolute -top-2 right-0">
                {wishlistLength !== null && <> {wishlistLength}</>}
              </span>
              <p className="text-xs    text-text-light hidden md:flex ">
                Wishlist
              </p>
            </Link>

            <div className="h-6 w-px bg-primary-200 hidden md:flex"></div>
            <Link
              href="/checkout"
              className=" text-text-semiLight  flex-col hidden md:flex items-center  justify-center relative"
            >
              <FiShoppingCart className="text-text-default" size={20} />
              <span className="text-xs bg-primary-400 text-white  rounded-full  w-4 h-4 flex items-center justify-center absolute -top-2  right-0">
                {productLength !== null && <> {productLength}</>}
              </span>
              <p className="text-xs whitespace-nowrap   text-text-light hidden md:flex">
                My Cart
              </p>
            </Link>
            {!userGetLoading && (
              <>
                <div className="h-6 w-px bg-primary-200 "></div>
                {userInfo?.data ? (
                  <div className="text-sm items-center space-x-2  hidden xl:inline-flex cursor-pointer">
                    {userInfo?.data ? (
                      <div>
                        <div
                          className="relative flex justify-center items-center md:justify-start gap-2 modal-container"
                          onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                        >
                          {userInfo?.data?.user_image ? (
                            <div className="">
                              <img
                                src={userInfo?.data?.user_image}
                                alt=""
                                className="w-[40px] h-[40px] object-cover "
                              />
                            </div>
                          ) : (
                            <div className="">
                              <FaUserCircle className="w-[40px] h-[40px]" />
                            </div>
                          )}

                          <div className="hidden xl:block">
                            <p className="text-text-default">Hello</p>
                            <p className="text-text-Lighter text-xs mt-px">
                              {userInfo?.data?.user_name}
                            </p>
                          </div>
                        </div>
                        {accountMenuOpen && (
                          <div className="bg-white w-max   absolute top-[70px] p-[10px] flex lg:flex-col transition-all duration-300 gap-[5px] z-40 right-10  shadow-xl border border-gray-100 modal-container">
                            <Link
                              href="/user-profile?tab=dashboard"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <MdOutlineHome className="font-bold" size={20} />
                              Dashboard
                            </Link>
                            <Link
                              href="/user-profile?tab=wishlist"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <TbJewishStar className="font-bold" size={20} />
                              WishLists
                            </Link>
                            <Link
                              href="/user-profile?tab=purchase-history"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <BiPurchaseTag className="font-bold" size={20} />
                              Purchase History
                            </Link>
                            {/* <Link
                              href="/user-profile?tab=offer-history"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <GiFlame className="font-bold" size={20} />
                              Offer History
                            </Link> */}
                            <Link
                              href="/user-profile?tab=review"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <SlUserFollowing
                                className="font-bold"
                                size={20}
                              />
                              Review
                            </Link>
                            <Link
                              href="/user-profile?tab=profile-setting"
                              className="flex items-center gap-[10px]   p-[8px] pr-[45px] py-[5px] text-[1rem] text-gray-600  font-medium hover:bg-primary hover:text-white"
                            >
                              <IoSettingsOutline
                                className="font-bold"
                                size={20}
                              />
                              Profile Setting
                            </Link>

                            <div className="mt-3 border-t border-gray-200 pt-[5px]">
                              <button
                                className="flex items-center justify-center gap-[7px]   p-[8px]  py-[3px] text-[1rem] text-red-500 bg-primary-100 font-medium w-full hover:bg-primary-200"
                                type="button"
                                onClick={handleLogOut}
                              >
                                {/* <TbLogout2 className="font-bold" size={25} /> */}
                                Logout
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        {" "}
                        <FiUser className="text-text-default" size={20} />
                        <div className="hidden xl:block">
                          <p className="text-text-default">Hello</p>
                          <p className="text-text-Lighter text-xs mt-px">
                            My Account
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <Link
                    className=" text-sm items-center space-x-2 hidden lg:inline-flex"
                    href={"/sign-in"}
                  >
                    <Button>SIGN IN</Button>
                  </Link>
                )}
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="block text-text-light lg:hidden text-2xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FiMenu />
            </button>
          </div>
          <div className="md:hidden w-full my-2">
            <SearchForm />
          </div>
          <button
            className="md:hidden text-text-light lg:hidden text-2xl"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <FiMenu />
          </button>
        </nav>
        {/* Sliding Mobile Menu */}
        <MobileNavbar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeDropdown={activeDropdown}
          toggleDropdown={toggleDropdown}
          activeSubDropdown={activeSubDropdown}
          toggleSubDropdown={toggleSubDropdown}
          closeAllSubDropdowns={closeAllSubDropdowns}
          activeChildDropdown={activeChildDropdown}
          toggleChildDropdown={toggleChildDropdown}
          closeAllChildDropdowns={closeAllChildDropdowns}
          isActive={isActive}
          closeAllDropdowns={closeAllDropdowns}
          menuRef={menuRef}
          closeSideBar={closeSideBar}
          menuData={menuData}
          footerData={footerData}
          userInfo={userInfo}
          handleLogOut={handleLogOut}
        />
      </div>
    </div>
  );
};

export default SecondNavbar;
