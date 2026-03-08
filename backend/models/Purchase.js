import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  poNumber: {
    type: String,
    required: true,
    unique: true
  },
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  items: [{
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    medicineName: String,
    genericId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Generic'
    },
    quantity: {
      type: Number,
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    batchNumber: String,
    expiryDate: Date
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'received', 'not received'],
    default: 'upcoming'
  },
  expectedDeliveryDate: Date,
  actualDeliveryDate: Date
}, {
  timestamps: true
});

purchaseSchema.index({ supplierId: 1, createdAt: -1 });

export default mongoose.model('Purchase', purchaseSchema);
