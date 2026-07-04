import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, MoreVertical } from 'lucide-react';

const PostJob = () => {
  const navigate = useNavigate();

  // Dữ liệu mock (sau này sẽ fetch từ database bảng Jobs)
  const jobs = [
    { id: 1, title: 'Senior React Developer', salary: '20,000,000 - 30,000,000', deadline: '2026-08-15', status: 'Active' },
    { id: 2, title: 'Node.js Backend Lead', salary: '30,000,000 - 45,000,000', deadline: '2026-08-20', status: 'Active' },
    { id: 3, title: 'UI/UX Designer', salary: '15,000,000 - 25,000,000', deadline: '2026-09-01', status: 'Draft' },
  ];

  return (
    <div className="animate-fade-in pb-12">
      {/* Header & Nút Tạo Job Mới */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Danh sách <span className="text-blue-600">Công việc</span>
          </h1>
          <p className="text-slate-500 text-base">Quản lý các chiến dịch tuyển dụng của bạn</p>
        </div>
        
        {/* NÚT TẠO JOB MỚI ĐƯỢC CHUYỂN SANG ĐÂY */}
        <button 
          onClick={() => navigate('/bussiness/create')} 
          className="bg-slate-900 hover:bg-blue-600 text-white px-7 py-3.5 rounded-2xl font-bold shadow-xl shadow-slate-900/10 flex items-center transition-all hover:-translate-y-1 active:translate-y-0 shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Tạo Job Mới
        </button>
      </div>

      {/* Bảng danh sách công việc */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto p-2">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-[2px] text-slate-400 font-black border-b border-slate-100 bg-slate-50/50">
                <th className="p-5">Vị trí tuyển dụng</th>
                <th className="p-5">Mức lương</th>
                <th className="p-5">Hạn chót</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {jobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{job.title}</td>
                  <td className="p-5 font-medium text-slate-500">{job.salary} VND</td>
                  <td className="p-5 font-medium text-slate-500">{new Date(job.deadline).toLocaleDateString('vi-VN')}</td>
                  <td className="p-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                      job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${job.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {job.status === 'Active' ? 'Hoạt động' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostJob;