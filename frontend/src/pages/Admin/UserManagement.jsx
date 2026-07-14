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
    active: {
        bg: "#dcfce7",
        text: "#166534",
    },
    banned: {
        bg: "#fee2e2",
        text: "#991b1b",
    },
    pending: {
        bg: "#fef3c7",
        text: "#92400e",
    },
};

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    });

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState("");

    const token = localStorage.getItem("token");
    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user"));
        } catch {
            return null;
        }
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

            const queryString = buildQueryString();

            const response = await fetch(`${API_BASE_URL}/admin/users?${queryString}`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Không thể lấy danh sách người dùng");
                return;
            }

            setUsers(data.users || []);
            setPagination(
                data.pagination || {
                    total: 0,
                    page: 1,
                    limit: 10,
                    totalPages: 1,
                }
            );
        } catch {
            toast.error("Lỗi kết nối server khi lấy danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 400);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, role, status, search]);


    const handleResetFilter = () => {
        setSearch("");
        setRole("");
        setStatus("");
        setPage(1);
    };

    const handleUpdateStatus = async (userId, nextStatus) => {
        const confirmMessage =
            nextStatus === "banned"
                ? "Bạn có chắc muốn khóa tài khoản này?"
                : "Bạn có chắc muốn mở khóa tài khoản này?";

        if (!window.confirm(confirmMessage)) return;

        try {
            setActionLoadingId(userId);

            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: nextStatus,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Cập nhật trạng thái thất bại");
                return;
            }

            toast.success(data.message || "Cập nhật trạng thái thành công");

            setUsers((prevUsers) =>
                prevUsers.map((user) => (user._id === userId ? data.user : user))
            );
        } catch {
            toast.error("Lỗi kết nối server khi cập nhật trạng thái");
        } finally {
            setActionLoadingId("");
        }
    };

    const handleUpdateRole = async (userId, nextRole) => {
        if (!window.confirm(`Bạn có chắc muốn đổi quyền người dùng thành ${roleLabels[nextRole]}?`)) {
            return;
        }

        try {
            setActionLoadingId(userId);

            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    role: nextRole,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Phân quyền thất bại");
                return;
            }

            toast.success(data.message || "Phân quyền thành công");

            setUsers((prevUsers) =>
                prevUsers.map((user) => (user._id === userId ? data.user : user))
            );
        } catch {
            toast.error("Lỗi kết nối server khi phân quyền");
        } finally {
            setActionLoadingId("");
        }
    };

    return (
        <>
            <ToastContainer position="top-right" autoClose={3000} />

            <style>{`
        .admin-user-page {
          min-height: calc(100vh - 120px);
          background: #f8fafc;
          padding: 36px 48px;
          font-family: 'Inter', sans-serif;
        }

        .admin-user-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 28px;
        }

        .admin-user-title {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 8px;
        }

        .admin-user-subtitle {
          color: #64748b;
          font-size: 15px;
          margin: 0;
        }

        .admin-stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px 22px;
          min-width: 180px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }

        .admin-stat-label {
          color: #64748b;
          font-size: 13px;
          margin-bottom: 6px;
        }

        .admin-stat-value {
          color: #0f172a;
          font-size: 28px;
          font-weight: 800;
        }

        .admin-filter-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 20px;
          margin-bottom: 22px;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .admin-filter-form {
          display: grid;
          grid-template-columns: 1.8fr 1fr 1fr auto;
          gap: 12px;
          align-items: center;
        }

        .admin-input,
        .admin-select {
          width: 100%;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 14px;
          color: #0f172a;
          outline: none;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .admin-input:focus,
        .admin-select:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .admin-btn {
          border: none;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .admin-btn-primary {
          background: #2563eb;
          color: #ffffff;
        }

        .admin-btn-primary:hover {
          background: #1d4ed8;
        }

        .admin-btn-secondary {
          background: #e2e8f0;
          color: #334155;
        }

        .admin-btn-secondary:hover {
          background: #cbd5e1;
        }

        .admin-btn-danger {
          background: #ef4444;
          color: #ffffff;
        }

        .admin-btn-danger:hover {
          background: #dc2626;
        }

        .admin-btn-success {
          background: #22c55e;
          color: #ffffff;
        }

        .admin-btn-success:hover {
          background: #16a34a;
        }

        .admin-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table thead {
          background: #f1f5f9;
        }

        .admin-table th {
          text-align: left;
          padding: 15px 18px;
          font-size: 13px;
          color: #475569;
          font-weight: 800;
          border-bottom: 1px solid #e2e8f0;
        }

        .admin-table td {
          padding: 16px 18px;
          border-bottom: 1px solid #f1f5f9;
          color: #0f172a;
          font-size: 14px;
          vertical-align: middle;
        }

        .admin-table tr:last-child td {
          border-bottom: none;
        }

        .admin-user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .admin-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #38bdf8);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          flex-shrink: 0;
        }

        .admin-user-name {
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 3px;
        }

        .admin-user-email {
          color: #64748b;
          font-size: 13px;
        }

        .admin-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 12px;
          font-weight: 800;
        }

        .admin-role-badge {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .admin-action-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .admin-action-select {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 9px 10px;
          outline: none;
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
        }

        .admin-empty {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
          font-size: 15px;
        }

        .admin-loading {
          text-align: center;
          padding: 40px 20px;
          color: #2563eb;
          font-size: 15px;
          font-weight: 700;
        }

        .admin-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          background: #ffffff;
        }

        .admin-pagination-info {
          color: #64748b;
          font-size: 14px;
        }

        .admin-pagination-actions {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 1100px) {
          .admin-filter-form {
            grid-template-columns: 1fr 1fr;
          }

          .admin-user-header {
            flex-direction: column;
          }

          .admin-table-card {
            overflow-x: auto;
          }

          .admin-table {
            min-width: 1000px;
          }
        }

        @media (max-width: 700px) {
          .admin-user-page {
            padding: 24px 16px;
          }

          .admin-filter-form {
            grid-template-columns: 1fr;
          }
        }
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
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />

                        <select
                            className="admin-select"
                            value={role}
                            onChange={(e) => {
                                setRole(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="admin">Admin</option>
                            <option value="candidate">Candidate</option>
                            <option value="business">Business</option>
                        </select>

                        <select
                            className="admin-select"
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="active">Hoạt động</option>
                            <option value="banned">Đã khóa</option>
                            <option value="pending">Chờ xác nhận</option>
                        </select>

                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={handleResetFilter}
                        >
                            Làm mới
                        </button>
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
                                    <th>Trạng thái</th>
                                    <th>Số điện thoại</th>
                                    <th>Ngày tạo</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>

                            <tbody>
                                {users.map((user) => {
                                    const isCurrentUser = currentUser?._id === user._id || currentUser?.id === user._id;
                                    const nextStatus = user.status === "banned" ? "active" : "banned";
                                    const color = statusColors[user.status] || statusColors.pending;

                                    return (
                                        <tr key={user._id}>
                                            <td>
                                                <div className="admin-user-cell">
                                                    <div className="admin-avatar">
                                                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                                                    </div>

                                                    <div>
                                                        <div className="admin-user-name">
                                                            {user.fullName || "Chưa cập nhật"}
                                                            {isCurrentUser ? " (Bạn)" : ""}
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
                                                <span
                                                    className="admin-badge"
                                                    style={{
                                                        background: color.bg,
                                                        color: color.text,
                                                    }}
                                                >
                                                    {statusLabels[user.status] || user.status}
                                                </span>
                                            </td>

                                            <td>{user.phone || "Chưa cập nhật"}</td>

                                            <td>
                                                {user.createdAt
                                                    ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                                                    : "Không có"}
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

                                                    <button
                                                        type="button"
                                                        className={
                                                            user.status === "banned"
                                                                ? "admin-btn admin-btn-success"
                                                                : "admin-btn admin-btn-danger"
                                                        }
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
                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                            >
                                Trước
                            </button>

                            <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                disabled={page >= (pagination.totalPages || 1) || loading}
                                onClick={() => setPage((prev) => prev + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserManagement;