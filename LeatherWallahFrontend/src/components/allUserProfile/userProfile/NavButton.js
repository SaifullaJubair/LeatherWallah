export const NavButton = ({
  icon: Icon,
  label,
  buttonName,
  activeNavButton,
  onClick,
}) => (
  <button
    className={`hover:bg-primary-300 hover:text-white flex items-center gap-3 font-medium py-2 px-4 w-full  ${
      activeNavButton === buttonName ? "bg-primary text-white" : ""
    }`}
    onClick={() => onClick(buttonName)}
  >
    <span className="flex items-center justify-center w-8 h-8">
      <Icon size={25} />
    </span>
    <span className="flex-1 text-left capitalize">{label}</span>
  </button>
);
