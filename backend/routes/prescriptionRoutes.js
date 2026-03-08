import express from 'express';
import multer from 'multer';
import path from 'path';
import {
  listPrescriptions,
  getPendingCount,
  createPrescription,
  updateStatus,
  getMyPrescriptions,
  deletePrescription,
} from '../controllers/prescriptionController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

// Multer — store prescription images in uploads/prescriptions/
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `rx_${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter(req, file, cb) {
    const allowed = /jpeg|jpg|png|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only images (JPG/PNG) and PDFs are allowed'));
  },
});

// Public routes (no auth required)
router.post('/', upload.single('prescriptionImage'), createPrescription);
router.get('/my/:phone', getMyPrescriptions);

// Protected routes (admin only)
router.get('/', authenticate, listPrescriptions);
router.get('/pending-count', authenticate, getPendingCount);
router.patch('/:id/status', authenticate, updateStatus);
router.delete('/:id', authenticate, deletePrescription);

export default router;
