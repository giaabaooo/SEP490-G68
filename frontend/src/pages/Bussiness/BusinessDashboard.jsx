import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Users, FileCheck, Calendar, ArrowRight, PlusCircle, Sparkles, TrendingUp } from 'lucide-react';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  return (
    <div className="animate-fade-in pb-8">
      {/* Header & Lời chào */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Bảng điều khiển <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-base flex items-center gap-2">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">{user.fullName || 'Nhà tuyển dụng'}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </p>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Briefcase, title: 'Chiến dịch mở', value: '12 Jobs', color: 'blue' },
          { icon: Users, title: 'CV nhận được', value: '156 CV', color: 'emerald' },
          { icon: FileCheck, title: 'Pass vòng AI', value: '45 CV', color: 'purple' },
          { icon: Calendar, title: 'Lịch phỏng vấn', value: '8 Lịch', color: 'amber' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colors = {
            blue: 'text-blue-600 bg-blue-50 border-blue-100',
            emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            purple: 'text-purple-600 bg-purple-50 border-purple-100',
            amber: 'text-amber-600 bg-amber-50 border-amber-100',
          };
          return (
            <div key={index} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-blue-300 hover:shadow-md transition-all cursor-default">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[stat.color]} group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs - Trái */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">Chiến dịch gần đây</h2>
            <Link to="/business/post-job" className="text-blue-600 font-bold text-sm hover:underline flex items-center">
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[2px] text-slate-400 font-black border-b border-slate-100">
                  <th className="p-5">Vị trí tuyển dụng</th>
                  <th className="p-5">Lượng ứng tuyển</th>
                  <th className="p-5">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { name: 'Senior React Developer', cv: '24 CV', type: 'active' },
                  { name: 'Node.js Backend Lead', cv: '12 CV', type: 'active' },
                  { name: 'UI/UX Designer', cv: '0 CV', type: 'draft' },
                ].map((job, idx) => (
                  <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-bold text-slate-800">{job.name}</td>
                    <td className="p-5 font-bold text-slate-500">{job.cv}</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                        job.type === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-2 ${job.type === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {job.type === 'active' ? 'Hoạt động' : 'Bản nháp'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Screening Sidebar - Phải */}
        <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              Sàng lọc AI
            </h2>
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Live</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Vũ Thành Trung', match: '92%', pos: 'React Dev' },
              { name: 'Trần Văn A', match: '85%', pos: 'Node.js' },
            ].map((cv, idx) => (
              <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{cv.name}</h3>
                  <span className="text-emerald-600 font-black text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{cv.match}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{cv.pos}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group">
            Phòng lọc CV <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;