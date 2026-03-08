import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authenticate from './middleware/authMiddleware.js';
import saleRoutes from './routes/saleRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import userRoutes from './routes/userRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import authRoutes from './routes/authRoutes.js';
import forecastRoutes from './routes/forecastRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import prescriptionRoutes from './routes/prescriptionRoutes.js';
import callRequestRoutes from './routes/callRequestRoutes.js';
import customerRoutes from './routes/customerRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
try {
  await connectDB();
} catch (error) {
  console.error('Failed to connect to MongoDB:', error);
  process.exit(1);
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Pharmacy Backend API is running with MongoDB',
    database: 'MongoDB (Mongoose)',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Medicine routes with public search endpoint (auth handled per-route)
app.use('/api/medicines', medicineRoutes);

// Protected routes (require JWT)
app.use('/api/sales', authenticate, saleRoutes);
app.use('/api/purchases', authenticate, purchaseRoutes);
app.use('/api/suppliers', authenticate, supplierRoutes);
app.use('/api/reports', authenticate, reportsRoutes);
app.use('/api/audits', authenticate, auditRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/backups', authenticate, backupRoutes);
app.use('/api/forecast', authenticate, forecastRoutes);
app.use('/api/prediction', authenticate, predictionRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/call-requests', callRequestRoutes);
app.use('/api/customers', authenticate, customerRoutes);

app.get('/api', (req, res) => {
  res.json({ 
    message: 'Pharmacy Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      sales: '/api/sales',
      salesSummary: '/api/sales/summary/today',
      medicines: '/api/medicines',
      medicineSearch: '/api/medicines/search?q=medicine'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});
