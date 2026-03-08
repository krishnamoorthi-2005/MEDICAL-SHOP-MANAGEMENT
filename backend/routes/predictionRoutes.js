import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getMonthlyDemandPrediction, exportPredictionsCsv, downloadTrainingDataset, uploadTrainingDataset } from '../controllers/predictionController.js';

const router = express.Router();
// Ensure a stable uploads directory exists for temporary CSV files
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

const predictionUpload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			// Temporary upload location; controller will move to training_data.csv
			cb(null, uploadDir);
		},
		filename: (req, file, cb) => {
			cb(null, `prediction_dataset_${Date.now()}.csv`);
		},
	}),
});

// GET /api/prediction?month=1-12
router.get('/', getMonthlyDemandPrediction);

// GET /api/prediction/export?month=1-12
router.get('/export', exportPredictionsCsv);

// GET /api/prediction/dataset - download last 12 months sales dataset used for AI training
router.get('/dataset', downloadTrainingDataset);

// POST /api/prediction/dataset - upload custom training dataset and trigger model training
router.post('/dataset', predictionUpload.single('file'), uploadTrainingDataset);

export default router;
