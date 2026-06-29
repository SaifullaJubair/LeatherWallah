import Link from "next/link";
import { FiChevronDown } from "react-icons/fi";

export const MenuItem = ({ isActive, href, label, closeSideBar }) => (
  <Link
    href={href}
    className={` px-4  py-1 transition-colors ease-in-out font-medium text-lg w-full   duration-300  ${
      isActive
        ? "bg-primary-400 text-white    "
        : "text-text-default  hover:bg-primary-400 hover:text-white"
    }`}
    onClick={closeSideBar}
  >
    {label}
  </Link>
);

export const DropdownMenu = ({ label, isOpen, onClick, children }) => (
  <div className="w-full">
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full py-1 space-x-1 px-2 text-text-default transition-colors ease-in-out duration-300 ${
        isOpen
          ? "bg-primary-300 text-white  border-secondary-700 w-full border-l-2"
          : "text-text-default hover:bg-primary-300 hover:text-white"
      }`}
    >
      <span>{label}</span>
      <FiChevronDown
        size={18}
        className={`transition-transform duration-300 ease-in-out ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    <div
      className={`text-sm bg-[#F4F4F4] border border-secondary-100  transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "max-h-screen" : "max-h-0"
      }`}
    >
      <ul className="space-y-1 list-none divide-y">{children}</ul>
    </div>
  </div>
);
export const SubDropdownMenu = ({
  label,
  isOpen,
  onClick,
  children,
  href,
  closeSideBar,
}) => (
  <div className="w-full">
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full py-1 space-x-1 px-2 text-text-default transition-colors ease-in-out duration-300 ${
        isOpen
          ? "bg-primary-300 text-white  border-secondary-700 w-full border-l-2"
          : "text-text-default hover:bg-primary-300 hover:text-white"
      }`}
    >
      <Link href={href} onClick={closeSideBar}>
        {label}
      </Link>
      <FiChevronDown
        size={18}
        className={`transition-transform duration-300 ease-in-out ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    <div
      className={`text-sm bg-[#F4F4F4] border border-secondary-100  transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "max-h-screen" : "max-h-0"
      }`}
    >
      <ul className="space-y-1 list-none divide-y">{children}</ul>
    </div>
  </div>
);
export const ChildDropdownMenu = ({
  label,
  isOpen,
  onClick,
  children,
  href,
  closeSideBar,
}) => (
  <div className="w-full">
    <button
      onClick={onClick}
      className={`flex items-center justify-between w-full py-1 space-x-1 px-2 text-text-default transition-colors ease-in-out duration-300 ${
        isOpen
          ? "bg-primary-300 text-white  border-secondary-700 w-full border-l-2"
          : "text-text-default hover:bg-primary-300 hover:text-white"
      }`}
    >
      <Link href={href} onClick={closeSideBar}>
        {label}
      </Link>
      <FiChevronDown
        size={18}
        className={`transition-transform duration-300 ease-in-out ${
          isOpen ? "rotate-180" : ""
        }`}
      />
    </button>

    <div
      className={`text-sm bg-[#F4F4F4] border border-secondary-100  transition-all duration-300 ease-in-out overflow-hidden ${
        isOpen ? "max-h-screen" : "max-h-0"
      }`}
    >
      <ul className="space-y-1 list-none divide-y">{children}</ul>
    </div>
  </div>
);
export const SubMenuItem = ({ href, label, isActive, closeSideBar }) => (
  <li>
    <Link
      href={href}
      className={`flex px-4  py-2 transition-colors ease-in-out duration-300 hover:border-secondary-100`}
      onClick={closeSideBar}
    >
      <span> {label}</span>
    </Link>
  </li>
);
export const ChildMenuItem = ({ href, label, isActive, closeSideBar }) => (
  <li>
    <Link
      href={href}
      className={`flex px-4  py-2 transition-colors ease-in-out duration-300 hover:border-secondary-100 ${
        isActive ? "bg-primary-100" : ""
      }`}
      onClick={closeSideBar}
    >
      <span> {label}</span>
    </Link>
  </li>
);
