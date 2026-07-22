import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

export const protect = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'অনুগ্রহ করে লগইন করুন।' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'ব্যবহারকারী পাওয়া যায়নি।' });
    next();
  } catch {
    res.status(401).json({ message: 'আপনার সেশনটি আর বৈধ নেই। আবার লগইন করুন।' });
  }
});
