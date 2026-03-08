import { useState, useEffect } from 'react';
import { Plus, Zap, Package, Trash2, Calendar as CalendarIcon, Search, Edit, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  createSupplier, 
  getSuppliers, 
  createPurchase, 
  getPurchases,
  getLowStockItems,
  searchMedicines,
  updatePurchaseStatus,
  deletePurchase
} from '@/lib/api';

interface Supplier {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  status: string;
}

interface PurchaseItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  batchNumber: string;
  expiryDate: Date;
  mrp: number;
}

interface Purchase {
  _id: string;
  poNumber: string;
  supplierId: { _id: string; name: string; phone: string };
  items: PurchaseItem[];
  totalAmount: number;
  status: string;
  expectedDeliveryDate: string;
  createdAt: string;
}

interface LowStockItem {
  _id: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  suggestedQuantity: number;
  lastPurchasePrice: number;
}

export default function Purchases() {
  const { toast } = useToast();
  
  // State
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // Modal states
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showSmartReorderModal, setShowSmartReorderModal] = useState(false);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');

  // Form states
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    email: '',
    gstNumber: '',
    address: ''
  });

  const [poForm, setPOForm] = useState({
    supplierId: '',
    expectedDeliveryDate: undefined as Date | undefined,
    items: [] as Array<{
      medicineId: string;
      medicineName: string;
      quantity: string;
      unitPrice: string;
      batchNumber: string;
      mrp: string;
      expiryDate: Date | undefined;
    }>
  });

  const [newItem, setNewItem] = useState({
    medicineId: '',
    medicineName: '',
    quantity: '',
    unitPrice: '',
    batchNumber: '',
    mrp: '',
    expiryDate: undefined as Date | undefined
  });

  const [medicineSearch, setMedicineSearch] = useState('');
  const [medicineResults, setMedicineResults] = useState<any[]>([]);
  const [showMedicineResults, setShowMedicineResults] = useState(false);

  // Load data
  useEffect(() => {
    loadPurchases();
    loadSuppliers();
  }, []);

  const loadPurchases = async () => {
    try {
      setIsLoading(true);
      const result = await getPurchases({ limit: 50 });
      setPurchases(result.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load purchases',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers({ status: 'active' });
      setSuppliers(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load suppliers',
        variant: 'destructive'
      });
    }
  };

  const loadLowStock = async () => {
    try {
      const data = await getLowStockItems();
      setLowStockItems(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load low stock items',
        variant: 'destructive'
      });
    }
  };

  // Search medicines
  useEffect(() => {
    if (medicineSearch.length < 2) {
      setMedicineResults([]);
      setShowMedicineResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchMedicines(medicineSearch);
        setMedicineResults(results);
        setShowMedicineResults(true);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [medicineSearch]);

  // Add supplier
  const handleAddSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast({
        title: 'Error',
        description: 'Name and phone are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      await createSupplier(supplierForm);
      toast({
        title: 'Success',
        description: 'Supplier added successfully'
      });
      setShowAddSupplierModal(false);
      setSupplierForm({ name: '', phone: '', email: '', gstNumber: '', address: '' });
      loadSuppliers();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add supplier',
        variant: 'destructive'
      });
    }
  };

  // Add item to PO
  const addItemToPO = () => {
    if (!newItem.medicineId || !newItem.quantity || !newItem.unitPrice) {
      toast({
        title: 'Error',
        description: 'Please fill medicine, quantity and price',
        variant: 'destructive'
      });
      return;
    }

    setPOForm(prev => ({
      ...prev,
      items: [...prev.items, { ...newItem }]
    }));

    setNewItem({
      medicineId: '',
      medicineName: '',
      quantity: '',
      unitPrice: '',
      batchNumber: '',
      mrp: '',
      expiryDate: undefined
    });
    setMedicineSearch('');
  };

  const removeItemFromPO = (index: number) => {
    setPOForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Calculate total
  const calculateTotal = () => {
    return poForm.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
    }, 0);
  };

  // Create purchase
  const handleCreatePurchase = async () => {
    if (!poForm.supplierId) {
      toast({
        title: 'Error',
        description: 'Please select a supplier',
        variant: 'destructive'
      });
      return;
    }

    if (poForm.items.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one item',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const purchaseData = {
        supplierId: poForm.supplierId,
        expectedDeliveryDate: poForm.expectedDeliveryDate?.toISOString(),
        items: poForm.items.map(item => ({
          medicineId: item.medicineId,
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
          expiryDate: item.expiryDate?.toISOString() || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          mrp: parseFloat(item.mrp) || parseFloat(item.unitPrice) * 1.3
        }))
      };

      await createPurchase(purchaseData);

      toast({
        title: 'Success',
        description: 'Purchase order created successfully'
      });

      setShowCreatePOModal(false);
      setPOForm({
        supplierId: '',
        expectedDeliveryDate: undefined,
        items: []
      });
      
      loadPurchases();

      // Notify other views that purchase/stock levels have changed
      window.dispatchEvent(new CustomEvent('purchase-completed'));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create purchase',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Smart reorder
  const handleSmartReorder = async () => {
    await loadLowStock();
    setShowSmartReorderModal(true);
  };

  const createReorderPO = () => {
    if (lowStockItems.length === 0) return;

    setPOForm(prev => ({
      ...prev,
      items: lowStockItems.map(item => ({
        medicineId: item._id,
        medicineName: item.name,
        quantity: item.suggestedQuantity.toString(),
        unitPrice: item.lastPurchasePrice.toString(),
        batchNumber: `BATCH-${Date.now()}`,
        mrp: (item.lastPurchasePrice * 1.3).toString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }))
    }));

    setShowSmartReorderModal(false);
    setShowCreatePOModal(true);
  };

  // Update purchase status
  const handleOpenStatusUpdate = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setNewStatus(purchase.status);
    setShowStatusUpdateDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedPurchase || !newStatus) return;

    try {
      setIsLoading(true);
      await updatePurchaseStatus(selectedPurchase._id, newStatus);
      
      toast({
        title: 'Success',
        description: newStatus === 'received' 
          ? 'Status updated and inventory has been updated!' 
          : 'Purchase status updated successfully'
      });

      setShowStatusUpdateDialog(false);
      setSelectedPurchase(null);
      loadPurchases();

      // Notify other views that purchase/stock levels have changed
      if (newStatus === 'received') {
        window.dispatchEvent(new CustomEvent('purchase-completed'));
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update purchase status',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete purchase
  const handleOpenDelete = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setShowDeleteDialog(true);
  };

  const handleDeletePurchase = async () => {
    if (!selectedPurchase) return;

    try {
      setIsLoading(true);
      await deletePurchase(selectedPurchase._id);
      
      toast({
        title: 'Success',
        description: 'Purchase deleted successfully'
      });

      setShowDeleteDialog(false);
      setSelectedPurchase(null);
      loadPurchases();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete purchase',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase orders and suppliers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddSupplierModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
          <Button variant="outline" onClick={handleSmartReorder}>
            <Zap className="mr-2 h-4 w-4" />
            Smart Reorder
          </Button>
          <Button onClick={() => setShowCreatePOModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Purchase
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suppliers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : purchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No purchases yet. Create your first purchase order.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase._id}>
                    <TableCell className="font-medium">{purchase.poNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{purchase.supplierId.name}</div>
                        <div className="text-sm text-muted-foreground">{purchase.supplierId.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{purchase.items.length} items</TableCell>
                    <TableCell>₹{purchase.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={
                        purchase.status === 'received' ? 'default' :
                        purchase.status === 'upcoming' ? 'secondary' :
                        'destructive'
                      }>
                        {purchase.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(purchase.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenStatusUpdate(purchase)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleOpenDelete(purchase)}
                          disabled={purchase.status === 'received'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Modal */}
      <Dialog open={showAddSupplierModal} onOpenChange={setShowAddSupplierModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Add a new supplier to your database</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Supplier Name *</Label>
              <Input
                id="name"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                placeholder="ABC Pharma Ltd"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gst">GST Number</Label>
              <Input
                id="gst"
                value={supplierForm.gstNumber}
                onChange={(e) => setSupplierForm({ ...supplierForm, gstNumber: e.target.value })}
                placeholder="29ABCDE1234F1Z5"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                placeholder="123 Street, City"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplierModal(false)}>Cancel</Button>
            <Button onClick={handleAddSupplier}>Add Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Smart Reorder Modal */}
      <Dialog open={showSmartReorderModal} onOpenChange={setShowSmartReorderModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Smart Reorder Suggestions</DialogTitle>
            <DialogDescription>Items below minimum stock level</DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                All items are adequately stocked!
              </div>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item._id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Current: {item.currentStock} | Min: {item.minStock} | Max: {item.maxStock}
                        </div>
                      </div>
                      <Badge variant="destructive">Low Stock</Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      Suggested Order: <span className="font-semibold">{item.suggestedQuantity} units</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSmartReorderModal(false)}>Cancel</Button>
            <Button onClick={createReorderPO} disabled={lowStockItems.length === 0}>
              Create Purchase from Suggestions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Purchase Modal */}
      <Dialog open={showCreatePOModal} onOpenChange={setShowCreatePOModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
            <DialogDescription>Add items and supplier details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Supplier Selection */}
            <div className="grid gap-2">
              <Label>Supplier *</Label>
              <Select value={poForm.supplierId} onValueChange={(v) => setPOForm({ ...poForm, supplierId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier._id} value={supplier._id}>
                      {supplier.name} - {supplier.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Expected Delivery */}
            <div className="grid gap-2">
              <Label>Expected Delivery</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("justify-start text-left font-normal", !poForm.expectedDeliveryDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {poForm.expectedDeliveryDate ? format(poForm.expectedDeliveryDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={poForm.expectedDeliveryDate} onSelect={(date) => setPOForm({ ...poForm, expectedDeliveryDate: date })} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Add Item Section */}
            <div className="border rounded-lg p-4 space-y-3">
              <Label className="text-base font-semibold">Add Item</Label>
              
              <div className="relative">
                <Label>Medicine *</Label>
                <Input
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                  placeholder="Search medicine..."
                  onFocus={() => setShowMedicineResults(medicineResults.length > 0)}
                />
                {showMedicineResults && medicineResults.length > 0 && (
                  <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
                    <CardContent className="p-2">
                      {medicineResults.map((medicine) => (
                        <button
                          key={medicine._id}
                          onClick={() => {
                            setNewItem({ 
                              ...newItem, 
                              medicineId: medicine._id, 
                              medicineName: medicine.name,
                              mrp: medicine.mrp?.toString() || ''
                            });
                            setMedicineSearch(medicine.name);
                            setShowMedicineResults(false);
                          }}
                          className="w-full text-left p-2 hover:bg-muted rounded"
                        >
                          <div className="font-medium">{medicine.name}</div>
                          <div className="text-sm text-muted-foreground">Stock: {medicine.stock}</div>
                        </button>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label>Purchase Price *</Label>
                  <Input
                    type="number"
                    value={newItem.unitPrice}
                    onChange={(e) => setNewItem({ ...newItem, unitPrice: e.target.value })}
                    placeholder="10.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>MRP</Label>
                  <Input
                    type="number"
                    value={newItem.mrp}
                    onChange={(e) => setNewItem({ ...newItem, mrp: e.target.value })}
                    placeholder="13.00"
                  />
                </div>
                <div>
                  <Label>Expiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newItem.expiryDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newItem.expiryDate ? format(newItem.expiryDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={newItem.expiryDate} onSelect={(date) => setNewItem({ ...newItem, expiryDate: date })} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button onClick={addItemToPO} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            {/* Items List */}
            {poForm.items.length > 0 && (
              <div className="border rounded-lg p-4">
                <Label className="text-base font-semibold mb-3 block">Items ({poForm.items.length})</Label>
                <div className="space-y-2">
                  {poForm.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.medicineName}</div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.unitPrice} = ₹{(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toFixed(2)}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeItemFromPO(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold">₹{calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreatePOModal(false)}>Cancel</Button>
            <Button onClick={handleCreatePurchase} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={showStatusUpdateDialog} onOpenChange={setShowStatusUpdateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Update Purchase Status</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Current Status</Label>
              <p className="text-sm text-muted-foreground mt-1 capitalize">{selectedPurchase?.status}</p>
            </div>
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status" className="w-full mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="not received">Not Received</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newStatus === 'received' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Changing status to "Received" will automatically update the inventory with the items from this purchase order.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateStatus} disabled={isLoading || !newStatus}>
              {isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedPurchase?.status === 'received' ? (
                <span className="text-destructive font-medium">
                  Cannot delete this purchase order because it has already been received and inventory has been updated.
                </span>
              ) : (
                <>
                  Are you sure you want to delete this purchase order?
                  <br />
                  <strong>PO Number:</strong> {selectedPurchase?.poNumber}
                  <br />
                  This action cannot be undone and will delete all associated items and batches.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {selectedPurchase?.status !== 'received' && (
              <AlertDialogAction 
                onClick={handleDeletePurchase}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
