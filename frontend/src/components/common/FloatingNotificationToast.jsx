import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ExternalLink, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

const FloatingNotificationToast = () => {
  const [activeToast, setActiveToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const DISPLAY_DURATION = 6000; // 6 giây tự biến mất

  // Khởi tạo các ID đã có sẵn trong DB lúc load trang để tránh popup dồn dập các thông báo cũ
  const isInitialLoadRef = useRef(true);

  const checkNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return;

      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) return;

      if (isInitialLoadRef.current) {
        // Lần đầu tải: lấy thông báo chưa đọc mới nhất nếu có (trong vòng 1 giờ qua) để nhắc người dùng
        isInitialLoadRef.current = false;
        data.forEach(n => seenIdsRef.current.add(n._id));

        const newestUnread = data.find(n => !n.isRead);
        if (newestUnread) {
          // Cho phép hiện thông báo chưa đọc mới nhất lúc vừa vào trang
          showToast(newestUnread);
        }
        return;
      }

      // Các lần polling sau: tìm thông báo chưa đọc mà chưa hiển thị
      const newNotif = data.find(n => !n.isRead && !seenIdsRef.current.has(n._id));
      if (newNotif) {
        seenIdsRef.current.add(newNotif._id);
        showToast(newNotif);
      }
    } catch (err) {
      // Bỏ qua lỗi polling im lặng
    }
  };

  const showToast = (notif) => {
    // Xóa timer cũ nếu đang có
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    setActiveToast(notif);
    setProgress(100);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPercent = Math.max(0, 100 - (elapsed / DISPLAY_DURATION) * 100);
      setProgress(remainingPercent);
      if (remainingPercent <= 0) {
        clearInterval(progressIntervalRef.current);
      }
    }, 50);

    timerRef.current = setTimeout(() => {
      dismissToast();
    }, DISPLAY_DURATION);
  };

  const dismissToast = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    setActiveToast(null);
  };

  const handleToastClick = async () => {
    if (!activeToast) return;
    const targetLink = activeToast.link;
    const notifId = activeToast._id;

    // Đánh dấu đã đọc trên server
    try {
      const token = localStorage.getItem('token');
      if (token && notifId) {
        fetch(`${API_BASE}/api/notifications/${notifId}/read`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    } catch (err) {}

    dismissToast();

    // Điều hướng tới đúng trang
    if (targetLink) {
      navigate(targetLink);
    } else {
      navigate('/candidate/notifications');
    }
  };

  useEffect(() => {
    // Check ngay khi mount
    checkNotifications();

    // Polling định kỳ mỗi 8 giây
    const interval = setInterval(checkNotifications, 8000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  if (!activeToast) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] max-w-sm w-full transition-all duration-300 transform translate-y-0 opacity-100 font-inter"
      style={{ animation: 'slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div
        onClick={handleToastClick}
        className="group relative bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-4 overflow-hidden cursor-pointer hover:border-emerald-500 hover:shadow-emerald-500/10 transition-all duration-200"
      >
        {/* Progress bar đếm ngược tự biến mất */}
        <div
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-start gap-3">
          {/* Icon nổi bật */}
          <div className="relative shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-200" />
          </div>

          {/* Nội dung */}
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Thông báo mới
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {activeToast.title}
            </h4>

            <p className="text-xs font-medium text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
              {activeToast.message}
            </p>

            <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              <span>Bấm để xem chi tiết</span>
              <ExternalLink className="w-3 h-3" />
            </div>
          </div>

          {/* Nút đóng [X] */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissToast();
            }}
            className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingNotificationToast;
