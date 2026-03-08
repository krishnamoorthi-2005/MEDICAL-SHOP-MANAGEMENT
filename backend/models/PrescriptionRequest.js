import mongoose from 'mongoose';

const prescriptionRequestSchema = new mongoose.Schema({
  // Patient info (no login required — just phone + name)
  patientName: { type: String, required: true, trim: true },
  patientPhone: { type: String, required: true, trim: true },
  patientEmail: { type: String, trim: true, default: '' },

  // Optionally linked to a Customer record
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },

  // Medicines requested
  medicines: [{
    name: { type: String, required: true },
    quantity: { type: String, default: '1' },
    notes: { type: String, default: '' },
  }],

  // Prescription image (stored as filename after upload)
  prescriptionImage: { type: String, default: null },

  // Doctor details (optional)
  doctorName: { type: String, default: '' },
  doctorPhone: { type: String, default: '' },

  // Status workflow
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'collected'],
    default: 'pending',
  },

  // Admin review
  adminNotes: { type: String, default: '' },
  reviewedBy: { type: String, default: null },
  reviewedAt: { type: Date, default: null },

  // Notification flag
  notificationSent: { type: Boolean, default: false },

}, { timestamps: true });

prescriptionRequestSchema.index({ patientPhone: 1 });
prescriptionRequestSchema.index({ status: 1 });
prescriptionRequestSchema.index({ createdAt: -1 });

export default mongoose.model('PrescriptionRequest', prescriptionRequestSchema);
