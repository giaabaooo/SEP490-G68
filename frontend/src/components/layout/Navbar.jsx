import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell, ArrowRight } from 'lucide-react';
import './Layout.css';

const Navbar = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isLoggedIn = !!token;
  const role = user?.role || 'candidate'; // Mặc định là candidate nếu chưa đăng nhập

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching nav notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${API_BASE}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <style>{`
        /* Nới lỏng Navbar để chứa logo to hơn */
        .top-navbar {
          min-height: 76px !important; 
          padding: 0 40px !important;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .nav-item-dropdown { 
          position: relative; 
          display: flex; 
          align-items: center; 
          height: 100%; 
          padding: 10px 0;
          cursor: pointer; 
        }

        .nav-item-dropdown::after {
          content: '';
          position: absolute;
          bottom: -15px;
          left: 0;
          width: 100%;
          height: 15px;
        }

        .dropdown-menu-content { 
          visibility: hidden; 
          opacity: 0; 
          position: absolute; 
          top: calc(100% + 10px); 
          left: 0; 
          background: #ffffff; 
          border: 1px solid #e2e8f0; 
          border-radius: 12px; 
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08); 
          transition: all 0.2s ease-out; 
          z-index: 1000; 
          transform: translateY(-10px); 
        }

        .nav-item-dropdown:hover .dropdown-menu-content { 
          visibility: visible; 
          opacity: 1; 
          transform: translateY(0); 
        }

        /* --- Mega Menu Candidate --- */
        .dropdown-menu-content.mega-menu {
          left: 50%;
          transform: translate(-50%, -10px);
        }
        .nav-item-dropdown:hover .dropdown-menu-content.mega-menu {
          transform: translate(-50%, 0);
        }
        .mega-menu { width: 650px; display: flex; padding: 20px; gap: 30px; }
        .mega-col { flex: 1; }
        .mega-group { margin-bottom: 20px; }
        .mega-group:last-child { margin-bottom: 0; }
        .mega-title { font-size: 14px; font-weight: 600; color: #059669; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }
        .mega-item { display: flex; align-items: center; gap: 12px; padding: 10px; border-radius: 8px; color: #334155; font-size: 14px; font-weight: 500; text-decoration: none; transition: background 0.2s, color 0.2s; }
        .mega-item:hover { background: #f1f5f9; color: #059669; }
        .mega-item svg { flex-shrink: 0; color: #64748b; }
        .mega-item:hover svg { color: #059669; }

        /* --- User Dropdown --- */
        .user-dropdown-container .dropdown-menu-content { left: auto; right: 0; width: 320px; max-height: 85vh; overflow-y: auto; }
        .user-dropdown-container .dropdown-menu-content::-webkit-scrollbar { width: 6px; }
        .user-dropdown-container .dropdown-menu-content::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .dropdown-header { padding: 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; gap: 12px;}
        .dropdown-header-info { display: flex; flex-direction: column; overflow: hidden; }
        .dropdown-name { font-weight: 700; color: #1e293b; font-size: 15px; margin-bottom: 2px; }
        .dropdown-id { font-size: 12px; color: #64748b; }
        .menu-section { border-bottom: 1px solid #e2e8f0; padding: 8px 0; }
        .menu-section:last-child { border-bottom: none; }
        .menu-section-title { font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin: 8px 16px 4px; letter-spacing: 0.5px; }
        .dropdown-item { padding: 10px 16px 10px 36px; font-size: 14px; color: #334155; font-weight: 500; display: flex; align-items: center; gap: 10px; text-decoration: none; transition: background 0.2s; cursor: pointer; }
        .dropdown-item.has-icon { padding-left: 16px; }
        .dropdown-item:hover { background: #f1f5f9; color: #059669; }
        .dropdown-item.logout { color: #dc2626; }
        .dropdown-item.logout:hover { background: #fef2f2; color: #dc2626; }

        .avatar-circle { width: 38px; height: 38px; border-radius: 50%; background: #eff6ff; border: 2px solid #bfdbfe; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; flex-shrink: 0; }
        .user-dropdown-container:hover .avatar-circle { border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .user-profile { display: flex; align-items: center; gap: 8px; font-weight: 600; color: #334155; }
        .nav-link-item { display: flex; align-items: center; gap: 4px; color: #334155; font-weight: 600; text-decoration: none; padding-bottom: 2px; border-bottom: 2px solid transparent; transition: 0.2s;}
        .nav-link-item:hover { color: #059669; border-bottom-color: #059669; }
        .nav-link-item.active { color: #059669; border-bottom-color: #059669; }
      `}</style>

      <header className="top-navbar">
        <div className="nav-left" style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img
              src="/logo-careerio.png"
              alt="Careerio Logo"
              style={{ height: '52px', width: 'auto', objectFit: 'contain' }}
            />
          </Link>
          {/* Nhãn nhỏ đánh dấu quyền cho Admin/Business */}
          {role === 'admin' && <span style={{ marginLeft: '10px', fontSize: '12px', background: '#dc2626', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>ADMIN</span>}
          {role === 'business' && <span style={{ marginLeft: '10px', fontSize: '12px', background: '#2563eb', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>BUSINESS</span>}
        </div>

        <div className="nav-center" style={{ display: 'flex', gap: '30px', height: '100%' }}>

          {/* ===================== MENU ADMIN ===================== */}
          {role === 'admin' && (
            <>
              <div className="nav-item-dropdown">
                <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Quản Lý Người Dùng</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/admin/jobs" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Quản Lý Việc Làm</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Báo Cáo Thống Kê</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Cài Đặt Hệ Thống</NavLink>
              </div>
            </>
          )}

          {/* ===================== MENU BUSINESS ===================== */}
          {role === 'business' && (
            <>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/dashboard" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Dashboard</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/post-job" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Tạo Tin Tuyển Dụng</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/cvlist" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>Ngân Hàng CV</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/skill-tests" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>AI Screening</NavLink>
              </div>
            </>
          )}

          {/* ===================== MENU CANDIDATE ===================== */}
          {role === 'candidate' && (
            <>
              <div className="nav-item-dropdown">
                <NavLink to="/jobs" className={({ isActive }) => isActive ? "nav-link-item active" : "nav-link-item"}>
                  Việc làm <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </NavLink>
              </div>

              <div className="nav-item-dropdown">
                <div className="nav-link-item">
                  Tạo CV <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                </div>
                <div className="dropdown-menu-content mega-menu">
                  {/* Cột trái Mega Menu */}
                  <div className="mega-col">
                    <div className="mega-group">
                      <div className="mega-title">Mẫu CV theo style</div>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg> Mẫu CV Đơn giản</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg> Mẫu CV Ấn tượng</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> Mẫu CV Chuyên nghiệp</Link>
                    </div>
                    <div className="mega-group">
                      <div className="mega-title">Mẫu CV theo vị trí</div>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> Lập trình viên</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg> Nhân viên kế toán</Link>
                    </div>
                  </div>
                  {/* Cột phải Mega Menu */}
                  <div className="mega-col" style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '30px' }}>
                    <div className="mega-group" style={{ marginTop: '30px' }}>
                      <Link to="/candidate/manage-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg> Quản lý CV</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Tải CV lên</Link>
                      <Link to="/candidate/practice" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg> Hướng dẫn viết CV</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-item-dropdown">
                <Link to="/candidate/practice" className="nav-link-item">Công cụ <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></Link>
              </div>

              <div className="nav-item-dropdown">
                <Link to="/candidate/courses" className="nav-link-item">Cẩm nang nghề nghiệp <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg></Link>
              </div>
            </>
          )}
        </div>

        <div className="nav-right" style={{ height: '100%', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoggedIn && (
            <div className="nav-item-dropdown notification-dropdown-container">
              {/* Notification Icon */}
              <div className="relative p-2 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-red-500 text-[10px] text-white font-extrabold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* Notification Dropdown Panel */}
              <div className="dropdown-menu-content notification-dropdown-panel" style={{ right: 0, left: 'auto', width: '360px', padding: '16px' }}>
                <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
                  <h3 className="font-extrabold text-slate-800 text-sm">Thông báo gần đây</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      Đọc tất cả
                    </button>
                  )}
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      Chưa có thông báo nào.
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div 
                        key={n._id} 
                        onClick={() => handleMarkAsRead(n._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-left relative ${
                          !n.isRead 
                            ? 'bg-emerald-50/20 border-emerald-100 hover:border-emerald-300' 
                            : 'bg-slate-50/30 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <h4 className={`text-xs font-bold text-slate-800 mb-0.5 leading-tight ${!n.isRead ? 'font-extrabold text-slate-900' : ''}`}>
                          {n.title}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">
                          {new Date(n.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                        {!n.isRead && (
                          <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-center">
                  <Link 
                    to="/candidate/notifications" 
                    className="text-xs font-bold text-slate-500 hover:text-emerald-600 flex items-center gap-1"
                  >
                    Xem tất cả thông báo <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {isLoggedIn ? (
            <div className="nav-item-dropdown user-dropdown-container">
              <div className="user-profile">
                <div className="avatar-circle">
                  <span style={{ color: '#059669', fontWeight: 'bold' }}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              <div className="dropdown-menu-content" style={{ width: '280px' }}>
                <div className="dropdown-header">
                  <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                    <span style={{ color: '#059669', fontWeight: 'bold' }}>
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="dropdown-header-info">
                    <div className="dropdown-name">Chào {user?.fullName || 'bạn'}</div>
                    <div className="dropdown-id text-xs text-gray-500">{user?.email || 'Tài khoản đã xác thực'}</div>
                  </div>
                </div>

                {/* DROPDOWN MENU TÙY CHỈNH THEO ROLE */}
                {role === 'admin' && (
                  <div className="menu-section">
                    <Link to="/profile" className="dropdown-item">Hồ sơ Admin</Link>
                    <Link to="/admin/settings" className="dropdown-item">Cài đặt hệ thống</Link>
                  </div>
                )}

                {role === 'business' && (
                  <div className="menu-section">
                    <Link to="/bussiness/profile" className="dropdown-item">Hồ sơ doanh nghiệp</Link>
                    <Link to="/bussiness/settings" className="dropdown-item">Cài đặt tài khoản</Link>
                    <Link to="/profile" className="dropdown-item">Cá nhân & Bảo mật</Link>
                  </div>
                )}

                {role === 'candidate' && (
                  <>
                    <div className="menu-section">
                      <div className="menu-section-title">Quản lý tìm việc</div>
                      <Link to="/candidate" className="dropdown-item">Việc làm đã lưu</Link>
                      <Link to="/candidate/applications" className="dropdown-item">Việc làm đã ứng tuyển</Link>
                      <Link to="/candidate" className="dropdown-item">Việc làm phù hợp với bạn</Link>
                      <Link to="/candidate/notifications" className="dropdown-item">Thông báo tuyển dụng</Link>
                    </div>

                    <div className="menu-section">
                      <div className="menu-section-title">Quản lý CV & Cover letter</div>
                      <Link to="/candidate/manage-cv" className="dropdown-item">CV của tôi</Link>
                      <Link to="/candidate" className="dropdown-item" style={{ color: '#059669' }}>Nhà tuyển dụng xem hồ sơ</Link>
                    </div>

                    <div className="menu-section">
                      <div className="menu-section-title">Công cụ AI (Nâng cao)</div>
                      <Link to="/candidate/ai-interview" className="dropdown-item has-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 1 0 10 10H12V2z" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></svg>
                        Phòng Phỏng Vấn AI
                      </Link>
                    </div>

                    <div className="menu-section">
                      <Link to="/profile" className="dropdown-item has-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Cá nhân & Bảo mật
                      </Link>
                    </div>
                  </>
                )}

                <div className="menu-section" style={{ paddingBottom: '16px' }}>
                  <div className="dropdown-item has-icon logout" onClick={handleLogout} style={{ justifyContent: 'center', background: '#f8fafc', margin: '0 16px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                    Đăng xuất
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'transparent', color: '#059669', border: '1px solid #059669', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button style={{ backgroundColor: '#059669', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)' }}>
                  Đăng ký
                </button>
              </Link>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Navbar;