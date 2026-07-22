import Doctor from '../models/Doctor.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const pickDoctorFields = ({ name, specialization, bio, avatar, isOnline, isActive }) => ({
  ...(name !== undefined && { name }),
  ...(specialization !== undefined && { specialization }),
  ...(bio !== undefined && { bio }),
  ...(avatar !== undefined && { avatar }),
  ...(isOnline !== undefined && { isOnline: Boolean(isOnline) }),
  ...(isActive !== undefined && { isActive: Boolean(isActive) })
});

// GET /api/doctors  (admin: full list for assignment/management)
export const getDoctors = asyncHandler(async (_req, res) => {
  res.json(await Doctor.find().sort('-createdAt'));
});

// GET /api/doctors/public  (storefront: active doctors for the "our vets" showcase)
export const getPublicDoctors = asyncHandler(async (_req, res) => {
  res.json(await Doctor.find({ isActive: true }).select('name specialization avatar isOnline').sort('-isOnline name'));
});

export const createDoctor = asyncHandler(async (req, res) => {
  if (!req.body.name?.trim()) return res.status(400).json({ message: 'ডাক্তারের নাম দিন।' });
  const doctor = await Doctor.create(pickDoctorFields(req.body));
  res.status(201).json(doctor);
});

export const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, pickDoctorFields(req.body), { new: true, runValidators: true });
  if (!doctor) return res.status(404).json({ message: 'ডাক্তার পাওয়া যায়নি।' });
  res.json(doctor);
});

export const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndDelete(req.params.id);
  if (!doctor) return res.status(404).json({ message: 'ডাক্তার পাওয়া যায়নি।' });
  res.json({ message: 'ডাক্তার মুছে ফেলা হয়েছে।' });
});
