const CustomLoader = () => {
  return (
    <div className="min-h-[60vh]   flex justify-center items-center">
      <div className=" h-32">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 rounded-full border-primary border-t-transparent  animate-spin"></div>
          <div className="absolute inset-1 border-4 rounded-full border-secondary border-b-transparent  animate-spin"></div>
          <div className="absolute inset-2 border-4 rounded-full border-accent border-r-transparent  animate-spin"></div>
        </div>
      </div>
    </div>
  );
};

export default CustomLoader;
