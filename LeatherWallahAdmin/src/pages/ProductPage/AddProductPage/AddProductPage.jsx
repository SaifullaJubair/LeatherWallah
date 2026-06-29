import { PiHouseBold } from "react-icons/pi";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import AddProduct from "../../../components/ProductNew/AddProduct";

const AddProductPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  });
  return (
    <>
      
      <div className="flex items-center justify-between shadow-md bg-white p-4 rounded-xl">
        <h3 className="text-[20px] font-semibold">Add Product</h3>
        <div className="flex items-center gap-2">
          <Link to="/admin">
            <p>
              <PiHouseBold size={25} color="#000F24" />
            </p>
          </Link>
          <p className="font-semibold text-xl">/</p>
          <Link to="/product/product-create">
            <p className="font-semibold">Add Product</p>
          </Link>
        </div>
      </div>

      {/* Step start */}

      <AddProduct />

      {/* Step end */}
    </>
  );
};

export default AddProductPage;
