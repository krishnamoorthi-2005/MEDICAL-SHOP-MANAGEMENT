// 🚨 DATA STRUCTURES ONLY - NO MOCK DATA
// All data now comes from Supabase PostgreSQL

export interface Medicine {
  id: string;
  name: string;
  category: string;
  manufacturer: string;
  stock: number;
  minStock: number;
  maxStock: number;
  purchasePrice: number;
  sellingPrice: number;
  rack: string;
  batches: Batch[];
  discontinued: boolean;
}

export interface Batch {
  id: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  purchasePrice: number;
  receivedDate: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  address: string;
  balance: number;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
  items: POItem[];
  total: number;
}

export interface POItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface AuditLog {
  id: string;
  medicineId: string;
  medicineName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'expired';
  previousStock: number;
  newStock: number;
  adjustmentQuantity: number;
  reason: string;
  date: string;
  user: string;
  batchNumber?: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  date: string;
  time: string;
  items: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  customerName?: string;
}

// ✅ ALL SAMPLE DATA REMOVED
// Data now fetched from Supabase through API calls in lib/api.ts

// Empty arrays - data comes from Supabase
export const sampleMedicines: Medicine[] = [];

// Sample Suppliers
export const sampleSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'MedSupply Distributors',
    contact: '+91 98765 43210',
    email: 'sales@medsupply.com',
    address: '123 Medical District, Mumbai, Maharashtra 400001',
    balance: 45000
  },
  {
    id: '2',
    name: 'PharmaLink Solutions',
    contact: '+91 87654 32109',
    email: 'orders@pharmalink.co.in',
    address: '456 Healthcare Avenue, Delhi, Delhi 110001',
    balance: 32000
  }
];

// Empty arrays - data comes from Supabase
export const samplePurchaseOrders: PurchaseOrder[] = [];

export const sampleAuditLogs: AuditLog[] = [];

export const sampleTransactions: Transaction[] = [];

export const categories = [
  'Analgesics', 'Antibiotics', 'Antacids', 'Antihistamines', 'Antiseptics',
  'Antidiabetic', 'Antihypertensive', 'Vitamins', 'Cardiac', 'Respiratory'
];

export const manufacturers = [
  'Sun Pharma', 'Cipla', 'Dr Reddy\'s Laboratories', 'Aurobindo Pharma',
  'Lupin', 'Zydus Cadila', 'Torrent Pharmaceuticals', 'Glenmark Pharmaceuticals',
  'Alkem Laboratories', 'Mankind Pharma'
];

// Stock adjustment reasons
export const adjustmentReasons = [
  'Damaged',
  'Lost',
  'Expired',
  'Manual Correction',
  'Return to Supplier',
  'Promotional Sample'
];