import mongoose from 'mongoose';

const genericSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  therapeuticClass: {
    type: String,
    required: true
  },
  commonUses: String
}, {
  timestamps: true
});

export default mongoose.model('Generic', genericSchema);
