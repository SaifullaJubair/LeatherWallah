import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FaLock, FaTimes } from "react-icons/fa";
import MiniSpinner from "@/components/shared/loader/MiniSpinner";

const OfferSummary = ({
  totalDiscount,
  shopTotal,
  shippingCharge,
  shopSubtotals,
  shopGrandTotals,
  division,
  loading,
  userInfo,
}) => {
  return (
    <div className="">
      <div className="  mt-6  bg-white shadow-lg p-4 ">
        <div className="flex justify-between items-center flex-wrap">
          <p className="text-text-Lightest">Location</p>
          <p className="text-text-Lightest">
            {division == "Dhaka" ? "Inside Dhaka" : "Outside Dhaka"}
          </p>
        </div>
        <hr />
        <div className="flex justify-between  mt-4">
          <p className="text-text-Lightest">Subtotal</p>
          <p className="text-text-Lightest">৳ {shopSubtotals}</p>
        </div>
        <hr className="mt-1" />
        <div className="flex justify-between mt-4">
          <p className="text-text-Lightest">Total Discount</p>
          <p className="text-text-Lightest">৳ -{totalDiscount}</p>
        </div>
        <hr className="mt-1" />
        <div className="flex justify-between mt-4">
          <p className="text-text-Lightest">Total </p>
          <p className="text-text-Lightest">৳ {shopTotal}</p>
        </div>
        <hr className="mt-1" />
        <div className="flex justify-between  mt-4">
          <p className="text-text-Lightest">Shipping</p>
          <p className="text-text-Lightest">৳ {shippingCharge}</p>
        </div>
        <hr className="mt-1" />

        <div className="flex justify-between mt-4">
          <p className="text-text-Lightest">Grand Total</p>
          <p className="text-text-Lightest">৳ {shopGrandTotals}</p>
        </div>
        <hr className="mt-1" />
        <div className="flex my-2 gap-2 mt-4">
          {userInfo?.data ? (
            <>
              {loading == true ? (
                <div className="px-10 py-2 flex items-center w-full justify-center  bg-primary text-white rounded">
                  <MiniSpinner />
                </div>
              ) : (
                <Button className="w-full" variant="default" type="submit">
                  Placed Order
                </Button>
              )}
            </>
          ) : (
            <Link href="/login">
              <Button className="w-full" type="button" variant="default">
                Login for Placed Order
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfferSummary;
