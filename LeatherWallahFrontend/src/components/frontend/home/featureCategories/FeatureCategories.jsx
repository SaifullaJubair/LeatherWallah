import Contain from "@/components/common/Contain";
import { getMenu } from "@/components/lib/getMenu";
import Link from "next/link";

const FeatureCategories = async () => {
  const data = await getMenu();
  const featureData = data?.data?.filter(
    (item) => item?.category?.feature_category_show === true
  );
  //   console.log(featureData);

  return (
    <div className="my-12">
      <Contain>
        <h2 className="my-4">Feature Category</h2>
        <div className="">
          <div className="sm:grid grid-cols-2 lg:grid-cols-3 hidden ">
            {featureData?.map((category, index) => (
              <div key={index} className="border ">
                <div className="sm:grid sm:grid-cols-5 gap-2 ">
                  <div className="sm:col-span-2">
                    <img
                      src={category?.category?.category_logo}
                      alt=""
                      className=" p-2 h-40 w-40 "
                    />
                  </div>

                  <div className="sm:col-span-3 px-3 pb-3 pt-6 overflow-y-auto scrollbar-thin h-44">
                    <h5 className="mb-1">
                      <Link
                        href={`/category/${category?.category?.category_slug}`}
                        className="hover:text-primary"
                      >
                        {category?.category?.category_name}
                      </Link>
                    </h5>
                    <div className="hidden sm:block">
                      {category?.sub_categories?.map((item) => (
                        <div key={item?._id} className="space-y-1.5">
                          <Link
                            href={`/category/${category?.category?.category_slug}/${item?.sub_category_slug}`}
                            className="hover:text-primary"
                          >
                            {item?.sub_category_name}
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:hidden">
            {featureData?.map((category, index) => (
              <Link
                key={index}
                href={`/category/${category?.category?.category_slug}`}
                className="border hover:text-primary flex items-center justify-center flex-col"
              >
                <img
                  src={category?.category?.category_logo}
                  alt=""
                  className=" p-2 h-24 w-24"
                />

                <p className="mb-1 text-center">
                  {category?.category?.category_name}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </Contain>
    </div>
  );
};

export default FeatureCategories;
