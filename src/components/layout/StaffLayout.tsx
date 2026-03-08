import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Receipt, Package, Activity, Menu, X, LogOut, User, Bell, ChevronDown, LayoutDashboard, Users, Search } from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const STAFF_NAV = [
    {
        id: 'home',
        label: 'Dashboard',
        icon: LayoutDashboard,
        path: '/staff',
        exact: true,
        desc: 'Your staff home',
    },
    {
        id: 'billing',
        label: 'Billing',
        icon: Receipt,
        path: '/staff/billing',
        exact: false,
        desc: 'Create & manage bills',
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: Package,
        path: '/staff/inventory',
        exact: false,
        desc: 'View medicine stock',
    },
    {
        id: 'customers',
        label: 'Customers',
        icon: Users,
        path: '/staff/customers',
        exact: false,
        desc: 'Regular customer list',
    },
    {
        id: 'transaction-lookup',
        label: 'Transaction Lookup',
        icon: Search,
        path: '/staff/transaction-lookup',
        exact: false,
        desc: 'Search transactions',
    },
];

interface StaffLayoutProps {
    children: React.ReactNode;
}

export function StaffLayout({ children }: StaffLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const userEmail = localStorage.getItem('userEmail') || 'staff@specialaccesspharma.com';
    const userName = localStorage.getItem('userFullName') || 'Staff Member';

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('token');
        window.location.replace('/login');
    };

    const currentNav = STAFF_NAV.find(n => location.pathname.startsWith(n.path));

    return (
        <div className="min-h-screen flex" style={{ background: 'hsl(220,25%,96%)' }}>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Sidebar ─────────────────────────────────────────── */}
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex-shrink-0',
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
                )}
                style={{
                    background: 'linear-gradient(180deg,#070b14 0%,#0d1426 30%,#0b1e38 60%,#06121f 100%)',
                    borderRight: '1px solid rgba(255,255,255,0.05)',
                }}
            >
                {/* Brand */}
                <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="relative flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-lg"
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
                            <Activity className="h-5 w-5 text-white" />
                        </div>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 border-2" style={{ borderColor: '#070b14' }} />
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="text-[15px] font-extrabold text-white tracking-tight truncate">Special Access Pharma</div>
                        <div className="text-[11px] font-semibold truncate" style={{ color: '#5eead4' }}>Staff Portal</div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="ml-auto text-white/40 hover:text-white lg:hidden">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Nav section label */}
                <div className="px-5 pt-5 pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(16,185,129,0.5)' }}>
                        Navigation
                    </span>
                </div>

                {/* Nav links */}
                <nav className="flex-1 px-3 pb-4 space-y-1 overflow-y-auto">
                    {STAFF_NAV.map(item => {
                        const isActive = item.exact
                            ? location.pathname === item.path
                            : location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.id}
                                to={item.path}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    'relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 group',
                                    isActive ? 'text-white' : 'text-slate-400 hover:text-white',
                                )}
                                style={isActive ? {
                                    background: 'linear-gradient(90deg,rgba(16,185,129,0.18),rgba(5,150,105,0.08))',
                                    boxShadow: 'inset 3px 0 0 #10b981',
                                } : {}}
                            >
                                {!isActive && (
                                    <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                        style={{ background: 'rgba(255,255,255,0.04)' }} />
                                )}
                                <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200"
                                    style={{
                                        background: isActive ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                                        border: isActive ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                    <item.icon className="h-4 w-4" style={{ color: isActive ? '#6ee7b7' : undefined }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div>{item.label}</div>
                                    <div className="text-[10px] font-normal opacity-60 truncate">{item.desc}</div>
                                </div>
                                {isActive && (
                                    <div className="absolute right-3 flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#10b981' }} />
                                        <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} />
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Restricted notice at bottom */}
                <div className="mx-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <p className="text-[10px] font-semibold text-red-400 leading-relaxed">
                        🔒 Reports, analytics, settings and purchases are restricted to admin accounts only.
                    </p>
                </div>
            </aside>

            {/* ── Main area ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top header */}
                <header className="flex-shrink-0 flex items-center h-16 px-6 gap-4 bg-white border-b border-slate-200/60 shadow-sm">
                    {/* Mobile menu btn */}
                    <button onClick={() => setSidebarOpen(true)}
                        className="lg:hidden flex-shrink-0 p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all">
                        <Menu className="h-5 w-5" />
                    </button>

                    {/* Page title */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg font-bold text-slate-900 truncate">
                            {currentNav?.label ?? 'Staff Dashboard'}
                        </h1>
                        <p className="text-xs text-slate-400 hidden sm:block">Staff portal — limited access</p>
                    </div>

                    {/* Right: notifications + user */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all">
                            <Bell className="h-4 w-4" />
                        </button>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs font-bold flex-shrink-0"
                                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="hidden sm:block text-left">
                                        <div className="text-xs font-bold text-slate-800 leading-none">{userName}</div>
                                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">Staff</div>
                                    </div>
                                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    <div className="font-semibold text-slate-900">{userName}</div>
                                    <div className="text-xs text-slate-500 font-normal">{userEmail}</div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-slate-600 gap-2">
                                    <User className="h-4 w-4" /> Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700 gap-2">
                                    <LogOut className="h-4 w-4" /> Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
