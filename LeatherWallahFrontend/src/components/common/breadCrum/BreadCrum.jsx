"use client";
import Link from "next/link";
import { IoHome } from "react-icons/io5";

const Breadcrumb = ({ crumbs }) => {
  return (
    <nav className="text-gray-500">
      <ul className="flex items-center h-full space-x-1 list-none flex-wrap">
        <li className="lg:-mt-[5px]">
          <Link href="/" className="text-gray-600">
            <IoHome className="text-base lg:text-xl" />
          </Link>
        </li>
        <span> / </span>
        {/* <span> &gt; </span> */}
        {crumbs.map((crumb, index) => (
          <li key={index} className="flex gap-1 items-center h-full">
            {index < crumbs?.length - 1 ? (
              <Link
                href={`/category${crumb?.path}`}
                className="hover:text-gray-700 text-xs md:text-sm"
              >
                {crumb?.label}
              </Link>
            ) : (
              <span className="text-gray-700 text-xs md:text-sm">
                {crumb?.label}
              </span>
            )}
            {index < crumbs?.length - 1 && <span> &gt; </span>}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Breadcrumb;
