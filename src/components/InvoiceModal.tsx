import { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, X, CheckCircle2 } from 'lucide-react';

interface InvoiceItem {
    medicineName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
}

export interface InvoiceData {
    _id?: string;
    invoiceNumber: string;
    customerName?: string | null;
    paymentMethod: string;
    paymentStatus: string;
    items: InvoiceItem[];
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    createdAt?: string;
}

interface InvoiceModalProps {
    open: boolean;
    onClose: () => void;
    invoice: InvoiceData | null;
    storeName?: string;
}

const PAYMENT_LABELS: Record<string, string> = {
    cash: 'Cash',
    upi: 'UPI',
    card: 'Card / Debit',
};

export default function InvoiceModal({ open, onClose, invoice, storeName = 'Special Access Pharma' }: InvoiceModalProps) {
    const printRef = useRef<HTMLDivElement>(null);

    if (!invoice) return null;

    const dateStr = invoice.createdAt
        ? new Date(invoice.createdAt).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
        : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const handlePrint = () => {
        if (!printRef.current) return;
        const printContents = printRef.current.innerHTML;
        const win = window.open('', '_blank', 'width=800,height=900');
        if (!win) return;
        win.document.write(`
      <html>
        <head>
          <title>Invoice – ${invoice.invoiceNumber}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: 'Inter', sans-serif; color: #111; background: #fff; padding: 40px; }
            .invoice-wrap { max-width: 680px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px 12px; text-align: left; font-size: 13px; }
            th { background: #f3f4f6; font-weight: 600; }
            tr:not(:last-child) td { border-bottom: 1px solid #e5e7eb; }
            .paid-seal { display: inline-flex; align-items: center; gap: 6px; background: #d1fae5; color: #065f46; border: 2px solid #6ee7b7; border-radius: 9999px; padding: 6px 18px; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
            .text-right { text-align: right; }
            .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 6px; }
            .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
            .total-row { font-weight: 700; font-size: 15px; }
          </style>
        </head>
        <body>
          <div class="invoice-wrap">${printContents}</div>
        </body>
      </html>
    `);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 400);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
                {/* Action bar */}
                <div className="flex items-center justify-between px-6 py-3 bg-muted/30 border-b">
                    <span className="text-sm font-semibold text-muted-foreground">Invoice Preview</span>
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1.5" /> Print
                        </Button>
                        <Button size="sm" variant="ghost" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Printable area */}
                <div ref={printRef} className="p-8 space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight">{storeName}</h1>
                            <p className="text-sm text-muted-foreground mt-0.5">Tax Invoice / Receipt</p>
                        </div>
                        {/* PAID Seal */}
                        <div className="flex flex-col items-end gap-2">
                            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-400 rounded-full px-4 py-1.5 font-bold text-sm tracking-widest shadow-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                PAID
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">{dateStr}</span>
                        </div>
                    </div>

                    <Separator />

                    {/* Invoice meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Invoice No.</p>
                            <p className="font-bold text-base font-mono tracking-tight">{invoice.invoiceNumber}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Transaction ID</p>
                            <p className="font-bold text-base font-mono tracking-tight text-primary">{invoice._id || '—'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Customer</p>
                            <p className="font-semibold">{invoice.customerName || 'Walk-in Customer'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Payment</p>
                            <p className="font-semibold capitalize">{PAYMENT_LABELS[invoice.paymentMethod] || invoice.paymentMethod}</p>
                        </div>
                    </div>

                    <Separator />

                    {/* Items table */}
                    <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-3">Items Purchased</p>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/40 rounded-lg">
                                    <th className="rounded-l-md px-3 py-2 text-left font-semibold text-xs">#</th>
                                    <th className="px-3 py-2 text-left font-semibold text-xs">Medicine</th>
                                    <th className="px-3 py-2 text-center font-semibold text-xs">Qty</th>
                                    <th className="px-3 py-2 text-right font-semibold text-xs">Unit Price</th>
                                    <th className="rounded-r-md px-3 py-2 text-right font-semibold text-xs">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, i) => (
                                    <tr key={i} className="border-b border-border/40 last:border-0">
                                        <td className="px-3 py-2.5 text-muted-foreground text-xs">{i + 1}</td>
                                        <td className="px-3 py-2.5 font-medium">{item.medicineName}</td>
                                        <td className="px-3 py-2.5 text-center">{item.quantity}</td>
                                        <td className="px-3 py-2.5 text-right text-muted-foreground">₹{item.unitPrice.toFixed(2)}</td>
                                        <td className="px-3 py-2.5 text-right font-semibold">₹{item.lineTotal.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Separator />

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">₹{invoice.subtotal.toFixed(2)}</span>
                            </div>
                            {invoice.taxAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">GST (5%)</span>
                                    <span className="font-medium">₹{invoice.taxAmount.toFixed(2)}</span>
                                </div>
                            )}
                            {invoice.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-600">
                                    <span>Discount</span>
                                    <span>−₹{invoice.discountAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-base font-extrabold">
                                <span>Total Paid</span>
                                <span className="text-primary">₹{invoice.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-muted/30 rounded-lg p-4 text-center mt-4">
                        <p className="text-xs text-muted-foreground">Thank you for choosing <strong>{storeName}</strong>. Keep this receipt for your records.</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">For queries, cite your Transaction ID: <span className="font-mono">{invoice._id || invoice.invoiceNumber}</span></p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
