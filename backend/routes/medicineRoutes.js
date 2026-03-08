import express from 'express';
import { searchMedicines, getMedicines, createMedicine, discontinueMedicine, updateRackLocation, updateMedicinePrices } from '../controllers/medicineController.js';
import { adjustStock } from '../controllers/stockController.js';
import { addBatch } from '../controllers/batchController.js';
import authenticate from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/search', searchMedicines); // Public search for front page

// Protected routes (authentication required)
router.get('/', authenticate, getMedicines);
router.post('/', authenticate, createMedicine);
router.post('/adjust-stock', authenticate, adjustStock);
router.post('/add-batch', authenticate, addBatch);
router.patch('/:medicineId/discontinue', authenticate, discontinueMedicine);
router.patch('/:medicineId/rack', authenticate, updateRackLocation);
router.patch('/:medicineId/prices', authenticate, updateMedicinePrices);

export default router;
