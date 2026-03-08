import mongoose from 'mongoose';

const purchaseItemSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
    },
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
    },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    batchNumber: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
    },
    mrp: {
      type: Number,
      default: 0,
    },
    lineTotal: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

purchaseItemSchema.index({ purchaseId: 1 });
purchaseItemSchema.index({ medicineId: 1 });
purchaseItemSchema.index({ batchId: 1 });

export default mongoose.model('PurchaseItem', purchaseItemSchema, 'purchaseitems');
