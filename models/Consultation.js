import mongoose from 'mongoose';
import { CONSULTATION_PET_TYPES, CONSULTATION_STATUSES } from '../config/taxonomy.js';

const attachmentSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' }
  },
  { _id: false }
);

const consultationSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    petType: { type: String, required: true, enum: CONSULTATION_PET_TYPES },
    petName: { type: String, trim: true, default: '' },
    breed: { type: String, trim: true, default: '' },
    petAge: { type: String, trim: true, default: '' },
    gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
    problem: { type: String, required: true, minlength: 10 },
    attachments: { type: [attachmentSchema], default: [] },
    status: { type: String, enum: CONSULTATION_STATUSES, default: 'pending', index: true },
    assignedDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
    // Denormalised contact details captured at apply time (defaults from the account).
    ownerName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    lastMessageAt: { type: Date, default: null },
    unreadForAdmin: { type: Number, default: 0 },
    unreadForUser: { type: Number, default: 0 },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

consultationSchema.index({ status: 1, createdAt: 1 });

export default mongoose.model('Consultation', consultationSchema);
