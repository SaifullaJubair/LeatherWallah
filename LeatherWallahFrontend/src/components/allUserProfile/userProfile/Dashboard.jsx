"use client";

import useGetSettingData from "@/components/lib/getSettingData";
import { BASE_URL } from "@/components/utils/baseURL";
import { useUserInfoQuery } from "@/redux/feature/auth/authApi";
import { lineThroughPrice, productPrice } from "@/utils/helper";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBoxArchive, FaHeart } from "react-icons/fa6";
import { GiFlameSpin } from "react-icons/gi";
import { IoCartOutline } from "react-icons/io5";
import { MdOutlineReviews } from "react-icons/md";
import { useSelector } from "react-redux";


const StatCard = ({ icon: Icon, iconBg, value, label }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900 leading-none">
        {value ?? <span className="text-gray-300">—</span>}
      </p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const [wishlistLength, setWishlistLength] = useState(0);
  const [productLength, setProductLength] = useState(0);
  const { products } = useSelector((state) => state.cart);
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data?.[0]?.currency_symbol;

  useEffect(() => {
    const update = () => {
      try {
        const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
        setWishlistLength(wishlist.length);
      } catch {}
    };
    update();
    window.addEventListener("storage", update);
    window.addEventListener("localStorageUpdated", update);
    return () => {
      window.removeEventListener("storage", update);
      window.removeEventListener("localStorageUpdated", update);
    };
  }, []);

  useEffect(() => {
    setProductLength(products?.length || 0);
  }, [products]);

  const { data: userInfo } = useUserInfoQuery();
  const user_id = userInfo?.data?._id;

  const { data: dashData, isLoading } = useQuery({
    queryKey: [`/api/v1/get_me/dashboard_data?user_id=${user_id}`],
    queryFn: async () => {
      const res = await fetch(`${BASE_URL}/get_me/dashboard_data?user_id=${user_id}`, {
        credentials: "include",
      });
      return res.json();
    },
    enabled: !!user_id,
  });

  const stats = [
    { icon: IoCartOutline,   iconBg: "bg-red-500",    value: productLength,              label: "Items in Cart" },
    { icon: FaHeart,         iconBg: "bg-blue-500",   value: wishlistLength,             label: "Saved to Wishlist" },
    { icon: FaBoxArchive,    iconBg: "bg-emerald-500",value: dashData?.data?.totalOrder, label: "Total Orders" },
    { icon: GiFlameSpin,     iconBg: "bg-orange-500", value: dashData?.data?.totalOfferOrder, label: "Offer Orders" },
    { icon: MdOutlineReviews,iconBg: "bg-yellow-500", value: dashData?.data?.totalReview,label: "Reviews Given" },
  ];

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Trending products — compact list */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-semibold text-gray-700">Trending Products</p>
          <Link href="/shop?sort=popular" className="text-xs text-primary hover:underline">View All</Link>
        </div>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : dashData?.data?.trendingProduct?.data?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {dashData.data.trendingProduct.data.slice(0, 6).map((product, index) => (
              <Link
                key={index}
                href={`/products/${product?.product_slug}`}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image
                    src={product?.main_image || "/assets/images/placeholder.jpg"}
                    alt={product?.product_name || "Product"}
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="flex-1 text-xs text-gray-700 line-clamp-1 group-hover:text-primary transition-colors">
                  {product?.product_name}
                </p>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-gray-900">
                    {currencySymbol}{productPrice(product)}
                  </span>
                  {lineThroughPrice(product) && (
                    <p className="text-[10px] line-through text-gray-400">
                      {currencySymbol}{lineThroughPrice(product)}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No trending products yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
