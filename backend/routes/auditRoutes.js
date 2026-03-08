import express from 'express';
import { startAudit, completeAudit, getAuditSummary, listAudits, getAuditDetails, getLatestInProgressAudit, updateAuditItem, bulkUpdateAuditItems, cancelAudit, getAuditAnalytics } from '../controllers/auditController.js';

const router = express.Router();

router.get('/summary/latest', getAuditSummary);
router.get('/in-progress/latest', getLatestInProgressAudit);
router.get('/analytics', getAuditAnalytics);
router.get('/', listAudits);
router.get('/:auditId', getAuditDetails);
router.post('/start', startAudit);
router.patch('/:auditId/items', bulkUpdateAuditItems);
router.patch('/:auditId/items/:itemId', updateAuditItem);
router.post('/:auditId/complete', completeAudit);
router.post('/:auditId/cancel', cancelAudit);

export default router;
