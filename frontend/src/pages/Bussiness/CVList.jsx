import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock, ArrowLeft, DownloadCloud, X, ThumbsUp, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const AiDetailModal = ({ isOpen, onClose, data, candidateName }) => {
    if (!isOpen || !data) return null;
    
    const details = data.aiMatchDetails || {};
    const categoryScores = details.categoryScores || [];

    const sortedCategories = [...categoryScores].sort((a, b) => b.weightedScore - a.weightedScore);

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-black flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" /> Báo cáo phân tích AI
                        </h3>
                        <p className="text-sm text-black font-medium">Ứng viên: <strong className="text-black">{candidateName}</strong></p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    
                    <div className="mb-8">
                        <h4 className="text-sm font-black text-black uppercase tracking-widest mb-2 border-b border-slate-200 pb-3 flex justify-between items-end">
                            <span>Chi tiết điểm theo từng hạng mục</span>
                            <span className="text-xs text-black font-medium normal-case">Đã sắp xếp theo mức độ ưu tiên</span>
                        </h4>
                        
                        <div className="space-y-0">
                            {sortedCategories.length > 0 ? sortedCategories.map((cat, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 border-b border-slate-100 hover:bg-slate-50 transition-colors px-3 rounded-xl">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="font-bold text-black">{cat.name}</span>
                                            {cat.isKey && <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase border border-amber-200">Trọng điểm</span>}
                                        </div>
                                        <p className="text-sm text-black font-medium leading-relaxed">"{cat.feedback}"</p>
                                    </div>
                                    <div className="mt-3 sm:mt-0 text-right shrink-0 bg-white p-3 rounded-lg border border-slate-100 shadow-sm min-w-[140px]">
                                        <div className="text-sm font-bold text-black mb-1">
                                            Điểm gốc: <span className={`font-black ${cat.rawScore >= 80 ? 'text-blue-600' : cat.rawScore >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{cat.rawScore}/100</span>
                                        </div>
                                        <div className="text-xs font-medium text-black">
                                            Trọng số: {cat.weight}% <br/>
                                            <span className="inline-block mt-1 pt-1 border-t border-slate-100 w-full text-black font-black">
                                                Quy đổi: +{cat.weightedScore.toFixed(1)} đ
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="py-4 text-sm text-black italic">Không có dữ liệu chi tiết hạng mục.</p>
                            )}
                        </div>

                        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex justify-between items-center shadow-sm">
                            <div>
                                <h4 className="text-xl font-black text-blue-900 mb-1">Tổng điểm Matching</h4>
                                <p className="text-sm text-blue-700 font-medium">Tính dựa trên tổng điểm quy đổi của các hạng mục</p>
                            </div>
                            <div className="text-5xl font-black text-blue-700 tracking-tighter">
                                {data.aiScore || 0}<span className="text-2xl text-blue-500 font-bold ml-1">/ 100</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                            <h4 className="font-black text-emerald-800 text-base mb-3 flex items-center gap-2"><ThumbsUp className="w-5 h-5"/> Nên gọi phỏng vấn</h4>
                            <p className="text-sm text-emerald-700 font-medium leading-relaxed">{details.reasonToHire || 'Chưa có nhận xét.'}</p>
                        </div>
                        <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                            <h4 className="font-black text-rose-800 text-base mb-3 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Rủi ro / Điểm yếu</h4>
                            <p className="text-sm text-rose-700 font-medium leading-relaxed">{details.reasonToReject || 'Chưa có nhận xét.'}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const CVList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentJobId = searchParams.get('jobId');

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

  const jobTitle = location.state?.jobTitle || (applications[0]?.jobId?.title) || (currentJobId ? 'Chi tiết công việc' : 'Tất cả công việc');

  const templates = {
    test: {
      subject: 'Thư mời thực hiện bài đánh giá năng lực - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi.\n\nChúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia thực hiện bài đánh giá kỹ năng chuyên môn.\n\nVui lòng hoàn thành bài đánh giá của bạn trước thời hạn quy định.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const getPublicCvUrl = (cv) => {
    if (!cv) return null;
    return cv.startsWith('http') ? cv : `${API_BASE}${cv}`;
  };

  const fetchApplications = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (viewMode === 'list' && activeFilter && activeFilter !== 'All') params.append('status', activeFilter);
      
      if (currentJobId) {
        params.append('jobId', currentJobId);
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
  }, [debouncedSearch, activeFilter, page, limit, viewMode, currentJobId]);

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
    if (appId) await updateApplicationStatus(appId, targetStatus);
  };

  const exportToExcel = () => {
    if (deduplicatedApps.length === 0) return toast.warning('Không có ứng viên nào để xuất dữ liệu.');
    const headers = ['Tên ứng viên', 'Email', 'Vị trí', 'Điểm CV (%)', 'Điểm Test (/100)', 'Ngày nộp', 'Trạng thái'];
    const csvRows = [headers.join(',')];

    deduplicatedApps.forEach(app => {
      const name = `"${app.userId?.fullName || 'N/A'}"`;
      const email = `"${app.userId?.email || 'N/A'}"`;
      const job = `"${app.jobId?.title || 'N/A'}"`;
      const cvScore = app.aiScore || 0;
      const testScore = app.testScore !== undefined && app.testScore !== null ? app.testScore : 'Chưa làm';
      const date = `"${new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}"`;
      const status = `"${getStatusLabel(app.status)}"`;
      csvRows.push([name, email, job, cvScore, testScore, date, status].join(','));
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

  const handleOpenNotifyModal = (app) => {
    setSelectedApp(app);
    setIsNotifyModalOpen(true);
    let templateKey = 'test';
    let type = 'Pass';
    if (app.status === 'Interviewing') templateKey = 'interview';
    else if (app.status === 'Offered') templateKey = 'offer';
    else if (app.status === 'Rejected') { templateKey = 'reject'; type = 'Reject'; }

    const candidateName = app.userId?.fullName || 'Ứng viên';
    const title = app.jobId?.title || 'Vị trí ứng tuyển';
    setEmailType(type);
    setEmailSubject(templates[templateKey].subject);
    setEmailContent(templates[templateKey].content(candidateName, title));
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

  return (
    <div className="animate-fade-in pb-12">
      <AiDetailModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} data={selectedAiData} candidateName={selectedAiData?.userId?.fullName} />

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

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              <button onClick={() => { const url = getPublicCvUrl(app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-1.5 bg-slate-50 text-black rounded-lg hover:bg-slate-100" title="Xem CV"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleOpenNotifyModal(app)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white" title="Gửi thông báo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                            </div>
                            <div className="flex gap-1">
                              {status !== 'Offered' && <button onClick={() => updateApplicationStatus(app._id || app.id, 'Offered')} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-600 hover:text-white">Nhận</button>}
                              {status !== 'Rejected' && <button onClick={() => updateApplicationStatus(app._id || app.id, 'Rejected')} className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black hover:bg-red-600 hover:text-white">Loại</button>}
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
                             <div className="flex items-center gap-2 w-full justify-center">
                                <span className={`font-black text-[15px] ${app.testScore >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>{app.testScore}</span>
                             </div>
                             <span className="text-[10px] font-bold text-black uppercase bg-slate-100 px-2 py-0.5 rounded mt-1.5 border border-slate-200">Hoàn thành</span>
                          </div>
                       ) : (
                          <span className="text-[11px] font-bold text-black italic bg-slate-50 border px-3 py-1.5 rounded-lg">Chưa làm bài</span>
                       )}
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(app.status)}`}>{getStatusLabel(app.status)}</span>
                    </td>

                    <td className="p-5 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { const url = getPublicCvUrl(app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenNotifyModal(app)} className="p-2.5 bg-slate-50 text-black rounded-xl hover:bg-slate-200 transition-colors"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                        <button onClick={() => updateApplicationStatus(app._id || app.id, 'Offered')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => updateApplicationStatus(app._id || app.id, 'Rejected')} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors"><XCircle className="w-4 h-4" /></button>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[{ key: 'test', label: 'Mời làm test' }, { key: 'interview', label: 'Mời phỏng vấn' }, { key: 'offer', label: 'Mời nhận việc' }, { key: 'reject', label: 'Thư từ chối' }].map((t) => (
                  <button
                    key={t.key} type="button"
                    onClick={() => {
                      setEmailSubject(templates[t.key].subject);
                      setEmailContent(templates[t.key].content(selectedApp.userId?.fullName || 'Ứng viên', selectedApp.jobId?.title || 'Vị trí ứng tuyển'));
                      setEmailType(t.key === 'reject' ? 'Reject' : 'Pass');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-black transition-all border border-slate-200/50"
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
    </div>
  );
};

export default CVList;