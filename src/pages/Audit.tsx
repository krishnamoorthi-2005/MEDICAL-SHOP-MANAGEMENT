import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Calendar, AlertTriangle, Play, CheckCircle, Bot, TrendingUp, TrendingDown, Package, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  completeStockAudit,
  getDemandPrediction,
  uploadPredictionDataset,
  getAuditDetails,
  getAuditHistory,
  getLatestInProgressAudit,
  getLatestAuditSummary,
  getMedicines,
  cancelStockAudit,
  startStockAudit,
  updateStockAuditItem,
  getAuditAnalytics,
  type StockAuditItem,
  type StockAuditRecord,
  type StockAuditType,
  type DemandPredictionItem,
  type AuditAnalytics
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type AuditItem = StockAuditItem;

export default function Audit() {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<StockAuditRecord[]>([]);
  const [auditInProgress, setAuditInProgress] = useState(false);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [summaryLastAudit, setSummaryLastAudit] = useState<StockAuditRecord | null>(null);
  const [activeAuditMeta, setActiveAuditMeta] = useState<{ type: StockAuditType; category?: string; rack?: string } | null>(null);

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsAudit, setDetailsAudit] = useState<any>(null);
  const [detailsItems, setDetailsItems] = useState<AuditItem[]>([]);

  // Modal states
  const [showStartAuditModal, setShowStartAuditModal] = useState(false);
  const [showApplyAdjustmentsDialog, setShowApplyAdjustmentsDialog] = useState(false);

  // Audit form
  const [auditType, setAuditType] = useState<StockAuditType>('full');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRack, setSelectedRack] = useState('');

  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableRacks, setAvailableRacks] = useState<string[]>([]);

  // AI prediction assistant state
  const [assistantMonth, setAssistantMonth] = useState<number | null>(null);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState<string | null>(null);
  const [assistantPredictions, setAssistantPredictions] = useState<DemandPredictionItem[]>([]);
  const [assistantPredictionMetadata, setAssistantPredictionMetadata] = useState<any>(null);
  const [assistantDatasetFile, setAssistantDatasetFile] = useState<File | null>(null);
  const [assistantUploading, setAssistantUploading] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState<AuditAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsType, setAnalyticsType] = useState<StockAuditType>('full');
  const [analyticsCategory, setAnalyticsCategory] = useState('');
  const [analyticsRack, setAnalyticsRack] = useState('');
  
  // Analytics history state (stored in localStorage, max 3 entries)
  const [analyticsHistory, setAnalyticsHistory] = useState<Array<{
    id: string;
    timestamp: string;
    type: StockAuditType;
    category?: string;
    rack?: string;
    data: AuditAnalytics;
  }>>([]);

  // Get last audit date
  const lastAudit = summaryLastAudit || (auditLogs.length > 0 ? auditLogs[0] : null);
  const itemsWithMismatch = auditItems.filter(item => item.difference !== 0).length;

  // Load analytics history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('auditAnalyticsHistory');
      if (stored) {
        setAnalyticsHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load analytics history:', error);
    }
  }, []);

  // Save analytics to history (max 3 entries, auto-delete oldest)
  const saveAnalyticsToHistory = (analyticsData: AuditAnalytics, type: StockAuditType, category?: string, rack?: string) => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type,
      category,
      rack,
      data: analyticsData
    };

    // Get current history and add new entry at the beginning
    const updatedHistory = [newEntry, ...analyticsHistory];
    
    // Keep only the most recent 3 entries (delete oldest if exceeds 3)
    const trimmedHistory = updatedHistory.slice(0, 3);
    
    setAnalyticsHistory(trimmedHistory);
    localStorage.setItem('auditAnalyticsHistory', JSON.stringify(trimmedHistory));
  };

  // Load specific history entry
  const loadHistoryEntry = (historyId: string) => {
    const entry = analyticsHistory.find(h => h.id === historyId);
    if (entry) {
      setAnalytics(entry.data);
      setAnalyticsType(entry.type);
      setAnalyticsCategory(entry.category || '');
      setAnalyticsRack(entry.rack || '');
      toast({
        title: 'History Loaded',
        description: `Analytics from ${format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}`,
      });
    }
  };

  // Clear all analytics history
  const clearAnalyticsHistory = () => {
    setAnalyticsHistory([]);
    localStorage.removeItem('auditAnalyticsHistory');
    toast({
      title: 'History Cleared',
      description: 'All analytics history has been deleted',
    });
  };

  const categories = useMemo(() => {
    return availableCategories;
  }, [availableCategories]);

  const racks = useMemo(() => {
    return availableRacks;
  }, [availableRacks]);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const [summary, history, meds, inProgress] = await Promise.all([
          getLatestAuditSummary(),
          getAuditHistory(50),
          getMedicines(),
          getLatestInProgressAudit()
        ]);
        setSummaryLastAudit(summary?.lastAudit ? (summary.lastAudit as any) : null);
        setAuditLogs(history || []);

        if (inProgress?.audit?.id && inProgress?.items?.length) {
          setAuditId(inProgress.audit.id);
          setAuditItems(inProgress.items);
          setAuditInProgress(true);
          setActiveAuditMeta({ type: inProgress.audit.type, category: inProgress.audit.category, rack: inProgress.audit.rack });
          setAuditType(inProgress.audit.type);
          setSelectedCategory(inProgress.audit.category || '');
          setSelectedRack(inProgress.audit.rack || '');
        }

        const cats = new Set<string>();
        const racksSet = new Set<string>();
        (meds || []).forEach((m: any) => {
          if (m?.discontinued) return;
          if (m?.category) cats.add(m.category);
          if (m?.rackLocation) racksSet.add(m.rackLocation);
        });
        setAvailableCategories(Array.from(cats).sort((a, b) => a.localeCompare(b)));
        setAvailableRacks(Array.from(racksSet).sort((a, b) => a.localeCompare(b)));
      } catch (error: any) {
        console.error('Failed to load audit data:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load audit data',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  const refreshAuditSummaryAndHistory = async () => {
    const [summary, history] = await Promise.all([
      getLatestAuditSummary(),
      getAuditHistory(50)
    ]);
    setSummaryLastAudit(summary?.lastAudit ? (summary.lastAudit as any) : null);
    setAuditLogs(history || []);
  };

  const startAudit = async () => {
    try {
      setLoading(true);
      const payload: any = {
        type: auditType,
        performedBy: 'Admin'
      };
      if (auditType === 'category') payload.category = selectedCategory;
      if (auditType === 'rack') payload.rack = selectedRack;

      const data = await startStockAudit(payload);
      setAuditId(data.audit.id);
      setAuditItems(data.items);
      setAuditInProgress(true);
      setActiveAuditMeta({ type: data.audit.type, category: data.audit.category, rack: data.audit.rack });
      setShowStartAuditModal(false);
      toast({ title: 'Audit Started (live)', description: `Auditing ${data.items.length} items` });
    } catch (error: any) {
      // If there's an existing audit in progress (409 conflict)
      if (error.status === 409 && error.existingAuditId) {
        const existingAuditId = error.existingAuditId;
        toast({
          title: 'Audit Already in Progress',
          description: 'An audit is already running. Loading existing audit...',
        });
        
        try {
          // Load the existing audit
          const inProgress = await getLatestInProgressAudit();
          if (inProgress?.audit?.id && inProgress?.items?.length) {
            setAuditId(inProgress.audit.id);
            setAuditItems(inProgress.items);
            setAuditInProgress(true);
            setActiveAuditMeta({ type: inProgress.audit.type, category: inProgress.audit.category, rack: inProgress.audit.rack });
            setAuditType(inProgress.audit.type);
            setSelectedCategory(inProgress.audit.category || '');
            setSelectedRack(inProgress.audit.rack || '');
            setShowStartAuditModal(false);
          }
        } catch (loadError: any) {
          toast({ 
            title: 'Error', 
            description: 'Failed to load existing audit. Please try canceling it first.',
            variant: 'destructive' 
          });
        }
      } else {
        toast({ title: 'Error', description: error.message || 'Failed to start audit', variant: 'destructive' });
      }
    } finally {
      setLoading(false);
    }
  };

  const updatePhysicalQty = (itemId: string, qty: number) => {
    setAuditItems(prev => prev.map(item => {
      if (item.itemId === itemId) {
        return {
          ...item,
          physicalQty: qty,
          difference: qty - item.systemQty
        };
      }
      return item;
    }));
  };

  const finalizeAudit = async () => {
    if (!auditId) {
      toast({ title: 'Error', description: 'No active audit found', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await completeStockAudit(auditId, {
        items: auditItems.map((i) => ({
          itemId: i.itemId,
          medicineId: i.medicineId,
          batchId: i.batchId,
          physicalQty: i.physicalQty,
          note: i.note
        })),
        performedBy: 'Admin'
      });

      setAuditInProgress(false);
      setAuditId(null);
      setAuditItems([]);
      setShowApplyAdjustmentsDialog(false);

      await refreshAuditSummaryAndHistory();

      toast({
        title: 'Audit Completed (saved)',
        description: `${itemsWithMismatch} mismatches recorded. Stock adjusted via ledger movements.`
      });
    } catch (error: any) {
      console.error('Failed to finalize audit:', error);
      toast({ title: 'Error', description: error.message || 'Failed to complete audit', variant: 'destructive' });
      setShowApplyAdjustmentsDialog(false);
    } finally {
      setLoading(false);
    }
  };

  const cancelAudit = () => {
    if (!auditId) {
      setAuditInProgress(false);
      setAuditItems([]);
      return;
    }

    setLoading(true);
    cancelStockAudit(auditId)
      .then(() => {
        setAuditInProgress(false);
        setAuditId(null);
        setAuditItems([]);
        setActiveAuditMeta(null);
        toast({ title: 'Audit cancelled', description: 'In-progress audit session closed.' });
        return refreshAuditSummaryAndHistory();
      })
      .catch((error: any) => {
        toast({ title: 'Error', description: error.message || 'Failed to cancel audit', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  };

  const persistItem = async (itemId: string) => {
    if (!auditId) return;
    const item = auditItems.find((i) => i.itemId === itemId);
    if (!item) return;

    try {
      await updateStockAuditItem(auditId, itemId, { physicalQty: item.physicalQty, note: item.note });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save audit item', variant: 'destructive' });
    }
  };

  const openAuditDetails = async (id: string) => {
    try {
      setDetailsLoading(true);
      setShowDetailsModal(true);
      const data = await getAuditDetails(id);
      console.log('Audit details loaded:', data);
      console.log('Audit items count:', data.items?.length || 0);
      setDetailsAudit(data.audit);
      setDetailsItems(data.items || []);
    } catch (error: any) {
      console.error('Failed to load audit details:', error);
      toast({ title: 'Error', description: error.message || 'Failed to load audit details', variant: 'destructive' });
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      setAnalytics(null); // Clear stale data
      const params: any = { type: analyticsType };
      if (analyticsType === 'category' && analyticsCategory) {
        params.category = analyticsCategory;
      }
      if (analyticsType === 'rack' && analyticsRack) {
        params.rack = analyticsRack;
      }

      const data = await getAuditAnalytics(params);
      setAnalytics(data);
      
      // Auto-save to history (max 3 entries, auto-delete oldest)
      saveAnalyticsToHistory(data, analyticsType, analyticsCategory, analyticsRack);
      
      toast({
        title: 'Analytics Loaded',
        description: 'Analytics saved to history (max 3 entries)',
      });
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load audit analytics',
        variant: 'destructive'
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Audit</h1>
          <p className="text-muted-foreground/70 font-medium">Physical stock verification and reconciliation</p>
        </div>
        {!auditInProgress && (
          <Button onClick={() => setShowStartAuditModal(true)}>
            <Play className="mr-2 h-4 w-4" />
            Start New Audit
          </Button>
        )}
      </div>



      {/* Audit Analytics Section */}
      {!auditInProgress && (
        <Card className="micro-interaction">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Audit Analytics
                </CardTitle>
                <CardDescription>
                  Analyze inventory by expiry, sales performance, and stock status
                </CardDescription>
              </div>
              <div className="flex gap-2 items-center">
                <Select value={analyticsType} onValueChange={(v: StockAuditType) => setAnalyticsType(v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full Inventory</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
                    <SelectItem value="rack">By Rack</SelectItem>
                  </SelectContent>
                </Select>

                {analyticsType === 'category' && (
                  <Select value={analyticsCategory} onValueChange={setAnalyticsCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {analyticsType === 'rack' && (
                  <Select value={analyticsRack} onValueChange={setAnalyticsRack}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Rack" />
                    </SelectTrigger>
                    <SelectContent>
                      {racks.map((rack) => (
                        <SelectItem key={rack} value={rack}>{rack}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <Button onClick={loadAnalytics} disabled={analyticsLoading}>
                  {analyticsLoading ? 'Loading...' : 'Load Analytics'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {analytics && (
              <Tabs defaultValue="expired" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="expired">Expired ({analytics.expired?.count ?? 0})</TabsTrigger>
                  <TabsTrigger value="expiring">Expiring Soon ({analytics.expiringSoon?.count ?? 0})</TabsTrigger>
                  <TabsTrigger value="highSales">High Sales ({analytics.highSales?.count ?? 0})</TabsTrigger>
                  <TabsTrigger value="lowSales">Low Sales ({analytics.lowSales?.count ?? 0})</TabsTrigger>
                  <TabsTrigger value="zeroSales">Zero Sales ({analytics.zeroSales?.count ?? 0})</TabsTrigger>
                  <TabsTrigger value="history">History ({analyticsHistory.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="expired" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Items that have already expired and still have stock
                    </p>
                    <Badge variant="destructive">
                      Total Value: ₹{(analytics.expired?.totalValue ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Generic</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Days Expired</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.expired?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No expired items with remaining stock 🎉
                            </TableCell>
                          </TableRow>
                        ) : (
                          (analytics.expired?.items ?? []).map((item, idx) => (
                            <TableRow key={idx} className="bg-red-100">
                              <TableCell className="font-medium">{item.medicineName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.genericName || 'N/A'}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.batchNumber}</TableCell>
                              <TableCell>{format(new Date(item.expiryDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="destructive">
                                  {Math.floor(item.daysExpired)} days ago
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{item.quantityAvailable}</TableCell>
                              <TableCell className="text-right font-semibold">₹{item.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="expiring" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Items expiring in the next 30 days
                    </p>
                    <Badge variant="destructive">
                      Total Value: ₹{(analytics.expiringSoon?.totalValue ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Generic</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Batch</TableHead>
                          <TableHead>Expiry Date</TableHead>
                          <TableHead className="text-right">Days Left</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.expiringSoon?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No items expiring in the next 30 days
                            </TableCell>
                          </TableRow>
                        ) : (
                          (analytics.expiringSoon?.items ?? []).map((item, idx) => (
                            <TableRow key={idx} className={cn(
                              item.daysUntilExpiry <= 7 && "bg-red-50",
                              item.daysUntilExpiry > 7 && item.daysUntilExpiry <= 15 && "bg-orange-50",
                              item.daysUntilExpiry > 15 && "bg-yellow-50"
                            )}>
                              <TableCell className="font-medium">{item.medicineName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.genericName || 'N/A'}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.batchNumber}</TableCell>
                              <TableCell>{format(new Date(item.expiryDate), 'dd MMM yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant={item.daysUntilExpiry <= 7 ? 'destructive' : 'secondary'}>
                                  {Math.floor(item.daysUntilExpiry)} days
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">{item.quantityAvailable}</TableCell>
                              <TableCell className="text-right font-semibold">₹{item.totalValue.toFixed(2)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="highSales" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Top 20 products with highest sales (Last 90 days)
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="default">
                        Revenue: ₹{(analytics.highSales?.totalRevenue ?? 0).toLocaleString()}
                      </Badge>
                      <Badge variant="default">
                        Profit: ₹{(analytics.highSales?.totalProfit ?? 0).toLocaleString()}
                      </Badge>
                    </div>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Generic</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Qty Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.highSales?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground">
                              No sales data available
                            </TableCell>
                          </TableRow>
                        ) : (
                          (analytics.highSales?.items ?? []).map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{item.medicineName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.genericName || 'N/A'}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right font-semibold">{item.totalQuantitySold}</TableCell>
                              <TableCell className="text-right">₹{item.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">₹{item.totalCost.toFixed(2)}</TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">₹{item.profit.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.saleCount}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="lowSales" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Products with lowest sales (but not zero) - Last 90 days
                    </p>
                    <Badge variant="secondary">
                      Revenue: ₹{(analytics.lowSales?.totalRevenue ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Generic</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Qty Sold</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Profit</TableHead>
                          <TableHead className="text-right">Sales Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.lowSales?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-muted-foreground">
                              No low sales products found
                            </TableCell>
                          </TableRow>
                        ) : (
                          (analytics.lowSales?.items ?? []).map((item, idx) => (
                            <TableRow key={idx} className="bg-orange-50/50">
                              <TableCell className="font-medium">{item.medicineName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.genericName || 'N/A'}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell className="text-right">{item.totalQuantitySold}</TableCell>
                              <TableCell className="text-right">₹{item.totalRevenue.toFixed(2)}</TableCell>
                              <TableCell className="text-right">₹{item.profit.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{item.saleCount}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="zeroSales" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Products with zero sales in the last 90 days
                    </p>
                    <Badge variant="destructive">
                      {analytics.zeroSales?.count ?? 0} products not sold
                    </Badge>
                  </div>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Medicine</TableHead>
                          <TableHead>Generic</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Rack</TableHead>
                          <TableHead className="text-right">Current Stock</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(analytics.zeroSales?.items ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                              All products have sales! 🎉
                            </TableCell>
                          </TableRow>
                        ) : (
                          (analytics.zeroSales?.items ?? []).map((item, idx) => (
                            <TableRow key={idx} className="bg-red-50/50">
                              <TableCell className="font-medium">{item.medicineName}</TableCell>
                              <TableCell className="text-muted-foreground">{item.genericName}</TableCell>
                              <TableCell>{item.category}</TableCell>
                              <TableCell>{item.rack}</TableCell>
                              <TableCell className="text-right">
                                <Badge variant="outline">{item.currentStock || 0} units</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="mt-4 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Stored analytics history (maximum 3 entries)
                    </p>
                    {analyticsHistory.length > 0 && (
                      <Button variant="destructive" size="sm" onClick={clearAnalyticsHistory}>
                        Clear All History
                      </Button>
                    )}
                  </div>
                  
                  {analyticsHistory.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30 text-muted-foreground" />
                      <p className="text-muted-foreground">No analytics history yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Load analytics to automatically save to history</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analyticsHistory.map((entry, index) => (
                        <Card key={entry.id} className="border-2 hover:border-primary/50 transition-colors">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Badge variant="outline">
                                    #{analyticsHistory.length - index}
                                  </Badge>
                                  {entry.type === 'full' && 'Full Inventory Analytics'}
                                  {entry.type === 'category' && `Category: ${entry.category}`}
                                  {entry.type === 'rack' && `Rack: ${entry.rack}`}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}
                                </CardDescription>
                              </div>
                              <Button size="sm" onClick={() => loadHistoryEntry(entry.id)}>
                                Load This Report
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                              <div className="text-center p-3 bg-red-50 rounded-lg">
                                <div className="text-2xl font-bold text-red-600">{entry.data.expired?.count ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">Expired</div>
                              </div>
                              <div className="text-center p-3 bg-orange-50 rounded-lg">
                                <div className="text-2xl font-bold text-orange-600">{entry.data.expiringSoon?.count ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">Expiring Soon</div>
                              </div>
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{entry.data.highSales?.count ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">High Sales</div>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-2xl font-bold text-yellow-600">{entry.data.lowSales?.count ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">Low Sales</div>
                              </div>
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-600">{entry.data.zeroSales?.count ?? 0}</div>
                                <div className="text-xs text-muted-foreground mt-1">Zero Sales</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {!analytics && !analyticsLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select audit type and click "Load Analytics" to view insights</p>
                <p className="text-sm mt-2">Analytics will be automatically saved to history (max 3 entries)</p>
              </div>
            )}

            {analyticsLoading && (
              <div className="text-center py-12 text-muted-foreground">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p>Loading analytics...</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* AI Audit Assistant - Prediction Chat */}
      {!auditInProgress && (
        <Card className="micro-interaction">
          <CardHeader className="flex flex-row items-start justify-between gap-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">AI Audit Assistant</CardTitle>
                <CardDescription>
                  Uses the last 12 months of sales to forecast medicine demand for a future month.
                </CardDescription>
              </div>
            </div>
            <div className="space-y-2 text-sm max-w-md">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="font-medium mb-1">How this works</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Model is trained on 1 year of stock ledger data.</li>
                  <li>Select which month you want the system to predict.</li>
                  <li>Shows sales from the same month last year, current stock, and recommended purchases.</li>
                </ol>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </span>
                  Bot: Which month should I predict for?
                </p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <Button
                      key={m}
                      type="button"
                      size="sm"
                      variant={assistantMonth === m ? 'default' : 'outline'}
                      onClick={() => setAssistantMonth(m)}
                    >
                      {new Date(2000, m - 1, 1).toLocaleString('en-US', { month: 'short' })}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <Button
                  type="button"
                  onClick={async () => {
                    if (!assistantMonth) {
                      setAssistantError('Please select a month first.');
                      return;
                    }
                    try {
                      setAssistantLoading(true);
                      setAssistantError(null);
                      
                      // Handle dataset upload if file is provided
                      if (assistantDatasetFile) {
                        setAssistantUploading(true);
                        try {
                          const result = await uploadPredictionDataset(assistantDatasetFile);
                          toast({
                            title: 'Dataset uploaded',
                            description:
                              result.message || 'Dataset uploaded and model prepared successfully.',
                          });
                          // Clear the file input after successful upload
                          setAssistantDatasetFile(null);
                          const fileInput = document.getElementById('assistantDataset') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        } catch (uploadError: any) {
                          console.error('Dataset upload error:', uploadError);
                          setAssistantUploading(false);
                          setAssistantLoading(false);
                          setAssistantPredictions([]);
                          
                          // Extract error details
                          let errorMsg = uploadError?.message || 'Failed to upload dataset';
                          const details = uploadError?.details || '';
                          
                          // The backend now provides specific, actionable error messages
                          // Just display them directly without further processing
                          if (details && details.includes('[ERROR]')) {
                            // Extract the actual error line from Python output
                            const errorLines = details.split('\n').filter((l: string) => l.includes('[ERROR]'));
                            if (errorLines.length > 0) {
                              errorMsg = errorLines[errorLines.length - 1].replace(/\[ERROR\]/g, '').trim();
                            }
                          }
                          
                          setAssistantError(errorMsg);
                          return; // Stop execution if upload fails
                        } finally {
                          setAssistantUploading(false);
                        }
                      }

                      // Get predictions
                      const result = await getDemandPrediction(assistantMonth);
                      setAssistantPredictions(result.data || []);
                      setAssistantPredictionMetadata(result.metadata || null);
                      if (!result.data || result.data.length === 0) {
                        setAssistantError('No prediction data available. Please upload a training dataset first.');
                      }
                    } catch (error: any) {
                      console.error('Audit assistant prediction error:', error);
                      setAssistantPredictions([]);
                      const rawMessage = error?.message || 'Failed to run prediction';
                      const friendlyMessage = rawMessage.includes('Training dataset not found')
                        ? 'No training data found. Please upload a sales dataset (CSV) first.'
                        : rawMessage.includes('AI model not trained yet')
                        ? 'AI model not trained yet. Please upload a 1-year sales dataset first.'
                        : rawMessage;
                      setAssistantError(friendlyMessage);
                    } finally {
                      setAssistantLoading(false);
                    }
                  }}
                  disabled={assistantLoading || assistantUploading}
                >
                  {assistantUploading
                    ? 'Uploading & Training…'
                    : assistantLoading
                      ? 'Thinking…'
                      : assistantDatasetFile
                        ? 'Upload Dataset & Ask Bot'
                        : 'Ask Bot for Prediction'}
                </Button>
                <p className="text-xs text-muted-foreground max-w-xs text-right">
                  Tip: You can either rely on the last trained model or attach a fresh CSV dataset here. The bot will upload, retrain, and then answer for the selected month.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1.2fr] items-center">
              <div className="space-y-1">
                <Label htmlFor="assistantDataset" className="text-sm font-medium">
                  Optional: Upload dataset (CSV) for this prediction
                </Label>
                <Input
                  id="assistantDataset"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setAssistantDatasetFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Use the dataset you downloaded from Settings → AI Prediction Dataset or a compatible 1-year sales CSV.
                </p>
              </div>
              <div className="text-xs text-muted-foreground md:text-right">
                When a file is attached, the assistant will first retrain the AI model with that
                dataset, then generate purchase recommendations for the chosen month.
              </div>
            </div>

            {assistantError && (
              <p className="text-xs text-red-500">{assistantError}</p>
            )}

            {assistantPredictions.length > 0 && (
              <div className="mt-2 border rounded-md max-h-[320px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medicine</TableHead>
                      <TableHead className="text-right">
                        {assistantPredictionMetadata?.monthName && assistantPredictionMetadata?.previousYear
                          ? `${assistantPredictionMetadata.monthName} ${assistantPredictionMetadata.previousYear} Sales`
                          : 'Previous Year Sales'}
                      </TableHead>
                      <TableHead className="text-right">Current Stock</TableHead>
                      <TableHead className="text-right">Recommended Purchase</TableHead>
                      <TableHead className="text-right">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assistantPredictions.map((p) => (
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
                          {typeof p.confidence === 'number' ? `${Math.round(p.confidence * 100)}%` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Audit View */}
      {auditInProgress && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
                Audit in Progress
              </CardTitle>
              <CardDescription>
                {(activeAuditMeta?.type || auditType) === 'full'
                  ? 'Full Inventory Audit'
                  : (activeAuditMeta?.type || auditType) === 'category'
                    ? `Category: ${activeAuditMeta?.category || selectedCategory}`
                    : `Rack: ${activeAuditMeta?.rack || selectedRack}`} · {auditItems.length} items
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={cancelAudit}>Cancel Audit</Button>
              <Button
                onClick={() => setShowApplyAdjustmentsDialog(true)}
                disabled={loading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {itemsWithMismatch === 0 ? 'Complete Audit' : `Review & Complete (${itemsWithMismatch})`}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Medicine</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-center">System Qty</TableHead>
                  <TableHead className="text-center">Physical Qty</TableHead>
                  <TableHead className="text-center">Difference</TableHead>
                  <TableHead className="text-right">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditItems.map((item) => (
                  <TableRow
                    key={item.itemId}
                    className={cn(
                      item.difference < 0 && "bg-red-50",
                      item.difference > 0 && "bg-green-50"
                    )}
                  >
                    <TableCell className="font-medium">{item.medicineName}</TableCell>
                    <TableCell className="text-muted-foreground">{item.batchNumber || '—'}</TableCell>
                    <TableCell className="text-center">{item.systemQty}</TableCell>
                    <TableCell className="text-center">
                      <Input
                        type="number"
                        value={item.physicalQty}
                        onChange={(e) => updatePhysicalQty(item.itemId, parseInt(e.target.value) || 0)}
                        onBlur={() => persistItem(item.itemId)}
                        className="w-24 text-center mx-auto"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "font-semibold",
                        item.difference < 0 && "text-destructive",
                        item.difference > 0 && "text-green-600",
                        item.difference === 0 && "text-muted-foreground"
                      )}>
                        {item.difference > 0 && '+'}{item.difference}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        placeholder="Note (optional)"
                        value={item.note || ''}
                        onChange={(e) =>
                          setAuditItems((prev) =>
                            prev.map((p) =>
                              p.itemId === item.itemId ? { ...p, note: e.target.value } : p
                            )
                          )
                        }
                        onBlur={() => persistItem(item.itemId)}
                        className="h-9"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Analytics History Section */}
      {!auditInProgress && analyticsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Analytics History
                </CardTitle>
                <CardDescription>Recent audit analytics reports (max 3 entries)</CardDescription>
              </div>
              <Button variant="destructive" size="sm" onClick={clearAnalyticsHistory}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsHistory.map((entry, index) => (
                <Card key={entry.id} className="border-2 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => loadHistoryEntry(entry.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">
                            #{analyticsHistory.length - index}
                          </Badge>
                          <span className="font-semibold">
                            {entry.type === 'full' && 'Full Inventory Analytics'}
                            {entry.type === 'category' && `Category: ${entry.category}`}
                            {entry.type === 'rack' && `Rack: ${entry.rack}`}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={(e) => {
                        e.stopPropagation();
                        loadHistoryEntry(entry.id);
                      }}>
                        Load Report
                      </Button>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <div className="text-center p-2 bg-red-50 rounded">
                        <div className="text-xl font-bold text-red-600">{entry.data.expired?.count ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground">Expired</div>
                      </div>
                      <div className="text-center p-2 bg-orange-50 rounded">
                        <div className="text-xl font-bold text-orange-600">{entry.data.expiringSoon?.count ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground">Expiring</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-xl font-bold text-green-600">{entry.data.highSales?.count ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground">High Sales</div>
                      </div>
                      <div className="text-center p-2 bg-yellow-50 rounded">
                        <div className="text-xl font-bold text-yellow-600">{entry.data.lowSales?.count ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground">Low Sales</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-xl font-bold text-gray-600">{entry.data.zeroSales?.count ?? 0}</div>
                        <div className="text-[10px] text-muted-foreground">Zero Sales</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}



      {/* Start Audit Modal */}
      <Dialog open={showStartAuditModal} onOpenChange={setShowStartAuditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Audit</DialogTitle>
            <DialogDescription>Choose audit type and scope</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <RadioGroup value={auditType} onValueChange={(v) => setAuditType(v as StockAuditType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="cursor-pointer">Full Inventory Audit</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="category" id="category" />
                <Label htmlFor="category" className="cursor-pointer">Audit by Category</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rack" id="rack" />
                <Label htmlFor="rack" className="cursor-pointer">Audit by Rack (optional)</Label>
              </div>
            </RadioGroup>

            {auditType === 'category' && (
              <div className="grid gap-2">
                <Label>Select Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {auditType === 'rack' && (
              <div className="grid gap-2">
                <Label>Select Rack</Label>
                <Select value={selectedRack} onValueChange={setSelectedRack}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose rack" />
                  </SelectTrigger>
                  <SelectContent>
                    {racks.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {loading && (
              <div className="text-sm text-muted-foreground">Loading…</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartAuditModal(false)}>Cancel</Button>
            <Button
              onClick={startAudit}
              disabled={loading || (auditType === 'category' && !selectedCategory) || (auditType === 'rack' && !selectedRack)}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Audit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Adjustments Confirmation */}
      <AlertDialog open={showApplyAdjustmentsDialog} onOpenChange={setShowApplyAdjustmentsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Audit</AlertDialogTitle>
            <AlertDialogDescription>
                {itemsWithMismatch === 0
                  ? 'No differences found. This will complete the audit and save it to history.'
                  : `Mismatches found for ${itemsWithMismatch} items. Completing will create ledger movements (AUDIT_ADJUSTMENT) and reconcile inventory.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4 rounded-lg border p-4">
            <div className="text-sm font-medium mb-2">Summary:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Items audited:</div>
              <div className="font-medium">{auditItems.length}</div>
              <div>Items with differences:</div>
              <div className="font-medium">{itemsWithMismatch}</div>
              <div>Shortages (red):</div>
              <div className="font-medium text-destructive">
                {auditItems.filter(i => i.difference < 0).length}
              </div>
              <div>Excess (green):</div>
              <div className="font-medium text-green-600">
                {auditItems.filter(i => i.difference > 0).length}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={finalizeAudit}>
              Confirm & Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Audit Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Audit Details</DialogTitle>
            <DialogDescription>
              {detailsAudit
                ? `${detailsAudit.type}${detailsAudit.category ? ` · ${detailsAudit.category}` : ''}${detailsAudit.rack ? ` · ${detailsAudit.rack}` : ''}`
                : 'Loading…'}
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="text-sm text-muted-foreground">Loading details…</div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead className="text-center">System</TableHead>
                    <TableHead className="text-center">Physical</TableHead>
                    <TableHead className="text-center">Diff</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailsItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No audit items found for this audit
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailsItems.map((i) => (
                      <TableRow key={i.itemId}>
                        <TableCell className="font-medium">{i.medicineName}</TableCell>
                        <TableCell className="text-muted-foreground">{i.batchNumber || '—'}</TableCell>
                        <TableCell className="text-center">{i.systemQty}</TableCell>
                        <TableCell className="text-center">{i.physicalQty}</TableCell>
                        <TableCell className="text-center">{i.difference}</TableCell>
                        <TableCell className="text-muted-foreground">{i.note || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
