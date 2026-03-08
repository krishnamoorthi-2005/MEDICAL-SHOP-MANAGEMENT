import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Receipt, Package, Clock, CheckCircle, AlertCircle,
    TrendingUp, ShoppingBag, Calendar, Activity, ArrowRight, Pill, Phone, MessageCircle
} from 'lucide-react';
import { getDashboardAnalytics, getCallRequests, updateCallRequestStatus, type CallRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

/* ── Types ─────────────────────────────────────────────── */
interface QuickStats {
    expiringSoon: number;
    lowStock: number;
}

/* ── Static tips ────────────────────────────────────────── */
const TIPS = [
    'Always double-check the medicine name and dosage before billing.',
    'Check expiry dates before dispensing any medicine.',
    'If stock looks low, notify the admin immediately.',
    'For prescription medicines, always verify a valid prescription.',
    'Log issues or discrepancies in the audit section immediately.',
];

/* ── Component ─────────────────────────────────────────── */
export default function StaffDashboard() {
    const [stats, setStats] = useState<QuickStats | null>(null);
    const [callRequests, setCallRequests] = useState<CallRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [todayTip] = useState(() => TIPS[new Date().getDay() % TIPS.length]);
    const userName = localStorage.getItem('userFullName') || 'Staff Member';
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const fetchCallRequests = async () => {
        try {
            const requests = await getCallRequests();
            setCallRequests(requests);
        } catch (error) {
            console.error('Failed to fetch call requests:', error);
        }
    };

    const handleUpdateCallStatus = async (id: string, status: string) => {
        try {
            await updateCallRequestStatus(id, status);
            fetchCallRequests(); // Refresh the list
        } catch (error) {
            console.error('Failed to update call request:', error);
        }
    };

    useEffect(() => {
        getDashboardAnalytics()
            .then(d => setStats({ expiringSoon: d?.expiringSoonCount ?? 0, lowStock: d?.lowStockCount ?? 0 }))
            .catch(() => setStats({ expiringSoon: 0, lowStock: 0 }))
            .finally(() => setLoading(false));
        
        fetchCallRequests();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => {
            fetchCallRequests();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-8 max-w-4xl mx-auto">

            {/* ── Greeting banner ────────────────────────────── */}
            <div
                className="relative overflow-hidden rounded-3xl p-7"
                style={{
                    background: 'linear-gradient(135deg,#0f0c29 0%,#1a1040 60%,#0d1a30 100%)',
                    boxShadow: '0 8px 32px rgba(99,102,241,0.2)'
                }}
            >
                {/* Orbs */}
                <div className="absolute top-0 right-0 h-48 w-48 rounded-full blur-3xl opacity-20 pointer-events-none"
                    style={{ background: 'radial-gradient(circle,#6366f1,transparent)' }} />
                <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full blur-3xl opacity-15 pointer-events-none"
                    style={{ background: 'radial-gradient(circle,#14b8a6,transparent)' }} />

                <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <p className="text-sm font-semibold mb-1" style={{ color: '#a5b4fc' }}>
                            {greeting},
                        </p>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">{userName} 👋</h1>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Welcome to your staff portal. You can create bills and view the medicine inventory below.
                        </p>
                    </div>
                    <div
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold"
                        style={{ background: 'rgba(20,184,166,0.15)', color: '#5eead4', border: '1px solid rgba(20,184,166,0.25)' }}
                    >
                        <Activity className="h-3.5 w-3.5 animate-pulse" />
                        Staff Portal · Active
                    </div>
                </div>

                {/* Date */}
                <div className="relative z-10 flex items-center gap-2 mt-4 text-xs text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* ── Quick actions ───────────────────────────────── */}
            <div>
                <div className="section-label mb-4">Quick Actions</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                        to="/staff/billing"
                        className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
                        style={{
                            background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)',
                            border: '1px solid rgba(99,102,241,0.12)',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.1)'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px rgba(99,102,241,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.1)')}
                    >
                        <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-20 transition-transform duration-300 group-hover:scale-150"
                            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} />
                        <div className="relative z-10">
                            <div className="h-12 w-12 flex items-center justify-center rounded-2xl mb-4 transition-transform duration-200 group-hover:scale-110"
                                style={{ background: 'rgba(99,102,241,0.12)' }}>
                                <Receipt className="h-6 w-6" style={{ color: '#6366f1' }} />
                            </div>
                            <div className="text-base font-extrabold text-slate-900 mb-1">Create New Bill</div>
                            <div className="text-xs text-slate-500 mb-4">Search medicines, add items and generate invoices</div>
                            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#6366f1' }}>
                                Open Billing <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/staff/inventory"
                        className="group relative overflow-hidden rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
                        style={{
                            background: 'linear-gradient(135deg,#f0fdfa,#ecfdf5)',
                            border: '1px solid rgba(20,184,166,0.12)',
                            boxShadow: '0 2px 8px rgba(20,184,166,0.1)'
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 12px 36px rgba(20,184,166,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(20,184,166,0.1)')}
                    >
                        <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full opacity-20 transition-transform duration-300 group-hover:scale-150"
                            style={{ background: 'linear-gradient(135deg,#14b8a6,#10b981)' }} />
                        <div className="relative z-10">
                            <div className="h-12 w-12 flex items-center justify-center rounded-2xl mb-4 transition-transform duration-200 group-hover:scale-110"
                                style={{ background: 'rgba(20,184,166,0.12)' }}>
                                <Package className="h-6 w-6" style={{ color: '#14b8a6' }} />
                            </div>
                            <div className="text-base font-extrabold text-slate-900 mb-1">View Inventory</div>
                            <div className="text-xs text-slate-500 mb-4">Check medicine stock levels and batch details</div>
                            <div className="flex items-center gap-1 text-xs font-bold" style={{ color: '#14b8a6' }}>
                                Check Stock <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* ── Alerts row ──────────────────────────────────── */}
            {!loading && stats && (stats.expiringSoon > 0 || stats.lowStock > 0) && (
                <div>
                    <div className="section-label mb-4">Alerts</div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {stats.expiringSoon > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl"
                                style={{ background: '#fff7ed', border: '1px solid rgba(249,115,22,0.2)' }}>
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl"
                                    style={{ background: 'rgba(249,115,22,0.12)' }}>
                                    <Clock className="h-5 w-5" style={{ color: '#f97316' }} />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-800">
                                        {stats.expiringSoon} item{stats.expiringSoon !== 1 ? 's' : ''} expiring soon
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">Within the next 30 days — notify admin</div>
                                </div>
                            </div>
                        )}
                        {stats.lowStock > 0 && (
                            <div className="flex items-center gap-4 p-4 rounded-2xl"
                                style={{ background: '#fefce8', border: '1px solid rgba(234,179,8,0.2)' }}>
                                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl"
                                    style={{ background: 'rgba(234,179,8,0.12)' }}>
                                    <AlertCircle className="h-5 w-5" style={{ color: '#ca8a04' }} />
                                </div>
                                <div>
                                    <div className="text-sm font-extrabold text-slate-800">
                                        {stats.lowStock} item{stats.lowStock !== 1 ? 's' : ''} low in stock
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">Inform admin to place a reorder</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Call Requests ───────────────────────────────── */}
            {callRequests.length > 0 && (
                <div>
                    <div className="section-label mb-4">Call Requests</div>
                    <div className="rounded-2xl overflow-hidden" 
                        style={{ background: 'white', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                        <div className="p-4 border-b" style={{ background: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.1)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 flex items-center justify-center rounded-lg"
                                        style={{ background: 'rgba(99,102,241,0.12)' }}>
                                        <Phone className="h-4 w-4" style={{ color: '#6366f1' }} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">Customer Call Requests</span>
                                </div>
                                {callRequests.filter(req => req.status === 'pending').length > 0 && (
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-full">
                                        {callRequests.filter(req => req.status === 'pending').length} pending
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="divide-y divide-slate-200 max-h-80 overflow-y-auto">
                            {callRequests.slice(0, 5).map((request) => (
                                <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1">
                                            <p className="font-bold text-sm text-slate-900">{request.name}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{request.phone}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                {format(new Date(request.createdAt), 'MMM dd, yyyy at h:mm a')}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide",
                                            request.status === 'pending' && "bg-yellow-100 text-yellow-800",
                                            request.status === 'called' && "bg-blue-100 text-blue-800",
                                            request.status === 'resolved' && "bg-green-100 text-green-800"
                                        )}>
                                            {request.status}
                                        </span>
                                    </div>
                                    {request.message && (
                                        <p className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg mb-3 leading-relaxed">
                                            {request.message}
                                        </p>
                                    )}
                                    {request.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                onClick={() => handleUpdateCallStatus(request.id, 'called')}
                                                className="text-xs h-8 flex-1"
                                            >
                                                Mark Called
                                            </Button>
                                            <Button 
                                                size="sm"
                                                onClick={() => handleUpdateCallStatus(request.id, 'resolved')}
                                                className="text-xs h-8 flex-1"
                                                style={{ background: '#6366f1' }}
                                            >
                                                Mark Resolved
                                            </Button>
                                        </div>
                                    )}
                                    {request.status === 'called' && (
                                        <div className="flex gap-2">
                                            <Button 
                                                size="sm"
                                                onClick={() => handleUpdateCallStatus(request.id, 'resolved')}
                                                className="text-xs h-8 w-full"
                                                style={{ background: '#10b981' }}
                                            >
                                                Mark Resolved
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {callRequests.length > 5 && (
                            <div className="p-3 text-center border-t" style={{ background: 'rgba(241,245,249,0.5)' }}>
                                <span className="text-xs text-slate-500">
                                    Showing 5 of {callRequests.length} requests
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Daily tip + Access info ──────────────────────── */}
            <div className="grid sm:grid-cols-2 gap-4">
                {/* Daily tip */}
                <div className="rounded-2xl p-5"
                    style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1px solid rgba(99,102,241,0.1)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'rgba(99,102,241,0.12)' }}>
                            <Pill className="h-4 w-4" style={{ color: '#6366f1' }} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#6366f1' }}>Tip of the Day</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-relaxed">{todayTip}</p>
                </div>

                {/* Access info */}
                <div className="rounded-2xl p-5"
                    style={{ background: 'linear-gradient(135deg,#fff1f2,#fff7ed)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-7 w-7 flex items-center justify-center rounded-lg"
                            style={{ background: 'rgba(239,68,68,0.1)' }}>
                            <CheckCircle className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-red-600">Your Access</span>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: 'Create Bills', ok: true },
                            { label: 'View Inventory', ok: true },
                            { label: 'Respond to Call Requests', ok: true },
                            { label: 'Reports & Analytics', ok: false },
                            { label: 'Purchases & Settings', ok: false },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-xs font-semibold">
                                {item.ok
                                    ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                                    : <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />}
                                <span className={item.ok ? 'text-slate-700' : 'text-slate-400 line-through'}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
