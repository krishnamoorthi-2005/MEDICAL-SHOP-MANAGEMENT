import mongoose from 'mongoose';

const callRequestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'called', 'resolved'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

callRequestSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('CallRequest', callRequestSchema, 'callrequests');
