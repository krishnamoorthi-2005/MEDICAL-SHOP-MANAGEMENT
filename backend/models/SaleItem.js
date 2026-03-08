import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema(
  {
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
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
      required: true,
    },
    medicineName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
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

saleItemSchema.index({ saleId: 1 });
saleItemSchema.index({ medicineId: 1 });
saleItemSchema.index({ batchId: 1 });

export default mongoose.model('SaleItem', saleItemSchema, 'saleitems');
