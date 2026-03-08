import express from 'express';
import { listCallRequests, createCallRequest, updateCallRequestStatus } from '../controllers/callRequestController.js';

const router = express.Router();

// Get all call requests (for admin dashboard)
router.get('/', listCallRequests);

// Create new call request (public)
router.post('/', createCallRequest);

// Update call request status (for admin use)
router.patch('/:id/status', updateCallRequestStatus);

export default router;