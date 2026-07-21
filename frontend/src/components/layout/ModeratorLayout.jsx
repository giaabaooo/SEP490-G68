import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, ClipboardList, Database, ShieldCheck, User, BrainCircuit } from 'lucide-react';

const ModeratorLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

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
    { label: 'Yêu cầu Test', path: '/moderator/requests', icon: ClipboardList },
    { label: 'Ngân hàng Bài Test', path: '/moderator/test-bank', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Navbar Moderator */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-2xl cursor-pointer" onClick={() => navigate('/moderator/requests')}>
          <BrainCircuit className="w-8 h-8" />
          <span>Careerio <span className="text-slate-400 font-medium text-lg">| Moderator</span></span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm font-bold text-slate-500">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`flex items-center gap-2 pb-1 border-b-2 transition-all ${
                location.pathname.includes(item.path) ? 'text-emerald-600 border-emerald-600' : 'hover:text-emerald-600 border-transparent'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                {user.fullName || 'Người kiểm duyệt'}
              </span>
              <span className="text-[11px] text-emerald-600 uppercase tracking-widest font-black flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> SME / Reviewer
              </span>
            </div>
            
            <div className="w-10 h-10 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center font-bold text-emerald-600 text-lg group-hover:border-emerald-500 group-hover:shadow-[0_0_0_4px_rgba(16,185,129,0.1)] transition-all">
              {user.fullName?.charAt(0).toUpperCase() || 'M'}
            </div>
          </div>

          {showDropdown && (
            <div className="absolute top-[120%] right-0 bg-white border border-slate-200 rounded-xl shadow-xl w-64 z-50 overflow-hidden origin-top-right transition-all">
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <div className="font-bold text-slate-800 text-sm mb-1">{user.fullName || 'Người kiểm duyệt'}</div>
                <div className="text-xs text-slate-500 truncate">{user.email || 'moderator@careerio.com'}</div>
              </div>
              
              <div className="p-2">
                <Link to="/profile" className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-600 rounded-lg transition-colors">
                  <User className="w-4 h-4" /> Cá nhân & Bảo mật
                </Link>
              </div>
              
              <div className="p-2 border-t border-slate-100">
                <button onClick={handleLogout} className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <LogOut className="w-4 h-4" /> Đăng xuất
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
    </div>
  );
};

export default ModeratorLayout;