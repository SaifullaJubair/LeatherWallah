import { FiX } from "react-icons/fi";
import {
  ChildDropdownMenu,
  ChildMenuItem,
  DropdownMenu,
  MenuItem,
  SubDropdownMenu,
  SubMenuItem,
} from "./NavManu";
import { images } from "@/components/utils/ImageImport";
import Link from "next/link";
import { Sub } from "@radix-ui/react-navigation-menu";
import { TbLogout2 } from "react-icons/tb";

const MobileNavbar = ({
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeDropdown,
  toggleDropdown,
  isActive,
  closeAllDropdowns,
  closeSideBar,
  menuRef,
  featureData,
  menuData,
  activeSubDropdown,
  toggleSubDropdown,
  closeAllSubDropdowns,
  activeChildDropdown,
  toggleChildDropdown,
  closeAllChildDropdowns,
  footerData,
  userInfo,
  handleLogOut,
}) => {
  return (
    <div
      className={`fixed  inset-0 z-20 bg-black bg-opacity-50 lg:hidden transition-transform ease-in-out duration-300 ${
        isMobileMenuOpen ? " w-full  translate-x-0" : " translate-x-full"
      }`}
    >
      <div
        ref={menuRef}
        className="fixed right-0 top-0 w-full max-w-[280px] h-full overflow-y-auto scrollbar-thin bg-white shadow-lg"
      >
        {/* Close button */}
        <button
          className="text-2xl py-4 absolute  right-4"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <FiX />
        </button>

        {/*---------- Mobile Menu Content -------------*/}
        <div className="flex flex-col items-start px-2 my-3 space-y-1.5 ">
          {/* Logo */}
          <div className=" w-full">
            <Link href={"/"}>
              <img src={footerData?.logo} className="h-16  mb-1.5" alt="" />
            </Link>
            <hr className="w-full border-gray-300 " />
          </div>

          <DropdownMenu
            label="All Category"
            isOpen={activeDropdown === "all-category"}
            onClick={() => toggleDropdown("all-category")}
          >
            {menuData?.data?.map((category, index) => (
              <SubDropdownMenu
                key={index}
                label={category?.category?.category_name}
                isOpen={activeSubDropdown === category?.category?.category_slug}
                onClick={() =>
                  toggleSubDropdown(category?.category?.category_slug)
                }
                href={`/category/${category?.category?.category_slug}`}
                closeSideBar={closeSideBar}
              >
                {category?.sub_categories?.map((subCategory, i) => (
                  <ChildDropdownMenu
                    key={i}
                    label={subCategory?.sub_category_name}
                    isOpen={
                      activeChildDropdown === subCategory?.sub_category_slug
                    }
                    onClick={() =>
                      toggleChildDropdown(subCategory?.sub_category_slug)
                    }
                    href={`/category/${category?.category?.category_slug}/${subCategory?.sub_category_slug}`}
                    closeSideBar={closeSideBar}
                  >
                    {subCategory?.child_categories?.map((childCategory, i) => (
                      <ChildMenuItem
                        key={i}
                        href={`/category/${category?.category?.category_slug}/${subCategory?.sub_category_slug}/${childCategory?.child_category_slug}`}
                        label={childCategory?.child_category_name}
                        isActive={isActive(
                          `/${childCategory?.child_category_slug}`
                        )}
                        closeSideBar={closeSideBar}
                      />
                    ))}
                  </ChildDropdownMenu>
                ))}
              </SubDropdownMenu>
            ))}
          </DropdownMenu>

          {/* Other Links */}
          <MenuItem
            href="/"
            label="Home"
            isActive={isActive("/")}
            closeSideBar={closeSideBar}
          />

          <MenuItem
            href="/shop"
            label="All Products"
            isActive={isActive("/shop")}
            closeSideBar={closeSideBar}
          />

          <MenuItem
            href="/checkout"
            label="Checkout"
            isActive={isActive("/checkout")}
            closeSideBar={closeSideBar}
          />
          <MenuItem
            href="/wishlist"
            label="Wish List"
            isActive={isActive("/wish-list")}
            closeSideBar={closeSideBar}
          />
          {/* <MenuItem
            href="/support"
            label="Support"
            isActive={isActive("/support")}
            closeSideBar={closeSideBar}
          /> */}

          <MenuItem
            href="/user-profile"
            label="My Profile"
            isActive={isActive("/user-profile")}
            closeSideBar={closeSideBar}
          />

          {/* Language and Sign-In */}
          {/* <button className="p-2 text-text-default">Language</button> */}
          <hr className="w-full border-gray-300 " />
          {userInfo?.data ? (
            <div className="  mt-3">
              <button
                className="flex items-center justify-center gap-[7px]   p-3 py-1.5 text-[1rem] text-white hover:text-red-400 bg-primary-400 font-medium w-full hover:bg-primary-200"
                type="button"
                onClick={handleLogOut}
              >
                <TbLogout2 className="font-bold" size={25} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              href={"/sign-in"}
              className="px-4 py-2 bg-primary text-white  "
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavbar;
