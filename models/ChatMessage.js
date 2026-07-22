import mongoose from 'mongoose';
import { CHAT_SENDERS } from '../config/taxonomy.js';

const chatMessageSchema = new mongoose.Schema(
  {
    consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true, index: true },
    sender: { type: String, enum: CHAT_SENDERS, required: true },
    senderName: { type: String, default: '', trim: true },
    // For user messages this is the User id; for doctor messages the Doctor id.
    senderRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    text: { type: String, default: '', trim: true },
    attachment: {
      url: { type: String, default: '' },
      type: { type: String, enum: ['image', 'video', 'file', ''], default: '' }
    },
    system: { type: Boolean, default: false }
  },
  { timestamps: true }
);

chatMessageSchema.index({ consultation: 1, createdAt: 1 });

export default mongoose.model('ChatMessage', chatMessageSchema);
