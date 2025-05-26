  const cloudinary=require('cloudinary')
  // Cloudinary Upload Image
  const cloudinaryUploadImage = async (fileToUpload) => {
    try {
      const data = await cloudinary.uploader.upload(fileToUpload, {
        resource_type: "auto",
      });
      return data;
    } catch (error) {
      console.log(error);
      throw new Error("Internal Server Error (cloudinary)");
    }
  };


    // Cloudinary Remove Image
const cloudinaryRemoveImage = async (imagePublicId) => {
    try {
      const result = await cloudinary.uploader.destroy(imagePublicId);
      return result;
    } catch (error) {
      console.log(error);
      throw new Error("Internal Server Error (cloudinary)");
    }
  };


  const cloudinaryUpdateImage = async (oldPublicId, newFile) => {
    try {
      // Remove the old image
      await cloudinaryRemoveImage(oldPublicId);
  
      // Upload the new image
      const uploaded = await cloudinaryUploadImage(newFile);
  
      return uploaded;
    } catch (error) {
      console.log(error);
      throw new Error('Internal Server Error (cloudinary update)');
    }
  };
  
  module.exports = {
    cloudinaryUploadImage,
    cloudinaryRemoveImage,
    cloudinaryUpdateImage, 
  };