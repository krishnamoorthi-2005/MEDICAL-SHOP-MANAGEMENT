import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getExpiryLossDetails, ExpiryLossItem } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface ExpiryLossResponse {
  range: { start: string; end: string };
  summary: { totalLoss: number; totalItems: number };
  items: ExpiryLossItem[];
}

export default function ExpiryLossReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ExpiryLossResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const result = await getExpiryLossDetails({ range: '7days' });
        setData(result);
      } catch (e) {
        console.error('Failed to load expiry loss report:', e);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expiry Loss Report</h1>
          <p className="text-muted-foreground/70 font-medium">
            Detailed breakdown of all expired items and financial loss.
          </p>
          {data && (
            <p className="text-xs text-muted-foreground mt-1">
              Period: {data.range.start} to {data.range.end}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Total items expired</span>
            <span className="text-lg font-semibold">{data ? data.summary.totalItems : '…'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground">Total expiry loss</span>
            <span className="text-lg font-semibold">
              {data ? `₹${data.summary.totalLoss.toLocaleString()}` : '…'}
            </span>
          </div>
        </div>
      </div>

      <Card className="micro-interaction">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Expired Items</CardTitle>
            <CardDescription>Each row represents a write-off entry from stock ledger.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground">Loading expiry loss…</div>
          ) : items.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              No expired items recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Showing last {items.length} expiry write-offs.</span>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Expired Date</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Purchase Price</TableHead>
                      <TableHead className="text-right">Total Loss</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={`${item.medicineId}-${item.batchId}-${idx}`}>
                        <TableCell className="font-medium">{item.medicineName}</TableCell>
                        <TableCell>{item.batchNumber}</TableCell>
                        <TableCell>
                          {item.expiryDate ? format(new Date(item.expiryDate), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-center">{item.quantityExpired}</TableCell>
                        <TableCell className="text-right">
                          ₹{(item.unitPrice || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{(item.totalLoss || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.supplierName || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          {item.purchaseDate ? format(new Date(item.purchaseDate), 'dd MMM yyyy') : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
