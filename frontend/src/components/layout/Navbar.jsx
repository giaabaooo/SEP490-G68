import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const Navbar = () => {
  const navigate = useNavigate();
  // Giả lập trạng thái đăng nhập. Trong thực tế, bạn sẽ lấy từ Context hoặc LocalStorage
  const isLoggedIn = localStorage.getItem('token') !== null; 
  const user = JSON.parse(localStorage.getItem('user')) || null;
  // Mặc định là candidate nếu chưa đăng nhập, hoặc lấy role từ user
  const role = user ? user.role : 'candidate'; 

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="top-navbar">
      <div className="nav-left">
        <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8"/>
          </svg>
          <span className="brand-text">Careerio</span>
        </Link>
      </div>

      {/* Điều chỉnh NavLink dựa trên Role của người dùng */}
      <div className="nav-center">
        {role === 'employer' ? (
          <>
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/job-postings" className="nav-link">Tin Tuyển Dụng</NavLink>
            <NavLink to="/applications" className="nav-link">Quản Lý Ứng Viên</NavLink>
            <NavLink to="/skill-tests" className="nav-link">Kho Bài Test</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/jobs" className="nav-link">Việc Làm</NavLink>
            <NavLink to="/ai-cv" className="nav-link">Hồ Sơ & AI CV</NavLink>
            <NavLink to="/practice" className="nav-link">Luyện Tập & Phỏng Vấn</NavLink>
            <NavLink to="/courses" className="nav-link">Khóa Học & Mentor</NavLink>
          </>
        )}
      </div>

      <div className="nav-right">
        {isLoggedIn ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div className="user-profile">
                <span>{user?.fullName || 'Tài khoản'}</span>
                <div className="avatar-circle">
                  {/* Hiển thị chữ cái đầu tiên của tên */}
                  <span style={{color: '#1d4ed8', fontWeight: 'bold'}}>{user?.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                </div>
              </div>
            </Link>
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #e2e8f0',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              Đăng xuất
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link to="/login" style={{ textDecoration: 'none' }}>
              <button style={{
                background: 'transparent',
                color: '#1d4ed8',
                border: '1px solid #1d4ed8',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Đăng nhập
              </button>
            </Link>
            <Link to="/register" style={{ textDecoration: 'none' }}>
              <button style={{
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Đăng ký
              </button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;