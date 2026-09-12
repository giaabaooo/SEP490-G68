import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, Users, Briefcase, Search, ArrowLeft, Mail,
  CheckCircle, XCircle, Eye, Sparkles, AlertTriangle,
  Clock, MapPin, ChevronRight, DownloadCloud, Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import AiDetailModal from '../../components/business/AiDetailModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const InterviewList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filterJobParam = searchParams.get('jobId') || 'all';

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(filterJobParam);
  const [searchQuery, setSearchQuery] = useState('');

  // AI Review modal state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedAiData, setSelectedAiData] = useState(null);

  // Email Notify Modal state
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [interviewLink, setInterviewLink] = useState('https://meet.google.com/new');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Confirm status change modal
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    app: null,
    targetStatus: null
  });

  const getPublicCvUrl = (cv, appliedCvId) => {
    const target = cv || appliedCvId;
    if (!target) return null;
    if (/^[0-9a-fA-F]{24}$/.test(target)) return `${API_BASE}/api/cv/view/${target}`;
    if (target.startsWith('http')) return target;
    if (target.startsWith('/')) return `${API_BASE}${target}`;
    return `${API_BASE}/${target}`;
  };

  const loadData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      setLoading(true);
      // Fetch Jobs
      const jobsRes = await fetch(`${API_BASE}/api/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      const jobList = Array.isArray(jobsData) ? jobsData : [];
      setJobs(jobList);

      // Fetch Applications with status = Interviewing
      const appsRes = await fetch(`${API_BASE}/api/applications?status=Interviewing&limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      const appList = Array.isArray(appsData.data) ? appsData.data : [];
      setApplications(appList);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách lịch phỏng vấn');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Count interviews per job
  const jobInterviewCounts = {};
  applications.forEach(app => {
    const jId = app.jobId?._id || app.jobId?.id || app.jobId;
    if (jId) {
      const key = jId.toString();
      jobInterviewCounts[key] = (jobInterviewCounts[key] || 0) + 1;
    }
  });

  // Filtered applications
  const filteredApps = applications.filter(app => {
    const jId = (app.jobId?._id || app.jobId?.id || app.jobId)?.toString();
    const matchJob = selectedJobId === 'all' || jId === selectedJobId;
    const nameMatch = (app.userId?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.userId?.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchJob && nameMatch;
  });

  // Open notify email modal
  const handleOpenNotifyModal = (app) => {
    setSelectedApp(app);
    const candidateName = app.userId?.fullName || 'Ứng viên';
    const jobTitle = app.jobId?.title || 'Vị trí tuyển dụng';
    setEmailSubject(`[Careerio] Thư mời phỏng vấn - Vị trí ${jobTitle}`);
    setEmailContent(
      `Thân gửi ${candidateName},\n\n` +
      `Cảm ơn bạn đã tham gia ứng tuyển và xuất sắc vượt qua các vòng sơ loại cho vị trí ${jobTitle} tại công ty chúng tôi.\n\n` +
      `Chúng tôi trân trọng kính mời bạn tham gia buổi phỏng vấn trực tuyến để cùng trao đổi chi tiết hơn về kinh nghiệm chuyên môn và cơ hội hợp tác.\n\n` +
      `Thời gian dự kiến: ${interviewTime || '[Vui lòng chọn thời gian]'}\n` +
      `Hình thức: Phỏng vấn trực tuyến qua Google Meet: ${interviewLink}\n\n` +
      `Vui lòng phản hồi lại email này để xác nhận tham gia.\n\n` +
      `Trân trọng,\nĐội ngũ Tuyển dụng.`
    );
    setIsNotifyModalOpen(true);
  };

  const handleSendInterviewEmail = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;
    const token = localStorage.getItem('token');
    setSendingEmail(true);

    try {
      const res = await fetch(`${API_BASE}/api/applications/${selectedApp._id || selectedApp.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
          type: 'Interview'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Gửi thất bại');

      toast.success('Đã gửi thư mời phỏng vấn thành công cho ứng viên!');
      setIsNotifyModalOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSendingEmail(false);
    }
  };

  // Status update
  const handleConfirmStatus = async () => {
    if (!confirmModal.app || !confirmModal.targetStatus) return;
    const token = localStorage.getItem('token');
    const appId = confirmModal.app._id || confirmModal.app.id;

    try {
      const res = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: confirmModal.targetStatus })
      });

      if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
      toast.success(confirmModal.targetStatus === 'Offered' ? 'Đã đề nghị nhận việc thành công!' : 'Đã chuyển hồ sơ sang Từ chối');
      setConfirmModal({ isOpen: false, app: null, targetStatus: null });
      loadData();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const totalInterviews = applications.length;
  const jobsWithInterviewsCount = Object.keys(jobInterviewCounts).length;

  return (
    <div className="animate-fade-in pb-16">
      <AiDetailModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        data={selectedAiData}
        candidateName={selectedAiData?.userId?.fullName}
      />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <button
            onClick={() => navigate('/bussiness/dashboard')}
            className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-xs mb-2 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
            Quay lại Dashboard
          </button>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Quản Lý <span className="text-blue-600">Lịch Phỏng Vấn</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            Theo dõi tất cả ứng viên đang trong vòng phỏng vấn phân bổ theo từng chiến dịch tuyển dụng.
          </p>
        </div>


      </div>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tổng lịch phỏng vấn</p>
            <h3 className="text-3xl font-black text-slate-900">{totalInterviews} <span className="text-base font-bold text-slate-400">Ứng viên</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
            <Briefcase className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vị trí có lịch hẹn</p>
            <h3 className="text-3xl font-black text-slate-900">{jobsWithInterviewsCount} / {jobs.length} <span className="text-base font-bold text-slate-400">Jobs</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đang xem theo</p>
            <h3 className="text-lg font-black text-blue-600 truncate max-w-[200px]">
              {selectedJobId === 'all' ? 'Tất cả công việc' : (jobs.find(j => (j._id || j.id) === selectedJobId)?.title || 'Vị trí đã chọn')}
            </h3>
          </div>
        </div>
      </div>

      {/* DANH SÁCH CÁC JOB VÀ SỐ LƯỢNG LỊCH PHỎNG VẤN */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Danh sách các vị trí & Số lượng lịch phỏng vấn</h2>
            <p className="text-xs text-slate-500 font-medium">Bấm vào từng vị trí để lọc nhanh danh sách ứng viên cần phỏng vấn.</p>
          </div>
          <button
            onClick={() => { setSelectedJobId('all'); setSearchParams({}); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedJobId === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Tất cả vị trí ({totalInterviews} Lịch)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const jId = (job._id || job.id).toString();
            const count = jobInterviewCounts[jId] || 0;
            const isSelected = selectedJobId === jId;
            const isExpired = (job.recruitmentDeadline || job.deadline) && new Date(job.recruitmentDeadline || job.deadline).getTime() < Date.now();

            return (
              <div
                key={jId}
                onClick={() => {
                  setSelectedJobId(jId);
                  setSearchParams({ jobId: jId });
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${isSelected
                    ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
                  }`}
              >
                <div className="min-w-0 pr-3">
                  <h4 className="font-bold text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {job.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500 font-medium">{job.salary || 'Thỏa thuận'}</span>
                    {isExpired && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Hết hạn</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${count > 0
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-slate-100 text-slate-500'
                    }`}>
                    {count} Lịch
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform ${isSelected ? 'text-blue-600' : ''}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm ứng viên theo tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-bold text-slate-500">
            Hiển thị: <strong className="text-slate-900">{filteredApps.length}</strong> ứng viên
          </span>
        </div>
      </div>

      {/* DANH SÁCH ỨNG VIÊN PHỎNG VẤN */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-black">
                <th className="p-5">Ứng viên</th>
                <th className="p-5">Vị trí tuyển dụng</th>
                <th className="p-5 text-center">AI Match</th>
                <th className="p-5 text-center">Bài Test</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    Đang tải danh sách lịch phỏng vấn...
                  </td>
                </tr>
              ) : filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-slate-400">
                    <div className="w-16 h-16 rounded-3xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-200/60">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <p className="font-bold text-slate-700 text-base mb-1">Không có ứng viên nào trong vòng phỏng vấn</p>
                    <p className="text-xs text-slate-400">Vào Ngân hàng CV để chọn ứng viên phù hợp chuyển sang vòng Phỏng vấn.</p>
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => {
                  const hasDoneTest = app.testScore !== undefined && app.testScore !== null;
                  const targetJob = app.jobId;

                  return (
                    <tr key={app._id || app.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ứng viên */}
                      <td className="p-5">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                            {app.userId?.fullName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/bussiness/candidate/${app._id || app.id}`)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left block"
                            >
                              {app.userId?.fullName || 'Chưa cập nhật'}
                            </button>
                            <span className="text-xs text-slate-400 block">{app.userId?.email || '—'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Vị trí */}
                      <td className="p-5">
                        <span className="font-bold text-slate-800 block">{targetJob?.title || '—'}</span>
                        <span className="text-xs text-slate-400">Ứng tuyển: {new Date(app.appliedAt || app.createdAt).toLocaleDateString('vi-VN')}</span>
                      </td>

                      {/* AI Match */}
                      <td className="p-5 text-center">
                        <button
                          onClick={() => {
                            setSelectedAiData(app);
                            setAiModalOpen(true);
                          }}
                          className={`px-3 py-1.5 rounded-xl border inline-flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer ${(app.aiScore ?? 0) >= 80 ? 'text-indigo-600 bg-indigo-50 border-indigo-200' :
                              (app.aiScore ?? 0) >= 50 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                                'text-rose-600 bg-rose-50 border-rose-200'
                            }`}
                          title="Click xem chi tiết phân tích AI"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{app.aiScore ?? 0}% Match</span>
                        </button>
                      </td>

                      {/* Bài test */}
                      <td className="p-5 text-center">
                        {hasDoneTest ? (
                          <div className="flex flex-col items-center">
                            <span className={`font-black text-sm ${app.testScore >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {app.testScore}/100
                            </span>
                            {app.tabSwitches > 0 && (
                              <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-0.5 border border-red-200 flex items-center gap-0.5" title={`Rời màn hình ${app.tabSwitches} lần`}>
                                <AlertTriangle className="w-3 h-3" /> {app.tabSwitches} lần rời tab
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Không có bài test</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenNotifyModal(app)}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                            title="Gửi thư mời / Lịch phỏng vấn"
                          >
                            <Mail className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              const url = getPublicCvUrl(app.appliedCvFileUrl, app.appliedCvId || app.userId?.cvUrl);
                              if (url) window.open(url, '_blank');
                              else toast.error('Không tìm thấy tệp CV của ứng viên');
                            }}
                            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
                            title="Xem CV"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConfirmModal({ isOpen: true, app, targetStatus: 'Offered' })}
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                            title="Đề nghị nhận việc (Offer)"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setConfirmModal({ isOpen: true, app, targetStatus: 'Rejected' })}
                            className="p-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl transition-colors cursor-pointer shadow-2xs"
                            title="Từ chối ứng viên"
                          >
                            <XCircle className="w-4 h-4" />
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

      {/* MODAL GỬI EMAIL MỜI PHỎNG VẤN */}
      {isNotifyModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setIsNotifyModalOpen(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 border border-slate-200 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" /> Gửi Lịch & Thư Mời Phỏng Vấn
              </h3>
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold" onClick={() => setIsNotifyModalOpen(false)}>&times;</button>
            </div>

            <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
              <p className="text-slate-600 mb-1">Ứng viên: <strong className="text-slate-900">{selectedApp.userId?.fullName}</strong> ({selectedApp.userId?.email})</p>
              <p className="text-slate-600">Vị trí: <strong className="text-slate-900">{selectedApp.jobId?.title}</strong></p>
            </div>

            <form onSubmit={handleSendInterviewEmail} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Thời gian phỏng vấn</label>
                  <input
                    type="datetime-local"
                    value={interviewTime}
                    onChange={(e) => {
                      setInterviewTime(e.target.value);
                      const dtStr = new Date(e.target.value).toLocaleString('vi-VN');
                      setEmailContent(prev => prev.replace(/Thời gian dự kiến: .*/, `Thời gian dự kiến: ${dtStr}`));
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Link họp (Google Meet / Zoom)</label>
                  <input
                    type="text"
                    value={interviewLink}
                    onChange={(e) => {
                      setInterviewLink(e.target.value);
                      setEmailContent(prev => prev.replace(/Google Meet: .*/, `Google Meet: ${e.target.value}`));
                    }}
                    placeholder="https://meet.google.com/..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Tiêu đề email</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm font-semibold focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nội dung thư mời</label>
                <textarea
                  rows={7}
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:border-blue-500 outline-none font-sans leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNotifyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md shadow-blue-500/20 text-sm flex items-center gap-2"
                >
                  {sendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  {sendingEmail ? 'Đang gửi...' : 'Gửi thư mời phỏng vấn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN CHUYỂN TRẠNG THÁI */}
      {confirmModal.isOpen && confirmModal.app && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4" onClick={() => setConfirmModal({ isOpen: false, app: null, targetStatus: null })}>
          <div className="bg-white rounded-[32px] w-full max-w-md p-6 border border-slate-200 shadow-2xl animate-scale-in text-center" onClick={(e) => e.stopPropagation()}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${confirmModal.targetStatus === 'Offered' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
              }`}>
              {confirmModal.targetStatus === 'Offered' ? <CheckCircle className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-2">
              {confirmModal.targetStatus === 'Offered' ? 'Xác nhận Đề Nghị Nhận Việc?' : 'Xác nhận Từ Chối Ứng Viên?'}
            </h3>

            <p className="text-sm text-slate-600 mb-6">
              Bạn có chắc chắn muốn chuyển ứng viên <strong className="text-slate-900">{confirmModal.app.userId?.fullName}</strong> sang trạng thái{' '}
              <strong className={confirmModal.targetStatus === 'Offered' ? 'text-emerald-600' : 'text-red-600'}>
                {confirmModal.targetStatus === 'Offered' ? 'Đề nghị nhận việc (Offer)' : 'Từ chối (Reject)'}
              </strong>?
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setConfirmModal({ isOpen: false, app: null, targetStatus: null })}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 text-sm"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmStatus}
                className={`px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all ${confirmModal.targetStatus === 'Offered'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                  }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewList;
