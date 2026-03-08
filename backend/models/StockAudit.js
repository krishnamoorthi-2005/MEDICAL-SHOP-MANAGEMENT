import mongoose from 'mongoose';

const stockAuditSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['full', 'category', 'rack'],
    required: true
  },
  category: String,
  rack: String,
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'cancelled'],
    default: 'in_progress'
  },
  performedBy: String,
  performedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  startedAt: Date,
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

stockAuditSchema.index({ status: 1, startedAt: -1 });

export default mongoose.model('StockAudit', stockAuditSchema);
