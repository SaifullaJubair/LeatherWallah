import axios from "axios";
import { BASE_URL } from "../../utils/baseURL";

const ImageUploader = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await axios.post(
      // Endpoint URL of your server where the file will be uploaded to DigitalOcean Spaces
      `${BASE_URL}/image_upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    const imageUrl = response?.data?.data?.Location;
    const imageKey = response?.data?.data?.Key;
    return [imageUrl, imageKey, response?.data?.success];
  } catch (error) {
    console.error("Error uploading image:", error);
  }
};

export default ImageUploader;
