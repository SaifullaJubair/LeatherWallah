import { images } from "@/components/utils/ImageImport";
import Link from "next/link";

const WishlistEmpty = () => {
  return (
    <div className="flex flex-col items-center justify-center  mt-4 text-center px-4">
      <img
        src={images.emptyWishlist}
        alt="Empty Wishlist"
        className="w-1/3 max-w-xs mb-6 "
      />
      <h1 className="text-2xl font-semibold text-gray-800">
        Your Wishlist is Empty
      </h1>
      <p className="text-gray-600 mt-2 mb-6">
        Looks like you haven’t added anything to your wishlist yet.
        <br />
        Start exploring and add your favorite products!
      </p>
      <Link
        href="/shop"
        className="px-6 py-3 bg-teal-500 text-white   shadow-md
        hover:bg-teal-600 transition duration-200"
      >
        Explore Products
      </Link>
    </div>
  );
};

export default WishlistEmpty;
