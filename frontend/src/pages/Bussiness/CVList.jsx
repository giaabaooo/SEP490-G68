import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock, ArrowLeft, DownloadCloud, X, ThumbsUp, AlertTriangle, RefreshCw, Layers, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate, useLocation, useParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

import AiDetailModal from '../../components/business/AiDetailModal';

const CVList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { jobId: paramJobId } = useParams();
  const currentJobId = searchParams.get('jobId') || paramJobId;

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(currentJobId || 'all');

  const [applications, setApplications] = useState([]);
  const [deduplicatedApps, setDeduplicatedApps] = useState([]); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('list'); 

  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [selectedAiData, setSelectedAiData] = useState(null);

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState('Pass');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Modal xác nhận chuyển trạng thái (Nhận việc / Từ chối) để tránh HR bấm nhầm
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    app: null,
    targetStatus: null
  });

  const handleOpenConfirmModal = (app, targetStatus) => {
    setConfirmModal({
      isOpen: true,
      app,
      targetStatus
    });
  };

  const handleConfirmStatus = async () => {
    if (!confirmModal.app || !confirmModal.targetStatus) return;
    const appId = confirmModal.app._id || confirmModal.app.id;
    const targetStatus = confirmModal.targetStatus;
    await updateApplicationStatus(appId, targetStatus);
    setConfirmModal({ isOpen: false, app: null, targetStatus: null });
  };

  useEffect(() => {
    if (currentJobId) {
      setSelectedJobId(currentJobId);
    }
  }, [currentJobId]);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/api/jobs`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error('Lỗi nạp danh sách công việc:', e);
      }
    };
    fetchJobs();
  }, []);

  const selectedJobObj = jobs.find(j => (j._id || j.id) === selectedJobId);
  const jobTitle = selectedJobId !== 'all'
    ? (selectedJobObj?.title || location.state?.jobTitle || 'Vị trí đã chọn')
    : 'Tất cả vị trí tuyển dụng';

  const templates = {
    test: {
      subject: 'Thư mời thực hiện bài đánh giá năng lực - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi.\n\nChúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia thực hiện bài đánh giá kỹ năng chuyên môn.\n\nVui lòng hoàn thành bài đánh giá của bạn trước thời hạn quy định.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    testReminder: {
      subject: '[Nhắc nhở] Hoàn thành bài kiểm tra năng lực - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nChúng tôi nhận thấy bạn vẫn chưa hoàn thành bài kiểm tra năng lực cho vị trí ${jobTitle}.\n\nĐể tiếp tục quá trình xét duyệt hồ sơ ứng tuyển, bạn vui lòng đăng nhập vào hệ thống và hoàn thành bài test trong thời gian sớm nhất.\n\nNếu cần hỗ trợ kỹ thuật hoặc có bất kỳ câu hỏi nào, vui lòng phản hồi lại email này.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    interview: {
      subject: 'Thư mời phỏng vấn - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã hoàn thành bài đánh giá năng lực cho vị trí ${jobTitle}.\n\nChúng tôi muốn mời bạn tham gia một buổi phỏng vấn trực tuyến để thảo luận chi tiết hơn về kinh nghiệm của bạn.\n\nThời gian dự kiến: [Vui lòng điền giờ và ngày tại đây]\nHình thức: Phỏng vấn trực tuyến qua Google Meet.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    offer: {
      subject: 'Thư mời nhận việc (Job Offer) - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nChúc mừng bạn! Chúng tôi rất vui mừng được gửi lời mời hợp tác chính thức đến bạn cho vị trí ${jobTitle}.\n\nChi tiết về mức lương, phúc lợi sẽ được gửi kèm trong hợp đồng chính thức.\n\nChào mừng bạn gia nhập đội ngũ của chúng tôi!\nTrân trọng,\nBộ phận Nhân sự.`
    },
    reject: {
      subject: 'Thư cảm ơn ứng tuyển - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vị trí ${jobTitle}.\n\nChúng tôi rất tiếc khi chưa thể đồng hành cùng bạn lần này. Thông tin hồ sơ của bạn đã được lưu lại cho các cơ hội phù hợp hơn trong tương lai.\n\nChúc bạn luôn may mắn và thành công!\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Applied': return 'bg-slate-100 text-black border-slate-200';
      case 'Testing': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Interviewing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Offered': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-black border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    const labels = { Applied: 'Hồ sơ mới', Testing: 'Làm Test', Interviewing: 'Phỏng vấn', Offered: 'Nhận việc', Rejected: 'Từ chối' };
    return labels[status] || status;
  };

  const getAiScoreStyle = (score) => {
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:bg-indigo-100 hover:shadow-sm cursor-pointer';
    if (score >= 50) return 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:shadow-sm cursor-pointer';
    return 'text-rose-600 bg-rose-50 border-rose-200 hover:bg-rose-100 hover:shadow-sm cursor-pointer';
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const getPublicCvUrl = (cv, appliedCvId) => {
    const target = cv || appliedCvId;
    if (!target) return null;
    if (/^[0-9a-fA-F]{24}$/.test(target)) return `${API_BASE}/api/cv/view/${target}`;
    if (target.startsWith('http')) return target;
    if (target.startsWith('/')) return `${API_BASE}${target}`;
    return `${API_BASE}/${target}`;
  };

  const fetchApplications = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (viewMode === 'list' && activeFilter && activeFilter !== 'All') params.append('status', activeFilter);
      
      const activeJobId = selectedJobId !== 'all' ? selectedJobId : null;
      if (activeJobId) {
        params.append('jobId', activeJobId);
        params.append('sort', '-aiScore'); 
      } else {
        params.append('sort', '-appliedAt');
      }
      
      params.append('page', page);
      params.append('limit', viewMode === 'pipeline' ? 100 : limit);

      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/applications?${params.toString()}`;
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal });

      if (!res.ok) {
        const jsonErr = await res.json().catch(() => ({}));
        throw new Error(jsonErr.message || `Request failed ${res.status}`);
      }

      const json = await res.json();
      setApplications(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeFilter, page, limit, viewMode, selectedJobId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, [fetchApplications]);

  useEffect(() => {
      const uniqueAppsMap = new Map();
      applications.forEach(app => {
          const uid = app.userId?._id || app.userId?.id || app.userId;
          if (!uniqueAppsMap.has(uid)) {
              uniqueAppsMap.set(uid, app);
          } else {
              const existingApp = uniqueAppsMap.get(uid);
              if (new Date(app.updatedAt) > new Date(existingApp.updatedAt)) {
                  uniqueAppsMap.set(uid, app);
              }
          }
      });
      setDeduplicatedApps(Array.from(uniqueAppsMap.values()));
  }, [applications]);

  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật trạng thái');

      toast.success(`Cập nhật trạng thái sang: ${getStatusLabel(newStatus)}`);
      setApplications(prev => prev.map(app => (app._id || app.id) === appId ? { ...app, status: newStatus } : app));
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  const handleDragStart = (e, appId) => e.dataTransfer.setData('text/plain', appId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;
    const app = deduplicatedApps.find(a => (a._id || a.id) === appId);
    if (app && (targetStatus === 'Offered' || targetStatus === 'Rejected')) {
      handleOpenConfirmModal(app, targetStatus);
      return;
    }
    await updateApplicationStatus(appId, targetStatus);
  };

  const exportToExcel = () => {
    if (deduplicatedApps.length === 0) return toast.warning('Không có ứng viên nào để xuất dữ liệu.');
    const headers = ['Tên ứng viên', 'Email', 'Vị trí', 'Điểm CV (%)', 'Điểm Test (/100)', 'Cảnh báo rời tab', 'Ngày nộp', 'Trạng thái'];
    const csvRows = [headers.join(',')];

    deduplicatedApps.forEach(app => {
      const name = `"${app.userId?.fullName || 'N/A'}"`;
      const email = `"${app.userId?.email || 'N/A'}"`;
      const job = `"${app.jobId?.title || 'N/A'}"`;
      const cvScore = app.aiScore || 0;
      const jobRequiresTest = app.hasTest || !!app.assessmentId || !!app.jobId?.requireTest;
      const testScore = app.testScore !== undefined && app.testScore !== null 
        ? app.testScore 
        : app.status === 'Rejected'
        ? 'Đã dừng tuyển'
        : app.status === 'Offered'
        ? 'Đã nhận việc'
        : (jobRequiresTest ? 'Chưa làm' : 'Không có bài test');
      const tabSwitches = app.tabSwitches || 0;
      const date = `"${new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}"`;
      const status = `"${getStatusLabel(app.status)}"`;
      csvRows.push([name, email, job, cvScore, testScore, tabSwitches, date, status].join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\n'); 
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSachUngVien_${currentJobId ? 'Job' : 'All'}.csv`;
    link.click();
  };

  const handleOpenAiModal = (app) => {
    setSelectedAiData(app);
    setAiModalOpen(true);
  };

  const handleOpenNotifyModal = (app, forcedTemplateKey = null) => {
    setSelectedApp(app);
    setIsNotifyModalOpen(true);
    let templateKey = forcedTemplateKey || 'test';
    let type = 'Pass';
    if (!forcedTemplateKey) {
      if (app.status === 'Interviewing') templateKey = 'interview';
      else if (app.status === 'Offered') templateKey = 'offer';
      else if (app.status === 'Rejected') { templateKey = 'reject'; type = 'Reject'; }
    }

    const candidateName = app.userId?.fullName || 'Ứng viên';
    const title = app.jobId?.title || 'Vị trí ứng tuyển';
    setEmailType(type);
    setEmailSubject(templates[templateKey]?.subject || '');
    setEmailContent(templates[templateKey]?.content ? templates[templateKey].content(candidateName, title) : '');
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSendingEmail(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${selectedApp._id || selectedApp.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subject: emailSubject, content: emailContent, type: emailType })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi gửi thông báo');

      toast.success('Gửi thông báo thành công!');
      setIsNotifyModalOpen(false);
      setApplications(prev => prev.map(app => (app._id || app.id) === (selectedApp._id || selectedApp.id) ? { ...app, mailSentStatus: data.mailSentStatus } : app));
    } catch (err) {
      toast.error(err.message || 'Không thể gửi email thông báo');
    } finally {
      setSendingEmail(false);
    }
  };

  const [isReEvaluating, setIsReEvaluating] = useState(false);

  const handleReEvaluate = async (appId) => {
    if (!appId) return;
    try {
      setIsReEvaluating(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${appId}/re-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Lỗi khi chấm lại');
      toast.success(json.message || 'Đã chấm lại theo Bands thành công!');
      if (json.data) {
        setSelectedAiData(json.data);
        setApplications(prev => prev.map(a => (a._id || a.id) === appId ? { ...a, ...json.data } : a));
        setDeduplicatedApps(prev => prev.map(a => (a._id || a.id) === appId ? { ...a, ...json.data } : a));
      }
    } catch (err) {
      toast.error(err.message || 'Không thể chấm lại');
    } finally {
      setIsReEvaluating(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      <AiDetailModal 
        isOpen={aiModalOpen} 
        onClose={() => setAiModalOpen(false)} 
        data={selectedAiData} 
        candidateName={selectedAiData?.userId?.fullName} 
        onReEvaluate={handleReEvaluate}
        isReEvaluating={isReEvaluating}
      />

      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/bussiness/post-job')} className="w-10 h-10 rounded-full hover:bg-slate-100 text-black flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-black leading-tight">Danh sách ứng viên</h1>
            <p className="text-sm text-black font-medium mt-1">Công việc: <span className="font-bold text-blue-600">{jobTitle}</span></p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="Tìm ứng viên..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <Search className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            <select 
              value={selectedJobId} 
              onChange={(e) => { 
                setSelectedJobId(e.target.value); 
                setPage(1); 
              }} 
              className="w-full sm:w-56 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black focus:outline-none focus:border-blue-500"
            >
              <option value="all">Tất cả vị trí ({jobs.length})</option>
              {jobs.map((j) => (
                <option key={j._id || j.id} value={j._id || j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            {viewMode === 'list' && (
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-black focus:outline-none focus:border-blue-500">
                <option value="All">Trạng thái: Tất cả</option>
                <option value="Applied">Hồ sơ mới</option>
                <option value="Testing">Làm bài kiểm tra</option>
                <option value="Interviewing">Đang phỏng vấn</option>
                <option value="Offered">Đề nghị nhận việc</option>
                <option value="Rejected">Đã từ chối</option>
              </select>
            )}
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 hidden sm:flex">
              <button onClick={() => { setViewMode('list'); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-sm' : 'text-black hover:text-black'}`}>Danh sách</button>
              <button onClick={() => { setViewMode('pipeline'); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-black shadow-sm' : 'text-black hover:text-black'}`}>Cột Pipeline</button>
            </div>
            <button onClick={exportToExcel} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-black hover:text-blue-700 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl font-bold text-sm transition-colors shadow-sm whitespace-nowrap">
              <DownloadCloud className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <div className="flex gap-4 overflow-x-auto pb-6 items-start hide-scrollbar" style={{ minHeight: '600px' }}>
          {['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'].map((status) => {
            const columnApps = deduplicatedApps.filter((app) => app.status === status);
            const statusNames = { Applied: 'Hồ sơ mới', Testing: 'Làm Test', Interviewing: 'Phỏng vấn', Offered: 'Nhận việc', Rejected: 'Từ chối' };
            const columnStyles = { Applied: 'border-t-4 border-t-slate-400 bg-slate-50/50', Testing: 'border-t-4 border-t-amber-500 bg-amber-50/10', Interviewing: 'border-t-4 border-t-blue-500 bg-blue-50/10', Offered: 'border-t-4 border-t-emerald-500 bg-emerald-50/10', Rejected: 'border-t-4 border-t-red-500 bg-red-50/10' };
            
            return (
              <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className={`flex-1 min-w-[190px] max-w-[280px] rounded-2xl border border-slate-200 p-4 shadow-sm min-h-[500px] ${columnStyles[status]}`}>
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <h3 className="font-bold text-black text-xs tracking-tight">{statusNames[status]}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-black shadow-sm border border-slate-100">{columnApps.length}</span>
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {columnApps.length === 0 ? (
                    <div className="py-10 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-black text-[10px] font-medium bg-white/40">Kéo thả vào đây</div>
                  ) : (
                    columnApps.map((app) => (
                      <div key={app._id || app.id} draggable onDragStart={(e) => handleDragStart(e, app._id || app.id)} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative">
                        <div className="flex items-start gap-3 mb-4">
                          <img src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} alt={app.userId?.fullName} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                          <div className="flex-grow">
                            <button onClick={() => navigate(`/bussiness/candidate/${app._id || app.id}`)} className="font-bold text-black text-sm hover:text-blue-600 transition-colors text-left block w-full mb-0.5">{app.userId?.fullName || 'Unknown'}</button>
                            <p className="text-black text-[10px] font-bold uppercase tracking-wider">{app.jobId?.title || '—'}</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <button onClick={() => handleOpenAiModal(app)} title="Xem báo cáo chi tiết" className={`px-2 py-1 rounded-lg border flex items-center gap-1 text-[11px] font-bold transition-all ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                            {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                            <span>AI: {(app.aiScore ?? 0)}%</span>
                          </button>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between transition-opacity">
                            <div className="flex gap-1">
                              <button onClick={() => { const url = getPublicCvUrl(app.appliedCvFileUrl, app.appliedCvId || app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200" title="Xem CV"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleOpenNotifyModal(app)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white" title="Gửi thông báo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                            </div>
                            <div className="flex gap-1">
                              {status !== 'Offered' && <button onClick={() => handleOpenConfirmModal(app, 'Offered')} className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[11px] font-black hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer border border-emerald-100" title="Đề nghị nhận việc">Nhận</button>}
                              {status !== 'Rejected' && <button onClick={() => handleOpenConfirmModal(app, 'Rejected')} className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[11px] font-black hover:bg-red-600 hover:text-white transition-colors cursor-pointer border border-red-100" title="Từ chối hồ sơ">Loại</button>}
                            </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-5 pl-6 text-xs font-semibold text-black w-12">#</th>
                  <th className="p-5 text-xs font-semibold text-black">Ứng viên</th>
                  <th className="p-5 text-xs font-semibold text-black text-center">Đánh giá CV (AI)</th>
                  <th className="p-5 text-xs font-semibold text-black text-center w-40">Điểm Bài Test</th>
                  <th className="p-5 text-xs font-semibold text-black">Trạng thái hồ sơ</th>
                  <th className="p-5 pr-6 text-xs font-semibold text-black text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={7} className="p-12 text-center text-black">Đang tải...</td></tr>}
                {!loading && error && <tr><td colSpan={7} className="p-12 text-center text-red-500">{error}</td></tr>}
                {!loading && !error && deduplicatedApps.length === 0 && <tr><td colSpan={7} className="p-16 text-center"><p className="text-black font-medium italic">Chưa có ứng viên nào ứng tuyển vào vị trí này.</p></td></tr>}

                {deduplicatedApps.filter(app => activeFilter === 'All' || app.status === activeFilter).map((app, index) => {
                   const hasDoneTest = app.testStatus === 'Completed' || (app.testScore !== undefined && app.testScore !== null);
                   const jobRequiresTest = app.hasTest || !!app.assessmentId || !!app.jobId?.requireTest;

                   return (
                  <tr key={app._id || app.id} className="hover:bg-slate-50/60 transition-colors group animate-fade-in">
                    <td className="p-5 pl-6 text-sm font-medium text-black">{(page - 1) * limit + index + 1}</td>
                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} alt={app.userId?.fullName || 'Ứng viên'} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                        <div>
                          <p className="font-bold text-black text-sm flex items-center gap-1.5">
                            <button 
                              onClick={() => navigate(`/bussiness/candidate/${app._id || app.id}`)}
                              className="hover:text-blue-600 transition-colors text-left"
                            >
                              {app.userId?.fullName || 'N/A'}
                            </button>
                            {app.mailSentStatus && app.mailSentStatus !== 'Pending' && <span className={`w-1.5 h-1.5 rounded-full inline-block ${app.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-500' : 'bg-red-500'}`} title={app.mailSentStatus === 'Sent_Pass' ? 'Đã báo đạt' : 'Đã báo loại'}></span>}
                          </p>
                          <p className="text-xs font-medium text-black truncate max-w-[200px]" title={app.userId?.email}>{app.userId?.email || `ID: #${(app._id || app.id).toString().slice(-6).toUpperCase()}`}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <div className="flex justify-center">
                        <button onClick={() => handleOpenAiModal(app)} title="Click để xem phân tích chi tiết" className={`px-4 py-2 rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                          {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-4 h-4" />}
                          <span className="font-black text-sm">{(app.aiScore ?? 0)}% Match</span>
                        </button>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                       {hasDoneTest ? (
                          <div className="flex flex-col items-center">
                             <div className="flex items-center gap-1.5 w-full justify-center">
                                <span className={`font-black text-[15px] ${app.testScore >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{app.testScore}</span>
                                <span className="text-xs text-slate-400 font-bold">/100</span>
                             </div>
                             <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded mt-1 border border-emerald-200">Hoàn thành</span>
                             {app.tabSwitches > 0 && (
                                <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded mt-1 border border-red-200 flex items-center gap-0.5" title={`Hệ thống phát hiện rời màn hình ${app.tabSwitches} lần trong khi thi`}>
                                   <AlertTriangle className="w-3 h-3 text-red-500" />
                                   {app.tabSwitches} lần rời tab
                                </span>
                             )}
                          </div>
                       ) : app.status === 'Rejected' ? (
                          <span className="text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5" title="Hồ sơ đã bị từ chối trước khi làm bài test">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                             Đã dừng tuyển
                          </span>
                       ) : app.status === 'Offered' ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                             Đã nhận việc
                          </span>
                       ) : jobRequiresTest ? (
                          <div className="flex flex-col items-center gap-1.5">
                             <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">Chưa làm bài</span>
                             <button
                               onClick={() => handleOpenNotifyModal(app, 'testReminder')}
                               className="text-[10px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md border border-blue-200 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                               title="Gửi email nhắc nhở ứng viên hoàn thành bài test"
                             >
                               <Mail className="w-3 h-3 text-blue-600" />
                               <span>Nhắc làm bài</span>
                             </button>
                          </div>
                       ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5">
                             <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                             Không có bài test
                          </span>
                       )}
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(app.status)}`}>{getStatusLabel(app.status)}</span>
                    </td>

                    <td className="p-5 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => { const url = getPublicCvUrl(app.appliedCvFileUrl, app.appliedCvId || app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors cursor-pointer shadow-2xs" title="Xem CV"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenNotifyModal(app)} className="p-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer shadow-2xs" title="Gửi thông báo"><Mail className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenConfirmModal(app, 'Offered')} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer shadow-2xs" title="Đề nghị nhận việc"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenConfirmModal(app, 'Rejected')} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors cursor-pointer shadow-2xs" title="Từ chối hồ sơ"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isNotifyModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsNotifyModalOpen(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 border border-slate-200 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-black">Gửi thông báo cho ứng viên</h3>
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-black hover:text-black transition-colors text-xl font-bold" onClick={() => setIsNotifyModalOpen(false)}>&times;</button>
            </div>
            
            <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
              <p className="text-black mb-1">Ứng viên: <strong className="text-black">{selectedApp.userId?.fullName}</strong></p>
              <p className="text-black">Vị trí ứng tuyển: <strong className="text-black">{selectedApp.jobId?.title}</strong></p>
            </div>

            <div className="mb-6">
              <label className="text-xs font-black text-black uppercase tracking-wider block mb-2">Mẫu thông báo nhanh</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: 'test', label: 'Mời làm test' }, 
                  { key: 'testReminder', label: 'Nhắc làm bài test' },
                  { key: 'interview', label: 'Mời phỏng vấn' }, 
                  { key: 'offer', label: 'Mời nhận việc' }, 
                  { key: 'reject', label: 'Thư từ chối' }
                ].map((t) => (
                  <button
                    key={t.key} type="button"
                    onClick={() => {
                      setEmailSubject(templates[t.key].subject);
                      setEmailContent(templates[t.key].content(selectedApp.userId?.fullName || 'Ứng viên', selectedApp.jobId?.title || 'Vị trí ứng tuyển'));
                      setEmailType(t.key === 'reject' ? 'Reject' : 'Pass');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-black transition-all border border-slate-200/50 cursor-pointer text-center"
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-5">
              <div className="form-group">
                <label className="text-xs font-black text-black uppercase tracking-wider block mb-1">Loại thông báo</label>
                <select value={emailType} onChange={(e) => setEmailType(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="Pass">Đạt / Tiếp tục (Xanh)</option>
                  <option value="Reject">Không đạt / Từ chối (Đỏ)</option>
                  <option value="Info">Thông tin khác</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-xs font-black text-black uppercase tracking-wider block mb-1">Tiêu đề Email</label>
                <input type="text" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold text-black" />
              </div>
              <div className="form-group">
                <label className="text-xs font-black text-black uppercase tracking-wider block mb-1">Nội dung thông báo</label>
                <textarea required rows="7" value={emailContent} onChange={(e) => setEmailContent(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-black leading-relaxed"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-black rounded-2xl text-sm font-bold transition-all" onClick={() => setIsNotifyModalOpen(false)}>Hủy</button>
                <button type="submit" disabled={sendingEmail} className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
                  {sendingEmail ? 'Đang gửi...' : 'Gửi thông báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xác nhận Đổi trạng thái Nhận việc / Từ chối để tránh HR bấm nhầm */}
      {confirmModal.isOpen && confirmModal.app && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => setConfirmModal({ isOpen: false, app: null, targetStatus: null })}
        >
          <div 
            className="bg-white rounded-[28px] w-full max-w-md p-6 sm:p-7 border border-slate-200 shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3.5 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmModal.targetStatus === 'Offered' 
                  ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' 
                  : 'bg-rose-100 text-rose-600 border border-rose-200'
              }`}>
                {confirmModal.targetStatus === 'Offered' ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {confirmModal.targetStatus === 'Offered' ? 'Xác nhận nhận việc' : 'Xác nhận từ chối hồ sơ'}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Thao tác thay đổi trạng thái tuyển dụng</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5 text-sm space-y-1.5">
              <p className="text-slate-600">
                Ứng viên: <strong className="text-slate-900">{confirmModal.app.userId?.fullName || 'Ứng viên'}</strong>
              </p>
              <p className="text-slate-600">
                Vị trí: <strong className="text-slate-900">{confirmModal.app.jobId?.title || jobTitle}</strong>
              </p>
              <p className="text-xs mt-2 pt-2 border-t border-slate-200/80">
                {confirmModal.targetStatus === 'Offered' ? (
                  <span className="text-emerald-700 font-semibold">
                    Ứng viên sẽ được chuyển sang trạng thái <strong>Đề nghị nhận việc (Offered)</strong>.
                  </span>
                ) : (
                  <span className="text-rose-700 font-semibold">
                    Ứng viên sẽ được chuyển sang trạng thái <strong>Từ chối (Rejected)</strong> và quá trình xét tuyển vị trí này sẽ kết thúc.
                  </span>
                )}
              </p>
            </div>

            <div className="flex justify-end items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ isOpen: false, app: null, targetStatus: null })}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmStatus}
                className={`px-5 py-2.5 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  confirmModal.targetStatus === 'Offered'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {confirmModal.targetStatus === 'Offered' ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Xác nhận nhận việc</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Xác nhận từ chối</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CVList;