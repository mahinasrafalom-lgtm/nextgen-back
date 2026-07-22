import Consultation from '../models/Consultation.js';
import Doctor from '../models/Doctor.js';
import ChatMessage from '../models/ChatMessage.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { nextTicketNumber } from '../models/Counter.js';
import { uploadAttachments } from '../config/uploads.js';
import { CONSULTATION_PET_TYPES, CONSULTATION_STATUSES } from '../config/taxonomy.js';
import { emitMessage, emitConsultationUpdate, notifyAdmins } from '../socket.js';

const doctorFields = 'name specialization avatar isOnline';

async function queuePosition(consultation) {
  if (consultation.status !== 'pending') return 0;
  const ahead = await Consultation.countDocuments({ status: 'pending', createdAt: { $lt: consultation.createdAt } });
  return ahead + 1;
}

const canAccess = (consultation, user) =>
  user.role === 'admin' || String(consultation.user) === String(user._id);

// POST /api/consultations  (authenticated user applies for a free consultation)
export const createConsultation = asyncHandler(async (req, res) => {
  const { petType, petName, breed, petAge, gender, problem } = req.body;
  if (!CONSULTATION_PET_TYPES.includes(petType)) return res.status(400).json({ message: 'সঠিক প্রাণীর ধরন নির্বাচন করুন।' });
  if (String(problem || '').trim().length < 10) return res.status(400).json({ message: 'সমস্যাটি অন্তত ১০ অক্ষরে লিখুন।' });

  const attachments = await uploadAttachments(req.files || [], 'nexgen-vet/consultations');
  const ticketNumber = await nextTicketNumber();
  const consultation = await Consultation.create({
    ticketNumber,
    user: req.user._id,
    petType,
    petName: petName || '',
    breed: breed || '',
    petAge: petAge || '',
    gender: ['male', 'female'].includes(gender) ? gender : 'unknown',
    problem: String(problem).trim(),
    attachments,
    ownerName: req.user.name,
    phone: req.user.phone || ''
  });

  notifyAdmins('consultation:new', { id: consultation._id, ticketNumber, petType, ownerName: consultation.ownerName });
  res.status(201).json({ consultation, queuePosition: await queuePosition(consultation) });
});

// GET /api/consultations/mine
export const getMyConsultations = asyncHandler(async (req, res) => {
  const consultations = await Consultation.find({ user: req.user._id })
    .populate('assignedDoctor', doctorFields)
    .sort('-updatedAt');
  res.json(consultations);
});

// GET /api/consultations/:id  (owner or admin)
export const getConsultation = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id)
    .populate('assignedDoctor', doctorFields)
    .populate('user', 'name email phone');
  if (!consultation) return res.status(404).json({ message: 'আবেদনটি পাওয়া যায়নি।' });
  if (!canAccess(consultation, req.user)) return res.status(403).json({ message: 'এই আবেদনটি দেখার অনুমতি নেই।' });
  res.json({ consultation, queuePosition: await queuePosition(consultation) });
});

// GET /api/consultations  (admin queue)
export const getConsultations = asyncHandler(async (req, res) => {
  const filter = {};
  if (CONSULTATION_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  const consultations = await Consultation.find(filter)
    .populate('assignedDoctor', doctorFields)
    .populate('user', 'name email phone')
    .sort('-lastMessageAt -createdAt');
  res.json(consultations);
});

// PUT /api/consultations/:id/assign  (admin assigns a doctor and opens the chat)
export const assignDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.body.doctorId);
  if (!doctor) return res.status(404).json({ message: 'ডাক্তার পাওয়া যায়নি।' });

  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) return res.status(404).json({ message: 'আবেদনটি পাওয়া যায়নি।' });

  consultation.assignedDoctor = doctor._id;
  if (consultation.status === 'pending') consultation.status = 'active';
  consultation.lastMessageAt = new Date();
  consultation.unreadForUser += 1;
  await consultation.save();

  const message = await ChatMessage.create({
    consultation: consultation._id,
    sender: 'support',
    senderName: 'সাপোর্ট টিম',
    system: true,
    text: `আপনার আবেদনটি নিশ্চিত করা হয়েছে। ডা. ${doctor.name} (${doctor.specialization}) আপনার সাথে যুক্ত হয়েছেন।`
  });

  const populated = await consultation.populate('assignedDoctor', doctorFields);
  emitMessage(consultation._id, message);
  emitConsultationUpdate(consultation._id, { status: consultation.status, assignedDoctor: populated.assignedDoctor });
  notifyAdmins('consultation:changed', { id: consultation._id });
  res.json(populated);
});

// PUT /api/consultations/:id/status  (admin)
export const updateConsultationStatus = asyncHandler(async (req, res) => {
  if (!CONSULTATION_STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'সঠিক স্ট্যাটাস দিন।' });
  const consultation = await Consultation.findById(req.params.id);
  if (!consultation) return res.status(404).json({ message: 'আবেদনটি পাওয়া যায়নি।' });

  consultation.status = req.body.status;
  if (req.body.status === 'completed' || req.body.status === 'cancelled') consultation.closedAt = new Date();
  await consultation.save();

  emitConsultationUpdate(consultation._id, { status: consultation.status });
  notifyAdmins('consultation:changed', { id: consultation._id });
  res.json(await consultation.populate('assignedDoctor', doctorFields));
});
