// File: src/pages/Moderator/TestBank.jsx
import React, { useState, useEffect } from 'react';
import { Database, Search, FileEdit, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const TestBank = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/assessments/my-tests', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setTests(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto mt-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">Ngân hàng Bài Test</h1>
          <p className="text-slate-500">Quản lý kho dữ liệu đề thi và trạng thái phê duyệt.</p>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-50 font-bold border-b border-slate-100">
                <th className="p-5">Tên bài Test</th>
                <th className="p-5">Job liên kết</th>
                <th className="p-5 text-center">Số câu hỏi</th>
                <th className="p-5 text-center">Thời lượng</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
              ) : tests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" /> Chưa có bài Test nào được tạo.
                  </td>
                </tr>
              ) : (
                tests.map((test) => (
                  <tr key={test._id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="p-5 font-bold text-slate-800 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      {test.assessmentName}
                    </td>
                    <td className="p-5 text-sm font-semibold text-blue-600">{test.jobId?.title || 'Chưa gắn Job'}</td>
                    <td className="p-5 text-center font-medium text-slate-600">{test.questions?.length || 0} câu</td>
                    <td className="p-5 text-center font-medium text-slate-600">{test.timeLimit} phút</td>
                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex w-fit ${
                        test.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {test.status === 'PUBLISHED' ? 'Đã duyệt' : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <button 
                        onClick={() => navigate(`/moderator/edit-test/${test._id}`)}
                        className="px-4 py-2 hover:bg-emerald-50 hover:text-emerald-700 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 text-xs shadow-sm"
                      >
                        <FileEdit className="w-3.5 h-3.5" /> Sửa Test
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestBank;