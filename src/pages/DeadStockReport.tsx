import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, PackageX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getDeadStockReport,
  DeadStockItem,
  getDemandPrediction,
  type DemandPredictionItem,
  downloadDemandPredictionCsv,
} from '@/lib/api';

export default function DeadStockReport() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DeadStockItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [predictions, setPredictions] = useState<DemandPredictionItem[]>([]);
  const [predictionMetadata, setPredictionMetadata] = useState<any>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [csvDownloading, setCsvDownloading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDeadStockReport();
        setItems(data.batches || []);
        setTotalItems(data.totalItems || 0);
      } catch (e) {
        console.error('Failed to load dead stock report', e);
        setItems([]);
        setTotalItems(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleRunPrediction = async () => {
    try {
      setPredictionLoading(true);
      setPredictionError(null);
      const result = await getDemandPrediction();
      setPredictions(result.data || []);
      setPredictionMetadata(result.metadata || null);
    } catch (e: any) {
      console.error('Failed to fetch prediction', e);
      setPredictions([]);
      setPredictionMetadata(null);
      setPredictionError(e?.message || 'Failed to fetch prediction');
    } finally {
      setPredictionLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    try {
      setCsvDownloading(true);
      const blob = await downloadDemandPredictionCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'purchase_predictions.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to download prediction CSV', e);
    } finally {
      setCsvDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PackageX className="h-6 w-6 text-gray-600" />
              Dead Stock Report
            </h1>
            <p className="text-muted-foreground/70 font-medium">
              Batches with stock on hand but no sales in the last 7 days
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total Dead Stock Items</div>
          <div className="text-2xl font-semibold">{totalItems.toLocaleString()}</div>
        </div>
      </div>

      <Card className="micro-interaction">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">AI Purchase Recommendations</CardTitle>
            <CardDescription>
              Trained on real sales from the stock ledger to forecast next month demand per medicine.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadCsv}
              disabled={csvDownloading}
            >
              <Download className="h-4 w-4 mr-1" />
              {csvDownloading ? 'Downloading…' : 'Download CSV'}
            </Button>
            <Button size="sm" onClick={handleRunPrediction} disabled={predictionLoading}>
              {predictionLoading ? 'Running…' : 'Run Prediction'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {predictionError && (
            <p className="text-xs text-red-500 mb-2">{predictionError}</p>
          )}
          {predictions.length > 0 ? (
            <div className="overflow-auto max-h-[50vh] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead className="text-right">
                      {predictionMetadata?.monthName && predictionMetadata?.previousYear
                        ? `${predictionMetadata.monthName} ${predictionMetadata.previousYear} Sales`
                        : 'Previous Year Sales'}
                    </TableHead>
                    <TableHead className="text-right">Current Stock</TableHead>
                    <TableHead className="text-right">Recommended Purchase</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((p) => (
                    <TableRow key={p.medicineId}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{p.medicineName || 'Unknown'}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{p.medicineId}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{(p.previousSales || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">{p.currentStock.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-semibold">{p.recommendedPurchase.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-xs">
                        {typeof p.confidence === 'number'
                          ? `${Math.round(p.confidence * 100)}%`
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Run Prediction" to generate AI-based purchase recommendations per medicine.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="micro-interaction">
        <CardHeader>
          <CardTitle className="text-base">Dead Stock Batches</CardTitle>
          <CardDescription>
            {loading
              ? 'Loading dead stock details…'
              : items.length === 0
              ? 'No dead stock batches found'
              : `${items.length} batch${items.length === 1 ? '' : 'es'} currently considered dead stock`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-72 flex items-center justify-center flex-col border-2 border-dashed rounded-lg border-muted">
              <p className="text-muted-foreground font-medium">Loading…</p>
            </div>
          ) : items.length === 0 ? (
            <div className="h-72 flex items-center justify-center flex-col border-2 border-dashed rounded-lg border-muted">
              <p className="text-muted-foreground font-medium">No dead stock currently detected</p>
              <p className="text-xs text-muted-foreground mt-1">Batches will appear here once they remain unsold for 90+ days.</p>
            </div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Qty Remaining</TableHead>
                    <TableHead className="text-right">Purchase Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead>Last Sold</TableHead>
                    <TableHead>Days Unsold</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Rack</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
                    const lastSold = item.lastSoldDate ? new Date(item.lastSoldDate) : null;
                    return (
                      <TableRow key={item.batchId}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>{item.batchNumber}</TableCell>
                        <TableCell>{expiry ? expiry.toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{item.totalValue.toFixed(2)}</TableCell>
                        <TableCell>{lastSold ? lastSold.toLocaleDateString() : 'Never Sold'}</TableCell>
                        <TableCell>{typeof item.daysUnsold === 'number' ? `${item.daysUnsold} days` : 'Never Sold'}</TableCell>
                        <TableCell>{item.supplierName || '-'}</TableCell>
                        <TableCell>{item.rackLocation || '-'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
