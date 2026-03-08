import express from 'express';
import { 
  createPurchase, 
  getPurchases, 
  getPurchase, 
  getLowStockItems,
  updatePurchaseStatus,
  deletePurchase
} from '../controllers/purchaseController.js';

const router = express.Router();

router.post('/', createPurchase);
router.get('/', getPurchases);
router.get('/low-stock', getLowStockItems);
router.get('/:id', getPurchase);
router.patch('/:id/status', updatePurchaseStatus);
router.delete('/:id', deletePurchase);

export default router;
