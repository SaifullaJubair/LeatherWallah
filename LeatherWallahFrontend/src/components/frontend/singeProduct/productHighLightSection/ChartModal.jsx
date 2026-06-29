import Image from "next/image";
import React from "react";
import { PhotoProvider, PhotoView } from "react-photo-view";

const ChartModal = ({ showChart, setShowChart, size_chart }) => {
  return (
    <div>
      <PhotoProvider>
        {showChart && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white  shadow-lg p-6 max-w-3xl w-full mx-4 max-h-screen flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Size Chart
                </h3>
                <button
                  onClick={() => setShowChart(false)}
                  className="text-gray-500 hover:text-gray-700"
                  type="button"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Modal Body (Size Chart Image) */}
              <div className="flex justify-center">
                <PhotoView src={size_chart}>
                  <Image
                    src={size_chart}
                    alt="Size Chart"
                    width={500} // Ensures image scales properly
                    height={600}
                    className="w-full border max-h-[80vh] object-contain cursor-zoom-in"
                  />
                </PhotoView>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowChart(false)}
                  type="button"
                  className="px-4 py-2 bg-primary text-white  hover:bg-primary-dark transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </PhotoProvider>
    </div>
  );
};

export default ChartModal;
