import express from 'express';
import {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  searchActiveCustomers,
  getMyCustomerInfo,
} from '../controllers/customerController.js';
import { deleteAllCustomers } from '../controllers/deleteAllCustomers.js';

const router = express.Router();

router.get('/',          getCustomers);
router.get('/search',    searchActiveCustomers);  // Dedicated search for active customers (must be before /:id)
router.get('/my-info',   getMyCustomerInfo);      // Get user's own customer info (must be before /:id)
router.post('/',         createCustomer);
router.delete('/all',    deleteAllCustomers);  // Delete all customers (admin only)
router.get('/:id',       getCustomerById);
router.put('/:id',       updateCustomer);
router.delete('/:id',    deleteCustomer);
router.get('/:id/history', getCustomerHistory);

export default router;
