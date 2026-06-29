"use client";
import { LoaderOverlay } from "../shared/loader/LoaderOverlay";
import { useEffect, useState } from "react";
import { BASE_URL } from "../utils/baseURL";

const ComparisonTable = ({ selectedProducts }) => {
  const [loading, setLoading] = useState(true);
  const [selectedProductsDetails, setSelectedProductsDetails] = useState([]);

  useEffect(() => {
    setLoading(true);
    // Function to fetch product details
    const fetchProductDetails = async (productId) => {
      const res = await fetch(`${BASE_URL}/compare/${productId}`);
      const data = await res.json();
      return data?.data;
    };

    // Function to fetch details of selected products
    const fetchSelectedProductsDetails = async () => {
      const productDetailsPromises = selectedProducts?.map((product) =>
        fetchProductDetails(product._id)
      );
      const productDetails = await Promise.all(productDetailsPromises);
      setSelectedProductsDetails(productDetails);
      setLoading(false);
    };

    fetchSelectedProductsDetails();
  }, [selectedProducts]);

  const [searchValue, setSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isHeadActive, setIsHeadActive] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 100) {
        // Adjust the value according to when you want the navbar to become active
        setIsHeadActive(true);
      } else {
        setIsHeadActive(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div className="overflow-x-auto min-h-screen lg:mb-10">
      <table className="w-full border-collapse border table-fixed">
        <thead>
          <tr className="bg-white">
            <th className="whitespace-nowrap p-4 border border-gray-200">
              <p className="text-xl font-medium">Product Comparison</p>
              <p className="text-sm font-normal">(2 Products selected)</p>
            </th>

            <th className="whitespace-nowrap p-3 border border-gray-200">
              <div className="flex flex-col items-center">
                <img
                  src="https://via.placeholder.com/150"
                  alt="Product 1"
                  className="w-24 h-24 object-cover mb-2"
                />
                <a
                  href="#"
                  className="hover:underline hover:text-blue-500 text-sm mb-2 font-medium text-center"
                >
                  Product Name 1
                </a>
                <p className="text-sm">
                  Regular price:
                  <span className="line-through text-gray-600">$100.00</span>
                </p>
                <p className="text-sm font-bold text-green-500">$80.00</p>
              </div>
            </th>

            <th className="whitespace-nowrap p-3 border border-gray-200">
              <div className="flex flex-col items-center">
                <img
                  src="https://via.placeholder.com/150"
                  alt="Product 2"
                  className="w-24 h-24 object-cover mb-2"
                />
                <a
                  href="#"
                  className="hover:underline hover:text-blue-500 text-sm mb-2 font-medium text-center"
                >
                  Product Name 2
                </a>
                <p className="text-sm">
                  Regular price:
                  <span className="line-through text-gray-600">$120.00</span>
                </p>
                <p className="text-sm font-bold text-green-500">$90.00</p>
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td className="p-3 border border-gray-200 font-medium bg-gray-50">
              Feature 1
            </td>
            <td className="p-3 border border-gray-200 text-center">✓</td>
            <td className="p-3 border border-gray-200 text-center">✓</td>
          </tr>

          <tr>
            <td className="p-3 border border-gray-200 font-medium bg-gray-50">
              Feature 2
            </td>
            <td className="p-3 border border-gray-200 text-center">✗</td>
            <td className="p-3 border border-gray-200 text-center">✓</td>
          </tr>

          <tr>
            <td className="p-3 border border-gray-200 font-medium bg-gray-50">
              Feature 3
            </td>
            <td className="p-3 border border-gray-200 text-center">128GB</td>
            <td className="p-3 border border-gray-200 text-center">256GB</td>
          </tr>

          <tr>
            <td className="p-3 border border-gray-200 font-medium bg-gray-50">
              Color
            </td>
            <td className="p-3 border border-gray-200 text-center">Black</td>
            <td className="p-3 border border-gray-200 text-center">Blue</td>
          </tr>

          <tr>
            <td className="p-3 border border-gray-200 bg-gray-50"></td>
            <td className="p-3 border border-gray-200 text-center">
              <button className="bg-primary-600 text-white py-2 px-4 hover:bg-primary">
                Add to Cart
              </button>
            </td>
            <td className="p-3 border border-gray-200 text-center">
              <button className="bg-primary-600 text-white py-2 px-4 hover:bg-primary">
                Buy Now
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;
