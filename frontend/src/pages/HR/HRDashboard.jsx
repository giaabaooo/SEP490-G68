import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. THÊM IMPORT NÀY TỪ REACT ROUTER
import { Briefcase, Users, FileCheck, Calendar, ArrowRight, LogOut, PlusCircle } from 'lucide-react';

const HRDashboard = () => {
  const navigate = useNavigate(); // 2. KHỞI TẠO HOOK ĐIỀU HƯỚNG

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* Navbar (Giữ nguyên style) */}
      <nav className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-blue-600 font-bold text-xl">
          <Briefcase className="w-6 h-6" />
          <span>Careerio</span>
        </div>
        
        <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-500">
          <a href="#" className="text-slate-900 pb-4 border-b-2 border-blue-600">Dashboard</a>
          <a href="#" className="hover:text-slate-900 pb-4 border-b-2 border-transparent">Quản lý Jobs</a>
          <a href="#" className="hover:text-slate-900 pb-4 border-b-2 border-transparent">Ngân hàng CV</a>
          <a href="#" className="hover:text-slate-900 pb-4 border-b-2 border-transparent">AI Screening</a>
        </div>

        <div className="flex items-center space-x-4 bg-slate-100 rounded-full p-1 text-sm">
          <button className="text-slate-600 px-4 py-1.5 font-medium hover:text-slate-900">Candidate</button>
          <button className="bg-blue-600 text-white px-4 py-1.5 rounded-full font-medium shadow-sm">Employer</button>
          <div className="w-px h-4 bg-slate-300 mx-2"></div>
          <button className="flex items-center text-slate-600 pr-3 font-medium hover:text-slate-900">
            Techcombank HR <LogOut className="w-4 h-4 ml-2" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header & Lời chào */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Bảng điều khiển Tuyển dụng</h1>
            <p className="text-slate-600">
              Chào mừng bạn quay lại, <span className="font-semibold text-slate-900">Nguyễn Mai Anh</span>. Xem tổng quan chiến dịch và lượng CV ứng tuyển.
            </p>
          </div>
          
          {/* 3. THÊM SỰ KIỆN ONCLICK VÀO NÚT NÀY */}
          <button 
            onClick={() => navigate('/hr/post-job')} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm flex items-center transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Tạo Job Mới
          </button>
        </div>

        {/* 4 Stats Cards (Cấu trúc giống ảnh) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Chiến dịch đang mở</p>
              <p className="text-xl font-bold text-slate-900">12 Jobs</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Tổng CV nhận được</p>
              <p className="text-xl font-bold text-slate-900">156 CV</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Pass vòng AI (AI Score)</p>
              <p className="text-xl font-bold text-slate-900">45 CV</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Lịch phỏng vấn tới</p>
              <p className="text-xl font-bold text-slate-900">8 Lịch</p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CỘT LỚN TRÁI: Danh sách Job gần đây */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Chiến dịch tuyển dụng gần đây</h2>
            
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-500 font-semibold">
                  <th className="pb-3">Vị trí ứng tuyển</th>
                  <th className="pb-3">Lượt nộp</th>
                  <th className="pb-3">Hạn chót</th>
                  <th className="pb-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 font-semibold text-slate-800">Senior React Developer</td>
                  <td className="py-4 font-bold text-slate-600">24 CV</td>
                  <td className="py-4 text-slate-500">30/06/2026</td>
                  <td className="py-4">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">Đang mở</span>
                  </td>
                </tr>
                <tr className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 font-semibold text-slate-800">Node.js Backend Lead</td>
                  <td className="py-4 font-bold text-slate-600">12 CV</td>
                  <td className="py-4 text-slate-500">15/07/2026</td>
                  <td className="py-4">
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold">Đang mở</span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-4 font-semibold text-slate-800">UI/UX Designer</td>
                  <td className="py-4 font-bold text-slate-600">-</td>
                  <td className="py-4 text-slate-500">-</td>
                  <td className="py-4">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Bản nháp</span>
                  </td>
                </tr>
              </tbody>
            </table>

            <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors">
              Xem toàn bộ chiến dịch <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

          {/* CỘT PHẢI: AI Sàng lọc CV */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
             <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-900">Sàng lọc CV AI</h2>
              <span className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                ✨ Tự động
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-6">Hệ thống vừa bóc tách và chấm điểm các CV mới nhất so với JD.</p>
            
            <div className="space-y-4">
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">Vũ Thành Trung</h3>
                  <span className="text-emerald-600 font-bold text-sm">92% Match</span>
                </div>
                <p className="text-xs text-slate-500">Ứng tuyển: Senior React Developer</p>
              </div>
              <div className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-slate-800 text-sm">Trần Văn A</h3>
                  <span className="text-emerald-600 font-bold text-sm">85% Match</span>
                </div>
                <p className="text-xs text-slate-500">Ứng tuyển: Node.js Backend Lead</p>
              </div>
            </div>

            <button className="w-full mt-6 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center transition-colors">
              Vào phòng lọc CV <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default HRDashboard;