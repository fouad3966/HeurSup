const express = require('express');
const router = express.Router();
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryUpdateImage,
} = require('../controllers/ImageController');
const upload = require('../middleware/multer');
const  verifyToken  = require('../middleware/auth');
// Upload Image
router.post('/upload-image',verifyToken, upload.single('image'), async (req, res) => {
  try {
    const file = req.file.path;
    const uploadedImage = await cloudinaryUploadImage(file);
    res.status(200).json({ message: 'Image uploaded', data: uploadedImage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove Image
router.delete('/remove-image',verifyToken, async (req, res) => {
  try {
    const { publicId } = req.body;
    if (!publicId) {
      return res.status(400).json({ message: 'Public ID is required' });
    }
    const result = await cloudinaryRemoveImage(publicId);
    res.status(200).json({ message: 'Image removed', result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update Image
router.put('/update-image', verifyToken,upload.single('image'), async (req, res) => {
  try {
    const { oldPublicId } = req.body;
    if (!oldPublicId || !req.file) {
      return res.status(400).json({ message: 'Old public ID and new image are required' });
    }
    const file = req.file.path;
    const updatedImage = await cloudinaryUpdateImage(oldPublicId, file);
    res.status(200).json({ message: 'Image updated', data: updatedImage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
