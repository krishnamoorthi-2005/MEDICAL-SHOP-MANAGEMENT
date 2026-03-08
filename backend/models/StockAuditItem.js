import mongoose from 'mongoose';

const stockAuditItemSchema = new mongoose.Schema({
  auditId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StockAudit',
    required: true
  },
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: true
  },
  batchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  systemQuantity: {
    type: Number,
    required: true
  },
  countedQuantity: {
    type: Number,
    required: true
  },
  difference: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['matched', 'shortage', 'excess'],
    required: true
  },
  notes: String
}, {
  timestamps: true
});

stockAuditItemSchema.index({ auditId: 1 });
stockAuditItemSchema.index({ medicineId: 1 });
stockAuditItemSchema.index({ batchId: 1 });

export default mongoose.model('StockAuditItem', stockAuditItemSchema);
