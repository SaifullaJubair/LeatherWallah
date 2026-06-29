export const LoaderOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="flex justify-center items-center space-x-2">
        <div className="w-10 h-10 border-4 border-dashed rounded-full animate-spin border-white"></div>
        <span className="text-white font-semibold text-2xl">Loading...</span>
      </div>
    </div>
  );
};
