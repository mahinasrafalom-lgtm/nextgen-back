import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  const { items, paymentMethod, deliveryAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'কার্টে কোনো পণ্য নেই।' });
  if (!deliveryAddress?.name || !deliveryAddress?.phone || !deliveryAddress?.district) return res.status(400).json({ message: 'ডেলিভারির তথ্য সম্পূর্ণ দিন।' });

  const productIds = items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });
  if (products.length !== productIds.length) return res.status(400).json({ message: 'এক বা একাধিক পণ্য আর পাওয়া যাচ্ছে না।' });
  const map = new Map(products.map((product) => [String(product._id), product]));
  const normalizedItems = items.map((item) => {
    const product = map.get(String(item.product));
    if (!Number.isInteger(item.qty) || item.qty < 1) throw new Error(`${product.name} এর পরিমাণ সঠিক নয়।`);
    // Price is always re-derived from the database, never trusted from the client.
    return { product: product._id, qty: item.qty, price: product.price };
  });

  // Reserve stock atomically with a guard so concurrent orders cannot oversell.
  // If any line can't be met, roll back the ones already reserved.
  const reserved = [];
  for (const item of normalizedItems) {
    const result = await Product.updateOne({ _id: item.product, stock: { $gte: item.qty } }, { $inc: { stock: -item.qty } });
    if (result.modifiedCount === 1) {
      reserved.push(item);
    } else {
      await Promise.all(reserved.map((line) => Product.updateOne({ _id: line.product }, { $inc: { stock: line.qty } })));
      const name = map.get(String(item.product))?.name || 'পণ্য';
      return res.status(409).json({ message: `${name} এর পর্যাপ্ত স্টক নেই।` });
    }
  }

  const totalAmount = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  try {
    const order = await Order.create({ user: req.user._id, items: normalizedItems, totalAmount, paymentMethod, deliveryAddress });
    res.status(201).json(order);
  } catch (error) {
    // Order write failed after reserving stock — release it back.
    await Promise.all(reserved.map((line) => Product.updateOne({ _id: line.product }, { $inc: { stock: line.qty } })));
    throw error;
  }
});

export const getMyOrders = asyncHandler(async (req, res) => res.json(await Order.find({ user: req.user._id }).populate('items.product', 'name images').sort('-createdAt')));
export const getOrders = asyncHandler(async (_req, res) => res.json(await Order.find().populate('user', 'name email phone').populate('items.product', 'name').sort('-createdAt')));
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];
  if (!statuses.includes(req.body.status)) return res.status(400).json({ message: 'সঠিক অর্ডার স্ট্যাটাস দিন।' });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!order) return res.status(404).json({ message: 'অর্ডারটি পাওয়া যায়নি।' });
  res.json(order);
});
