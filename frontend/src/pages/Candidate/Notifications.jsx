import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Check, Inbox, AlertCircle, Clock, CheckCheck, 
  ExternalLink, FileText, Award, Briefcase, Mail, CheckCircle2,
  Sparkles, ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatNotificationTime, formatFullDateTime } from '../../utils/timeAgo';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const notifsPerPage = 10;

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isBusiness = user.role === 'business';

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
      setNotifications(Array.isArray(data) ? data : []);
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

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      handleMarkAsRead(n._id);
    }
    if (n.link) {
      navigate(n.link);
    } else if (n.relatedApplicationId) {
      navigate(isBusiness ? `/bussiness/candidate/${n.relatedApplicationId}` : '/candidate/applications');
    } else {
      if (isBusiness) {
        navigate('/bussiness/dashboard');
      } else {
        navigate('/candidate/applications');
      }
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

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application_submitted':
      case 'cv_updated':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'test_completed':
      case 'test_submitted':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'moderator_request':
      case 'job_approved':
      case 'test_draft':
      case 'test_updated':
        return <Briefcase className="w-5 h-5 text-emerald-600" />;
      case 'email_notification':
        return <Mail className="w-5 h-5 text-purple-600" />;
      case 'status_change':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      default:
        return <Bell className="w-5 h-5 text-blue-600" />;
    }
  };

  const getNotificationTag = (type) => {
    switch (type) {
      case 'application_submitted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">ỨNG TUYỂN & CV</span>;
      case 'cv_updated':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 text-cyan-800 border border-cyan-200">CẬP NHẬT CV</span>;
      case 'test_completed':
      case 'test_submitted':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">BÀI KIỂM TRA</span>;
      case 'moderator_request':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">MODERATOR TEST</span>;
      case 'job_approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">ĐÃ PHÁT HÀNH</span>;
      case 'status_change':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">TRẠNG THÁI</span>;
      case 'email_notification':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200">THƯ MỜI / EMAIL</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">HỆ THỐNG</span>;
    }
  };

  const totalPages = Math.ceil(notifications.length / notifsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [notifications.length, currentPage, totalPages]);

  const currentNotifs = notifications.slice((currentPage - 1) * notifsPerPage, currentPage * notifsPerPage);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 animate-fade-in font-inter">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight">
                {isBusiness ? (
                  <>Thông báo <span className="text-blue-600">Tuyển Dụng & Ứng Viên</span></>
                ) : (
                  <>Thông báo của <span className="text-emerald-600">Tôi</span></>
                )}
              </h1>
              <p className="text-slate-900 font-medium text-xs md:text-sm mt-0.5">
                {isBusiness 
                  ? 'Theo dõi tất cả thông báo về ứng viên nộp CV, kết quả bài test, cập nhật hồ sơ và quy trình xét tuyển.'
                  : 'Theo dõi tất cả thông báo về tiến trình tuyển dụng, lịch kiểm tra và kết quả phỏng vấn.'
                }
              </p>
            </div>
          </div>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-2xl text-xs font-black border border-blue-200 transition-all shadow-sm cursor-pointer shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24 text-slate-900 font-bold">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Đang tải thông báo...
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-900 rounded-2xl border border-red-200 flex items-center gap-3 font-bold">
          <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      ) : currentNotifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-800 mb-4">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-black text-slate-950 mb-1">Chưa có thông báo nào</h3>
          <p className="text-slate-800 text-sm font-semibold text-center max-w-sm">
            {isBusiness 
              ? 'Khi ứng viên nộp hồ sơ, làm bài test hoặc cập nhật CV, thông báo sẽ hiển thị tại đây.'
              : 'Thông báo liên quan đến tiến trình ứng tuyển của bạn sẽ xuất hiện ở đây.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden divide-y divide-slate-100">
            {currentNotifs.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-5 md:p-6 flex items-start gap-4 transition-all cursor-pointer hover:bg-slate-50 ${
                  !n.isRead ? 'bg-blue-50/20' : 'bg-white'
                }`}
              >
                {/* ICON */}
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                    !n.isRead 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-slate-100 border-slate-200'
                  }`}>
                    {getNotificationIcon(n.type)}
                  </div>
                  {!n.isRead && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-600 rounded-full border-2 border-white shadow-xs"></span>
                  )}
                </div>

                {/* CONTENT */}
                <div className="grow min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className={`text-sm md:text-base leading-snug ${
                        !n.isRead ? 'font-black text-slate-950' : 'font-bold text-slate-900'
                      }`}>
                        {n.title}
                      </h4>
                      {getNotificationTag(n.type)}
                    </div>
                    
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-black text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {formatNotificationTime(n.createdAt)}
                      </span>
                      <span className="text-[10px] font-black text-slate-700 hidden sm:inline-block">
                        ({formatFullDateTime(n.createdAt)})
                      </span>
                    </div>
                  </div>

                  <p className="text-xs md:text-sm font-semibold text-slate-800 leading-relaxed break-words pr-2 mt-1">
                    {n.message}
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    {(n.link || n.relatedApplicationId) && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800">
                        <span>{isBusiness ? 'Xem hồ sơ ứng viên' : 'Xem chi tiết'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {!n.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(n._id);
                        }}
                        className="text-xs font-bold text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        Đánh dấu đã đọc
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 mb-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 bg-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-9 h-9 rounded-xl font-black text-xs transition-all shadow-xs cursor-pointer ${
                    currentPage === page 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20' 
                      : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100'
                  } border`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 bg-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Notifications;