export const LoaderOverlay = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="flex justify-center items-center space-x-2">
        <div className="w-10 h-10 border-4 rounded-full border-dashed  animate-spin border-white"></div>
        <span className="text-white text-xl">Loading...</span>
      </div>
    </div>
  );
};
