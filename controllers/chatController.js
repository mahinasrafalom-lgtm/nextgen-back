import Consultation from '../models/Consultation.js';
import Doctor from '../models/Doctor.js';
import ChatMessage from '../models/ChatMessage.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { uploadBufferToCloudinary, classifyMedia, isCloudinaryConfigured } from '../config/uploads.js';
import { emitMessage, emitConsultationUpdate, notifyAdmins } from '../socket.js';

const canAccess = (consultation, user) =>
  user.role === 'admin' || String(consultation.user) === String(user._id);

// GET /api/consultations/:id/messages
export const getMessages = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id).select('user unreadForAdmin unreadForUser');
  if (!consultation) return res.status(404).json({ message: 'আবেদনটি পাওয়া যায়নি।' });
  if (!canAccess(consultation, req.user)) return res.status(403).json({ message: 'এই কথোপকথন দেখার অনুমতি নেই।' });

  // Reading the thread clears the unread counter for the viewing side.
  const clear = req.user.role === 'admin' ? { unreadForAdmin: 0 } : { unreadForUser: 0 };
  await Consultation.updateOne({ _id: consultation._id }, { $set: clear });

  const messages = await ChatMessage.find({ consultation: consultation._id }).sort('createdAt');
  res.json(messages);
});

// POST /api/consultations/:id/messages
export const postMessage = asyncHandler(async (req, res) => {
  const consultation = await Consultation.findById(req.params.id).populate('assignedDoctor', 'name specialization');
  if (!consultation) return res.status(404).json({ message: 'আবেদনটি পাওয়া যায়নি।' });
  if (!canAccess(consultation, req.user)) return res.status(403).json({ message: 'এই কথোপকথনে অংশ নেওয়ার অনুমতি নেই।' });
  if (consultation.status === 'completed' || consultation.status === 'cancelled') {
    return res.status(409).json({ message: 'এই পরামর্শটি বন্ধ হয়ে গেছে।' });
  }

  const text = String(req.body.text || '').trim();
  let attachment;
  if (req.file) {
    if (!isCloudinaryConfigured) return res.status(503).json({ message: 'ফাইল আপলোড এখনো কনফিগার করা হয়নি।' });
    const result = await uploadBufferToCloudinary(req.file, 'nexgen-vet/chat');
    attachment = { url: result.secure_url, type: classifyMedia(req.file.mimetype) };
  }
  if (!text && !attachment) return res.status(400).json({ message: 'একটি বার্তা লিখুন।' });

  // Resolve the sender identity.
  let sender = 'user';
  let senderName = req.user.name;
  let senderRef = req.user._id;
  if (req.user.role === 'admin') {
    if (req.body.as === 'doctor' && consultation.assignedDoctor) {
      sender = 'doctor';
      senderName = consultation.assignedDoctor.name;
      senderRef = consultation.assignedDoctor._id;
    } else {
      sender = 'support';
      senderName = 'সাপোর্ট টিম';
      senderRef = null;
    }
  }

  const message = await ChatMessage.create({
    consultation: consultation._id,
    sender,
    senderName,
    senderRef,
    text,
    attachment: attachment || undefined
  });

  consultation.lastMessageAt = new Date();
  if (sender === 'user') consultation.unreadForAdmin += 1;
  else consultation.unreadForUser += 1;
  // A staff reply on a still-pending ticket opens the live chat.
  const statusChanged = sender !== 'user' && consultation.status === 'pending';
  if (statusChanged) consultation.status = 'active';
  await consultation.save();

  emitMessage(consultation._id, message);
  if (statusChanged) emitConsultationUpdate(consultation._id, { status: 'active' });
  if (sender === 'user') notifyAdmins('consultation:activity', { id: consultation._id, ticketNumber: consultation.ticketNumber });
  res.status(201).json(message);
});
