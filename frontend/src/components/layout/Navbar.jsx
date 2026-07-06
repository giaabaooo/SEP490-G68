import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import './Layout.css';

const Navbar = () => {
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user')) || null;
  const isLoggedIn = !!token;
  const role = user?.role || 'candidate';

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
        .nav-link-item { display: flex; align-items: center; gap: 4px; color: #334155; font-weight: 600; text-decoration: none; }
        .nav-link-item:hover { color: #059669; }
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
        </div>

        <div className="nav-center" style={{ display: 'flex', gap: '24px', height: '100%' }}>
          {role === 'business' ? (
            <>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/dashboard" className="nav-link-item">Dashboard</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/job-postings" className="nav-link-item">Quản Lý Tuyển Dụng</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/applications" className="nav-link-item">Quản Lý Ứng Viên</NavLink>
              </div>
              <div className="nav-item-dropdown">
                <NavLink to="/bussiness/skill-tests" className="nav-link-item">Kho Bài Test</NavLink>
              </div>
            </>
          ) : (
            <>
              <div className="nav-item-dropdown">
                <NavLink to="/jobs" className="nav-link-item">Việc làm <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></NavLink>
              </div>

              <div className="nav-item-dropdown">
                <div className="nav-link-item">Tạo CV <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></div>
                <div className="dropdown-menu-content mega-menu">
                  <div className="mega-col">
                    <div className="mega-group">
                      <div className="mega-title">Mẫu CV theo style <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> Mẫu CV Đơn giản</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Mẫu CV Ấn tượng</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Mẫu CV Chuyên nghiệp</Link>
                      <Link to="/candidate/cv-templates" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg> Mẫu CV Harvard</Link>
                    </div>

                    <div className="mega-group">
                      <div className="mega-title">Mẫu CV theo vị trí ứng tuyển <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
                      <Link to="/ai-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Nhân viên kinh doanh</Link>
                      <Link to="/ai-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Lập trình viên</Link>
                      <Link to="/ai-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Nhân viên kế toán</Link>
                      <Link to="/ai-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> Chuyên viên marketing</Link>
                    </div>
                  </div>

                  <div className="mega-col" style={{ borderLeft: '1px solid #f1f5f9', paddingLeft: '30px' }}>
                    <div className="mega-group" style={{ marginTop: '30px' }}>
                      <Link to="/candidate/manage-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Quản lý CV</Link>
                      <Link to="/candidate/manage-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Tải CV lên</Link>
                      <Link to="/candidate/manage-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Hướng dẫn viết CV</Link>
                      <Link to="/candidate/manage-cv" className="mega-item" style={{ marginTop: '15px' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> Quản lý Cover Letter</Link>
                      <Link to="/candidate/manage-cv" className="mega-item"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Mẫu Cover Letter</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-item-dropdown">
                <Link to="/practice" className="nav-link-item" style={{ textDecoration: 'none' }}>Công cụ <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></Link>
              </div>

              <div className="nav-item-dropdown">
                <Link to="/courses" className="nav-link-item" style={{ textDecoration: 'none' }}>Cẩm nang nghề nghiệp <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></Link>
              </div>
            </>
          )}
        </div>

        <div className="nav-right" style={{ height: '100%' }}>
          {isLoggedIn ? (
            <div className="nav-item-dropdown user-dropdown-container">
              <div className="user-profile">
                <div className="avatar-circle">
                  <span style={{color: '#059669', fontWeight: 'bold'}}>
                    {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>

              <div className="dropdown-menu-content">
                <div className="dropdown-header">
                  <div className="avatar-circle" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                    <span style={{color: '#059669', fontWeight: 'bold'}}>
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="dropdown-header-info">
                    <div className="dropdown-name">Chào {user?.fullName || 'bạn'}</div>
                    <div className="dropdown-id">Tài khoản đã xác thực <br/> ID: {user?.id || '4297468'}</div>
                  </div>
                </div>

                <div className="menu-section">
                  <div className="menu-section-title">Quản lý tìm việc</div>
                  <Link to="/candidate" className="dropdown-item">Việc làm đã lưu</Link>
                  <Link to="/candidate" className="dropdown-item">Việc làm đã ứng tuyển</Link>
                  <Link to="/candidate" className="dropdown-item">Việc làm phù hợp với bạn</Link>
                  <Link to="/candidate" className="dropdown-item">Cài đặt gợi ý việc làm</Link>
                </div>

                <div className="menu-section">
                  <div className="menu-section-title">Quản lý CV & Cover letter</div>
                  <Link to="/candidate/manage-cv" className="dropdown-item">CV của tôi</Link>
                  <Link to="/candidate/cover-letter" className="dropdown-item">Cover Letter của tôi</Link>
                  <Link to="/candidate" className="dropdown-item">Nhà tuyển dụng muốn kết nối</Link>
                  <Link to="/candidate" className="dropdown-item" style={{ color: '#059669' }}>Nhà tuyển dụng xem hồ sơ</Link>
                </div>

                <div className="menu-section">
                  <Link to="/candidate" className="dropdown-item has-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Cài đặt email & thông báo
                  </Link>
                  <Link to="/profile" className="dropdown-item has-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Cá nhân & Bảo mật
                  </Link>
                  <Link to="/candidate" className="dropdown-item has-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    Nâng cấp tài khoản
                  </Link>
                </div>

                <div className="menu-section" style={{ paddingBottom: '16px' }}>
                  <div className="dropdown-item has-icon logout" onClick={handleLogout} style={{ justifyContent: 'center', background: '#f8fafc', margin: '0 16px', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '10px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
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