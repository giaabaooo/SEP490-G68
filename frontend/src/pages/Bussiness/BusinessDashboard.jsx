import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, Users, FileCheck, Calendar, ArrowRight, 
  Sparkles, TrendingUp, Edit3, Power, Loader2, BarChart3, Clock 
} from 'lucide-react';
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [jobs, setJobs] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [usageInfo, setUsageInfo] = useState(null);
  const [statsData, setStatsData] = useState({ totalJobs: 0, totalApplications: 0, statusCounts: {}, trend: [] });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const resJobs = await fetch('http://localhost:5000/api/jobs', { headers: { Authorization: `Bearer ${token}` } });
      const jobsData = await resJobs.json();
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      const resUsage = await fetch('http://localhost:5000/api/payment/my-usage', { headers: { Authorization: `Bearer ${token}` } });
      if(resUsage.ok) setUsageInfo(await resUsage.json());

      const resStats = await fetch('http://localhost:5000/api/applications/stats/summary', { headers: { Authorization: `Bearer ${token}` } });
      if(resStats.ok) setStatsData(await resStats.json());

      const appRes = await fetch('http://localhost:5000/api/applications?limit=1000', { headers: { Authorization: `Bearer ${token}` } });
      if(appRes.ok) {
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
      toast.error('Có lỗi xảy ra khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const toggleJobStatus = async (jobId, currentStatus) => {
    // FIX TOGGLE: Ép currentStatus về chữ thường, nếu đang active thì chuyển thành closed
    const statusLower = (currentStatus || '').toLowerCase();
    const newStatus = statusLower === 'active' ? 'closed' : 'active';

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Cập nhật trạng thái thất bại');
      toast.success(`Đã ${newStatus === 'active' ? 'MỞ' : 'ĐÓNG'} tin tuyển dụng thành công!`);
      fetchDashboardData(); 
    } catch (error) {
      toast.error(error.message);
    }
  };

  const passedAiCount = (statsData.statusCounts?.Interviewing || 0) + (statsData.statusCounts?.Offered || 0);

  return (
    <div className="animate-fade-in pb-8">
      {/* Header & Token Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Bảng điều khiển <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-base flex items-center gap-2">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">{user.fullName || user.companyName || 'Nhà tuyển dụng'}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-3 rounded-2xl border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/upgrade')}>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-blue-600">Số dư AI Tokens</p>
                <p className="text-xl font-black text-slate-800">{usageInfo?.businessCredits?.balance || 0} <span className="text-sm text-slate-500 font-bold">TK</span></p>
            </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Briefcase, title: 'Chiến dịch mở', value: `${jobs.filter(j => (j.status || '').toLowerCase() === 'active').length} Jobs`, color: 'blue' },
          { icon: Users, title: 'Tổng CV nhận được', value: `${statsData.totalApplications} CV`, color: 'emerald' },
          { icon: FileCheck, title: 'Pass vòng AI / Lọc', value: `${passedAiCount} CV`, color: 'purple' },
          { icon: Calendar, title: 'Lịch phỏng vấn', value: `${statsData.statusCounts?.Interviewing || 0} Lịch`, color: 'amber' },
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
                <p className="text-slate-500 font-medium text-sm mb-1">{stat.title}</p>
                <h3 className="text-2xl font-black text-slate-800">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BẢNG CHIẾN DỊCH GẦN ĐÂY */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col h-fit">
          <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">Chiến dịch gần đây</h2>
            <Link to="/bussiness/post-job" className="text-blue-600 font-bold text-sm hover:underline flex items-center">
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[2px] text-slate-400 font-black border-b border-slate-100">
                  <th className="p-5">Vị trí tuyển dụng</th>
                  <th className="p-5 text-center">Lượng ứng tuyển</th>
                  <th className="p-5 text-center">Trạng thái</th>
                  <th className="p-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-10"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" /></td></tr>
                ) : jobs.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-10 text-slate-500 font-medium">Bạn chưa có chiến dịch tuyển dụng nào.</td></tr>
                ) : (
                  jobs.slice(0, 5).map((job) => {
                    const targetDeadline = job.recruitmentDeadline || job.deadline;
                    const isExpired = targetDeadline && new Date(targetDeadline).getTime() < new Date().getTime();
                    const cvCount = appCounts[job._id || job.id] || 0;
                    const jobStatus = (job.status || '').toLowerCase();

                    return (
                      <tr key={job._id || job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group">
                        <td className="p-5 font-bold text-slate-800">{job.title}</td>
                        <td className="p-5 text-center font-black text-blue-600">{cvCount} CV</td>
                        <td className="p-5 text-center">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                            isExpired ? 'bg-red-100 text-red-600' :
                            jobStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                            jobStatus === 'closed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-2 ${isExpired ? 'bg-red-500' : jobStatus === 'active' ? 'bg-emerald-500' : jobStatus === 'closed' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                            {isExpired ? 'Hết hạn' : jobStatus === 'active' ? 'Hoạt động' : jobStatus === 'closed' ? 'Đã đóng' : 'Bản nháp'}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => toggleJobStatus(job._id || job.id, jobStatus)}
                              title={jobStatus === 'active' ? 'Đóng tin này' : 'Mở lại tin'}
                              className={`p-2 rounded-xl transition-colors ${
                                jobStatus === 'active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            
                            <button onClick={() => navigate(`/bussiness/edit-job/${job._id || job.id}`)} title="Chỉnh sửa tin" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors">
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
<div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200 mb-12">
        <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" /> Lịch sử tiếp nhận hồ sơ
        </h2>
        {statsData.trend && statsData.trend.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
            Chưa có hoạt động nộp hồ sơ gần đây.
          </div>
        ) : (
          <div className="space-y-4">
            {statsData.trend && statsData.trend.map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{new Date(t._id).toLocaleDateString('vi-VN')}</span>
                </div>
                <span className="px-3.5 py-1 bg-blue-100 text-blue-800 rounded-xl text-xs font-black">+{t.count} CV mới</span>
              </div>
            ))}
          </div>
        )}
      </div>
        {/* AI SCREENING SIDEBAR */}
        {/* <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200 h-fit">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" /> Sàng lọc AI
            </h2>
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Live</span>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-slate-500 italic">Vào Quản lý Pipeline để xem chi tiết AI Score của từng ứng viên.</p>
          </div>
          <button onClick={() => navigate('/bussiness/cvlist')} className="w-full mt-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group">
            Quản lý Pipeline <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div> */}

      </div>
    </div>
  );
};

export default BusinessDashboard;