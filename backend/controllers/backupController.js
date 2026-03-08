import BackupSnapshot from '../models/BackupSnapshot.js';

import Generic from '../models/Generic.js';
import Manufacturer from '../models/Manufacturer.js';
import Medicine from '../models/Medicine.js';
import Supplier from '../models/Supplier.js';
import Batch from '../models/Batch.js';
import StockMovement from '../models/StockMovement.js';
import Sale from '../models/Sale.js';
import Purchase from '../models/Purchase.js';
import WriteOffLog from '../models/WriteOffLog.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import DailySalesSummary from '../models/DailySalesSummary.js';
import StockAudit from '../models/StockAudit.js';
import StockAuditItem from '../models/StockAuditItem.js';

const buildSnapshot = async () => {
  const [
    generics,
    manufacturers,
    medicines,
    suppliers,
    batches,
    stockMovements,
    sales,
    purchases,
    writeOffLogs,
    roles,
    users,
    dailySalesSummaries,
    audits,
    auditItems,
  ] = await Promise.all([
    Generic.find({}).lean(),
    Manufacturer.find({}).lean(),
    Medicine.find({}).lean(),
    Supplier.find({}).lean(),
    Batch.find({}).lean(),
    StockMovement.find({}).lean(),
    Sale.find({}).lean(),
    Purchase.find({}).lean(),
    WriteOffLog.find({}).lean(),
    Role.find({}).lean(),
    User.find({}).lean(),
    DailySalesSummary.find({}).lean(),
    StockAudit.find({}).lean(),
    StockAuditItem.find({}).lean(),
  ]);

  const counts = {
    generics: generics.length,
    manufacturers: manufacturers.length,
    medicines: medicines.length,
    suppliers: suppliers.length,
    batches: batches.length,
    stockMovements: stockMovements.length,
    sales: sales.length,
    purchases: purchases.length,
    writeOffLogs: writeOffLogs.length,
    roles: roles.length,
    users: users.length,
    dailySalesSummaries: dailySalesSummaries.length,
    audits: audits.length,
    auditItems: auditItems.length,
  };

  return {
    counts,
    data: {
      generics,
      manufacturers,
      medicines,
      suppliers,
      batches,
      stockMovements,
      sales,
      purchases,
      writeOffLogs,
      roles,
      users,
      dailySalesSummaries,
      audits,
      auditItems,
    },
  };
};

export const createBackup = async (req, res) => {
  try {
    const { createdBy, note } = req.body || {};

    const snapshot = await buildSnapshot();
    const backup = await BackupSnapshot.create({
      createdBy: createdBy || 'system',
      note,
      counts: snapshot.counts,
      data: snapshot.data,
    });

    res.json({
      success: true,
      data: {
        _id: backup._id,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
        note: backup.note,
        counts: backup.counts,
      },
    });
  } catch (error) {
    console.error('createBackup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create backup' });
  }
};

export const listBackups = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10) || 20, 200);

    const backups = await BackupSnapshot.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .select({ data: 0 });

    res.json({ success: true, data: backups });
  } catch (error) {
    console.error('listBackups error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch backups' });
  }
};

export const getBackupDetails = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await BackupSnapshot.findById(backupId);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    res.json({ success: true, data: backup });
  } catch (error) {
    console.error('getBackupDetails error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch backup' });
  }
};

export const deleteBackup = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await BackupSnapshot.findById(backupId);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    await BackupSnapshot.deleteOne({ _id: backupId });
    res.json({ success: true, message: 'Backup deleted' });
  } catch (error) {
    console.error('deleteBackup error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete backup' });
  }
};
