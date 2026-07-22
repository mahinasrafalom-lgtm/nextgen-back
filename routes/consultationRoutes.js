import { Router } from 'express';
import {
  createConsultation,
  getMyConsultations,
  getConsultation,
  getConsultations,
  assignDoctor,
  updateConsultationStatus
} from '../controllers/consultationController.js';
import { getMessages, postMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';
import { mediaUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

// Admin queue of every application.
router.get('/', protect, adminOnly, getConsultations);
// Authenticated user submits a free-consultation application (with optional media).
router.post('/', protect, mediaUpload.array('attachments', 4), createConsultation);
// A user's own tickets.
router.get('/mine', protect, getMyConsultations);

// Ticket detail + chat thread (owner or admin — enforced in the controllers).
router.get('/:id', protect, getConsultation);
router.get('/:id/messages', protect, getMessages);
router.post('/:id/messages', protect, mediaUpload.single('attachment'), postMessage);

// Admin actions: confirm/assign a doctor and change status.
router.put('/:id/assign', protect, adminOnly, assignDoctor);
router.put('/:id/status', protect, adminOnly, updateConsultationStatus);

export default router;
