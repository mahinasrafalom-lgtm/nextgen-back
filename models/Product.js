import mongoose from 'mongoose';
import { PET_TYPES, PRODUCT_CATEGORIES } from '../config/taxonomy.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    banglaName: { type: String, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    category: { type: String, required: true, enum: PET_TYPES },
    subCategory: { type: String, required: true, trim: true, enum: PRODUCT_CATEGORIES },
    brand: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    rating: {
      average: { type: Number, default: 5, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 }
    },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productSchema.index({ category: 1, subCategory: 1, createdAt: -1 });
export default mongoose.model('Product', productSchema);
