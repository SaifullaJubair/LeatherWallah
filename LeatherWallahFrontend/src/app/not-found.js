import Link from "next/link";
import React from "react";

const NotFound = () => {
  return (
    <div className="boxShadow px-10 w-full flex items-center flex-col justify-center py-20  min-h-screen bg-[#00543A]">
      <img
        src="https://i.ibb.co/LvLq6d3/Group-29.png"
        alt="illustration"
        className="w-full lg:w-[400px]"
      />
      <p className="text-[#fff] text-[1.2rem] w-full lg:w-[55%] text-center">
        The page cannot be found. The requested URL was not found on this
        server.
      </p>

      <Link href={"/"}>
        <button className="relative mt-2 inline-flex items-center justify-center px-6 py-2.5 overflow-hidden font-medium text-primary transition duration-300 ease-out border-2 border-primary  shadow-md group">
          <span className="absolute inset-0 flex items-center justify-center w-full h-full text-white duration-300 -translate-x-full bg-primary group-hover:translate-x-0 ease">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              ></path>
            </svg>
          </span>
          <span className="absolute flex items-center justify-center w-full h-full text-primary transition-all duration-300 transform group-hover:translate-x-full ease">
            Home
          </span>
          <span className="relative invisible">Home</span>
        </button>
      </Link>
    </div>
  );
};

export default NotFound;
