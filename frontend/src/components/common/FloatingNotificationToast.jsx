import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X, ExternalLink, Sparkles, Clock } from 'lucide-react';
import { formatNotificationTime } from '../../utils/timeAgo';

const FloatingNotificationToast = () => {
  const [activeToast, setActiveToast] = useState(null);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const seenIdsRef = useRef(new Set());
  const mountTimeRef = useRef(Date.now());
  const isInitialLoadRef = useRef(true);
  const navigate = useNavigate();

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const DISPLAY_DURATION = 6000; // 6 giây tự biến mất

  const getStorageKey = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user?._id ? `careerio_shown_notifs_${user._id}` : 'careerio_shown_notifs';
    } catch {
      return 'careerio_shown_notifs';
    }
  };

  // Lấy danh sách ID đã từng hiển thị từ localStorage
  const getShownIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(getStorageKey()) || '[]'));
    } catch {
      return new Set();
    }
  };

  const markIdsAsShown = (ids) => {
    if (!ids || ids.length === 0) return;
    try {
      const key = getStorageKey();
      const currentList = JSON.parse(localStorage.getItem(key) || '[]');
      const set = new Set(currentList);
      ids.forEach(id => {
        if (id) {
          set.add(id);
          seenIdsRef.current.add(id);
        }
      });
      const updatedList = Array.from(set);
      if (updatedList.length > 300) updatedList.splice(0, updatedList.length - 300);
      localStorage.setItem(key, JSON.stringify(updatedList));
    } catch {}
  };

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

      const shownSet = getShownIds();
      const now = Date.now();

      // LẦN ĐẦU TIÊN TẢI HOẶC VỪA MỚI LOGIN:
      // Luôn ghi nhận TOÀN BỘ thông báo hiện tại là đã biết -> TUYỆT ĐỐI KHÔNG POPUP THÔNG BÁO CŨ
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        markIdsAsShown(data.map(n => n._id));
        return;
      }

      // ĐIỀU KIỆN ĐỂ POPUP TOAST THỜI GIAN THỰC:
      // 1. Chưa từng hiển thị (không có trong shownSet và seenIdsRef)
      // 2. Phải là thông báo CHƯA ĐỌC (!n.isRead)
      // 3. Thời gian tạo phải MỚI TINH (trong vòng 60 giây gần nhất VÀ sau lúc mở ứng dụng mountTimeRef)
      const newNotif = data.find(n => {
        if (!n || n.isRead) return false;
        if (seenIdsRef.current.has(n._id) || shownSet.has(n._id)) return false;
        const createdMs = n.createdAt ? new Date(n.createdAt).getTime() : 0;
        const isRecent = (now - createdMs) <= 60 * 1000; // Không quá 60s
        const isAfterMount = createdMs >= (mountTimeRef.current - 5000);
        return isRecent && isAfterMount;
      });

      // Bất kỳ thông báo cũ nào phát hiện được thì âm thầm đánh dấu đã biết, không bao giờ popup
      const oldUnshownIds = data
        .filter(n => !shownSet.has(n._id) && ((now - new Date(n.createdAt).getTime()) > 60 * 1000 || n.isRead))
        .map(n => n._id);
      if (oldUnshownIds.length > 0) {
        markIdsAsShown(oldUnshownIds);
      }

      if (newNotif) {
        markIdsAsShown([newNotif._id]);
        showToast(newNotif);
        try {
          window.dispatchEvent(new CustomEvent('new_notification_received', { detail: newNotif }));
        } catch (e) {}
      }
    } catch (err) {
      // Bỏ qua lỗi polling im lặng
    }
  };

  const showToast = (notif) => {
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
      dismissToast(false); // Hết 6s tự biến mất
    }, DISPLAY_DURATION);
  };

  const dismissToast = (markAsRead = true) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    if (activeToast?._id) {
      markIdsAsShown([activeToast._id]);

      if (markAsRead) {
        const token = localStorage.getItem('token');
        if (token) {
          fetch(`${API_BASE}/api/notifications/${activeToast._id}/read`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => {});
        }
      }
    }

    setActiveToast(null);
  };

  const handleToastClick = async () => {
    if (!activeToast) return;
    const targetLink = activeToast.link;
    const notifId = activeToast._id;

    try {
      window.dispatchEvent(new CustomEvent('app_notification_clicked', { detail: activeToast }));
    } catch (e) {}

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

    dismissToast(true);

    // Điều hướng tới đúng trang
    if (targetLink) {
      navigate(targetLink);
    } else if (activeToast.relatedApplicationId) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'business' ? `/bussiness/candidate/${activeToast.relatedApplicationId}` : '/candidate/applications');
    } else {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(user.role === 'business' ? '/bussiness/notifications' : '/candidate/notifications');
    }
  };

  useEffect(() => {
    checkNotifications();

    // Polling định kỳ mỗi 6 giây
    const interval = setInterval(checkNotifications, 6000);
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
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Thông báo mới
              </span>
              <span className="text-[10px] font-black text-slate-800 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-700" />
                {formatNotificationTime(activeToast.createdAt)}
              </span>
            </div>

            <h4 className="text-sm font-black text-slate-950 leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {activeToast.title}
            </h4>

            <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed line-clamp-2">
              {activeToast.message}
            </p>

            <div className="mt-2 flex items-center gap-1 text-[11px] font-black text-emerald-700 group-hover:translate-x-0.5 transition-transform">
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
