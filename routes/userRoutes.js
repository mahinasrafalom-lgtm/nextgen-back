import { Router } from 'express';
import { getUsers, login, profile, register } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { message: 'অনেক বেশি চেষ্টা করা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।' } });
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/profile', protect, profile);
router.get('/', protect, adminOnly, getUsers);
export default router;
