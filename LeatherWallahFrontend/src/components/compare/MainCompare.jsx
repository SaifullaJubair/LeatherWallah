"use client";
import ComparisonTable from "./ComparisonTable";

const MainCompare = () => {
  const crumbs = [
    {
      label: "Compare",
      path: "/compare",
    },
  ];
  return (
    <div className="mt-2 mb-5 rounded">
      {/* <div className="bg-white py-2.5 px-4 my-2   shadow">
        <Breadcrumb crumbs={crumbs} />
      </div> */}
      <ComparisonTable />
    </div>
  );
};

export default MainCompare;
