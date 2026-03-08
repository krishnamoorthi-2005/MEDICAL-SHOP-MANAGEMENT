import mongoose from 'mongoose';

const manufacturerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contact: String,
  email: String,
  address: String,
  gstNumber: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

manufacturerSchema.index({ name: 1 });

export default mongoose.model('Manufacturer', manufacturerSchema);
