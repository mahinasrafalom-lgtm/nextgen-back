import { Router } from 'express';
import { getDoctors, getPublicDoctors, createDoctor, updateDoctor, deleteDoctor } from '../controllers/doctorController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = Router();

router.get('/public', getPublicDoctors);
router.get('/', protect, adminOnly, getDoctors);
router.post('/', protect, adminOnly, createDoctor);
router.put('/:id', protect, adminOnly, updateDoctor);
router.delete('/:id', protect, adminOnly, deleteDoctor);

export default router;
