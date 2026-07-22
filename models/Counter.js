import mongoose from 'mongoose';

// Atomic sequence generator used for human-readable ticket numbers.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

export async function nextSequence(key) {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export async function nextTicketNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`consultation-${year}`);
  return `NGV-${year}-${String(seq).padStart(5, '0')}`;
}

export default Counter;
