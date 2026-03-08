import { useNavigate, useLocation, Link } from 'react-router-dom';
import { LogOut, User, ClipboardList, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLayoutProps {
    children: React.ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const userEmail = localStorage.getItem('userEmail') || 'user@specialaccesspharma.com';
    const userName = localStorage.getItem('userFullName') || userEmail.split('@')[0];

    const handleLogout = () => {
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userFullName');
        localStorage.removeItem('token');
        window.location.replace('/login');
    };

    const navigationItems = [
        { label: 'Dashboard', path: '/user-dashboard', icon: ClipboardList },
        { label: 'Submit Request', path: '/submit-prescription', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Navigation Header */}
            <nav className="sticky top-0 z-50 h-16 border-b border-border/60 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 shadow-sm">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-lg font-bold text-white shadow-md shadow-blue-600/20">
                            M
                        </div>
                        <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            Special Access Pharma
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-6">
                        {navigationItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "text-sm font-medium transition-colors hover:text-blue-600",
                                    location.pathname === item.path ? "text-blue-600" : "text-gray-600"
                                )}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Info & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">{userName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden md:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main>{children}</main>

            {/* Footer */}
            <footer className="bg-gray-50 border-t">
                <div className="mx-auto max-w-7xl px-6 py-8">
                    <div className="text-center text-sm text-gray-600">
                        © 2026 Special Access Pharma. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
