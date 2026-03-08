import mongoose from 'mongoose';

import Purchase from '../models/Purchase.js';
import PurchaseItem from '../models/PurchaseItem.js';
import Supplier from '../models/Supplier.js';
import Medicine from '../models/Medicine.js';
import Batch from '../models/Batch.js';
import StockLedger from '../models/StockLedger.js';

const generatePONumber = async () => {
  const last = await Purchase.findOne().sort({ createdAt: -1 }).lean();
  const year = new Date().getFullYear();
  if (!last || !last.poNumber) {
    return `PO-${year}-0001`;
  }
  const parts = String(last.poNumber).split('-');
  const seqRaw = parts[parts.length - 1] || '0';
  const next = Number.parseInt(seqRaw, 10) + 1 || 1;
  return `PO-${year}-${String(next).padStart(4, '0')}`;
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, expectedDeliveryDate } = req.body || {};

    if (!supplierId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'supplierId and at least one item are required',
      });
    }

    const supplier = await Supplier.findById(supplierId).lean();
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const poNumber = await generatePONumber();

    let totalAmount = 0;
    const purchaseItems = [];
    const ledgerEntries = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.medicineId || !item.quantity || !item.unitPrice) {
          throw new Error('Each item must include medicineId, quantity and unitPrice');
        }

        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
          throw new Error('Invalid quantity or unitPrice for purchase item');
        }

        const medicine = await Medicine.findById(item.medicineId).lean();
        if (!medicine) {
          throw new Error('Medicine not found for purchase item');
        }

        const lineTotal = quantity * unitPrice;
        totalAmount += lineTotal;

        // Generate unique batch number: PONumber-ItemIndex-Timestamp
        const uniqueBatchNumber = `${poNumber}-${i + 1}-${Date.now()}`;

        const batch = await Batch.create([
          {
            medicineId: item.medicineId,
            batchNumber: uniqueBatchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            purchasePrice: unitPrice,
            mrp: item.mrp || unitPrice,
            quantityAvailable: 0,
            supplierId,
            receivedDate: new Date(),
          },
        ]);

        const createdBatch = batch[0];

        purchaseItems.push({
          medicineId: item.medicineId,
          medicineName: medicine.name,
          genericId: medicine.genericId,
          quantity,
          unitPrice,
          batchNumber: createdBatch.batchNumber,
          expiryDate: createdBatch.expiryDate,
          batchId: createdBatch._id,
          lineTotal,
        });

        ledgerEntries.push({
          medicineId: item.medicineId,
          batchId: createdBatch._id,
          batchNumber: createdBatch.batchNumber,
          quantity,
          unitPrice,
        });
      }

      const [purchase] = await Purchase.create([
        {
          poNumber,
          supplierId,
          items: purchaseItems.map((it) => ({
            medicineId: it.medicineId,
            medicineName: it.medicineName,
            genericId: it.genericId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            batchNumber: it.batchNumber,
            expiryDate: it.expiryDate,
          })),
          totalAmount,
          status: 'upcoming',
          expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
        },
      ]);

      await PurchaseItem.insertMany(
        purchaseItems.map((it) => ({
          purchaseId: purchase._id,
          medicineId: it.medicineId,
          batchId: it.batchId,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          mrp: it.unitPrice,
          lineTotal: it.lineTotal,
        })),
      );

      // Store batch and ledger info for later inventory update
      purchase.batchInfo = purchaseItems.map(it => ({
        batchId: it.batchId,
        batchNumber: it.batchNumber
      }));
      purchase.ledgerInfo = ledgerEntries;

      await purchase.save();

      res.status(201).json({
        success: true,
        message: 'Purchase created successfully',
        data: { id: purchase._id, poNumber, totalAmount },
      });
  } catch (error) {
    console.error('❌ Create purchase error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create purchase' });
  }
};

