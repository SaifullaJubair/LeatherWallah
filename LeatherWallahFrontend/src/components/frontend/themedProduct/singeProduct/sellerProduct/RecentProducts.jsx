"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import useGetSettingData from "@/components/lib/getSettingData";
import { lineThroughPrice, productPrice } from "@/utils/helper";
import { FiClock } from "react-icons/fi";

const RecentProductCard = ({ product }) => {
  const { data: settingsData } = useGetSettingData();
  const currencySymbol = settingsData?.data[0]?.currency_symbol;
  const price = productPrice(product);
  const ltPrice = lineThroughPrice(product);

  return (
    <Link
      href={`/products/${product?.product_slug}`}
      className="flex gap-2.5 group hover:bg-gray-50 rounded-lg p-1.5 transition-colors"
    >
      <div className="relative w-14 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
        <Image
          fill
          src={product?.main_image || "/assets/images/placeholder.jpg"}
          alt={product?.product_name}
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug mb-1 group-hover:text-primary transition-colors">
          {product?.product_name}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-gray-900">
            {currencySymbol}
            {price}
          </span>
          {ltPrice && (
            <span className="text-[10px] line-through text-gray-400">
              {currencySymbol}
              {ltPrice}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

const RecentProducts = ({ productId }) => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("recent-products");
    setProducts(stored ? JSON.parse(stored) : []);
  }, [productId]);

  const filtered = products?.filter((p) => p?._id !== productId);
  if (!filtered?.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <FiClock size={14} className="text-primary" />
        <h3 className="text-sm font-bold text-gray-700">Recently Viewed</h3>
      </div>
      <div className="space-y-1">
        {filtered.slice(0, 6).map((product, i) => (
          <RecentProductCard key={i} product={product} />
        ))}
      </div>
    </div>
  );
};

export default RecentProducts;
