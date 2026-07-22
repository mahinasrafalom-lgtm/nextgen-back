import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { PET_TYPES, PRODUCT_CATEGORIES } from '../config/taxonomy.js';

const sortMap = { newest: '-createdAt', price_asc: 'price', price_desc: '-price', rating: '-rating.average' };

// Whitelist the fields an admin may set — prevents mass-assignment of things
// like rating or arbitrary keys, and derives the discount from the prices.
function buildProductPayload(body) {
  const price = Number(body.price);
  const originalPrice = body.originalPrice ? Number(body.originalPrice) : undefined;
  const payload = {
    name: body.name?.trim(),
    banglaName: body.banglaName?.trim() || '',
    description: body.description?.trim(),
    price,
    originalPrice,
    category: body.category,
    subCategory: body.subCategory,
    brand: body.brand?.trim(),
    images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
    stock: Number(body.stock) || 0,
    isFeatured: Boolean(body.isFeatured)
  };
  payload.discount = originalPrice && originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0;
  return payload;
}

function validateProduct(payload, { partial = false } = {}) {
  if (!partial || payload.category !== undefined) {
    if (!PET_TYPES.includes(payload.category)) return 'সঠিক প্রাণীর ধরন নির্বাচন করুন।';
  }
  if (!partial || payload.subCategory !== undefined) {
    if (!PRODUCT_CATEGORIES.includes(payload.subCategory)) return 'সঠিক পণ্য ক্যাটাগরি নির্বাচন করুন।';
  }
  if (!partial && !payload.name) return 'পণ্যের নাম দিন।';
  if (!partial && !Number.isFinite(payload.price)) return 'সঠিক মূল্য দিন।';
  return null;
}

export const getProducts = asyncHandler(async (req, res) => {
  const { category, subCategory, brand, featured, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12, search } = req.query;
  const query = {};
  if (category) query.category = category;
  if (subCategory) query.subCategory = subCategory;
  if (brand) query.brand = { $in: brand.split(',') };
  if (featured === 'true') query.isFeatured = true;
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { banglaName: { $regex: search, $options: 'i' } }];
  if (minPrice || maxPrice) query.price = { ...(minPrice ? { $gte: Number(minPrice) } : {}), ...(maxPrice ? { $lte: Number(maxPrice) } : {}) };

  const pageNumber = Math.max(Number(page), 1);
  const pageSize = Math.min(Math.max(Number(limit), 1), 50);
  const [products, total] = await Promise.all([
    Product.find(query).sort(sortMap[sort] || sortMap.newest).skip((pageNumber - 1) * pageSize).limit(pageSize),
    Product.countDocuments(query)
  ]);
  res.json({ products, page: pageNumber, pages: Math.ceil(total / pageSize), total });
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: 'পণ্যটি পাওয়া যায়নি।' });
  res.json(product);
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = buildProductPayload(req.body);
  const error = validateProduct(payload);
  if (error) return res.status(400).json({ message: error });
  const product = await Product.create(payload);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = buildProductPayload(req.body);
  const error = validateProduct(payload);
  if (error) return res.status(400).json({ message: error });
  const product = await Product.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'পণ্যটি পাওয়া যায়নি।' });
  res.json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'পণ্যটি পাওয়া যায়নি।' });
  res.json({ message: 'পণ্যটি মুছে ফেলা হয়েছে।' });
});
