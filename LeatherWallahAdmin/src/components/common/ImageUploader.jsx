import axios from "axios";
import { BASE_URL } from "../../utils/baseURL";

// `profile` tells the backend what this image is FOR, so it can size and encode
// it appropriately. Optional — omitting it means "product", which is what every
// caller did before profiles existed, so no existing call site had to change.
//
// The one that genuinely matters is "favicon": it must stay a PNG, because
// Safari (macOS and iOS) will not render a WebP favicon, and the same file is
// served as the apple-touch-icon.
const ImageUploader = async (file, profile) => {
  const formData = new FormData();
  formData.append("image", file);
  if (profile) formData.append("profile", profile);

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
