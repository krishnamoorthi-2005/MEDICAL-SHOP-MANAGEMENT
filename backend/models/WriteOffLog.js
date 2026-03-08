import mongoose from 'mongoose';

const writeOffLogSchema = new mongoose.Schema({
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
  quantity: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    enum: ['expired', 'damaged', 'lost', 'stolen'],
    required: true
  },
  financialLoss: {
    type: Number,
    required: true
  },
  authorizedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String
}, {
  timestamps: true
});

writeOffLogSchema.index({ medicineId: 1 });
writeOffLogSchema.index({ batchId: 1 });
writeOffLogSchema.index({ reason: 1 });
writeOffLogSchema.index({ createdAt: -1 });

export default mongoose.model('WriteOffLog', writeOffLogSchema);
