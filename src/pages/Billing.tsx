import { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, User, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { createSale, searchMedicines as apiSearchMedicines, getFrequentItems, searchActiveCustomers, getCustomers, updateCustomer, createCustomer, type Customer } from '@/lib/api';

interface Medicine {
  _id: string;
  name: string;
  stock: number;
  mrp: number;
  inStock?: boolean;
  genericId?: { name: string };
  manufacturerId?: { name: string };
}

interface CartItem {
  medicine: Medicine;
  quantity: number;
}

export default function Billing() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card'>('cash');

  // Custom Customer Selection States
  const [customerMode, setCustomerMode] = useState<'walk-in' | 'regular'>('walk-in');
  const [customerName, setCustomerName] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
  const [nextPurchaseDate, setNextPurchaseDate] = useState('');

  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchResults, setSearchResults] = useState<Medicine[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [frequentItems, setFrequentItems] = useState<Medicine[]>([]);
  const [isLoadingFrequent, setIsLoadingFrequent] = useState(true);

  const [regularCustomers, setRegularCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);

  // Load all active regular customers when tab becomes 'regular'
  useEffect(() => {
    if (customerMode === 'regular' && regularCustomers.length === 0) {
      const loadCustomers = async () => {
        setIsLoadingCustomers(true);
        try {
          const result = await getCustomers({ active: true, limit: 100 });
          const list = Array.isArray(result) ? result : (result.data || result.customers || []);

          const validCustomers = list.filter((customer: any) => {
            if (!customer._id || !customer.name || !customer.phone) return false;
            if (customer.isAppUser === true) return false;
            if (customer.role !== undefined) return false;
            return true;
          });

          setRegularCustomers(validCustomers);
        } catch (error) {
          console.error('Customer load failed:', error);
        } finally {
          setIsLoadingCustomers(false);
        }
      };
      loadCustomers();
    }
  }, [customerMode, regularCustomers.length]);

  // Load frequently purchased items on mount
  useEffect(() => {
    const loadFrequentItems = async () => {
      try {
        setIsLoadingFrequent(true);
        const items = await getFrequentItems(8);
        setFrequentItems(items);
      } catch (error) {
        console.error('Failed to load frequent items:', error);
      } finally {
        setIsLoadingFrequent(false);
      }
    };
    loadFrequentItems();
  }, []);

  // Search medicines from API with debouncing
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await apiSearchMedicines(searchQuery);
        setSearchResults(results);
        setShowSearchResults(true);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search customers from API with debouncing - Name-based search
  useEffect(() => {
    if (customerSearchQuery.length < 1) {
      setCustomerSearchResults([]);
      setShowCustomerResults(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingCustomer(true);
      try {
        // Use the dedicated search endpoint that filters for active customers only
        const result = await searchActiveCustomers(customerSearchQuery, 10);
        const list = result.customers || [];

        const searchLower = customerSearchQuery.toLowerCase().trim();

        // Filter: ONLY actual customers from Customer collection
        // The backend already filters for isActive: true, but we do additional validation
        const validCustomers = list.filter((customer: any) => {
          // Ensure it has Customer model required fields
          if (!customer._id || !customer.name || !customer.phone) return false;

          // Exclude if it has User model indicators
          if (customer.isAppUser === true) return false;
          if (customer.role !== undefined) return false;

          return true;
        });

        // Remove duplicates based on _id (primary key)
        const uniqueCustomers = validCustomers.filter((customer: Customer, index: number, self: Customer[]) =>
          index === self.findIndex((c: Customer) => c._id === customer._id)
        );

        // Sort by relevance: exact match > starts with > contains
        const sortedCustomers = uniqueCustomers.sort((a, b) => {
          const aName = a.name?.toLowerCase() || '';
          const bName = b.name?.toLowerCase() || '';

          // Exact match
          if (aName === searchLower && bName !== searchLower) return -1;
          if (bName === searchLower && aName !== searchLower) return 1;

          // Starts with
          const aStarts = aName.startsWith(searchLower);
          const bStarts = bName.startsWith(searchLower);
          if (aStarts && !bStarts) return -1;
          if (bStarts && !aStarts) return 1;

          // Sort by total spent (higher spending customers first)
          return (b.totalSpent || 0) - (a.totalSpent || 0);
        });

        // Already limited to top 10 by backend, but sort for UX
        setCustomerSearchResults(sortedCustomers.slice(0, 10));
        setShowCustomerResults(true);
      } catch (error) {
        console.error('Customer search failed:', error);
        setCustomerSearchResults([]);
      } finally {
        setIsSearchingCustomer(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearchQuery]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.medicine.mrp * item.quantity, 0);
  const taxRate = 0.05; // 5% GST
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;

  const addToCart = (medicine: Medicine) => {
    const availableStock = typeof medicine.stock === 'number' ? medicine.stock : 0;
    const isInStock = (medicine.inStock === undefined ? true : medicine.inStock) && availableStock > 0;

    if (!isInStock) {
      toast({ title: 'Out of Stock', description: 'This medicine is not available', variant: 'destructive' });
      return;
    }

    const existing = cart.find(item => item.medicine._id === medicine._id);
    if (existing) {
      if (existing.quantity < availableStock) {
        setCart(prev => prev.map(item =>
          item.medicine._id === medicine._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      } else {
        toast({ title: 'Stock Limit', description: 'Cannot add more than available stock', variant: 'destructive' });
      }
    } else {
      setCart(prev => [...prev, { medicine, quantity: 1 }]);
    }
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.medicine._id === medicineId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.medicine.stock) {
          toast({ title: 'Stock Limit', description: 'Cannot exceed available stock', variant: 'destructive' });
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicine._id !== medicineId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setNextPurchaseDate('');
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Add items to cart before checkout', variant: 'destructive' });
      return;
    }

    if (customerMode === 'regular' && !selectedCustomer) {
      toast({ title: 'No Customer Selected', description: 'Please search and select a regular customer', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      let finalCustomerId: string | undefined = undefined;
      let finalCustomerName: string | undefined = customerMode === 'walk-in' ? (customerName || undefined) : selectedCustomer?.name;

      let currentSpent = selectedCustomer?.totalSpent || 0;
      let currentVisits = selectedCustomer?.totalVisits || 0;

      // 1. If regular customer, ensure we have a valid Customer _id (resolve AppUsers)
      if (customerMode === 'regular' && selectedCustomer) {
        if ((selectedCustomer as any).isAppUser) {
          const existingSearch = await getCustomers({ search: selectedCustomer.email });
          const list = Array.isArray(existingSearch) ? existingSearch : (existingSearch.data || []);
          const match = list.find((c: any) => c.email === selectedCustomer.email);

          if (match) {
            finalCustomerId = match._id;
            currentSpent = match.totalSpent || 0;
            currentVisits = match.totalVisits || 0;
          } else {
            const dummyPhone = `999${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`;
            const newCustRes = await createCustomer({
              name: selectedCustomer.name,
              phone: selectedCustomer.phone !== 'N/A' ? selectedCustomer.phone : dummyPhone,
              email: selectedCustomer.email,
            });
            const newCust = newCustRes.data || newCustRes;
            if (newCust && newCust._id) {
              finalCustomerId = newCust._id;
              currentSpent = 0;
              currentVisits = 0;
            }
          }
        } else {
          finalCustomerId = selectedCustomer._id;
        }
      }

      // 2. Prepare sale data for backend
      const saleData = {
        items: cart.map(item => ({
          medicineId: item.medicine._id,
          medicineName: item.medicine.name,
          quantity: item.quantity
        })),
        customerName: finalCustomerName,
        customerId: finalCustomerId,
        paymentMethod,
        taxAmount: tax,
        discountAmount: 0
      };

      // 3. Call backend API
      const result = await createSale(saleData);

      // 4. Update customer metrics
      if (finalCustomerId) {
        try {
          await updateCustomer(finalCustomerId, {
            totalSpent: currentSpent + total,
            totalVisits: currentVisits + 1,
            ...(nextPurchaseDate ? { nextPurchaseDate } : {})
          });
        } catch (e) {
          console.error('Failed to update customer stats in the background:', e);
        }
      }

      toast({
        title: '✅ Payment Successful',
        description: `Invoice ${result.data.invoiceNumber} - ₹${total.toLocaleString()}`
      });

      // Clear cart and close modal
      setShowPaymentModal(false);
      clearCart();

      // Trigger dashboard refresh (if needed)
      window.dispatchEvent(new CustomEvent('sale-completed'));

    } catch (error: any) {
      toast({
        title: '❌ Payment Failed',
        description: error.message || 'Failed to process payment',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-auto md:h-[calc(100vh-160px)]">
      {/* Left: Product Search & Cart */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Search medicines by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(e.target.value.length > 0);
            }}
            onFocus={() => setShowSearchResults(searchQuery.length > 0)}
            className="pl-9 h-12 text-lg border-border/60 transition-all duration-140 focus:border-primary/50"
          />

          {/* Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-80 overflow-y-auto border border-border/60 shadow-lg">
              <CardContent className="p-2">
                {searchResults.map(medicine => (
                  <button
                    key={medicine._id}
                    onClick={() => addToCart(medicine)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-all duration-130 text-left"
                  >
                    <div>
                      <div className="font-semibold">{medicine.name}</div>
                      <div className="text-sm text-muted-foreground/70">
                        {medicine.genericId?.name || 'Generic'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">₹{medicine.mrp}</div>
                      <div className="text-xs text-muted-foreground/70">Stock: {medicine.stock}</div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Medicines / Quick Pick */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <h3 className="text-sm font-bold text-muted-foreground/70">Frequently Purchased</h3>
          </div>

          {isLoadingFrequent ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : frequentItems.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {frequentItems.map((medicine) => (
                <button
                  key={medicine._id}
                  onClick={() => addToCart(medicine)}
                  disabled={!medicine.inStock}
                  className={cn(
                    "p-3 rounded-lg text-left transition-all duration-130 border",
                    medicine.inStock
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/30 cursor-pointer"
                      : "bg-muted/30 border-muted/40 opacity-50 cursor-not-allowed"
                  )}
                >
                  <div className="font-medium text-sm truncate">{medicine.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground font-medium">₹{medicine.mrp}</span>
                    {medicine.inStock ? (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        Stock: {medicine.stock}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0">
                        Out
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground/70 border rounded-lg border-dashed border-muted/60">
              No frequently purchased items yet
            </div>
          )}
        </div>

        {/* Cart Items */}
        <Card className="flex-1 overflow-hidden flex flex-col border border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Current Bill</CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground/70 hover:text-foreground transition-colors duration-140">
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pb-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground/70">
                <Search className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">Search and add medicines to the bill</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.medicine._id} className="flex items-center gap-4 p-3.5 rounded-lg bg-muted/40 border border-border/40 transition-all duration-130 hover:bg-muted/60">
                    <div className="flex-1">
                      <div className="font-semibold">{item.medicine.name}</div>
                      <div className="text-sm text-muted-foreground/70 font-medium">
                        ₹{item.medicine.mrp} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 transition-all duration-130"
                        onClick={() => updateQuantity(item.medicine._id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 transition-all duration-130"
                        onClick={() => updateQuantity(item.medicine._id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="w-20 text-right font-bold">
                      ₹{(item.medicine.mrp * item.quantity).toLocaleString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-130"
                      onClick={() => removeFromCart(item.medicine._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: Bill Summary */}
      <Card className="w-full md:w-80 flex flex-col h-fit md:h-auto border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Bill Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-3.5 flex-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground/70 font-medium">Items ({cart.length})</span>
              <span className="font-semibold">₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground/70 font-medium">GST (5%)</span>
              <span className="font-semibold">₹{tax.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3.5 mt-auto pt-6 overflow-visible z-10">
            <Tabs value={customerMode} onValueChange={(v: any) => setCustomerMode(v)} className="w-full overflow-visible">
              <TabsList className="grid w-full grid-cols-2 h-9 place-items-stretch">
                <TabsTrigger value="walk-in" className="text-xs">Walk-in</TabsTrigger>
                <TabsTrigger value="regular" className="text-xs">Regular</TabsTrigger>
              </TabsList>

              <TabsContent value="walk-in" className="mt-4">
                <div className="grid gap-2">
                  <Label className="text-xs text-muted-foreground/70 font-semibold">Walk-in Name (Optional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                    <Input
                      placeholder="Enter name..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="pl-9 h-10 border-border/60 transition-all duration-140 focus:border-primary/50 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="regular" className="mt-3 space-y-0">
                {/* Compact Container with Fixed Height */}
                <div className="border border-border/60 rounded-lg bg-background overflow-hidden h-[320px] flex flex-col">
                  {selectedCustomer ? (
                    <>
                      {/* Selected Customer - Compact Header */}
                      <div className="flex items-center justify-between px-3 py-2 bg-primary/5 border-b border-border/60 shrink-0">
                        <div className="flex flex-col flex-1 min-w-0 pr-2">
                          <span className="text-sm font-semibold truncate">{selectedCustomer.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">
                            {selectedCustomer.phone}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 shrink-0" 
                          onClick={() => { 
                            setSelectedCustomer(null); 
                            setCustomerSearchQuery(''); 
                            setNextPurchaseDate(''); 
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Next Purchase Date - Mini Tabs */}
                      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                          Next Purchase (Optional)
                        </div>
                        
                        {/* Compact Date Preset Buttons */}
                        <div className="flex gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-[10px] px-2"
                            onClick={() => {
                              const tomorrow = new Date();
                              tomorrow.setDate(tomorrow.getDate() + 1);
                              setNextPurchaseDate(tomorrow.toISOString().split('T')[0]);
                            }}
                          >
                            +1d
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-[10px] px-2"
                            onClick={() => {
                              const nextWeek = new Date();
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              setNextPurchaseDate(nextWeek.toISOString().split('T')[0]);
                            }}
                          >
                            +7d
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-[10px] px-2"
                            onClick={() => {
                              const nextMonth = new Date();
                              nextMonth.setDate(nextMonth.getDate() + 30);
                              setNextPurchaseDate(nextMonth.toISOString().split('T')[0]);
                            }}
                          >
                            +30d
                          </Button>
                        </div>
                        
                        {/* Compact Date Input */}
                        <Input
                          type="date"
                          value={nextPurchaseDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => setNextPurchaseDate(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Customer List Header - Compact */}
                      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border/60 shrink-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wide">Select Customer</span>
                        <span className="text-[9px] text-muted-foreground font-medium px-1.5 py-0.5 bg-background rounded">
                          {regularCustomers.length}
                        </span>
                      </div>
                      
                      {/* Customer List - Scrollable */}
                      <div className="flex-1 overflow-y-auto">
                        {isLoadingCustomers ? (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-xs text-muted-foreground">Loading...</span>
                          </div>
                        ) : regularCustomers.length > 0 ? (
                          <div className="divide-y divide-border/30">
                            {regularCustomers.map(c => (
                              <button
                                key={c._id}
                                onClick={() => setSelectedCustomer(c)}
                                className="w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left group"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-xs font-semibold truncate group-hover:text-primary">
                                      {c.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground truncate">
                                      {c.phone}
                                    </span>
                                  </div>
                                  <div className="flex flex-col items-end shrink-0">
                                    <span className="text-[10px] font-semibold">₹{c.totalSpent?.toFixed(0) || 0}</span>
                                    <span className="text-[9px] text-muted-foreground">{c.totalVisits || 0}×</span>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-xs text-muted-foreground">No customers</span>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <Button
              className="w-full h-12 text-lg font-semibold transition-all duration-140 mt-4"
              disabled={cart.length === 0 || (customerMode === 'regular' && !selectedCustomer)}
              onClick={() => setShowPaymentModal(true)}
            >
              Proceed to Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold">Select Payment Method</DialogTitle>
            <DialogDescription className="text-muted-foreground/70">
              Total amount: <span className="font-bold text-foreground">₹{total.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <RadioGroup
            value={paymentMethod}
            onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}
            className="grid grid-cols-3 gap-4 py-4"
          >
            <Label
              htmlFor="cash"
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all duration-140",
                paymentMethod === 'cash' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              <RadioGroupItem value="cash" id="cash" className="sr-only" />
              <Banknote className={cn("h-8 w-8 mb-2 transition-colors duration-140", paymentMethod === 'cash' && "text-primary")} />
              <span className="font-semibold">Cash</span>
            </Label>
            <Label
              htmlFor="upi"
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all duration-140",
                paymentMethod === 'upi' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              <RadioGroupItem value="upi" id="upi" className="sr-only" />
              <Smartphone className={cn("h-8 w-8 mb-2 transition-colors duration-140", paymentMethod === 'upi' && "text-primary")} />
              <span className="font-semibold">UPI</span>
            </Label>
            <Label
              htmlFor="card"
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-all duration-140",
                paymentMethod === 'card' ? "border-primary bg-primary/5 shadow-sm" : "border-border/60 hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              <RadioGroupItem value="card" id="card" className="sr-only" />
              <CreditCard className={cn("h-8 w-8 mb-2 transition-colors duration-140", paymentMethod === 'card' && "text-primary")} />
              <span className="font-semibold">Card</span>
            </Label>
          </RadioGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)} disabled={isProcessing} className="transition-all duration-140">Cancel</Button>
            <Button onClick={processPayment} disabled={isProcessing} className="transition-all duration-140 font-semibold">
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
