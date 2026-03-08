import express from 'express';
import { createUser, deleteUser, listUsers, updateUserStatus } from '../controllers/userController.js';

const router = express.Router();

router.get('/', listUsers);
router.post('/', createUser);
router.patch('/:userId/status', updateUserStatus);
router.delete('/:userId', deleteUser);

export default router;
