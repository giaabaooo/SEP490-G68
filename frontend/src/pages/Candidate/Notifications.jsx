import React, { useState, useEffect } from 'react';
import { Bell, Check, Inbox, AlertCircle, Clock, CheckCheck } from 'lucide-react';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Không thể tải danh sách thông báo');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message || 'Lỗi tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      toast.success('Đã đánh dấu đã đọc');
    } catch (err) {
      toast.error(err.message || 'Lỗi xử lý');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Thao tác thất bại');
      
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('Đã đánh dấu đọc tất cả thông báo');
    } catch (err) {
      toast.error(err.message || 'Lỗi xử lý');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-emerald-600" />
            Thông báo của <span className="text-emerald-600">tôi</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Theo dõi tất cả thông báo về tiến trình tuyển dụng, lịch kiểm tra và kết quả phỏng vấn.
          </p>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-2xl text-sm font-bold border border-emerald-100 transition-all shadow-sm cursor-pointer"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400">Đang tải thông báo...</div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <span>{error}</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Chưa có thông báo nào</h3>
          <p className="text-slate-400 text-sm text-center max-w-sm">
            Thông báo liên quan đến tiến trình ứng tuyển của bạn sẽ xuất hiện ở đây.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden divide-y divide-slate-100">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`p-6 flex gap-4 transition-all hover:bg-slate-50/50 ${
                !n.isRead ? 'bg-emerald-50/10' : ''
              }`}
            >
              {/* Icon & Unread Indicator */}
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                  !n.isRead 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                {!n.isRead && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                )}
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0">
                <div className="flex justify-between items-start gap-4">
                  <h4 className={`text-base font-bold text-slate-900 leading-tight mb-1 truncate ${
                    !n.isRead ? 'font-extrabold' : ''
                  }`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(n.createdAt).toLocaleDateString('vi-VN')} {new Date(n.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed break-words pr-4">
                  {n.message}
                </p>
              </div>

              {/* Action */}
              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="p-2 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-xl transition-colors border border-slate-100 flex-shrink-0 align-self-start self-start cursor-pointer"
                  title="Đánh dấu đã đọc"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
