import { RouterProvider } from "react-router-dom";
import { Slide, ToastContainer } from "react-toastify";
import route from "./routes/Route";
import "react-toastify/dist/ReactToastify.css";
import "react-tooltip/dist/react-tooltip.css";
import "react-quill-new/dist/quill.snow.css";
import "react-loading-skeleton/dist/skeleton.css";
import { useContext, useEffect } from "react";
import { SettingContext } from "./context/SettingProvider";
import { LoaderOverlay } from "./components/common/loader/LoderOverley";

const App = () => {
  const { settingData, loading: settingLoading } = useContext(SettingContext);

  // effect to update favicon
  useEffect(() => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = settingData?.favicon;
  }, [settingData?.favicon]);

  // Effect to update title
  useEffect(() => {
    if (settingData?.title) {
      document.title = settingData?.title; // Update the document title
    }
  }, [settingData?.title]);

  if (settingLoading) {
    return <LoaderOverlay />;
  }

  return (
    <div>
      <ToastContainer
        position="bottom-right"
        autoClose={1500}
        transition={Slide}
        closeOnClick
      />
      <RouterProvider router={route} />
    </div>
  );
};

export default App;
