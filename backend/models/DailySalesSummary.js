import mongoose from 'mongoose';

// ⭐ PRECOMPUTED DATA - Updates via events/workers, NOT during user requests
const dailySalesSummarySchema = new mongoose.Schema({
  date: {
    type: String, // Format: "2026-01-30"
    required: true,
    unique: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  billCount: {
    type: Number,
    default: 0
  },
  itemsSold: {
    type: Number,
    default: 0
  },
  totalTransactions: {
    type: Number,
    default: 0
  },
  totalItems: {
    type: Number,
    default: 0
  },
  averageTicketSize: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});


export default mongoose.model('DailySalesSummary', dailySalesSummarySchema);
