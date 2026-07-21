import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Loader2, AlertCircle } from 'lucide-react';

const PostJob = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State quản lý tab đang chọn
  const [activeTab, setActiveTab] = useState('main'); // 'main' hoặc 'pending'

  useEffect(() => {
    const loadJobs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách công việc');

        setJobs(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadJobs();
  }, [navigate]);

  // Bộ lọc dữ liệu theo Tab
  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'pending') {
      return job.requireTest === true && job.testStatus === 'pending';
    }
    // Tab main: Bao gồm các job Không cần test, HOẶC đã được Test duyệt (approved)
    return !job.requireTest || job.testStatus === 'approved';
  });

  return (
    <div className="animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Quản lý <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Theo dõi tin đăng và các bài test đánh giá năng lực ứng viên.</p>
        </div>
        
        <button 
          onClick={() => navigate('/bussiness/create')} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center transition-all hover:-translate-y-0.5 shrink-0"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Tạo Job Mới
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-8 mb-6 border-b border-slate-200 px-2">
        <button 
          onClick={() => setActiveTab('main')}
          className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'main' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Chiến dịch của bạn
          {activeTab === 'main' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></span>}
        </button>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'pending' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Đợi kiểm duyệt Test
          {jobs.some(j => j.requireTest && j.testStatus === 'pending') && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          )}
          {activeTab === 'pending' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-amber-500 rounded-t-full"></span>}
        </button>
      </div>

      {/* Bảng danh sách công việc */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-black border-b border-slate-100 bg-slate-50/50">
                <th className="p-5">Vị trí tuyển dụng</th>
                <th className="p-5">Mức lương</th>
                <th className="p-5">Hạn chót</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải dữ liệu...
                  </td>
                </tr>
              )}
              
              {!loading && filteredJobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 font-medium">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                      Không có công việc nào trong danh sách này.
                    </div>
                  </td>
                </tr>
              )}

              {filteredJobs.map((job) => (
                <tr key={job._id || job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{job.title}</td>
                  <td className="p-5 font-medium text-slate-500">{job.salary || 'Thỏa thuận'}{job.salary && job.salary.toLowerCase() !== 'thỏa thuận' ? ' VND' : ''}</td>
                  <td className="p-5 font-medium text-slate-500">{job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : '—'}</td>
                  <td className="p-5">
                    {/* Nếu nằm ở tab Pending Test thì hiển thị trạng thái chờ duyệt vàng chói */}
                    {job.requireTest && job.testStatus === 'pending' ? (
                      <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center bg-amber-100 text-amber-700">
                        <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500 animate-pulse"></span>
                        Chờ SME Duyệt Test
                      </span>
                    ) : (
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                        job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : job.status === 'Draft' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.status === 'Active' ? 'bg-emerald-500' : job.status === 'Draft' ? 'bg-slate-400' : 'bg-red-500'}`}></span>
                        {job.status === 'Active' ? 'Hoạt động' : job.status === 'Draft' ? 'Bản nháp' : 'Đã đóng'}
                      </span>
                    )}
                  </td>
                  <td className="p-5 text-center">
                    <button 
                      onClick={() => navigate(`/bussiness/edit-job/${job._id || job.id}`)}
                      className="px-4 py-2 hover:bg-blue-50 hover:text-blue-700 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 text-xs shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Sửa
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