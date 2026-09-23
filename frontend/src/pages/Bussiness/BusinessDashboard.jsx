import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase, Users, FileCheck, Calendar, ArrowRight,
  Sparkles, TrendingUp, Edit3, Power, Loader2, BarChart3, Clock, PlusCircle,
  Bell, Eye, FileText, ExternalLink, CheckCircle2, MessageSquare, AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [jobs, setJobs] = useState([]);
  const [appCounts, setAppCounts] = useState({});
  const [usageInfo, setUsageInfo] = useState(null);
  const [statsData, setStatsData] = useState({ totalJobs: 0, totalApplications: 0, statusCounts: {}, trend: [], recentApplications: [] });
  const [notifications, setNotifications] = useState([]);
  const [feedTab, setFeedTab] = useState('all'); // all | applications | notifications
  const [loading, setLoading] = useState(true);

  const getPublicCvUrl = (cv, appliedCvId) => {
    const target = cv || appliedCvId;
    if (!target) return null;
    if (/^[0-9a-fA-F]{24}$/.test(target)) return `${API_BASE}/api/cv/view/${target}`;
    if (target.startsWith('http')) return target;
    if (target.startsWith('/')) return `${API_BASE}${target}`;
    return `${API_BASE}/${target}`;
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const resJobs = await fetch(`${API_BASE}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } });
      const jobsData = await resJobs.json();
      setJobs(Array.isArray(jobsData) ? jobsData : []);

      const resUsage = await fetch(`${API_BASE}/api/payment/my-usage`, { headers: { Authorization: `Bearer ${token}` } });
      if (resUsage.ok) setUsageInfo(await resUsage.json());

      const resStats = await fetch(`${API_BASE}/api/applications/stats/summary`, { headers: { Authorization: `Bearer ${token}` } });
      if (resStats.ok) setStatsData(await resStats.json());

      const appRes = await fetch(`${API_BASE}/api/applications?limit=1000`, { headers: { Authorization: `Bearer ${token}` } });
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

      const resNotifs = await fetch(`${API_BASE}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (resNotifs.ok) {
        const notifs = await resNotifs.json();
        setNotifications(Array.isArray(notifs) ? notifs : []);
      }

    } catch (error) {
      console.error(error);
      if (!silent) toast.error('Có lỗi xảy ra khi tải dữ liệu!');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(false);

    // Cập nhật real-time dữ liệu dashboard định kỳ mỗi 8 giây
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);

    const handleFocus = () => {
      fetchDashboardData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Sắp xếp các Job còn hạn lên đầu
  const sortedJobs = useMemo(() => {
    const now = Date.now();
    return [...jobs].sort((a, b) => {
      const isExpA = (() => {
        if ((a.status || '').toLowerCase() === 'closed') return true;
        const dl = a.recruitmentDeadline || a.deadline;
        if (!dl) return false;
        const d = new Date(dl);
        if (isNaN(d.getTime())) return false;
        const dEnd = new Date(d);
        if (dEnd.getHours() === 0 && dEnd.getMinutes() === 0 && dEnd.getSeconds() === 0) dEnd.setHours(23, 59, 59, 999);
        return dEnd.getTime() < now;
      })();

      const isExpB = (() => {
        if ((b.status || '').toLowerCase() === 'closed') return true;
        const dl = b.recruitmentDeadline || b.deadline;
        if (!dl) return false;
        const d = new Date(dl);
        if (isNaN(d.getTime())) return false;
        const dEnd = new Date(d);
        if (dEnd.getHours() === 0 && dEnd.getMinutes() === 0 && dEnd.getSeconds() === 0) dEnd.setHours(23, 59, 59, 999);
        return dEnd.getTime() < now;
      })();

      if (!isExpA && isExpB) return -1;
      if (isExpA && !isExpB) return 1;
      return new Date(b.postedAt || b.createdAt || 0).getTime() - new Date(a.postedAt || a.createdAt || 0).getTime();
    });
  }, [jobs]);

  const toggleJobStatus = async (jobId, currentStatus, job) => {
    const statusLower = (currentStatus || '').toLowerCase();
    if (statusLower === 'pending' || (job?.requireTest && job?.testStatus === 'pending' && statusLower !== 'draft')) {
      toast.error('Công việc đang chờ SME kiểm duyệt bài test, chưa thể thay đổi trạng thái!');
      return;
    }
    // FIX TOGGLE: Ép currentStatus về chữ thường, nếu đang active thì chuyển thành closed
    const newStatus = statusLower === 'active' ? 'closed' : 'active';

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
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

  const recentAppsList = useMemo(() => {
    return (statsData.recentApplications || []).map((app) => ({
      id: app._id || app.id,
      feedType: 'application',
      timestamp: new Date(app.appliedAt || app.createdAt || 0).getTime(),
      dateStr: app.appliedAt || app.createdAt,
      candidateName: app.userId?.fullName || 'Ứng viên',
      candidateEmail: app.userId?.email || '',
      candidateAvatar: app.userId?.avatar,
      jobTitle: app.jobId?.title || 'Công việc',
      jobId: app.jobId?._id || app.jobId,
      aiScore: app.aiScore,
      status: app.status,
      cvUrl: getPublicCvUrl(app.appliedCvFileUrl, app.appliedCvId || app.userId?.cvUrl),
      appId: app._id || app.id
    }));
  }, [statsData.recentApplications]);

  const notifList = useMemo(() => {
    return notifications.map((n) => ({
      id: n._id,
      feedType: 'notification',
      timestamp: new Date(n.createdAt || 0).getTime(),
      dateStr: n.createdAt,
      title: n.title,
      message: n.message,
      notifType: n.type,
      link: n.link,
      isRead: n.isRead
    }));
  }, [notifications]);

  const activityFeed = useMemo(() => {
    let combined = [];
    if (feedTab === 'all') {
      combined = [...recentAppsList, ...notifList];
    } else if (feedTab === 'applications') {
      combined = [...recentAppsList];
    } else {
      combined = [...notifList];
    }
    return combined.sort((a, b) => b.timestamp - a.timestamp);
  }, [recentAppsList, notifList, feedTab]);

  const passedAiCount = (statsData.statusCounts?.Interviewing || 0) + (statsData.statusCounts?.Offered || 0);

  return (
    <div className="animate-fade-in pb-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Bảng điều khiển <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-base flex items-center gap-2">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">{user.fullName || user.companyName || 'Nhà tuyển dụng'}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/bussiness/create')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center gap-2 text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Đăng tin mới
          </button>


          <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-xl border border-blue-100 shadow-sm cursor-pointer hover:shadow-md transition-all" onClick={() => navigate('/upgrade')} title="Nhấp để nạp thêm Token">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shadow-inner">
              <Sparkles className="w-4 h-4 text-yellow-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Tokens</p>
              <p className="text-base font-black text-slate-800 leading-tight">{usageInfo?.businessCredits?.balance || 0} <span className="text-xs text-slate-500 font-bold">TK</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Briefcase, title: 'Chiến dịch mở', value: `${jobs.filter(j => (j.status || '').toLowerCase() === 'active').length} Jobs`, color: 'blue', path: '/bussiness/post-job' },
          { icon: Users, title: 'Tổng CV nhận được', value: `${statsData.totalApplications} CV`, color: 'emerald', path: '/bussiness/cvlist' },
          { icon: FileCheck, title: 'Pass vòng AI / Lọc', value: `${passedAiCount} CV`, color: 'purple', path: '/bussiness/cvlist' },
          { icon: Calendar, title: 'Lịch phỏng vấn', value: `${statsData.statusCounts?.Interviewing || 0} Lịch`, color: 'amber', path: '/bussiness/interviews' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          const colors = {
            blue: 'text-blue-600 bg-blue-50 border-blue-100',
            emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            purple: 'text-purple-600 bg-purple-50 border-purple-100',
            amber: 'text-amber-600 bg-amber-50 border-amber-100',
          };
          return (
            <div
              key={index}
              onClick={() => navigate(stat.path)}
              className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
            >
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
                <tr className="text-xs uppercase tracking-wider text-slate-900 font-black border-b border-slate-200 bg-slate-50/80">
                  <th className="p-5 font-black text-slate-900">Tiêu đề công việc</th>
                  <th className="p-5 text-center font-black text-slate-900">Lượng ứng tuyển</th>
                  <th className="p-5 text-center font-black text-slate-900">Trạng thái</th>
                  <th className="p-5 text-right font-black text-slate-900">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan="4" className="text-center p-10"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" /></td></tr>
                ) : sortedJobs.length === 0 ? (
                  <tr><td colSpan="4" className="text-center p-10 text-slate-500 font-medium">Bạn chưa có chiến dịch tuyển dụng nào.</td></tr>
                ) : (
                  sortedJobs.slice(0, 5).map((job) => {
                    const targetDeadline = job.recruitmentDeadline || job.deadline;
                    let isExpired = false;
                    if ((job.status || '').toLowerCase() === 'closed') {
                      isExpired = true;
                    } else if (targetDeadline) {
                      const d = new Date(targetDeadline);
                      if (!isNaN(d.getTime())) {
                        const dEnd = new Date(d);
                        if (dEnd.getHours() === 0 && dEnd.getMinutes() === 0 && dEnd.getSeconds() === 0) {
                          dEnd.setHours(23, 59, 59, 999);
                        }
                        isExpired = dEnd.getTime() < Date.now();
                      }
                    }
                    const cvCount = appCounts[job._id || job.id] || 0;
                    const jobStatus = (job.status || '').toLowerCase();

                    return (
                      <tr key={job._id || job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group">
                        <td className="p-5 font-bold text-slate-800">
                          <Link
                            to={`/bussiness/cvlist?jobId=${job._id || job.id}`}
                            state={{ jobTitle: job.title }}
                            className="hover:text-blue-600 transition-colors"
                            title="Xem ứng viên của vị trí này"
                          >
                            {job.title}
                          </Link>
                        </td>
                        <td className="p-5 text-center">
                          <button
                            onClick={() => navigate(`/bussiness/cvlist?jobId=${job._id || job.id}`, { state: { jobTitle: job.title } })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all shadow-2xs cursor-pointer"
                            title="Xem danh sách CV ứng tuyển"
                          >
                            <Users className="w-3.5 h-3.5" />
                            {cvCount} CV
                          </button>
                        </td>
                        <td className="p-5 text-center">
                          {isExpired ? (
                            <span className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center bg-red-100 text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-red-500"></span> Hết hạn
                            </span>
                          ) : (
                            <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                              jobStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                              jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')
                                ? 'bg-amber-100 text-amber-700'
                                : jobStatus === 'draft'
                                ? 'bg-slate-100 text-slate-700'
                                : 'bg-red-100 text-red-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                jobStatus === 'active' ? 'bg-emerald-500' : 
                                jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')
                                  ? 'bg-amber-500 animate-pulse'
                                  : jobStatus === 'draft'
                                  ? 'bg-slate-400'
                                  : 'bg-red-500'
                              }`}></span>
                              {
                                jobStatus === 'active' ? (job.requireTest ? 'Đã duyệt test' : 'Hoạt động') : 
                                jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')
                                  ? 'Đang chờ SME'
                                  : jobStatus === 'draft'
                                  ? 'Bản nháp'
                                  : 'Đã đóng'
                              }
                            </span>
                          )}
                        </td>
                        <td className="p-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/bussiness/cvlist?jobId=${job._id || job.id}`, { state: { jobTitle: job.title } })}
                              title="Xem danh sách ứng viên / CV"
                              className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition-colors cursor-pointer"
                            >
                              <Users className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => navigate(`/bussiness/edit-job/${job._id || job.id}`)}
                              title="Chỉnh sửa tin"
                              className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => toggleJobStatus(job._id || job.id, jobStatus, job)}
                              disabled={jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')}
                              title={
                                jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')
                                  ? 'Đang chờ SME duyệt bài test, chưa thể thay đổi'
                                  : jobStatus === 'active'
                                  ? 'Đóng tin này'
                                  : 'Mở lại tin'
                              }
                              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                                jobStatus === 'pending' || (job.requireTest && job.testStatus === 'pending' && jobStatus !== 'draft')
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                                  : jobStatus === 'active'
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              }`}
                            >
                              <Power className="w-4 h-4" />
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
          {sortedJobs.length > 5 && (
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-center">
              <button
                onClick={() => navigate('/bussiness/post-job')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                Xem tất cả chiến dịch ({sortedJobs.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-200 mb-12 flex flex-col justify-between h-fit">
          <div>
            {/* Header: Đổi title thành Lịch sử hoạt động & Thông báo, xoá chữ Real-time */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">
                    Lịch sử hoạt động & Thông báo
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400">Hoạt động ứng tuyển & thông báo tuyển dụng</p>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl mb-4 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setFeedTab('all')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feedTab === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả ({recentAppsList.length + notifList.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedTab('applications')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feedTab === 'applications' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Hồ sơ ({recentAppsList.length})
              </button>
              <button
                type="button"
                onClick={() => setFeedTab('notifications')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  feedTab === 'notifications' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Thông báo ({notifList.length})
              </button>
            </div>

            {/* Activity List */}
            {activityFeed.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                Chưa có hoạt động hoặc thông báo mới.
              </div>
            ) : (
              <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
                {activityFeed.slice(0, 10).map((item) => {
                  if (item.feedType === 'application') {
                    return (
                      <div
                        key={`app-${item.id}`}
                        className="p-3.5 bg-slate-50/90 hover:bg-blue-50/40 rounded-2xl border border-slate-200/80 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2.5 mb-1.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img
                              src={item.candidateAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.candidateName)}&background=eff6ff&color=3b82f6`}
                              alt={item.candidateName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <button
                                onClick={() => navigate(`/bussiness/candidate/${item.appId}`)}
                                className="font-black text-slate-900 text-xs hover:text-blue-600 transition-colors truncate block text-left"
                                title={item.candidateName}
                              >
                                {item.candidateName}
                              </button>
                              <span className="text-[10px] text-slate-400 font-bold block">
                                {formatTimeAgo(item.dateStr)}
                              </span>
                            </div>
                          </div>

                          {item.aiScore !== undefined && item.aiScore !== null && (
                            <span
                              className={`px-2 py-0.5 rounded-lg border text-[10px] font-black shrink-0 ${
                                item.aiScore >= 80
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : item.aiScore >= 50
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              AI: {item.aiScore}%
                            </span>
                          )}
                        </div>

                        {/* Thông tin Job ứng tuyển */}
                        <div className="mb-2.5 px-0.5">
                          <p className="text-[11px] text-slate-600 font-medium truncate">
                            Ứng tuyển: <strong className="font-black text-slate-900">{item.jobTitle}</strong>
                          </p>
                        </div>

                        {/* Thao tác: Xem CV luôn + Chi tiết hồ sơ */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          {item.cvUrl ? (
                            <button
                              type="button"
                              onClick={() => window.open(item.cvUrl, '_blank')}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-black border border-blue-200 transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Mở trực tiếp tệp CV của ứng viên"
                            >
                              <Eye className="w-3.5 h-3.5" /> Xem CV
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chưa có file CV</span>
                          )}

                          <button
                            type="button"
                            onClick={() => navigate(`/bussiness/candidate/${item.appId}`)}
                            className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950 rounded-lg text-[11px] font-bold border border-slate-200 transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            Hồ sơ <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // item.feedType === 'notification'
                  return (
                    <div
                      key={`notif-${item.id}`}
                      className="p-3.5 bg-slate-50/90 hover:bg-amber-50/40 rounded-2xl border border-slate-200/80 transition-all group"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-black text-slate-900 text-xs truncate">{item.title}</h4>
                            <span className="text-[10px] text-slate-400 font-bold shrink-0">
                              {formatTimeAgo(item.dateStr)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2">{item.message}</p>
                          {item.link && (
                            <button
                              type="button"
                              onClick={() => navigate(item.link)}
                              className="mt-1.5 text-[11px] font-black text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              Xem chi tiết <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/bussiness/cvlist')}
              className="text-xs font-black text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              Mở toàn bộ hồ sơ trong Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
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