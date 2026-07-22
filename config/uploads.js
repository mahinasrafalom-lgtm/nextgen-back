import { cloudinary, isCloudinaryConfigured } from './cloudinary.js';

// Streams an in-memory multer file to Cloudinary. resource_type 'auto' lets a
// single helper handle both images and video (used by consultation attachments).
export function uploadBufferToCloudinary(file, folder = 'nexgen-vet') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(file.buffer);
  });
}

export function classifyMedia(mimetype = '') {
  return mimetype.startsWith('video/') ? 'video' : 'image';
}

// Uploads any provided files and returns [{ url, type }]; returns [] when
// Cloudinary is not configured so the core flow keeps working in development.
export async function uploadAttachments(files = [], folder = 'nexgen-vet/consultations') {
  if (!files.length || !isCloudinaryConfigured) return [];
  const uploaded = await Promise.all(
    files.map(async (file) => {
      const result = await uploadBufferToCloudinary(file, folder);
      return { url: result.secure_url, type: classifyMedia(file.mimetype) };
    })
  );
  return uploaded;
}

export { isCloudinaryConfigured };
