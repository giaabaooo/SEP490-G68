import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Receipt, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, CreditCard, Sparkles } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const planLabels = {
    CANDIDATE_PRO: "Gói Pro Candidate (30 Ngày)",
    BUSINESS_TOPUP: "Nạp Token Doanh Nghiệp"
};

const PaymentManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0, page: 1, limit: 10, totalPages: 1,
    });

    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const token = localStorage.getItem("token");

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (status) params.append("status", status);
        params.append("page", page);
        params.append("limit", pagination.limit || 10);
        return params.toString();
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/payment/transactions?${buildQueryString()}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            
            if (!response.ok) {
                return toast.error(data.message || "Không thể lấy danh sách giao dịch");
            }
            
            setTransactions(data.transactions || []);
            setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
        } catch {
            toast.error("Lỗi kết nối server khi lấy danh sách giao dịch");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchTransactions(); }, 400);
        return () => clearTimeout(timer);
    }, [page, status, search]);

    const handleResetFilter = () => { 
        setSearch(""); 
        setStatus(""); 
        setPage(1); 
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="animate-fade-in pb-12 max-w-7xl mx-auto mt-6 px-4">
            <ToastContainer position="top-right" autoClose={3000} />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-blue-600" />
                        Quản lý giao dịch <span className="text-blue-600 flex items-center gap-1">Payments <Sparkles className="w-5 h-5 text-yellow-400" /></span>
                    </h1>
                    <p className="text-slate-900 text-sm font-medium">
                        Theo dõi lịch sử thanh toán, nâng cấp gói Pro và nạp Token từ người dùng trên hệ thống.
                    </p>
                </div>

                <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
                    <div>
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-1">Tổng giao dịch</p>
                        <p className="text-2xl font-black text-slate-900">{pagination.total}</p>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-900 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        placeholder="Tìm kiếm theo mã giao dịch (Order Code)..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>

                <select 
                    className="w-full md:w-64 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
                    value={status} 
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">Tất cả trạng thái</option>
                    <option value="PAID">Đã thanh toán (Thành công)</option>
                    <option value="PENDING">Đang chờ thanh toán</option>
                    <option value="CANCELLED">Đã hủy</option>
                </select>

               
            </div>

            {/* Main Table Wrapper */}
            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-16 text-center text-slate-900 font-medium">Đang tải dữ liệu...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-16 text-center text-slate-900 font-medium">
                        Không tìm thấy giao dịch nào phù hợp với bộ lọc.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-900 font-black">
                                    <th className="p-6">Mã Giao Dịch</th>
                                    <th className="p-6">Khách hàng</th>
                                    <th className="p-6">Gói Dịch vụ</th>
                                    <th className="p-6">Số Tiền</th>
                                    <th className="p-6 text-center">Thời gian</th>
                                    <th className="p-6 text-center">Trạng Thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-900">
                                {transactions.map((tx) => {
                                    const dateObj = new Date(tx.createdAt);
                                    
                                    return (
                                        <tr key={tx._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6">
                                                <span className="font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                                                    #{tx.orderCode}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-extrabold text-slate-900 mb-1">{tx.userId?.fullName || "Khách hàng ẩn danh"}</div>
                                                <div className="font-semibold text-xs text-slate-900">{tx.userId?.email || "N/A"}</div>
                                            </td>
                                            <td className="p-6">
                                                <span className="font-extrabold text-slate-900 block mb-1">
                                                    {planLabels[tx.planType] || tx.planType}
                                                </span>
                                                {tx.tokensAdded > 0 && (
                                                    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-md font-black uppercase">
                                                        <CreditCard className="w-3 h-3" /> +{tx.tokensAdded} Token
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-6">
                                                <span className="text-emerald-600 font-black text-base">
                                                    {formatCurrency(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="font-extrabold text-slate-900">{dateObj.toLocaleDateString('vi-VN')}</div>
                                                <div className="font-medium text-xs text-slate-900 mt-1">{dateObj.toLocaleTimeString('vi-VN')}</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                {tx.status === 'PAID' && (
                                                    <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-xl border border-emerald-200 uppercase tracking-wide">
                                                        <CheckCircle2 className="w-4 h-4" /> Đã thanh toán
                                                    </span>
                                                )}
                                                {tx.status === 'PENDING' && (
                                                    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl border border-amber-200 uppercase tracking-wide">
                                                        <Clock className="w-4 h-4" /> Đang chờ
                                                    </span>
                                                )}
                                                {tx.status === 'CANCELLED' && (
                                                    <span className="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-black px-3 py-1.5 rounded-xl border border-rose-200 uppercase tracking-wide">
                                                        <XCircle className="w-4 h-4" /> Đã hủy
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <span className="text-sm font-bold text-slate-900">
                            Trang {page} / {pagination.totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page <= 1 || loading}
                                className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                <ChevronLeft className="w-4 h-4" /> Trước
                            </button>
                            <button 
                                onClick={() => setPage((prev) => prev + 1)}
                                disabled={page >= pagination.totalPages || loading}
                                className="flex items-center gap-1 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl border border-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                Sau <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentManagement;