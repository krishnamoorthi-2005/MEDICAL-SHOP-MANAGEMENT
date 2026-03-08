import Sale from '../models/Sale.js';
import Medicine from '../models/Medicine.js';
import Batch from '../models/Batch.js';
import StockLedger from '../models/StockLedger.js';

const toLocalDateString = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// GET DASHBOARD ANALYTICS
export const getDashboardAnalytics = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = new Date(today);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Get low stock items (stock < minStockLevel) from ledger
    const medicines = await Medicine.find().lean();
    const lowStockItems = [];
    const expiringSoonItems = [];
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    for (const med of medicines) {
      if (med.discontinued) {
        continue;
      }

      const batches = await Batch.find({ medicineId: med._id }).lean();
      const batchIds = batches.map((b) => b._id);
      const stockAgg = await StockLedger.aggregate([
        { $match: { medicineId: med._id, batchId: { $in: batchIds } } },
        { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
      ]);
      const balanceMap = new Map(stockAgg.map((s) => [s._id.toString(), s.quantity || 0]));
      const totalStock = batches.reduce(
        (sum, b) => sum + (balanceMap.get(b._id.toString()) || 0),
        0,
      );

      const minStockLevel = med.minStockLevel ?? 0;
      if (minStockLevel > 0 && totalStock < minStockLevel) {
        lowStockItems.push({ name: med.name, stock: totalStock });
      }

      // Check for expiring batches
      const expiringBatches = batches.filter((b) => {
        const qty = balanceMap.get(b._id.toString()) || 0;
        return (
          new Date(b.expiryDate) < thirtyDaysFromNow &&
          new Date(b.expiryDate) > new Date() &&
          qty > 0
        );
      });

      if (expiringBatches.length > 0) {
        const expiringValue = expiringBatches.reduce((sum, b) => {
          const qty = balanceMap.get(b._id.toString()) || 0;
          return sum + qty * (b.mrp || 0);
        }, 0);
        expiringSoonItems.push({ 
          name: med.name, 
          value: expiringValue,
          batches: expiringBatches.length 
        });
      }
    }

    // Get top selling items (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSales = await Sale.find({ 
      createdAt: { $gte: sevenDaysAgo } 
    }).lean();

    const itemSales = {};
    recentSales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemSales[item.medicineName]) {
          itemSales[item.medicineName] = { quantity: 0, revenue: 0 };
        }
        itemSales[item.medicineName].quantity += item.quantity;
        itemSales[item.medicineName].revenue += item.lineTotal;
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Get recent transactions (last 10)
    const recentTransactions = await Sale.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Get last 7 days sales trend from StockLedger (SALE movements only)
    const trendStart = new Date();
    trendStart.setDate(trendStart.getDate() - 6);
    trendStart.setHours(0, 0, 0, 0);

    const trendAgg = await StockLedger.aggregate([
      {
        $match: {
          type: 'SALE',
          createdAt: { $gte: trendStart },
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
            },
          },
          revenue: {
            $multiply: [
              { $abs: '$quantity' },
              {
                $ifNull: [
                  '$sellingPrice',
                  0,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: '$date',
          sales: { $sum: '$revenue' },
        },
      },
    ]);

    const trendMap = new Map(trendAgg.map((t) => [t._id, t.sales]));
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateString = toLocalDateString(date);

      salesTrend.push({
        date: dateString,
        sales: trendMap.get(dateString) || 0,
      });
    }

    const totalExpiringValue = expiringSoonItems.reduce((sum, item) => sum + item.value, 0);
    const expiringSoonCount = expiringSoonItems.length;
    const expiringSoonBatchCount = expiringSoonItems.reduce((sum, item) => sum + (item.batches || 0), 0);

    // === Ledger-based financial summary for today ===
    const [salesByInvoice, expiredAgg, expiredInStockAgg] = await Promise.all([
      StockLedger.aggregate([
        {
          $match: {
            type: 'SALE',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: '$referenceId',
            totalAmount: {
              $sum: {
                $multiply: [
                  { $abs: '$quantity' },
                  { $ifNull: ['$sellingPrice', 0] },
                ],
              },
            },
            totalCostOfGoodsSold: {
              $sum: {
                $multiply: [
                  { $abs: '$quantity' },
                  { $ifNull: ['$purchasePrice', 0] },
                ],
              },
            },
            itemsSold: { $sum: { $abs: '$quantity' } },
          },
        },
      ]),
      StockLedger.aggregate([
        {
          $match: {
            type: 'EXPIRED_WRITE_OFF',
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
        },
        {
          $group: {
            _id: null,
            totalLoss: { $sum: '$totalValue' },
          },
        },
      ]),
      // Calculate value of expired items still in stock
      Batch.aggregate([
        {
          $match: {
            expiryDate: { $lt: today },
            quantityAvailable: { $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalExpiredValue: {
              $sum: {
                $multiply: ['$quantityAvailable', '$purchasePrice'],
              },
            },
            totalExpiredQty: { $sum: '$quantityAvailable' },
          },
        },
      ]),
    ]);

    const billCount = salesByInvoice.length;
    const totalSales = salesByInvoice.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalCostOfGoodsSold = salesByInvoice.reduce((sum, s) => sum + (s.totalCostOfGoodsSold || 0), 0);
    const itemsSold = salesByInvoice.reduce((sum, s) => sum + (s.itemsSold || 0), 0);
    const writtenOffLoss = expiredAgg[0]?.totalLoss || 0;
    const expiredInStockValue = expiredInStockAgg[0]?.totalExpiredValue || 0;

    // Net profit should be based only on selling price
    // and purchase price for items actually sold today.
    // Do NOT subtract write-off losses here; those are
    // already tracked separately in expiry analytics.
    const netProfit = totalSales - totalCostOfGoodsSold;

    // Expose the raw net profit value directly to the UI
    // so it can show profit or loss instead of clamping
    // negative values to zero.
    const displayProfit = netProfit;

    console.log('📊 Dashboard Expiry Snapshot:', {
      writtenOffLossToday: writtenOffLoss,
      expiredInStockValue,
      rawNetProfit: netProfit,
      displayProfit,
      expiredQtyInStock: expiredInStockAgg[0]?.totalExpiredQty || 0
    });

    const todaySummary = {
      totalSales,
      totalRevenue: totalSales,
      billCount,
      itemsSold,
      profit: displayProfit,
      date: toLocalDateString(today),
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: {
        todaySummary,
        lowStockCount: lowStockItems.length,
        lowStockItems: lowStockItems.slice(0, 10), // Return top 10 low stock items
        expiringSoonCount,
        expiringSoonBatchCount,
        expiringSoonValue: totalExpiringValue,
        expiringSoonItems: expiringSoonItems.slice(0, 10), // Return top 10 expiring items
        topSellingItems: topItems,
        recentTransactions: recentTransactions.map(t => ({
          invoiceNumber: t.invoiceNumber,
          total: t.total,
          items: t.items.length,
          createdAt: t.createdAt
        })),
        salesTrend
      }
    });
  } catch (error) {
    console.error('❌ Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get frequently purchased items (for quick billing)
export const getFrequentItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get sales from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSales = await Sale.find({ 
      createdAt: { $gte: thirtyDaysAgo } 
    }).lean();

    // Count medicine purchases
    const itemFrequency = {};
    recentSales.forEach(sale => {
      sale.items.forEach(item => {
        const key = item.medicineId;
        if (!itemFrequency[key]) {
          itemFrequency[key] = {
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            count: 0,
            totalQuantity: 0
          };
        }
        itemFrequency[key].count += 1;
        itemFrequency[key].totalQuantity += item.quantity;
      });
    });

    // Sort by frequency and get medicine details
    const frequentItemIds = Object.values(itemFrequency)
      .sort((a, b) => b.count - a.count)
      .slice(0, parseInt(limit))
      .map(item => item.medicineId);

    // Get full medicine details
    const medicines = await Medicine.find({ 
      _id: { $in: frequentItemIds },
      discontinued: { $ne: true }
    })
      .populate('genericId', 'name')
      .populate('manufacturerId', 'name')
      .lean();

    // Get stock info for each medicine
    const medicinesWithStock = await Promise.all(
      medicines.map(async (med) => {
        const batches = await Batch.find({
          medicineId: med._id,
        })
          .sort({ expiryDate: 1 })
          .lean();

        const batchIds = batches.map((b) => b._id);
        const stockAgg = await StockLedger.aggregate([
          { $match: { medicineId: med._id, batchId: { $in: batchIds } } },
          { $group: { _id: '$batchId', quantity: { $sum: '$quantity' } } },
        ]);
        const balanceMap = new Map(
          stockAgg.map((s) => [s._id.toString(), s.quantity || 0]),
        );

        const totalStock = batches.reduce(
          (sum, b) => sum + (balanceMap.get(b._id.toString()) || 0),
          0,
        );

        const firstInStockBatch = batches.find(
          (b) => (balanceMap.get(b._id.toString()) || 0) > 0,
        );
        const mrp = firstInStockBatch ? firstInStockBatch.mrp : 0;

        return {
          _id: med._id,
          name: med.name,
          genericId: med.genericId,
          manufacturerId: med.manufacturerId,
          category: med.category,
          stock: totalStock,
          mrp,
          inStock: totalStock > 0,
          purchaseCount: itemFrequency[med._id.toString()]?.count || 0
        };
      })
    );

    // Sort by original frequency order
    const sortedMedicines = medicinesWithStock.sort((a, b) => 
      frequentItemIds.indexOf(a._id.toString()) - frequentItemIds.indexOf(b._id.toString())
    );

    res.json({
      success: true,
      data: sortedMedicines.filter(m => m.inStock)
    });
  } catch (error) {
    console.error('❌ Get frequent items error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
