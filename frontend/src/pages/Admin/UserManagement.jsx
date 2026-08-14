import { useEffect, useMemo, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = "http://localhost:5000/api";

const roleLabels = {
    admin: "Admin",
    candidate: "Candidate",
    business: "Business",
};

const statusLabels = {
    active: "Hoạt động",
    banned: "Đã khóa",
    pending: "Chờ xác nhận",
};

const statusColors = {
    active: { bg: "#dcfce7", text: "#166534" },
    banned: { bg: "#fee2e2", text: "#991b1b" },
    pending: { bg: "#fef3c7", text: "#92400e" },
};

// Map đúng với schema User.js (chỉ có free và pro)
const planLabels = {
    free: "Gói Free",
    pro: "Gói Pro (30 Ngày)"
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0, page: 1, limit: 10, totalPages: 1,
    });

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState("");

    // ================= MODAL STATE =================
    const [selectedUser, setSelectedUser] = useState(null);
    const [editPlan, setEditPlan] = useState("free");
    const [addTokens, setAddTokens] = useState(0);
    const [modalLoading, setModalLoading] = useState(false);
    // ===============================================

    const token = localStorage.getItem("token");
    const currentUser = useMemo(() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    }, []);

    const buildQueryString = () => {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (role) params.append("role", role);
        if (status) params.append("status", status);
        params.append("page", page);
        params.append("limit", pagination.limit || 10);
        return params.toString();
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/admin/users?${buildQueryString()}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) return toast.error(data.message || "Không thể lấy danh sách người dùng");
            
            setUsers(data.users || []);
            setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
        } catch {
            toast.error("Lỗi kết nối server khi lấy danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { fetchUsers(); }, 400);
        return () => clearTimeout(timer);
    }, [page, role, status, search]);

    const handleResetFilter = () => { setSearch(""); setRole(""); setStatus(""); setPage(1); };

    const handleUpdateStatus = async (userId, nextStatus) => {
        if (!window.confirm(nextStatus === "banned" ? "Chắc chắn khóa?" : "Chắc chắn mở khóa?")) return;
        try {
            setActionLoadingId(userId);
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await response.json();
            if (!response.ok) return toast.error(data.message || "Cập nhật thất bại");
            
            toast.success(data.message);
            setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
        } catch { toast.error("Lỗi server"); } finally { setActionLoadingId(""); }
    };

    const handleUpdateRole = async (userId, nextRole) => {
        if (!window.confirm(`Đổi quyền thành ${roleLabels[nextRole]}?`)) return;
        try {
            setActionLoadingId(userId);
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ role: nextRole }),
            });
            const data = await response.json();
            if (!response.ok) return toast.error(data.message || "Phân quyền thất bại");
            
            toast.success(data.message);
            setUsers((prev) => prev.map((u) => (u._id === userId ? data.user : u)));
        } catch { toast.error("Lỗi server"); } finally { setActionLoadingId(""); }
    };

    // ================= XỬ LÝ LƯU GÓI & TOKEN =================
    const handleOpenModal = (user) => {
        setSelectedUser(user);
        // Map đúng vào data từ DB
        setEditPlan(user.subscription?.plan || "free");
        setAddTokens(0); 
    };

    const handleUpdatePlanAndToken = async (e) => {
        e.preventDefault();
        try {
            setModalLoading(true);
            const payload = {};
            if (selectedUser.role === "candidate") payload.plan = editPlan;
            if (selectedUser.role === "business") payload.addTokens = Number(addTokens);

            const response = await fetch(`${API_BASE_URL}/admin/users/${selectedUser._id}/subscription`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || "Cập nhật thất bại");
            
            toast.success("Cập nhật thành công!");
            
            // Cập nhật lại UI bằng data user mới trả về từ Backend
            setUsers((prev) => prev.map((u) => (u._id === selectedUser._id ? data.user : u)));
            setSelectedUser(null);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setModalLoading(false);
        }
    };
    // =========================================================

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />
            <style>{`
                .admin-user-page { min-height: calc(100vh - 120px); background: #f8fafc; padding: 36px 48px; font-family: 'Inter', sans-serif; }
                .admin-user-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
                .admin-user-title { font-size: 32px; font-weight: 800; color: #0f172a; margin: 0 0 8px; }
                .admin-user-subtitle { color: #64748b; font-size: 15px; margin: 0; }
                .admin-stat-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 18px 22px; min-width: 180px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
                .admin-stat-label { color: #64748b; font-size: 13px; margin-bottom: 6px; }
                .admin-stat-value { color: #0f172a; font-size: 28px; font-weight: 800; }
                .admin-filter-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 20px; margin-bottom: 22px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
                .admin-filter-form { display: grid; grid-template-columns: 1.8fr 1fr 1fr auto; gap: 12px; align-items: center; }
                .admin-input, .admin-select { width: 100%; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; font-size: 14px; color: #0f172a; outline: none; background: #f8fafc; transition: all 0.2s; }
                .admin-input:focus, .admin-select:focus { border-color: #3b82f6; background: #ffffff; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
                .admin-btn { border: none; border-radius: 12px; padding: 12px 16px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
                .admin-btn-primary { background: #2563eb; color: #ffffff; }
                .admin-btn-primary:hover { background: #1d4ed8; }
                .admin-btn-secondary { background: #e2e8f0; color: #334155; }
                .admin-btn-secondary:hover { background: #cbd5e1; }
                .admin-btn-danger { background: #ef4444; color: #ffffff; }
                .admin-btn-danger:hover { background: #dc2626; }
                .admin-btn-success { background: #22c55e; color: #ffffff; }
                .admin-btn-success:hover { background: #16a34a; }
                .admin-btn-warning { background: #f59e0b; color: #ffffff; padding: 10px 14px; }
                .admin-btn-warning:hover { background: #d97706; }
                .admin-btn:disabled { opacity: 0.6; cursor: not-allowed; }
                .admin-table-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05); }
                .admin-table { width: 100%; border-collapse: collapse; }
                .admin-table thead { background: #f1f5f9; }
                .admin-table th { text-align: left; padding: 15px 18px; font-size: 13px; color: #475569; font-weight: 800; border-bottom: 1px solid #e2e8f0; }
                .admin-table td { padding: 16px 18px; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-size: 14px; vertical-align: middle; }
                .admin-table tr:last-child td { border-bottom: none; }
                .admin-user-cell { display: flex; align-items: center; gap: 12px; }
                .admin-avatar { width: 42px; height: 42px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #38bdf8); color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: 800; flex-shrink: 0; }
                .admin-user-name { font-weight: 800; color: #0f172a; margin-bottom: 3px; }
                .admin-user-email { color: #64748b; font-size: 13px; }
                .admin-badge { display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 800; }
                .admin-role-badge { background: #dbeafe; color: #1d4ed8; }
                .admin-plan-badge { background: #fef3c7; color: #d97706; border: 1px solid #fde68a; }
                .admin-action-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
                .admin-action-select { border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 10px; outline: none; background: #ffffff; color: #0f172a; font-weight: 600; }
                .admin-empty { text-align: center; padding: 40px 20px; color: #64748b; font-size: 15px; }
                .admin-loading { text-align: center; padding: 40px 20px; color: #2563eb; font-size: 15px; font-weight: 700; }
                .admin-pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #ffffff; }
                .admin-pagination-info { color: #64748b; font-size: 14px; }
                .admin-pagination-actions { display: flex; gap: 8px; }

                /* CSS MODAL */
                .admin-modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.2s ease; }
                .admin-modal { background: #ffffff; border-radius: 24px; width: 100%; max-width: 480px; padding: 32px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: scaleUp 0.2s ease; }
                .admin-modal-title { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; }
                .form-group { margin-bottom: 20px; }
                .form-label { display: block; font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                .admin-modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @media (max-width: 1100px) { .admin-filter-form { grid-template-columns: 1fr 1fr; } .admin-user-header { flex-direction: column; } .admin-table-card { overflow-x: auto; } .admin-table { min-width: 1200px; } }
                @media (max-width: 700px) { .admin-user-page { padding: 24px 16px; } .admin-filter-form { grid-template-columns: 1fr; } }
            `}</style>

            <div className="admin-user-page">
                <div className="admin-user-header">
                    <div>
                        <h1 className="admin-user-title">Quản lý người dùng</h1>
                        <p className="admin-user-subtitle">
                            Quản trị danh sách tài khoản, khóa/mở khóa tài khoản và phân quyền người dùng trong hệ thống Careerio.
                        </p>
                    </div>

                    <div className="admin-stat-card">
                        <div className="admin-stat-label">Tổng người dùng</div>
                        <div className="admin-stat-value">{pagination.total}</div>
                    </div>
                </div>

                <div className="admin-filter-card">
                    <div className="admin-filter-form">
                        <input
                            className="admin-input"
                            placeholder="Tìm theo tên hoặc email..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        />

                        <select className="admin-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                            <option value="">Tất cả vai trò</option>
                            <option value="admin">Admin</option>
                            <option value="candidate">Candidate</option>
                            <option value="business">Business</option>
                        </select>

                        <select className="admin-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="banned">Đã khóa</option>
                            <option value="pending">Chờ xác nhận</option>
                        </select>

                        <button type="button" className="admin-btn admin-btn-secondary" onClick={handleResetFilter}>Làm mới</button>
                    </div>
                </div>

                <div className="admin-table-card">
                    {loading ? (
                        <div className="admin-loading">Đang tải danh sách người dùng...</div>
                    ) : users.length === 0 ? (
                        <div className="admin-empty">Không tìm thấy người dùng phù hợp.</div>
                    ) : (
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Người dùng</th>
                                    <th>Vai trò</th>
                                    <th>Trạng thái & Gói</th>
                                    <th>Số dư Token</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => {
                                    const isCurrentUser = currentUser?._id === user._id || currentUser?.id === user._id;
                                    const nextStatus = user.status === "banned" ? "active" : "banned";
                                    const color = statusColors[user.status] || statusColors.pending;
                                    
                                    // Map trường data thực tế
                                    const currentPlan = user.subscription?.plan || "free";
                                    const currentTokens = user.businessCredits?.balance || 0;

                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-avatar">
                                                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                                                    </div>
                                                    <div>
                                                        <div className="admin-user-name">
                                                            {user.fullName || "Chưa cập nhật"} {isCurrentUser ? " (Bạn)" : ""}
                                                        </div>
                                                        <div className="admin-user-email">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                <span className="admin-badge admin-role-badge">
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="flex flex-col items-start gap-2">
                                                    <span className="admin-badge" style={{ background: color.bg, color: color.text }}>
                                                        {statusLabels[user.status] || user.status}
                                                    </span>
                                                    {user.role === "candidate" && (
                                                        <span className={`admin-badge uppercase border ${currentPlan === 'pro' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                                            {planLabels[currentPlan]}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                {user.role === "business" ? (
                                                    <div>
                                                        <strong className="text-blue-600 font-black text-lg">{currentTokens}</strong> 
                                                        <span className="text-xs font-bold text-slate-400 ml-1">TK</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Không áp dụng</span>
                                                )}
                                            </td>

                                            <td>
                                                <div className="admin-action-row">
                                                    <select
                                                        className="admin-action-select"
                                                        value={user.role}
                                                        disabled={actionLoadingId === user._id}
                                                        onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                                                    >
                                                        <option value="admin">Admin</option>
                                                        <option value="candidate">Candidate</option>
                                                        <option value="business">Business</option>
                                                    </select>
                                                    
                                                    {/* Chỉ hiện nút cấp Gói/Token cho Candidate hoặc Business */}
                                                    {(user.role === "candidate" || user.role === "business") && (
                                                        <button
                                                            type="button"
                                                            className="admin-btn admin-btn-warning"
                                                            onClick={() => handleOpenModal(user)}
                                                        >
                                                            {user.role === "candidate" ? "Gói Pro" : "Cấp Token"}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        className={user.status === "banned" ? "admin-btn admin-btn-success" : "admin-btn admin-btn-danger"}
                                                        disabled={actionLoadingId === user._id}
                                                        onClick={() => handleUpdateStatus(user._id, nextStatus)}
                                                    >
                                                        {user.status === "banned" ? "Mở khóa" : "Khóa"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}

                    <div className="admin-pagination">
                        <div className="admin-pagination-info">
                            Trang {pagination.page || page} / {pagination.totalPages || 1}
                        </div>
                        <div className="admin-pagination-actions">
                            <button type="button" className="admin-btn admin-btn-secondary" disabled={page <= 1 || loading} onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>Trước</button>
                            <button type="button" className="admin-btn admin-btn-secondary" disabled={page >= (pagination.totalPages || 1) || loading} onClick={() => setPage((prev) => prev + 1)}>Sau</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL CẤP PHÁT GÓI VÀ TOKEN (Hiển thị form động theo role) */}
            {selectedUser && (
                <div className="admin-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="admin-modal-title">
                            {selectedUser.role === 'candidate' ? 'Quản lý Gói (Plan)' : 'Quản lý Token AI'}
                        </h3>
                        
                        <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <p className="text-sm text-slate-500 mb-1">Người dùng: <strong className="text-slate-800">{selectedUser.fullName || selectedUser.email}</strong></p>
                            <p className="text-sm text-slate-500 mb-1">Vai trò: <strong className="text-slate-800 uppercase">{selectedUser.role}</strong></p>
                            
                            {selectedUser.role === 'business' && (
                                <p className="text-sm text-slate-500 mt-2 pt-2 border-t border-slate-200">Số dư Token hiện tại: <strong className="text-blue-600 text-lg">{selectedUser.businessCredits?.balance || 0}</strong></p>
                            )}
                            {selectedUser.role === 'candidate' && (
                                <p className="text-sm text-slate-500 mt-2 pt-2 border-t border-slate-200">Gói hiện tại: <strong className="text-indigo-600 uppercase">{selectedUser.subscription?.plan || "free"}</strong></p>
                            )}
                        </div>

                        <form onSubmit={handleUpdatePlanAndToken}>
                            {/* FORM CHO CANDIDATE */}
                            {selectedUser.role === 'candidate' && (
                                <div className="form-group">
                                    <label className="form-label">Phân quyền Gói</label>
                                    <select 
                                        className="admin-select"
                                        value={editPlan} 
                                        onChange={(e) => setEditPlan(e.target.value)}
                                    >
                                        <option value="free">Gói Candidate Free (Mặc định)</option>
                                        <option value="pro">Gói Candidate Pro (30 ngày AI)</option>
                                    </select>
                                    {editPlan === 'pro' && (
                                        <p className="text-xs text-emerald-600 font-medium mt-2 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                                            Hệ thống sẽ tự động set thời hạn 30 ngày và reset lại usage cho ứng viên này.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* FORM CHO BUSINESS */}
                            {selectedUser.role === 'business' && (
                                <div className="form-group">
                                    <label className="form-label">Cộng / Trừ AI Token</label>
                                    <input 
                                        type="number" 
                                        className="admin-input" 
                                        placeholder="Ví dụ: 100 (Cộng) hoặc -50 (Trừ)"
                                        value={addTokens}
                                        onChange={(e) => setAddTokens(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-slate-500 mt-2 italic">
                                        * Nhập số dương để cộng thêm token, nhập số âm để trừ bớt token của doanh nghiệp.
                                    </p>
                                </div>
                            )}

                            <div className="admin-modal-actions">
                                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setSelectedUser(null)}>Hủy bỏ</button>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={modalLoading}>
                                    {modalLoading ? "Đang xử lý..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default UserManagement;