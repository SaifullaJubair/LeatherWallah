"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { FiMenu } from "react-icons/fi";
import MobileNavbar from "./MobileNavbar";
import Contain from "@/components/common/Contain";
import { Button } from "@/components/ui/button";
import { FaFire } from "react-icons/fa";
import { IoMdFlame } from "react-icons/io";

const Item = ({ isActive, href, label }) => (
  <Link
    href={href}
    className={` lg:text-sm xl:text-base font-medium tracking-wide hover:text-primary-500  hover:underline hover:underline-offset-8 ${
      isActive ? "text-primary" : "text-text-semiLight"
    }`}
  >
    {label}
  </Link>
);

const BottomNavbar = ({ menuData }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMenu, setIsMenu] = useState("");
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isCategory, setIsCategory] = useState("");
  const [subCategories, setSubCategories] = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const exploreData = menuData?.data?.filter(
    (item) => item?.category?.explore_category_show === true
  );
  useEffect(() => {
    const saveDropDown = localStorage.getItem("activeDropdown");
    if (saveDropDown) {
      setActiveDropdown(saveDropDown);
    }
  }, []);
  const toggleDropdown = (dropdown) => {
    const newActiveDropdown = activeDropdown === dropdown ? null : dropdown;
    setActiveDropdown(newActiveDropdown);

    localStorage.setItem("activeDropdown", newActiveDropdown);
  };
  const closeAllDropdowns = () => {
    setActiveDropdown(null);
    localStorage.removeItem("activeDropdown");
  };

  // console.log(menuData);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setDropdownOpen(false);
        // setSearchFieldOpen(false);
        // setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuRef]);
  const isActive = (route) => pathname === route;

  return (
    <div className=" px-4 py-2.5 border-b hidden lg:flex">
      <Contain>
        <nav className="flex items-center  justify-between">
          {/* Left side: Logo */}
          <div className="relative">
            <Button
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
              <FiMenu className="text-white" />
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
                                    isMenu === menu?.category?.category_slug &&
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
                                  subCategory?.child_categories
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
                                            ?.sub_category_slug && "-rotate-90"
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
          {/* Center Part (Hidden on small screens) */}
          <div className="hidden lg:flex items-center xl:space-x-8 lg:space-x-4 whitespace-nowrap">
            <Item isActive={isActive("/")} href="/" label="Home" />
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
                    `/category/${category?.category?.category_slug}`
                  )}
                  href={`/category/${category?.category?.category_slug}`}
                  label={category?.category?.category_name}
                />
              ))}
          </div>
          {/* Right side: Language Switch, Sign-In, and Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <Link
              href="/offer"
              className="bg-gradient-to-r from-red-600  to-yellow-400 text-white font-medium py-2 px-6 shadow-lg hover:from-yellow-400  hover:to-red-600 transition-all duration-100 ease-in flex items-center gap-x-2"
            >
              <IoMdFlame className="text-[25px]" /> Offer
            </Link>
            <Link href={"/campaign"}>
              <Button size={"lg"} variant="light">
                <FaFire className="text-[35px]" /> Campaign
              </Button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="block md:hidden text-2xl"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FiMenu />
            </button>
          </div>
        </nav>
        {/* Sliding Mobile Menu */}
        <MobileNavbar
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          activeDropdown={activeDropdown}
          toggleDropdown={toggleDropdown}
          isActive={isActive}
          closeAllDropdowns={closeAllDropdowns}
          menuRef={menuRef}
          featureData={exploreData}
          menuData={menuData}
        />
      </Contain>
    </div>
  );
};

export default BottomNavbar;
