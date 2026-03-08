import mongoose from 'mongoose';

// ⭐ CRITICAL: Stock is stored at BATCH level, NOT medicine level
const batchSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  batchNumber: {
    type: String,
    required: true,
    trim: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  mrp: {
    type: Number,
    required: true
  },
  quantityAvailable: {
    type: Number,
    required: true,
    default: 0
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  receivedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 🔥 MOST IMPORTANT INDEX - Supports FEFO (First Expiry First Out)
batchSchema.index({ medicineId: 1, expiryDate: 1, quantityAvailable: 1 });
batchSchema.index({ expiryDate: 1 });

// Batch numbers should be unique PER medicine (not globally)
batchSchema.index({ medicineId: 1, batchNumber: 1 }, { unique: true });

export default mongoose.model('Batch', batchSchema);
