import { RxCross1 } from "react-icons/rx";
import useGetOrderStatusSteadFast from "../../hooks/useGetOrderStatusSteadFast";
import MiniSpinner from "../../shared/MiniSpinner/MiniSpinner";
import { useEffect, useState } from "react";

const OrderStatus = ({ setViewOrderStatusValueModal, orderStatusValue }) => {
    const trackingCode = orderStatusValue?.tracking_code;

    // ✅ Call the hook always, but prevent fetching when trackingCode is undefined
    const { data: statusData, isLoading } = useGetOrderStatusSteadFast({ trackingCode });
    
    if (!trackingCode) {
      return <p>No tracking code available.</p>; // UI fallback
    }
    
    if (isLoading) {
      return <MiniSpinner />;
    }
    

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative overflow-hidden text-left bg-white rounded-lg shadow-xl w-[550px] p-6 max-h-[100vh] overflow-y-auto scrollbar-thin">
        <div className="">
          <h3
            className="text-[20px] font-bold text-gray-800 capitalize text-center"
            id="modal-title "
          >
            Order Status
          </h3>
          <button
            type="button"
            className="btn bg-white   p-1 absolute right-1 rounded-full top-1 hover:bg-bgBtnInactive hover:text-btnInactiveColor"
            onClick={() => setViewOrderStatusValueModal(false)}
          >
            {" "}
            <RxCross1 size={20}></RxCross1>
          </button>
        </div>
        <p className="font-bold mt-4">Delivery Status: {statusData?.delivery_status}</p>
      </div>
    </div>
  );
};

export default OrderStatus;
