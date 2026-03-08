import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, DollarSign, PackageX, AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { getReportsAnalytics, resetExpiryLoss } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type ReportData = {
  range: { start: string; end: string };
  totals: { totalSales: number; netProfit: number; billCount: number; itemsSold: number };
  dailySales: Array<{ date: string; sales: number; profit: number; bills: number; itemsSold: number }>;
  paymentModes: Array<{ mode: string; count: number; total: number }>;
  topSellingItems: Array<{ name: string; quantity: number; revenue: number }>;
  recentInvoices: Array<{ invoiceNumber: string; total: number; paymentMethod?: string; items: number; createdAt: string }>;
  expiryLoss: number;
  expiredItemCount: number;
  deadStockValue?: number;
  deadStockItems?: number;
};

const PIE_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#6b7280'];

export default function Reports() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('7days');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await getReportsAnalytics({ range: dateRange as any });
        setReport(data);
      } catch (e) {
        console.error('Failed to load reports analytics:', e);
        setReport(null);
      } finally {
        setLoading(false);
      }
    };
    run();

    const handleRefresh = () => {
      run();
    };

    window.addEventListener('sale-completed', handleRefresh);
    window.addEventListener('purchase-completed', handleRefresh);
    window.addEventListener('stock-adjusted', handleRefresh);

    return () => {
      window.removeEventListener('sale-completed', handleRefresh);
      window.removeEventListener('purchase-completed', handleRefresh);
      window.removeEventListener('stock-adjusted', handleRefresh);
    };
  }, [dateRange]);

  const handleResetExpiryLoss = async () => {
    if (!window.confirm('Reset all recorded expiry loss? This will clear expiry loss analytics but will not change stock.')) {
      return;
    }

    try {
      await resetExpiryLoss();
      toast({ title: 'Expiry Loss Reset', description: 'Expiry loss analytics have been reset.' });

      // Trigger a global refresh so Reports/Dashboard re-read from the ledger
      window.dispatchEvent(new CustomEvent('stock-adjusted'));
    } catch (error: any) {
      console.error('Failed to reset expiry loss:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to reset expiry loss',
        variant: 'destructive',
      });
    }
  };

  const totals = report?.totals;
  const totalSales = totals?.totalSales || 0;
  const netProfit = totals?.netProfit || 0;
  const deadStockItems = report?.deadStockItems || 0;
  const expiryLoss = report?.expiryLoss || 0;
  const expiredItemCount = report?.expiredItemCount || 0;

  const paymentModes = report?.paymentModes || [];
  const paymentModeChart = paymentModes.map((p) => ({ name: p.mode.toUpperCase(), value: p.total, count: p.count }));

  const filteredInvoices = useMemo(() => {
    const invoices = report?.recentInvoices || [];
    if (!selectedPaymentMode) return invoices;
    return invoices.filter((i) => (i.paymentMethod || '').toLowerCase() === selectedPaymentMode.toLowerCase());
  }, [report, selectedPaymentMode]);

  const exportInvoicesCsv = () => {
    if (!report) return;
    const rows = [
      ['invoiceNumber', 'date', 'total', 'paymentMethod', 'items'],
      ...filteredInvoices.map((i) => [
        i.invoiceNumber,
        i.createdAt ? format(new Date(i.createdAt), 'yyyy-MM-dd HH:mm') : '',
        String(i.total ?? 0),
        String(i.paymentMethod ?? ''),
        String(i.items ?? 0)
      ])
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-invoices-${report.range.start}-to-${report.range.end}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          {/* ... header ... */}
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground/70 font-medium">Business intelligence and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          {/* ... selects ... */}
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={selectedPaymentMode || 'all'} onValueChange={(v) => setSelectedPaymentMode(v === 'all' ? null : v)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All payment modes</SelectItem>
            {paymentModes.map((p) => (
              <SelectItem key={p.mode} value={p.mode}>{p.mode.toUpperCase()} ({p.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportInvoicesCsv} disabled={loading || !report || filteredInvoices.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="micro-interaction">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Sales</div>
                <div className="text-2xl font-semibold">{loading ? '…' : `₹${totalSales.toLocaleString()}`}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="micro-interaction">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Net Profit</div>
                <div className="text-2xl font-semibold">{loading ? '…' : `₹${netProfit.toLocaleString()}`}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="micro-interaction cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/reports/dead-stock')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <PackageX className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Dead Stock</div>
                <div className="text-2xl font-semibold">{loading ? '…' : deadStockItems}</div>
                <div className="text-xs text-muted-foreground">items unsold 7+ days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="micro-interaction cursor-pointer hover:shadow-md transition"
          onClick={() => navigate('/reports/expiry-loss')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Expiry Loss</div>
                <div className="text-2xl font-semibold">{loading ? '…' : `₹${expiryLoss.toLocaleString()}`}</div>
                {!loading && report && (
                  <div className="text-xs text-muted-foreground">{report.expiredItemCount} items expired in stock</div>
                )}
                <div className="mt-2 flex gap-2">
                  <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); handleResetExpiryLoss(); }}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <Card className="col-span-1 lg:col-span-2 micro-interaction">
          <CardHeader>
            <CardTitle className="text-base">Sales Trend</CardTitle>
            <CardDescription>
              Daily sales over the selected period
              {!loading && report && (
                <span className="ml-2 text-xs">
                  ({format(new Date(report.range.start), 'dd MMM')} - {format(new Date(report.range.end), 'dd MMM yyyy')})
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !report ? (
              <div className="h-72 flex items-center justify-center flex-col border-2 border-dashed rounded-lg border-muted">
                <p className="text-muted-foreground font-medium">Loading sales data…</p>
              </div>
            ) : report.dailySales.length === 0 ? (
              <div className="h-72 flex items-center justify-center flex-col border-2 border-dashed rounded-lg border-muted">
                <p className="text-muted-foreground font-medium">No sales data recorded yet</p>
                <p className="text-xs text-muted-foreground">Transactions will appear here once you start billing</p>
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={report.dailySales} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(v) => format(new Date(v), 'dd MMM')}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(v) => format(new Date(String(v)), 'dd MMM yyyy')} 
                      formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, 'Sales']} 
                    />
                    <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Mode Pie */}
        <Card className="micro-interaction">
          <CardHeader>
            <CardTitle className="text-base">Payment Mode</CardTitle>
            <CardDescription>Distribution by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !report ? (
              <div className="h-48 flex items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg border-muted mb-4">
                Loading…
              </div>
            ) : paymentModeChart.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-center text-muted-foreground border-2 border-dashed rounded-lg border-muted mb-4">
                No payment data
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentModeChart} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {paymentModeChart.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: any) => `₹${Number(v).toLocaleString()}`}
                        labelFormatter={(label: any) => String(label)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Always show available payment modes (even if 0) */}
                <div className="space-y-2">
                  {paymentModes.map((p, idx) => (
                    <div key={p.mode} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span className="font-medium">{p.mode.toUpperCase()}</span>
                        <span className="text-muted-foreground">({p.count})</span>
                      </div>
                      <div className="font-semibold">₹{(p.total || 0).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Selling & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Items */}
        <Card className="micro-interaction">
          <CardHeader>
            <CardTitle className="text-base">Top Selling Items</CardTitle>
            <CardDescription>By quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            {loading || !report ? (
              <div className="h-64 flex items-center justify-center flex-col text-muted-foreground border-2 border-dashed rounded-lg border-muted">
                <p>Loading…</p>
              </div>
            ) : report.topSellingItems.length === 0 ? (
              <div className="h-64 flex items-center justify-center flex-col text-muted-foreground border-2 border-dashed rounded-lg border-muted">
                <p>No items sold</p>
              </div>
            ) : (
              <div className="space-y-3">
                {report.topSellingItems.slice(0, 8).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.quantity} sold</div>
                    </div>
                    <div className="font-bold text-sm">₹{item.revenue.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="col-span-1 lg:col-span-2 micro-interaction">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Invoices</CardTitle>
              <CardDescription>All transactions</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !report ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">Loading…</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="h-64 flex items-center justify-center flex-col text-center">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Download className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">No invoices found</h3>
                <p className="text-muted-foreground mb-4">Try changing the date range or payment mode filter.</p>
                <Button asChild>
                  <a href="/billing">Go to Billing</a>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-center">Items</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.slice(0, 15).map((inv) => (
                    <TableRow key={inv.invoiceNumber}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.createdAt ? format(new Date(inv.createdAt), 'dd MMM yyyy, HH:mm') : '-'}</TableCell>
                      <TableCell>{(inv.paymentMethod || '-').toUpperCase()}</TableCell>
                      <TableCell className="text-center">{inv.items}</TableCell>
                      <TableCell className="text-right font-semibold">₹{(inv.total || 0).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
