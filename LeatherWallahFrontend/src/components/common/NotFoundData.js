// import { GoDatabase } from "react-icons/go";
// const NotFoundData = () => {
//   return (
//     <div className="h-[60vh] flex flex-col items-center justify-center">
//       <GoDatabase className="p-5 text-[80px] md:text-[100px] lg:text-[120px] xl:text-[150px] bg-primary text-textColor " />
//       <p className="mt-5 text-base lg:text-xl">Not Found Data!</p>
//     </div>
//   );
// };

// export default NotFoundData;

const NotFoundData = () => {
  return (
    <div className="mt-10 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.1)] p-6 sm:px-20 sm:py-14 flex items-center justify-center flex-col gap-[4px] ">
      <img
        src="/assets/images/empty/no-result.png"
        alt="empty/image"
        className="w-full sm:w-[200px]"
      />

      <h1 className="text-[1.4rem] mt-6 font-[500] text-black">
        Result Not Found
      </h1>

      <p className="text-[0.9rem] text-gray-500">
        Whoops ... this information is not available for a moment
      </p>
    </div>
  );
};

export default NotFoundData;
