import Batch from '../models/Batch.js';
import StockLedger from '../models/StockMovement.js'; // StockMovement is an alias to StockLedger
import Medicine from '../models/Medicine.js';

// ADJUST STOCK - Add or reduce stock with reason
export const adjustStock = async (req, res) => {
  try {
    const { medicineId, batchId, quantity, reason } = req.body;

    // Validate input
    if (!medicineId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID and reason are required'
      });
    }

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required (cannot be zero)'
      });
    }

    // Find the medicine
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Always use the actual ObjectId from the document for
    // all subsequent queries/aggregations to avoid type
    // mismatches when req.body.medicineId is a string.
    const medObjectId = medicine._id;

    let batch;

    if (batchId) {
      batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found',
        });
      }

      const ledgerAgg = await StockLedger.aggregate([
        { $match: { medicineId: batch.medicineId, batchId: batch._id } },
        { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
      ]);
      const previousStock = ledgerAgg[0]?.quantity || 0;
      const newStock = previousStock + quantityNum;

      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${previousStock}`,
        });
      }

      let ledgerType = 'AUDIT_ADJUSTMENT';
      let referenceTypeValue = 'adjustment';

      if (reason && typeof reason === 'string') {
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('expir')) {
          ledgerType = 'EXPIRED_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        } else if (reasonLower.includes('damag')) {
          ledgerType = 'DAMAGE_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        }
      }

      const unitPrice = batch.purchasePrice || 0;
      const isExpiredWriteOff = ledgerType === 'EXPIRED_WRITE_OFF';
      const lossAmount = Math.abs(quantityNum) * unitPrice;

      await StockLedger.recordMovement({
        medicineId: medObjectId,
        medicineName: medicine.name,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        type: ledgerType,
        quantity: quantityNum,
        unitPrice,
        purchasePrice: unitPrice,
        previousStock,
        newStock,
        referenceType: referenceTypeValue,
        referenceId: null,
        reason,
        totalValue: lossAmount,
        totalLoss: isExpiredWriteOff ? lossAmount : 0,
        userId: req.user?.id || null,
      });

      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          medicineId,
          batchId: batch._id,
          quantityAdjusted: quantityNum,
          newStock,
        },
      });
    }

    const batches = await Batch.find({ medicineId: medObjectId }).sort({ expiryDate: 1 });

    if (quantityNum > 0) {
      if (batches.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No batch found. Please add a new batch first.',
        });
      }

      batch = batches[0];
      const ledgerAgg = await StockLedger.aggregate([
        { $match: { medicineId: medObjectId, batchId: batch._id } },
        { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
      ]);
      const previousStock = ledgerAgg[0]?.quantity || 0;
      const newStock = previousStock + quantityNum;

      let ledgerType = 'AUDIT_ADJUSTMENT';
      let referenceTypeValue = 'adjustment';

      if (reason && typeof reason === 'string') {
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('expir')) {
          ledgerType = 'EXPIRED_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        } else if (reasonLower.includes('damag')) {
          ledgerType = 'DAMAGE_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        }
      }

      const unitPrice = batch.purchasePrice || 0;
      const isExpiredWriteOff = ledgerType === 'EXPIRED_WRITE_OFF';
      const lossAmount = Math.abs(quantityNum) * unitPrice;

      await StockLedger.recordMovement({
        medicineId: medObjectId,
        medicineName: medicine.name,
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        type: ledgerType,
        quantity: quantityNum,
        unitPrice,
        purchasePrice: unitPrice,
        previousStock,
        newStock,
        referenceType: referenceTypeValue,
        referenceId: null,
        reason,
        totalValue: lossAmount,
        totalLoss: isExpiredWriteOff ? lossAmount : 0,
        userId: req.user?.id || null,
      });

      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          medicineId,
          batchId: batch._id,
          quantityAdjusted: quantityNum,
          newStock,
        },
      });
    }

    // Negative adjustment across multiple batches (FEFO)
    let remaining = Math.abs(quantityNum);
    const adjustments = [];

    for (const b of batches) {
      if (remaining <= 0) break;

      const ledgerAgg = await StockLedger.aggregate([
        { $match: { medicineId: medObjectId, batchId: b._id } },
        { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
      ]);
      const available = ledgerAgg[0]?.quantity || 0;
      if (available <= 0) continue;

      const deduct = Math.min(available, remaining);
      const previousStock = available;
      const newStock = previousStock - deduct;

      adjustments.push({
        batchId: b._id,
        quantity: -deduct,
        previousStock,
        newStock,
      });

      remaining -= deduct;
    }

    if (remaining > 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Short by ${remaining} units`,
      });
    }

    for (const adj of adjustments) {
      let ledgerType = 'AUDIT_ADJUSTMENT';
      let referenceTypeValue = 'adjustment';

      if (reason && typeof reason === 'string') {
        const reasonLower = reason.toLowerCase();
        if (reasonLower.includes('expir')) {
          ledgerType = 'EXPIRED_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        } else if (reasonLower.includes('damag')) {
          ledgerType = 'DAMAGE_WRITE_OFF';
          referenceTypeValue = 'writeoff';
        }
      }

      const batchForPrice = await Batch.findById(adj.batchId);
      const unitPrice = batchForPrice?.purchasePrice || 0;
      const qty = adj.quantity;

      const isExpiredWriteOff = ledgerType === 'EXPIRED_WRITE_OFF';
      const lossAmount = Math.abs(qty) * unitPrice;

      await StockLedger.recordMovement({
        medicineId: medObjectId,
        medicineName: medicine.name,
        batchId: adj.batchId,
        batchNumber: batchForPrice?.batchNumber,
        expiryDate: batchForPrice?.expiryDate,
        type: ledgerType,
        quantity: qty,
        unitPrice,
        purchasePrice: unitPrice,
        previousStock: adj.previousStock,
        newStock: adj.newStock,
        referenceType: referenceTypeValue,
        referenceId: null,
        reason,
        totalValue: lossAmount,
        totalLoss: isExpiredWriteOff ? lossAmount : 0,
        userId: req.user?.id || null,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        medicineId,
        adjustments: adjustments.length,
        totalAdjusted: Math.abs(quantityNum),
      },
    });

  } catch (error) {
    console.error('❌ Stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to adjust stock'
    });
  }
};
