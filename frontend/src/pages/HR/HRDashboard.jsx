import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Users, FileCheck, Calendar, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';

const HRDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in pb-12">
      {/* Header & Lời chào */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Bảng điều khiển Tuyển dụng</h1>
          <p className="text-slate-500 text-base">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">Nguyễn Mai Anh</span>. Xem tổng quan chiến dịch và lượng CV ứng tuyển.
          </p>
        </div>
        
        <button 
          onClick={() => navigate('/job-postings')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-blue-500/20 flex items-center transition-all hover:scale-[1.02] shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Tạo Job Mới
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {[
          { icon: Briefcase, title: 'Chiến dịch đang mở', value: '12 Jobs', color: 'blue' },
          { icon: Users, title: 'Tổng CV nhận được', value: '156 CV', color: 'emerald' },
          { icon: FileCheck, title: 'Pass vòng AI (AI Score)', value: '45 CV', color: 'purple' },
          { icon: Calendar, title: 'Lịch phỏng vấn tới', value: '8 Lịch', color: 'amber' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const bgColors = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100',
            emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            purple: 'bg-purple-50 text-purple-600 border-purple-100',
            amber: 'bg-amber-50 text-amber-600 border-amber-100',
          };
          
          return (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${bgColors[stat.color]}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm text-slate-500 font-semibold mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT LỚN TRÁI: Danh sách Job gần đây */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-extrabold text-slate-900">Chiến dịch tuyển dụng gần đây</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
                  <th className="p-4 px-6">Vị trí ứng tuyển</th>
                  <th className="p-4">Lượt nộp</th>
                  <th className="p-4">Hạn chót</th>
                  <th className="p-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: 'Senior React Developer', cv: '24 CV', date: '30/06/2026', status: 'Đang mở', type: 'active' },
                  { name: 'Node.js Backend Lead', cv: '12 CV', date: '15/07/2026', status: 'Đang mở', type: 'active' },
                  { name: 'UI/UX Designer', cv: '-', date: '-', status: 'Bản nháp', type: 'draft' },
                ].map((job, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 px-6 font-bold text-slate-800">{job.name}</td>
                    <td className="p-4 font-bold text-slate-500">{job.cv}</td>
                    <td className="p-4 font-medium text-slate-500">{job.date}</td>
                    <td className="p-4">
                      {job.type === 'active' ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                          {job.status}
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
                          {job.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 mt-auto">
            <button className="w-full py-3 rounded-xl text-sm font-bold text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors">
              Xem toàn bộ chiến dịch <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: AI Sàng lọc CV */}
        <div className="bg-gradient-to-b from-indigo-50 to-white p-1 rounded-3xl shadow-sm border border-indigo-100">
          <div className="bg-white rounded-[22px] p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                Sàng lọc CV AI
              </h2>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                Tự động
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-6">Hệ thống vừa bóc tách và chấm điểm các CV mới nhất so với JD.</p>
            
            <div className="space-y-4 flex-1">
              {[
                { name: 'Vũ Thành Trung', match: '92%', pos: 'Senior React Developer' },
                { name: 'Trần Văn A', match: '85%', pos: 'Node.js Backend Lead' },
              ].map((cv, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-2xl bg-white hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="font-bold text-slate-800 text-base group-hover:text-indigo-600 transition-colors">{cv.name}</h3>
                    <span className="text-emerald-600 font-extrabold text-sm bg-emerald-50 px-2.5 py-1 rounded-md">{cv.match} Match</span>
                  </div>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {cv.pos}
                  </p>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 flex items-center justify-center transition-colors shadow-md">
              Vào phòng lọc CV <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HRDashboard;