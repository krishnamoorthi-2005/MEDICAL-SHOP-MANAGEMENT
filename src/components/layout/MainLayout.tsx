import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Package,
  ShoppingCart,
  ClipboardCheck,
  BarChart3,
  Settings,
  Search,
  Bell,
  Plus,
  ChevronDown,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { id: 'billing', label: 'Billing', icon: Receipt, path: '/billing' },
  { id: 'inventory', label: 'Inventory', icon: Package, path: '/inventory' },
  { id: 'purchases', label: 'Purchases', icon: ShoppingCart, path: '/purchases' },
  { id: 'audit', label: 'Audit', icon: ClipboardCheck, path: '/audit' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/reports' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
];

const notifications: any[] = [];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-background to-indigo-50/20">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 h-[72px] border-b border-border/60 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between px-8">
          {/* Left: Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-blue-600/20">
              M
            </div>
            <span className="text-[17px] font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Special Access Pharma System
            </span>
          </div>

          {/* Center: Navigation Menu */}
          <div className="flex flex-1 items-center justify-center gap-1">
            {navigationItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    "flex h-[72px] items-center border-b-2 px-4 text-sm font-semibold transition-all duration-160 ease-out",
                    isActive
                      ? "border-blue-600 text-blue-700 bg-blue-50/50"
                      : "border-transparent text-muted-foreground/80 hover:text-blue-700 hover:bg-blue-50/30 hover:border-blue-200"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <div className="relative w-60">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors duration-150" />
              <Input
                type="text"
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-blue-50/30 border-blue-100 transition-all duration-160 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* New Bill Button */}
            <Button asChild size="sm">
              <Link to="/billing">
                <Plus className="mr-1 h-4 w-4" />
                New Bill
              </Link>
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex items-start gap-3 p-3">
                    <div className={cn(
                      "mt-1 h-2 w-2 shrink-0 rounded-full",
                      notif.type === 'warning' && "bg-yellow-500",
                      notif.type === 'danger' && "bg-destructive",
                      notif.type === 'info' && "bg-primary"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                    </div>
                    {notif.count && (
                      <Badge variant="secondary" className="text-xs">
                        {notif.count}
                      </Badge>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted">
                    <User className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm">Admin</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-8 py-8">
        {children}
      </main>
    </div>
  );
}
