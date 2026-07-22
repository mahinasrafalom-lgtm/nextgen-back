import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, default: 'পশু চিকিৎসক', trim: true },
    bio: { type: String, default: '', trim: true },
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);
