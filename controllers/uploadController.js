import { asyncHandler } from '../middleware/asyncHandler.js';
import { uploadBufferToCloudinary, classifyMedia, isCloudinaryConfigured } from '../config/uploads.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'একটি ছবি নির্বাচন করুন।' });
  if (!isCloudinaryConfigured) return res.status(503).json({ message: 'Cloudinary এখনো কনফিগার করা হয়নি।' });
  const result = await uploadBufferToCloudinary(req.file, 'nexgen-vet/products');
  res.status(201).json({ url: result.secure_url, publicId: result.public_id, type: classifyMedia(req.file.mimetype) });
});
