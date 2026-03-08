import express from 'express';
import { createBackup, deleteBackup, getBackupDetails, listBackups } from '../controllers/backupController.js';

const router = express.Router();

router.post('/', createBackup);
router.get('/', listBackups);
router.get('/:backupId', getBackupDetails);
router.delete('/:backupId', deleteBackup);

export default router;
