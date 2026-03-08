import { useState, useEffect, useCallback } from 'react';
import { Search, Package, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { getMedicines } from '@/lib/api';

interface Medicine {
    _id: string;
    name: string;
    manufacturer: string;
    category?: string;
    dosageForm?: string;
    currentStock: number;
    batches?: Array<{ expiryDate: string; quantity: number; mrp: number }>;
}

export default function StaffInventory() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMedicines();
            setMedicines(Array.isArray(data) ? data : data?.medicines || []);
        } catch {
            setMedicines([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        (m.manufacturer || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.category || '').toLowerCase().includes(search.toLowerCase())
    );

    const stockStatus = (m: Medicine) => {
        // First priority: Check for expired or expiring batches
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        // Check if any batches are expired
        const hasExpiredBatches = m.batches?.some(batch => {
            const expiryDate = new Date(batch.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            return expiryDate < today;
        });

        if (hasExpiredBatches) {
            return { label: 'Expired', style: { background: '#fee2e2', color: '#991b1b', border: '1px solid rgba(153,27,27,0.3)' } };
        }

        // Check if any batches are expiring within 30 days
        const hasExpiringSoonBatches = m.batches?.some(batch => {
            const expiryDate = new Date(batch.expiryDate);
            expiryDate.setHours(0, 0, 0, 0);
            return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
        });

        if (hasExpiringSoonBatches) {
            return { label: 'Expiring Soon', style: { background: '#fed7aa', color: '#c2410c', border: '1px solid rgba(194,65,12,0.3)' } };
        }

        // Then check stock levels
        const qty = m.currentStock;
        if (qty <= 0) return { label: 'Out of Stock', style: { background: '#1e293b', color: '#ffffff', border: '1px solid rgba(30,41,59,0.3)' } };
        if (qty <= 10) return { label: 'Low Stock', style: { background: '#fefce8', color: '#b45309', border: '1px solid rgba(180,83,9,0.2)' } };
        return { label: 'In Stock', style: { background: '#f0fdf4', color: '#15803d', border: '1px solid rgba(21,128,61,0.2)' } };
    };

    const nearestExpiry = (m: Medicine) => {
        if (!m.batches?.length) return null;
        const future = m.batches
            .map(b => new Date(b.expiryDate))
            .filter(d => d > new Date())
            .sort((a, b) => a.getTime() - b.getTime());
        return future.length ? future[0] : null;
    };

    const isExpiringSoon = (m: Medicine) => {
        const exp = nearestExpiry(m);
        if (!exp) return false;
        const diff = (exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Medicine Inventory</h2>
                    <p className="text-sm text-slate-400 font-medium mt-0.5">Read-only view · {medicines.length} medicines total</p>
                </div>
                <button
                    onClick={load}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, manufacturer or category…"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm font-medium placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/10 transition-all"
                />
            </div>

            {/* Table card */}
            <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden"
                style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04),0 12px 36px rgba(0,0,0,0.03)' }}>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <RefreshCw className="h-8 w-8 animate-spin opacity-40" />
                        <p className="text-sm font-medium">Loading inventory…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                        <Package className="h-10 w-10 opacity-30" />
                        <p className="text-sm font-semibold">No medicines found</p>
                        {search && <p className="text-xs">Try clearing the search</p>}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                    {['Medicine', 'Category', 'Stock', 'Status', 'Nearest Expiry'].map(h => (
                                        <th key={h} className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400 px-5 py-3">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filtered.map((m, index) => {
                                    const { label, style } = stockStatus(m);
                                    const exp = nearestExpiry(m);
                                    const soon = isExpiringSoon(m);
                                    return (
                                        <tr key={m._id || `medicine-${index}`} className="hover:bg-slate-50/60 transition-colors group">
                                            {/* Medicine name */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-xl"
                                                        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))' }}>
                                                        <Package className="h-4 w-4 text-indigo-500" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{m.name}</div>
                                                        <div className="text-xs text-slate-400">{m.manufacturer}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Category */}
                                            <td className="px-5 py-4 text-xs text-slate-500 font-medium">
                                                {m.dosageForm || m.category || '—'}
                                            </td>
                                            {/* Stock qty */}
                                            <td className="px-5 py-4">
                                                <span className="font-extrabold text-slate-800 number-display">{m.currentStock}</span>
                                                <span className="text-xs text-slate-400 ml-1">units</span>
                                            </td>
                                            {/* Status badge */}
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold" style={style}>
                                                    {label}
                                                </span>
                                            </td>
                                            {/* Expiry */}
                                            <td className="px-5 py-4">
                                                {exp ? (
                                                    <div className="flex items-center gap-1.5">
                                                        {soon && <Clock className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />}
                                                        <span className={`text-xs font-semibold ${soon ? 'text-amber-600' : 'text-slate-500'}`}>
                                                            {exp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                        {soon && (
                                                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                                                                Soon
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer note */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-amber-700"
                style={{ background: '#fefce8', border: '1px solid rgba(234,179,8,0.2)' }}>
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                This is a read-only view. To add or modify inventory, contact the admin.
            </div>
        </div>
    );
}
