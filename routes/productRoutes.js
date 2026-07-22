import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, getProducts, updateProduct } from '../controllers/productController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = Router();
router.route('/').get(getProducts).post(protect, adminOnly, createProduct);
router.route('/:id').get(getProduct).put(protect, adminOnly, updateProduct).delete(protect, adminOnly, deleteProduct);
export default router;
