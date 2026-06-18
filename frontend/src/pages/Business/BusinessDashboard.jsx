import React from 'react';
import { Calendar, Plus, Briefcase, UserPlus, ClipboardList, TrendingUp } from 'lucide-react';

const BusinessDashboard = () => {
  // --- MOCK DATA ---
  const user = { fullName: "Vu Van Quang" };

  const getFormattedDate = () => {
    const today = new Date();
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const dayName = days[today.getDay()];
    const date = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    return `${dayName}, ${date} Tháng ${month}, ${year}`;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen p-8 font-sans">
      <div className="max-w-[1100px] mx-auto">
        
        {/* === HEADER === */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Xin chào, {user.fullName}</h1>
            <div className="flex items-center text-slate-500 mt-1.5 text-sm font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              {getFormattedDate()}
            </div>
          </div>
          <button className="bg-[#2563eb] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Đăng tin mới
          </button>
        </div>

        {/* === STATS GRID === */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">TIN TUYỂN DỤNG</p>
                <h3 className="text-4xl font-bold text-slate-900">0</h3>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" strokeWidth={2} />
              </div>
            </div>
            <div className="flex items-center mt-5 text-emerald-500 text-sm font-semibold">
              <TrendingUp className="w-4 h-4 mr-1.5" strokeWidth={2.5} />
              Đang hoạt động
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">ỨNG VIÊN MỚI</p>
                <h3 className="text-4xl font-bold text-slate-900">0</h3>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <UserPlus className="w-6 h-6 text-purple-600" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-5 text-blue-600 text-sm font-semibold">
              Cần duyệt
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">BÀI TEST HOÀN THÀNH</p>
                <h3 className="text-4xl font-bold text-slate-900">0</h3>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <ClipboardList className="w-6 h-6 text-orange-500" strokeWidth={2} />
              </div>
            </div>
            <div className="mt-5 text-slate-500 text-sm font-semibold">
              Trong tháng này
            </div>
          </div>
        </div>

        {/* === MAIN CONTENT === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột trái (2 phần) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[240px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 text-base">Tin tuyển dụng gần đây</h2>
                <button className="text-sm text-blue-600 font-semibold hover:text-blue-800">Xem tất cả</button>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <p className="text-slate-500">Chưa có tin tuyển dụng nào</p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[240px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h2 className="font-bold text-slate-900 text-base">Bài kiểm tra kỹ năng</h2>
                <button className="text-sm text-blue-600 font-semibold hover:text-blue-800">Quản lý kho đề</button>
              </div>
              <div className="flex-grow flex items-center justify-center">
                <p className="text-slate-500">Chưa có bài test nào</p>
              </div>
            </div>
          </div>

          {/* Cột phải (1 phần) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-[504px] flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-base">Hoạt động gần đây</h2>
              </div>
              <div className="p-6">
                <div className="border-l-2 border-slate-200 pl-4 py-1">
                  <p className="italic text-slate-400 text-sm">Chưa có hoạt động nào.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BusinessDashboard;