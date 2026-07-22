import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, qty: { type: Number, required: true, min: 1 }, price: { type: Number, required: true, min: 0 } }],
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash_on_delivery', 'bkash', 'sslcommerz'], default: 'cash_on_delivery' },
    deliveryAddress: { name: String, phone: String, area: String, city: String, district: String, details: String }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
