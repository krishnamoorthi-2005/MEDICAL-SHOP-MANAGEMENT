import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    enum: ['Admin', 'Manager', 'Staff', 'Cashier', 'Auditor', 'User', 'user']
  },
  permissions: [{
    type: String
  }],
  description: String
}, {
  timestamps: true
});


export default mongoose.model('Role', roleSchema);
