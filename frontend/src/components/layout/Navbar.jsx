import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isLoggedIn = !!token;
  const role = user?.role || 'candidate';

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setShowDropdown(false);
    navigate('/login', { replace: true });
  };

  return (
    <>
      <style>{`
        .user-dropdown-container { position: relative; cursor: pointer; }
        .dropdown-menu { position: absolute; top: 120%; right: 0; background: white; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); width: 240px; z-index: 1000; overflow: hidden; animation: slideDown 0.2s ease-out; }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .dropdown-header { padding: 16px; border-bottom: 1px solid #e2e8f0; background: #f8fafc; }
        .dropdown-name { font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 4px; }
        .dropdown-email { font-size: 13px; color: #64748b; word-break: break-all; }
        .dropdown-item { padding: 12px 16px; font-size: 14px; color: #334155; font-weight: 500; display: block; text-decoration: none; transition: background 0.2s; }
        .dropdown-item:hover { background: #f1f5f9; color: #1d4ed8; }
        .dropdown-item.logout { color: #dc2626; border-top: 1px solid #e2e8f0; }
        .dropdown-item.logout:hover { background: #fef2f2; }
        
        /* FIX LỖI AVATAR Ở ĐÂY */
        .avatar-circle {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: #eff6ff;
          border: 2px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }
        .user-dropdown-container:hover .avatar-circle {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        .user-profile { display: flex; align-items: center; gap: 12px; font-weight: 600; color: #334155; }
      `}</style>

      <header className="top-navbar">
        <div className="nav-left">
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8"/>
            </svg>
            <span className="brand-text">Careerio</span>
          </Link>
        </div>

        <div className="nav-center">
          {role === 'business' ? (
            <>
              <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
              <NavLink to="/job-postings" className="nav-link">Quản Lý Tuyển Dụng</NavLink>
              <NavLink to="/applications" className="nav-link">Quản Lý Ứng Viên</NavLink>
              <NavLink to="/skill-tests" className="nav-link">Kho Bài Test</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/jobs" className="nav-link">Việc Làm</NavLink>
              <NavLink to="/profile" className="nav-link">Hồ Sơ & AI CV</NavLink>
              <NavLink to="/practice" className="nav-link">Luyện Tập & Phỏng Vấn</NavLink>
              <NavLink to="/courses" className="nav-link">Khóa Học & Mentor</NavLink>
            </>
          )}
        </div>

        <div className="nav-right">
          {isLoggedIn ? (
            <div className="user-dropdown-container" ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-profile">
                <span>{user?.fullName?.split(' ').pop() || 'Tài khoản'}</span>
                <div className="avatar-circle">
                  <span style={{color: '#1d4ed8', fontWeight: 'bold'}}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              {showDropdown && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-name">{user?.fullName}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                  <Link to="/profile" className="dropdown-item">Hồ sơ cá nhân</Link>
                  <Link to="/settings" className="dropdown-item">Cài đặt tài khoản</Link>
                  <div className="dropdown-item logout" onClick={handleLogout}>Đăng xuất</div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button style={{ background: 'transparent', color: '#1d4ed8', border: '1px solid #1d4ed8', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}>
                  Đăng nhập
                </button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button style={{ backgroundColor: '#1d4ed8', color: '#ffffff', border: 'none', padding: '9px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 6px -1px rgba(29, 78, 216, 0.2)' }}>
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