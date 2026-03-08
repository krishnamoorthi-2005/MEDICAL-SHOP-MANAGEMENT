import mongoose from 'mongoose';

const backupSnapshotSchema = new mongoose.Schema(
  {
    createdBy: { type: String, default: 'system' },
    note: { type: String },
    counts: {
      type: Object,
      default: {},
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

backupSnapshotSchema.index({ createdAt: -1 });

export default mongoose.model('BackupSnapshot', backupSnapshotSchema);