export const getPurchases = async (req, res) => {
  try {
    const { status, supplierId, limit = 20, page = 1 } = req.query;
    const pageNum = Number.parseInt(page, 10) || 1;
    const limitNum = Number.parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (supplierId) filter.supplierId = supplierId;

    const [purchases, total] = await Promise.all([
      Purchase.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Purchase.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: purchases || [],
      pagination: {
        total: total || 0,
        page: pageNum,
        pages: Math.ceil((total || 0) / limitNum) || 0,
      },
    });
  } catch (error) {
    console.error('❌ Get purchases error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch purchases' });
  }
};

export const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).lean();
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const items = await PurchaseItem.find({ purchaseId: purchase._id }).lean();

    res.json({
      success: true,
      data: {
        ...purchase,
        items,
      },
    });
  } catch (error) {
    console.error('❌ Get purchase error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch purchase' });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
      const medicines = await Medicine.find({ discontinued: { $ne: true } }).lean();

      const lowStock = [];
      for (const med of medicines) {
        const totalStockAgg = await StockLedger.aggregate([
          { $match: { medicineId: med._id } },
          { $group: { _id: '$medicineId', quantity: { $sum: '$quantity' } } },
        ]);
        const totalStock = totalStockAgg[0]?.quantity || 0;

        const minStock = med.minStockLevel || 0;
        if (minStock > 0 && totalStock < minStock) {
          lowStock.push({
            medicineId: med._id,
            name: med.name,
            stock: totalStock,
            minStockLevel: minStock,
          });
        }
      }

      res.json({ success: true, data: lowStock });
  } catch (error) {
    console.error('❌ Get low stock items error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch low stock items' });
  }
};

export const updatePurchaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};

    if (!status) {
      return res.status(400).json({ success: false, message: 'status is required' });
    }

    const validStatuses = ['upcoming', 'received', 'not received'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be: upcoming, received, or not received' });
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const oldStatus = purchase.status;
    purchase.status = status;

    // If changing to 'received', update inventory
    if (status === 'received' && oldStatus !== 'received') {
      purchase.actualDeliveryDate = new Date();

      // Get purchase items with batch info
      const purchaseItems = await PurchaseItem.find({ purchaseId: id }).lean();

      // Create stock ledger entries for each item
      for (const item of purchaseItems) {
        if (item.batchId && item.medicineId) {
          // Update batch quantity
          await Batch.updateOne(
            { _id: item.batchId },
            { $inc: { quantityAvailable: item.quantity } }
          );

          await StockLedger.recordMovement({
            medicineId: item.medicineId,
            batchId: item.batchId,
            batchNumber: item.batchNumber,
            type: 'PURCHASE',
            quantity: item.quantity,
            previousStock: 0,
            newStock: item.quantity,
            referenceType: 'po',
            referenceId: purchase._id,
            reason: 'Purchase received',
            unitPrice: item.unitPrice,
            purchasePrice: item.unitPrice,
            totalValue: item.quantity * item.unitPrice,
          });
        }
      }

      console.log(`✅ Inventory updated for purchase ${purchase.poNumber}`);
    }

    await purchase.save();

    res.json({ success: true, message: 'Status updated', data: purchase });
  } catch (error) {
    console.error('❌ Update purchase status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to update purchase status' });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Only allow deletion if status is not 'received' (prevent deleting already processed inventory)
    if (purchase.status === 'received') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete received purchase. Inventory already updated.' 
      });
    }

    // Delete related purchase items
    await PurchaseItem.deleteMany({ purchaseId: id });

    // Delete related batches (only if not received)
    const purchaseItems = await PurchaseItem.find({ purchaseId: id }).lean();
    const batchIds = purchaseItems.map(item => item.batchId).filter(Boolean);
    if (batchIds.length > 0) {
      await Batch.deleteMany({ _id: { $in: batchIds } });
    }

    // Delete the purchase
    await Purchase.findByIdAndDelete(id);

    res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('❌ Delete purchase error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete purchase' });
  }
};
