import { parse } from 'csv-parse/sync';

// POST /api/forecast/upload-csv
// Expects multipart/form-data with field name "file" containing a CSV.
// The CSV must have columns:
// medicineId, medicineName, date, quantitySold, currentStock, supplier, purchasePrice, sellingPrice
// Optional query params: forecastDays (default 30), safetyDays (default 7)
export const uploadCsvForecast = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required (field name: file)',
      });
    }

    const csvText = req.file.buffer.toString('utf8');

    let records;
    try {
      records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Failed to parse CSV file',
      });
    }

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty or has no data rows',
      });
    }

    const requiredColumns = [
      'medicineId',
      'medicineName',
      'date',
      'quantitySold',
      'currentStock',
      'supplier',
      'purchasePrice',
      'sellingPrice',
    ];

    const first = records[0];
    const missing = requiredColumns.filter((col) => !(col in first));
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `CSV is missing required columns: ${missing.join(', ')}`,
      });
    }

    const forecastDays = Number.parseInt(req.query.forecastDays, 10) || 30;
    const safetyDays = Number.parseInt(req.query.safetyDays, 10) || 7;

    // Group rows by medicineId
    const groupMap = new Map();

    for (const row of records) {
      const medicineId = String(row.medicineId).trim();
      if (!medicineId) continue;

      const quantitySold = Number(row.quantitySold);
      const currentStock = Number(row.currentStock);
      const purchasePrice = Number(row.purchasePrice);
      const sellingPrice = Number(row.sellingPrice);
      const dateStr = row.date && String(row.date).trim();

      if (!Number.isFinite(quantitySold)) continue;

      const key = medicineId;
      let entry = groupMap.get(key);
      if (!entry) {
        entry = {
          medicineId,
          medicineName: String(row.medicineName || '').trim() || medicineId,
          supplier: String(row.supplier || '').trim() || 'Unknown',
          totalSold: 0,
          dates: new Set(),
          currentStock: Number.isFinite(currentStock) ? currentStock : 0,
          purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
          sellingPrice: Number.isFinite(sellingPrice) ? sellingPrice : 0,
        };
        groupMap.set(key, entry);
      }

      entry.totalSold += quantitySold;
      if (dateStr) {
        entry.dates.add(dateStr);
      }

      // Use the latest non-null stock/prices we see
      if (Number.isFinite(currentStock)) {
        entry.currentStock = currentStock;
      }
      if (Number.isFinite(purchasePrice)) {
        entry.purchasePrice = purchasePrice;
      }
      if (Number.isFinite(sellingPrice)) {
        entry.sellingPrice = sellingPrice;
      }
    }

    const results = [];

    for (const entry of groupMap.values()) {
      const daysCount = entry.dates.size || 1;
      const avgDailySold = entry.totalSold / daysCount;
      const forecastQty = avgDailySold * forecastDays;
      const safetyStock = avgDailySold * safetyDays;
      const rawRecommended = forecastQty + safetyStock - entry.currentStock;
      const recommendedQty = rawRecommended > 0 ? Math.ceil(rawRecommended) : 0;
      const estimatedCost = recommendedQty * entry.purchasePrice;

      results.push({
        medicineId: entry.medicineId,
        medicineName: entry.medicineName,
        supplier: entry.supplier,
        totalSold: Number(entry.totalSold.toFixed(2)),
        avgDailySold: Number(avgDailySold.toFixed(2)),
        forecastQty: Math.ceil(forecastQty),
        safetyStock: Math.ceil(safetyStock),
        currentStock: entry.currentStock,
        recommendedQty,
        purchasePrice: Number(entry.purchasePrice.toFixed(2)),
        estimatedCost: Number(estimatedCost.toFixed(2)),
        daysCount,
        forecastDays,
        safetyDays,
      });
    }

    return res.json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('❌ CSV forecast error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate forecast from CSV',
    });
  }
};

export default {
  uploadCsvForecast,
};
