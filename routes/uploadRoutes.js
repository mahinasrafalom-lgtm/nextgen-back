import { Router } from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();
router.post('/', protect, adminOnly, upload.single('image'), uploadImage);
export default router;
