import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Plus, Search, Clock, CheckCircle, XCircle,
    Eye, Package, Loader2, FileText, RefreshCw
} from 'lucide-react';
import { getMyPrescriptions, type PrescriptionRequest } from '@/lib/api';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7', icon: Clock },
    under_review: { label: 'Under Review', color: '#6366f1', bg: '#ede9fe', icon: Eye },
    approved: { label: 'Approved', color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
    rejected: { label: 'Rejected', color: '#ef4444', bg: '#fee2e2', icon: XCircle },
    collected: { label: 'Collected', color: '#64748b', bg: '#f1f5f9', icon: Package },
};

export default function UserDashboard() {
    const navigate = useNavigate();
    const [prescriptions, setPrescriptions] = useState<PrescriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const userPhone = localStorage.getItem('userPhone') || '';
    const userName = localStorage.getItem('userFullName') || 'User';

    useEffect(() => {
        loadPrescriptions();
    }, []);

    const loadPrescriptions = async () => {
        setLoading(true);
        try {
            // Use email as primary identifier (always stored on login), fallback to phone
            const userEmail = localStorage.getItem('userEmail') || '';
            const userPhone = localStorage.getItem('userPhone') || '';
            const searchParam = userEmail || userPhone;
            
            console.log('Loading prescriptions for:', searchParam);
            
            if (searchParam) {
                const data = await getMyPrescriptions(searchParam);
                console.log('Loaded prescriptions:', data);
                setPrescriptions(data || []);
            } else {
                console.warn('No user email or phone found in localStorage');
            }
        } catch (error) {
            console.error('Failed to load prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPrescriptions = prescriptions.filter(p =>
        p.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.doctorName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 50%,#f0fdf4 100%)' }}>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm font-medium text-indigo-600 mb-1">{getGreeting()},</p>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{userName} 👋</h1>
                            <p className="text-gray-600">Track and manage your prescription requests</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={loadPrescriptions}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={() => navigate('/submit-prescription')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:scale-105 transition-all"
                            >
                                <Plus className="h-5 w-5" />
                                New Request
                            </button>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: 'Total Requests', value: prescriptions.length, color: '#6366f1', icon: ClipboardList },
                            { label: 'Pending', value: prescriptions.filter(p => p.status === 'pending' || p.status === 'under_review').length, color: '#f59e0b', icon: Clock },
                            { label: 'Approved', value: prescriptions.filter(p => p.status === 'approved').length, color: '#10b981', icon: CheckCircle },
                            { label: 'Collected', value: prescriptions.filter(p => p.status === 'collected').length, color: '#64748b', icon: Package },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">{stat.label}</span>
                                    <div
                                        className="h-10 w-10 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${stat.color}15` }}
                                    >
                                        <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search */}
                <div className="mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search prescriptions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Prescriptions List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <FileText className="h-5 w-5 text-indigo-600" />
                            Your Prescription Requests
                            {!loading && prescriptions.length > 0 && (
                                <span className="text-sm font-normal text-gray-500">
                                    ({prescriptions.length} {prescriptions.length === 1 ? 'request' : 'requests'})
                                </span>
                            )}
                        </h2>
                        {!loading && prescriptions.length > 0 && (
                            <button
                                onClick={loadPrescriptions}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : filteredPrescriptions.length === 0 ? (
                        <div className="text-center py-20">
                            <ClipboardList className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">No prescription requests found</p>
                            <p className="text-xs text-gray-400 mb-4">
                                Searching for: {localStorage.getItem('userEmail') || localStorage.getItem('userPhone') || 'No identifier found'}
                            </p>
                            <button
                                onClick={() => navigate('/submit-prescription')}
                                className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Submit Your First Request
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredPrescriptions.map((prescription) => {
                                const statusInfo = STATUS_CONFIG[prescription.status] || STATUS_CONFIG.pending;
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <div
                                        key={prescription._id}
                                        className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => navigate('/submit-prescription')}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        Request #{prescription._id?.slice(-6)}
                                                    </h3>
                                                    <span
                                                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                                                        style={{
                                                            color: statusInfo.color,
                                                            backgroundColor: statusInfo.bg
                                                        }}
                                                    >
                                                        <StatusIcon className="h-3 w-3" />
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">
                                                    Submitted: {format(new Date(prescription.createdAt), 'dd MMM yyyy, hh:mm a')}
                                                </p>
                                                {prescription.doctorName && (
                                                    <p className="text-sm text-gray-600">
                                                        Doctor: {prescription.doctorName}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {prescription.adminNotes && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-sm font-medium text-blue-900 mb-1">Admin Reply:</p>
                                                <p className="text-sm text-blue-800">{prescription.adminNotes}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
