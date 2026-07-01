import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Briefcase, LogOut, LayoutDashboard, FileText, Users, Wand2, ShieldCheck, User } from 'lucide-react';

const BusinessLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  // State quản lý Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    localStorage.clear();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/business/dashboard', icon: LayoutDashboard },
    { label: 'Tạo Tin Tuyển Dụng', path: '/business/post-job', icon: FileText },
    { label: 'Ngân hàng CV', path: '/business/applications', icon: Users },
    { label: 'AI Screening', path: '/business/skill-tests', icon: Wand2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Navbar Business */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Briefcase className="w-8 h-8" />
          <span>Careerio <span className="text-slate-400 font-medium text-lg">| Business</span></span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-500">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
                location.pathname === item.path ? 'text-blue-600 border-blue-600' : 'hover:text-blue-600 border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                {user.fullName || 'Nhà tuyển dụng'}
              </span>
              <span className="text-[11px] text-blue-600 uppercase tracking-widest font-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Premium
              </span>
            </div>
            
            {/* Avatar Circle */}
            <div className="w-10 h-10 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center font-bold text-blue-600 text-lg group-hover:border-blue-500 group-hover:shadow-[0_0_0_4px_rgba(59,130,246,0.1)] transition-all">
              {user.fullName?.charAt(0).toUpperCase() || 'B'}
            </div>
          </div>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-[120%] right-0 bg-white border border-slate-200 rounded-xl shadow-xl w-64 z-50 overflow-hidden origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="font-bold text-slate-800 text-sm mb-1">{user.fullName || 'Nhà tuyển dụng'}</div>
                <div className="text-xs text-slate-500 truncate">{user.email || 'business@careerio.com'}</div>
              </div>
              
              <div className="p-2">
                <Link to="/business/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                  <User className="w-4 h-4" />
                  Hồ sơ doanh nghiệp
                </Link>
                <Link to="/business/settings" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors">
                  <Briefcase className="w-4 h-4" />
                  Cài đặt tài khoản
                </Link>
              </div>
              
              <div className="p-2 border-t border-slate-100">
                <button 
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>

      {/* Business Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm font-medium text-slate-500">
            © 2026 Careerio Business. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Hỗ trợ đối tác</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Bảo mật dữ liệu</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Điều khoản API</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BusinessLayout;