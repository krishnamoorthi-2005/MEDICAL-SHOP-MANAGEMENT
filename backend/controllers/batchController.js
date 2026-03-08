import Batch from '../models/Batch.js';
import Medicine from '../models/Medicine.js';
import StockMovement from '../models/StockMovement.js';
import Supplier from '../models/Supplier.js';

// ADD NEW BATCH - Add stock for existing medicine
export const addBatch = async (req, res) => {
  try {
    const { medicineId, batchNumber, expiryDate, quantity, purchasePrice, mrp } = req.body;

    // Validate required fields
    if (!medicineId || !batchNumber || !expiryDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Medicine ID, batch number, expiry date, and quantity are required'
      });
    }

    // Validate medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: 'Medicine not found'
      });
    }

    // Check if batch number already exists for this medicine
    const existingBatch = await Batch.findOne({ medicineId, batchNumber });
    if (existingBatch) {
      const quantityNum = parseInt(quantity);
      
      // Update purchase price and MRP metadata if provided (no stock field changes)
      if (purchasePrice) existingBatch.purchasePrice = parseFloat(purchasePrice);
      if (mrp) existingBatch.mrp = parseFloat(mrp);
      
      await existingBatch.save();

      const agg = await StockMovement.aggregate([
        { $match: { medicineId, batchId: existingBatch._id } },
        { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
      ]);
      const previousStock = agg[0]?.quantity || 0;

      const movement = new StockMovement({
        medicineId,
        batchId: existingBatch._id,
        type: 'PURCHASE_IN',
        quantity: quantityNum,
        previousStock,
        newStock: previousStock + quantityNum,
        referenceType: 'po',
        reason: `Additional stock received for batch ${batchNumber}`
      });
      await movement.save();

      return res.status(200).json({
        success: true,
        message: 'Stock added to existing batch successfully',
        data: {
          batchId: existingBatch._id,
          batchNumber: existingBatch.batchNumber,
          quantityAdded: quantityNum,
          totalQuantity: previousStock + quantityNum,
          expiryDate: existingBatch.expiryDate
        }
      });
    }

    // Validate quantity
    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }

    // Validate expiry date
    const expiryDateObj = new Date(expiryDate);
    if (isNaN(expiryDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expiry date'
      });
    }

    // Find or create default supplier
    let supplier = await Supplier.findOne({ name: 'Default Supplier' });
    if (!supplier) {
      supplier = await Supplier.create({
        name: 'Default Supplier',
        contactPerson: 'Admin',
        phone: '0000000000',
        email: 'default@supplier.com',
        address: 'Default Address'
      });
    }

    // Create new batch
    const newBatch = new Batch({
      medicineId,
      batchNumber,
      expiryDate: expiryDateObj,
      quantityAvailable: 0,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : medicine.purchasePrice || 0,
      mrp: mrp ? parseFloat(mrp) : medicine.mrp || 0,
      supplierId: supplier._id,
      receivedDate: new Date()
    });

    await newBatch.save();

    const movement = new StockMovement({
      medicineId,
      batchId: newBatch._id,
      type: 'PURCHASE_IN',
      quantity: quantityNum,
      previousStock: 0,
      newStock: quantityNum,
      referenceType: 'po',
      reason: `New batch received - ${batchNumber}`
    });
    await movement.save();

    res.status(201).json({
      success: true,
      message: 'Batch added successfully',
      data: {
        batchId: newBatch._id,
        batchNumber: newBatch.batchNumber,
        quantity: quantityNum,
        expiryDate: expiryDateObj
      }
    });

  } catch (error) {
    console.error('❌ Add batch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add batch'
    });
  }
};
