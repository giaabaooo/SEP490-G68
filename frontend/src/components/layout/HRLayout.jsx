import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Briefcase, LogOut } from 'lucide-react';

const HRLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Navbar chuyên biệt cho HR */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-2xl">
          <Briefcase className="w-7 h-7" />
          <span>Careerio</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-slate-500">
          <Link 
            to="/hr/dashboard" 
            className={`pb-1 border-b-2 transition-colors ${location.pathname === '/hr/dashboard' ? 'text-blue-600 border-blue-600' : 'hover:text-blue-600 border-transparent'}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/hr/dashboard" 
            className="hover:text-blue-600 pb-1 border-b-2 border-transparent transition-colors"
          >
            Quản lý Jobs
          </Link>
          <Link 
            to="/hr/dashboard" 
            className="hover:text-blue-600 pb-1 border-b-2 border-transparent transition-colors"
          >
            Ngân hàng CV
          </Link>
          <Link 
            to="/hr/dashboard" 
            className="hover:text-blue-600 pb-1 border-b-2 border-transparent transition-colors"
          >
            AI Screening
          </Link>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 rounded-full p-1.5 text-sm shadow-inner">
          <button className="text-slate-600 px-4 py-2 font-semibold hover:text-slate-900 transition-colors rounded-full hover:bg-white/50">
            Candidate
          </button>
          <button className="bg-blue-600 text-white px-5 py-2 rounded-full font-semibold shadow-md hover:bg-blue-700 transition-colors">
            Employer
          </button>
          <div className="w-px h-6 bg-slate-300 mx-1"></div>
          <button className="flex items-center gap-2 text-slate-700 px-3 py-2 font-semibold hover:text-blue-600 transition-colors group">
            Techcombank HR 
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default HRLayout;
