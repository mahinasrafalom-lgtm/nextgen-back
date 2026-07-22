import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, address: user.address });
const createToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  if (!name || !email || !password || !phone) return res.status(400).json({ message: 'সব আবশ্যক তথ্য দিন।' });
  if (password.length < 6) return res.status(400).json({ message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' });
  if (await User.findOne({ email: email.toLowerCase() })) return res.status(409).json({ message: 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে।' });
  const user = await User.create({ name, email, password, phone, address });
  res.status(201).json({ user: publicUser(user), token: createToken(user._id) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
  res.json({ user: publicUser(user), token: createToken(user._id) });
});

export const profile = asyncHandler(async (req, res) => res.json({ user: publicUser(req.user) }));
export const getUsers = asyncHandler(async (_req, res) => res.json(await User.find().select('-password').sort('-createdAt')));
