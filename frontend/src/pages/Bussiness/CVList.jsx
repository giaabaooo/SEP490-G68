import React, { useState } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock } from 'lucide-react';

const CVList = () => {
  // Dữ liệu mock (Dựa theo bảng Applications trong DB)
  const [applications] = useState([
    { id: 1, name: 'Trần Văn A', position: 'Senior React Developer', aiScore: 92, status: 'Interviewing', appliedAt: '2026-07-05', avatar: 'https://ui-avatars.com/api/?name=Tran+Van+A&background=eff6ff&color=3b82f6' },
    { id: 2, name: 'Nguyễn Thị B', position: 'Node.js Backend Lead', aiScore: 88, status: 'Testing', appliedAt: '2026-07-04', avatar: 'https://ui-avatars.com/api/?name=Nguyen+Thi+B&background=f0fdf4&color=22c55e' },
    { id: 3, name: 'Lê Hoàng C', position: 'Senior React Developer', aiScore: 65, status: 'Applied', appliedAt: '2026-07-06', avatar: 'https://ui-avatars.com/api/?name=Le+Hoang+C&background=f8fafc&color=64748b' },
    { id: 4, name: 'Vũ Đức D', position: 'UI/UX Designer', aiScore: 42, status: 'Rejected', appliedAt: '2026-07-01', avatar: 'https://ui-avatars.com/api/?name=Vu+Duc+D&background=fef2f2&color=ef4444' },
  ]);

  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Applied': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Testing': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Interviewing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Offered': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getAiScoreStyle = (score) => {
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (score >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Quản lý <span className="text-blue-600">Hồ sơ ứng viên</span>
          </h1>
          <p className="text-slate-500 text-base">Xem xét và đánh giá các CV đã nộp vào hệ thống</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc vị trí..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 mr-2 shadow-sm">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">Lọc:</span>
        </div>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeFilter === filter 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {filter === 'All' ? 'Tất cả' : filter}
          </button>
        ))}
      </div>

      {/* Bảng Danh sách CV */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ứng viên</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Vị trí ứng tuyển</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">AI Match</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ngày nộp</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Trạng thái</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.filter(app => activeFilter === 'All' || app.status === activeFilter).map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors group">
                  
                  {/* Cột Ứng viên */}
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={app.avatar} alt={app.name} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{app.name}</p>
                        <p className="text-xs font-medium text-slate-400">ID: #{app.id}092A</p>
                      </div>
                    </div>
                  </td>

                  {/* Cột Vị trí */}
                  <td className="p-6">
                    <p className="font-bold text-slate-700 text-sm">{app.position}</p>
                  </td>

                  {/* Cột AI Match */}
                  <td className="p-6">
                    <div className="flex justify-center">
                      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${getAiScoreStyle(app.aiScore)}`}>
                        {app.aiScore >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                        <span className="font-black text-sm">{app.aiScore}%</span>
                      </div>
                    </div>
                  </td>

                  {/* Cột Ngày nộp */}
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{new Date(app.appliedAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(app.status)}`}>
                      {app.status}
                    </span>
                  </td>

                  {/* Cột Thao tác */}
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors tooltip" title="Xem CV">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors tooltip" title="Duyệt">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors tooltip" title="Loại">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors tooltip" title="Tải xuống">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Trạng thái trống nếu không có dữ liệu lọc */}
          {applications.filter(app => activeFilter === 'All' || app.status === activeFilter).length === 0 && (
            <div className="p-12 text-center">
              <p className="text-slate-400 font-medium">Không tìm thấy hồ sơ nào phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CVList;