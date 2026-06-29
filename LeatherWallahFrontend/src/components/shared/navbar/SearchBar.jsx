"use client";
import SearchForm from "@/components/frontend/searchForm/SearchForm";
import { titleFont } from "@/utils/font";
import { useEffect, useRef, useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";

const SearchBar = () => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Search Button */}

      <div className="flex flex-col items-center w-full justify-center group transition-colors duration-300">
        <button
          className="text-gray-800 group-hover:text-primary-500  "
          onClick={() => setIsSearchOpen(true)}
        >
          <FiSearch size={22} className="group-hover:text-primary-500" />
          <p className="text-xs group-hover:text-primary-500   text-text-light hidden md:flex ">
            Search
          </p>
        </button>
      </div>

      {/* Search Bar - Sliding Effect */}

      <div
        ref={searchRef}
        className={`fixed top-0 left-0 w-full bg-white shadow-md z-50 transform ${
          isSearchOpen
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        } transition-all duration-300`}
      >
        <div className="flex items-center justify-center mx-auto px-4 py-4 border-b">
          <h2
            className="text-lg lg:text-2xl mr-2 font-bold text-center sm:flex hidden text-gray-900"
            style={{
              fontFamily: titleFont.style.fontFamily,
            }}
          >
            Search <span className="text-primary-500 pr-1"> Products:</span>
          </h2>
          {/* Search Input */}
          {/* <input
            type="text"
            placeholder="Search for products..."
            className="w-full px-4 py-2 text-lg border rounded-md focus:outline-none"
          /> */}
          <SearchForm />

          {/* Close Button */}
          <button
            className="ml-2 text-gray-600 hover:text-red-600"
            onClick={() => setIsSearchOpen(false)}
          >
            <FiX size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
