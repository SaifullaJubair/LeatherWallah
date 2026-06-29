import { createContext, useEffect, useState } from "react";
import { BASE_URL } from "../utils/baseURL";

export const SettingContext = createContext();

const SettingProvider = ({ children }) => {
  const [settingData, setSettingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const response = await fetch(`${BASE_URL}/setting`, {
        method: "GET",
        headers: {
          "content-type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const data = await response.json();

      if (data?.statusCode === 200 && data?.success === true) {
        setSettingData(data?.data[0]);
        setLoading(false);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      // console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const info = {
    settingData,
    loading,
  };

  return (
    <SettingContext.Provider value={info}>{children}</SettingContext.Provider>
  );
};

export default SettingProvider;
