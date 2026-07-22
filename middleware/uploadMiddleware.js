import multer from 'multer';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const mediaTypes = [...imageTypes, 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'];

// Product images: small, image-only.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (imageTypes.includes(file.mimetype)) callback(null, true);
    else callback(new Error('শুধু JPG, PNG অথবা WEBP ছবি আপলোড করুন।'));
  }
});

// Consultation / chat media: images + short video, up to 20MB.
export const mediaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (mediaTypes.includes(file.mimetype)) callback(null, true);
    else callback(new Error('শুধু ছবি (JPG, PNG, WEBP) অথবা ভিডিও (MP4) আপলোড করুন।'));
  }
});
