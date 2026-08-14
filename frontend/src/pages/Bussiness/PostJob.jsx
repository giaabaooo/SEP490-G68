import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit3, Loader2, AlertCircle, Users, ExternalLink, UserCheck, Clock } from 'lucide-react';

const PostJob = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('main'); 

  useEffect(() => {
    const loadJobsAndCounts = async () => {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      try {
        const res = await fetch('http://localhost:5000/api/jobs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Không thể tải danh sách công việc');
        setJobs(Array.isArray(data) ? data : []);

        const appRes = await fetch('http://localhost:5000/api/applications?limit=1000', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (appRes.ok) {
            const appData = await appRes.json();
            const counts = {};
            if (appData.data) {
                appData.data.forEach(app => {
                    const jId = app.jobId?._id || app.jobId?.id || app.jobId;
                    if (jId) counts[jId.toString()] = (counts[jId.toString()] || 0) + 1;
                });
            }
            setAppCounts(counts);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadJobsAndCounts();
  }, [navigate]);

  const filteredJobs = jobs.filter(job => activeTab === 'test' ? job.requireTest === true : true);

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
          <PlusCircle className="w-5 h-5 mr-2" /> Tạo Job Mới
        </button>
      </div>

      <div className="flex gap-8 mb-6 border-b border-slate-200 px-2">
        <button onClick={() => setActiveTab('main')} className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'main' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Tin đăng thường
          {activeTab === 'main' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></span>}
        </button>
        <button onClick={() => setActiveTab('test')} className={`pb-4 text-sm font-bold transition-all relative flex items-center gap-2 ${activeTab === 'test' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Kiểm duyệt Test
          {jobs.some(j => j.requireTest && j.testStatus === 'pending') && <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>}
          {activeTab === 'test' && <span className="absolute bottom-0 left-0 w-full h-[3px] bg-blue-600 rounded-t-full"></span>}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto p-1">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-slate-400 font-black border-b border-slate-100 bg-slate-50/50">
                <th className="p-5">Vị trí tuyển dụng</th>
                <th className="p-5">Mức lương</th>
                <th className="p-5">Hạn chót</th>
                {activeTab === 'test' && <th className="p-5">SME Phụ trách</th>}
                <th className="p-5 text-center">Trạng thái</th>
                <th className="p-5 text-center">Hồ sơ</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading && <tr><td colSpan={7} className="p-10 text-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" /> Đang tải...</td></tr>}
              {!loading && filteredJobs.length === 0 && <tr><td colSpan={7} className="p-10 text-center text-slate-500 font-medium">Không có công việc nào.</td></tr>}

              {filteredJobs.map((job) => {
                // FIX DEADLINE: Chấp nhận cả 2 trường (tuỳ theo BE lưu là gì)
                const targetDeadline = job.recruitmentDeadline || job.deadline;
                const isExpired = targetDeadline && new Date(targetDeadline).getTime() < new Date().getTime();
                
                // FIX STATUS: Chuyển toàn bộ về chữ thường để so sánh an toàn tuyệt đối
                const jobStatus = (job.status || '').toLowerCase();
                const cvCount = appCounts[job._id || job.id] || 0;

                return (
                  <tr key={job._id || job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors">
                    <td className="p-5">
                      <button onClick={() => navigate(`/bussiness/cvlist?jobId=${job._id || job.id}`, { state: { jobTitle: job.title } })} className="font-bold text-slate-800 hover:text-blue-600 transition-colors flex items-center gap-2 group text-left">
                        {job.title} <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>
                    <td className="p-5 font-medium text-slate-500">{job.salary || 'Thỏa thuận'}</td>
                    <td className="p-5 font-medium text-slate-500">
                      <span className={`flex items-center gap-1.5 ${isExpired ? 'text-red-500 font-bold' : ''}`}>
                         {isExpired && <Clock className="w-3.5 h-3.5" />}
                         {targetDeadline ? new Date(targetDeadline).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>
                    
                    {activeTab === 'test' && (
                      <td className="p-5 text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                             <UserCheck className="w-4 h-4 text-slate-400" />
                             {job.moderatorEmail || job.moderatorId?.email || 'Chưa phân công'}
                          </div>
                      </td>
                    )}

                    <td className="p-5 text-center">
                      {job.requireTest ? (
                        job.testStatus === 'pending' ? (
                          <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center bg-amber-100 text-amber-700">
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-amber-500 animate-pulse"></span> Đang chờ SME
                          </span>
                        ) : (
                          <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center bg-emerald-100 text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500"></span> Đã Duyệt
                          </span>
                        )
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                          isExpired ? 'bg-red-100 text-red-600' :
                          jobStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          jobStatus === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-red-100 text-red-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isExpired ? 'bg-red-500' : jobStatus === 'active' ? 'bg-emerald-500' : jobStatus === 'draft' ? 'bg-slate-400' : 'bg-red-500'}`}></span>
                          {isExpired ? 'Hết hạn' : jobStatus === 'active' ? 'Hoạt động' : jobStatus === 'draft' ? 'Bản nháp' : 'Đã đóng'}
                        </span>
                      )}
                    </td>
                    
                    <td className="p-5 text-center">
                      <button onClick={() => navigate(`/bussiness/cvlist?jobId=${job._id || job.id}`, { state: { jobTitle: job.title } })} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white border border-indigo-100 font-bold rounded-lg transition-colors flex items-center justify-center mx-auto gap-1.5 text-xs shadow-sm whitespace-nowrap">
                        <Users className="w-3.5 h-3.5" /> {cvCount} CV
                      </button>
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => navigate(`/bussiness/edit-job/${job._id || job.id}`)} className="px-4 py-2 hover:bg-blue-50 hover:text-blue-700 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg transition-colors flex items-center justify-center mx-auto gap-2 text-xs shadow-sm">
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostJob;