import express from 'express';
import multer from 'multer';

import { uploadCsvForecast } from '../controllers/forecastController.js';

const router = express.Router();

// Store uploaded CSV in memory; suitable for files up to a few MB.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// POST /api/forecast/upload-csv
// Field name: "file" (multipart/form-data)
router.post('/upload-csv', upload.single('file'), uploadCsvForecast);

export default router;
