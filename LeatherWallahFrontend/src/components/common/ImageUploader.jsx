// import axios from "axios";
// import { BASE_URL } from "../utils/baseURL";

// const ImageUploader = async (file) => {
//   const formData = new FormData();
//   formData.append("image", file);

//   try {
//     const response = await axios.post(
//       // Endpoint URL of your server where the file will be uploaded to DigitalOcean Spaces
//       `${BASE_URL}/image_upload`,
//       formData,
//       {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       }
//     );
//     const imageUrl = response?.data?.data?.Location;
//     const imageKey = response?.data?.data?.Key;
//     return [imageUrl, imageKey, response?.data?.success];
//   } catch (error) {
//     console.error("Error uploading image:", error);
//   }
// };

// export default ImageUploader;

import { BASE_URL } from "../utils/baseURL";

const ImageUploader = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await fetch(`${BASE_URL}/image_upload`, {
      method: "POST",
      body: formData,
      headers: {
        // No need to set Content-Type for FormData; the browser automatically sets it with the correct boundary
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data?.data?.Location;
    const imageKey = data?.data?.Key;
    return [imageUrl, imageKey, data?.success];
  } catch (error) {
    console.error("Error uploading image:", error);
    return null;
  }
};

export default ImageUploader;
