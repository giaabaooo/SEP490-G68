import React, { useState } from 'react';
import { Database, Search, FileEdit } from 'lucide-react';

const TestBank = () => {
  const [tests] = useState([
    { id: 'T01', title: 'Bài Test Kỹ năng Frontend (React)', qCount: 20, time: 30, status: 'approved' },
    { id: 'T02', title: 'Bài Test Backend (Node.js/MongoDB)', qCount: 15, time: 25, status: 'draft' },
  ]);

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Ngân hàng Bài Test</h1>
          <p className="text-slate-500">Quản lý kho dữ liệu câu hỏi và các bộ đề thi đã được duyệt.</p>
        </div>
        
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input type="text" placeholder="Tìm kiếm bài test..." className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-500 outline-none w-64" />
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-50 font-bold border-b border-slate-100">
              <th className="p-5">Tên bài Test</th>
              <th className="p-5 text-center">Số câu hỏi</th>
              <th className="p-5 text-center">Thời lượng</th>
              <th className="p-5">Trạng thái</th>
              <th className="p-5 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((test) => (
              <tr key={test.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="p-5 font-bold text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Database className="w-5 h-5" />
                  </div>
                  {test.title}
                </td>
                <td className="p-5 text-center font-medium text-slate-600">{test.qCount} câu</td>
                <td className="p-5 text-center font-medium text-slate-600">{test.time} phút</td>
                <td className="p-5">
                  <span className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider inline-flex w-fit ${
                    test.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {test.status === 'approved' ? 'Đã duyệt (Active)' : 'Bản nháp'}
                  </span>
                </td>
                <td className="p-5 text-center">
                  <button className="p-2 text-slate-400 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 rounded-lg transition-colors">
                    <FileEdit className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestBank;