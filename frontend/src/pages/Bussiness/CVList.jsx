import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock, ArrowLeft, DownloadCloud } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';

const CVList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentJobId = searchParams.get('jobId');

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeFilter, setActiveFilter] = useState('All');

  const jobTitle = location.state?.jobTitle || (applications[0]?.jobId?.title) || (currentJobId ? 'Chi tiết công việc' : 'Tất cả công việc');

  const [viewMode, setViewMode] = useState('list'); 

  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState('Pass');
  const [sendingEmail, setSendingEmail] = useState(false);

  const templates = {
    test: {
      subject: 'Thư mời thực hiện bài đánh giá năng lực - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi.\n\nChúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia thực hiện bài đánh giá kỹ năng chuyên môn. Điều này sẽ giúp chúng tôi hiểu rõ hơn về năng lực thực tế của bạn.\n\nVui lòng hoàn thành bài đánh giá của bạn trước thời hạn quy định.\n\nChúc bạn làm bài thật tốt!\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    interview: {
      subject: 'Thư mời phỏng vấn - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã hoàn thành bài đánh giá năng lực cho vị trí ${jobTitle}.\n\nChúng tôi muốn mời bạn tham gia một buổi phỏng vấn trực tuyến để thảo luận chi tiết hơn về kinh nghiệm, kỹ năng và mức độ phù hợp của bạn với đội ngũ của chúng tôi.\n\nThời gian dự kiến: [Vui lòng điền giờ và ngày tại đây]\nHình thức: Phỏng vấn trực tuyến qua Google Meet.\n\nVui lòng phản hồi email này để xác nhận lịch phỏng vấn.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    offer: {
      subject: 'Thư mời nhận việc (Job Offer) - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nChúc mừng bạn! Chúng tôi rất vui mừng được gửi lời mời hợp tác chính thức đến bạn cho vị trí ${jobTitle}.\n\nBan giám đốc và toàn thể đội ngũ đánh giá cao năng lực của bạn qua các vòng ứng tuyển và tin rằng bạn sẽ là một mảnh ghép tuyệt vời giúp công ty phát triển vững mạnh.\n\nChi tiết về mức lương, phúc lợi và ngày bắt đầu công việc sẽ được gửi kèm trong hợp đồng chính thức. Vui lòng phản hồi trước ngày [Vui lòng điền ngày phản hồi] để xác nhận đồng ý nhận việc.\n\nChào mừng bạn gia nhập đội ngũ của chúng tôi!\nTrân trọng,\nBộ phận Nhân sự.`
    },
    reject: {
      subject: 'Thư cảm ơn ứng tuyển - Careerio',
      content: (candidateName, jobTitle) => `Thân gửi ${candidateName},\n\nCảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vị trí ${jobTitle} tại công ty chúng tôi.\n\nHồ sơ của bạn rất ấn tượng, tuy nhiên ở thời điểm hiện tại, chúng tôi đang tìm kiếm một ứng viên có kinh nghiệm phù hợp hơn với các tiêu chí đặc thù của dự án. Chúng tôi rất tiếc khi chưa thể đồng hành cùng bạn lần này.\n\nThông tin hồ sơ của bạn đã được lưu lại trong cơ sở dữ liệu của chúng tôi cho các cơ hội nghề nghiệp phù hợp hơn trong tương lai.\n\nChúc bạn luôn may mắn và thành công trên con đường sự nghiệp!\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Applied': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Testing': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Interviewing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Offered': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status) => {
    const labels = { Applied: 'Hồ sơ mới', Testing: 'Làm Test', Interviewing: 'Phỏng vấn', Offered: 'Nhận việc', Rejected: 'Từ chối' };
    return labels[status] || status;
  };

  const getAiScoreStyle = (score) => {
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (score >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
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

  // FETCH DATA
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

  // UPDATE STATUS
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
    if (applications.length === 0) {
      return toast.warning('Không có ứng viên nào để xuất dữ liệu.');
    }
    // Cập nhật Header file Excel
    const headers = ['Tên ứng viên', 'Email', 'Vị trí', 'Điểm CV (%)', 'Điểm Test (/100)', 'Ngày nộp', 'Trạng thái'];
    const csvRows = [headers.join(',')];

    applications.forEach(app => {
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
      <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/bussiness/post-job')} className="w-10 h-10 rounded-full hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight">Danh sách ứng viên</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Công việc: <span className="font-bold text-blue-600">{jobTitle}</span></p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-64">
              <input type="text" placeholder="Tìm ứng viên..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {viewMode === 'list' && (
              <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="w-full sm:w-48 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-blue-500">
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
              <button onClick={() => { setViewMode('list'); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Danh sách</button>
              <button onClick={() => { setViewMode('pipeline'); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Cột Pipeline</button>
            </div>
            <button onClick={exportToExcel} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 rounded-xl font-bold text-sm transition-colors shadow-sm whitespace-nowrap">
              <DownloadCloud className="w-4 h-4" /> Xuất Excel
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'pipeline' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 items-start hide-scrollbar" style={{ minHeight: '600px' }}>
          {['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'].map((status) => {
            const columnApps = applications.filter((app) => app.status === status);
            const statusNames = { Applied: 'Hồ sơ ứng tuyển', Testing: 'Làm bài kiểm tra', Interviewing: 'Đang phỏng vấn', Offered: 'Đề nghị (Offer)', Rejected: 'Đã từ chối' };
            const columnStyles = { Applied: 'border-t-4 border-t-slate-400 bg-slate-50/50', Testing: 'border-t-4 border-t-amber-500 bg-amber-50/10', Interviewing: 'border-t-4 border-t-blue-500 bg-blue-50/10', Offered: 'border-t-4 border-t-emerald-500 bg-emerald-50/10', Rejected: 'border-t-4 border-t-red-500 bg-red-50/10' };
            
            return (
              <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className={`flex-shrink-0 w-80 rounded-[28px] border border-slate-200 p-5 shadow-sm min-h-[500px] ${columnStyles[status]}`}>
                <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">{statusNames[status]}</h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-white text-slate-500 shadow-sm border border-slate-100">{columnApps.length}</span>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {columnApps.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-white/40">Kéo thả hồ sơ vào đây</div>
                  ) : (
                    columnApps.map((app) => (
                      <div key={app._id || app.id} draggable onDragStart={(e) => handleDragStart(e, app._id || app.id)} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative">
                        <div className="flex items-start gap-3 mb-4">
                          <img src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} alt={app.userId?.fullName} className="w-10 h-10 rounded-full border border-slate-100 object-cover" />
                          <div className="flex-grow">
                            <button onClick={() => navigate(`/bussiness/candidate/${app._id || app.id}`)} className="font-bold text-slate-900 text-sm hover:text-blue-600 transition-colors text-left block w-full mb-0.5">{app.userId?.fullName || 'Unknown'}</button>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{app.jobId?.title || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 text-[11px] font-bold ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                            {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                            <span>Match CV: {(app.aiScore ?? 0)}%</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">{new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                        </div>

                        {app.mailSentStatus && app.mailSentStatus !== 'Pending' && (
                          <div className="absolute top-4 right-4 flex items-center justify-center">
                            <span className={`w-2 h-2 rounded-full ${app.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} title={app.mailSentStatus === 'Sent_Pass' ? 'Đã báo đạt' : 'Đã báo loại'}></span>
                          </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <button onClick={() => { const url = getPublicCvUrl(app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100" title="Xem CV"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleOpenNotifyModal(app)} className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white" title="Gửi thông báo"><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
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
        /* TABLE VIEW */
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-5 pl-6 text-xs font-semibold text-slate-500 w-12">#</th>
                  <th className="p-5 text-xs font-semibold text-slate-500">Ứng viên</th>
                  <th className="p-5 text-xs font-semibold text-slate-500 text-center">Điểm CV (AI)</th>
                  {/* THÊM CỘT ĐIỂM TEST */}
                  <th className="p-5 text-xs font-semibold text-slate-500 text-center w-40">Điểm Bài Test</th>
                  <th className="p-5 text-xs font-semibold text-slate-500">Ngày nộp</th>
                  <th className="p-5 text-xs font-semibold text-slate-500">Trạng thái hồ sơ</th>
                  <th className="p-5 pr-6 text-xs font-semibold text-slate-500 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && <tr><td colSpan={7} className="p-12 text-center text-slate-400">Đang tải...</td></tr>}
                {!loading && error && <tr><td colSpan={7} className="p-12 text-center text-red-500">{error}</td></tr>}
                {!loading && !error && applications.length === 0 && <tr><td colSpan={7} className="p-16 text-center"><p className="text-slate-400 font-medium italic">Chưa có ứng viên nào ứng tuyển vào vị trí này.</p></td></tr>}

                {applications.filter(app => activeFilter === 'All' || app.status === activeFilter).map((app, index) => {
                   // Logic kiểm tra dữ liệu thật từ field testScore và testStatus
                   const hasDoneTest = app.testStatus === 'Completed' || (app.testScore !== undefined && app.testScore !== null);
                   
                   return (
                  <tr key={app._id || app.id} className="hover:bg-slate-50/60 transition-colors group animate-fade-in">
                    
                    <td className="p-5 pl-6 text-sm font-medium text-slate-400">{(page - 1) * limit + index + 1}</td>

                    <td className="p-5">
                      <div className="flex items-center gap-4">
                        <img src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} alt={app.userId?.fullName || 'Ứng viên'} className="w-10 h-10 rounded-full border border-slate-200 object-cover" />
                        <div>
                          {/* CLICK ĐỂ XEM CHI TIẾT BÀI LÀM */}
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            <button 
                              onClick={() => navigate(`/bussiness/candidate/${app._id || app.id}`)}
                              className="hover:text-blue-600 transition-colors text-left"
                            >
                              {app.userId?.fullName || 'N/A'}
                            </button>
                            {app.mailSentStatus && app.mailSentStatus !== 'Pending' && <span className={`w-1.5 h-1.5 rounded-full inline-block ${app.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-500' : 'bg-red-500'}`} title={app.mailSentStatus === 'Sent_Pass' ? 'Đã báo đạt' : 'Đã báo loại'}></span>}
                          </p>
                          <p className="text-xs font-medium text-slate-400 truncate max-w-[200px]" title={app.userId?.email}>{app.userId?.email || `ID: #${(app._id || app.id).toString().slice(-6).toUpperCase()}`}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-5 text-center">
                      <div className="flex justify-center">
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                          {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                          <span className="font-black text-sm">{(app.aiScore ?? 0)}%</span>
                        </div>
                      </div>
                    </td>

                    {/* HIỂN THỊ ĐIỂM TEST HOẶC TRẠNG THÁI CHƯA LÀM DỰA VÀO DỮ LIỆU THẬT */}
                    <td className="p-5 text-center">
                       {hasDoneTest ? (
                          <div className="flex flex-col items-center">
                             <div className="flex items-center gap-2 w-full justify-center">
                                <span className={`font-black text-[15px] ${app.testScore >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {app.testScore}
                                </span>
                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                   <div className={`h-full rounded-full ${app.testScore >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${app.testScore || 0}%` }}></div>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md mt-1.5 border border-slate-200">
                                Chấm điểm xong
                             </span>
                          </div>
                       ) : (
                          <span className="text-[11px] font-bold text-slate-400 italic bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                              Chưa làm bài
                          </span>
                       )}
                    </td>

                    <td className="p-5">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusStyle(app.status)}`}>{getStatusLabel(app.status)}</span>
                    </td>

                    <td className="p-5 pr-6 text-center">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { const url = getPublicCvUrl(app.userId?.cvUrl); if (url) window.open(url, '_blank'); }} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors tooltip" title="Xem CV"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleOpenNotifyModal(app)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors tooltip" title="Gửi thông báo"><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                        <button onClick={() => updateApplicationStatus(app._id || app.id, 'Offered')} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors tooltip" title="Đề nghị nhận việc"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => updateApplicationStatus(app._id || app.id, 'Rejected')} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors tooltip" title="Từ chối"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-5 border-t border-slate-100 bg-slate-50/50">
            <div className="text-sm text-slate-500 font-medium">Tổng: {total} ứng viên</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Trước</button>
              <div className="px-4 py-2 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold">{page}</div>
              <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE NOTIFICATION MODAL */}
      {isNotifyModalOpen && selectedApp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" onClick={() => setIsNotifyModalOpen(false)}>
          <div className="bg-white rounded-[32px] w-full max-w-xl p-8 border border-slate-200 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Gửi thông báo cho ứng viên</h3>
              <button className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-xl font-bold" onClick={() => setIsNotifyModalOpen(false)}>&times;</button>
            </div>
            
            <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
              <p className="text-slate-600 mb-1">Ứng viên: <strong className="text-slate-800">{selectedApp.userId?.fullName}</strong></p>
              <p className="text-slate-600">Vị trí ứng tuyển: <strong className="text-slate-800">{selectedApp.jobId?.title}</strong></p>
            </div>

            <div className="mb-6">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Mẫu thông báo nhanh</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[{ key: 'test', label: 'Mời làm test' }, { key: 'interview', label: 'Mời phỏng vấn' }, { key: 'offer', label: 'Mời nhận việc' }, { key: 'reject', label: 'Thư từ chối' }].map((t) => (
                  <button
                    key={t.key} type="button"
                    onClick={() => {
                      setEmailSubject(templates[t.key].subject);
                      setEmailContent(templates[t.key].content(selectedApp.userId?.fullName || 'Ứng viên', selectedApp.jobId?.title || 'Vị trí ứng tuyển'));
                      setEmailType(t.key === 'reject' ? 'Reject' : 'Pass');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all border border-slate-200/50"
                  >{t.label}</button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-5">
              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại thông báo</label>
                <select value={emailType} onChange={(e) => setEmailType(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500">
                  <option value="Pass">Đạt / Tiếp tục (Xanh)</option>
                  <option value="Reject">Không đạt / Từ chối (Đỏ)</option>
                  <option value="Info">Thông tin khác</option>
                </select>
              </div>
              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề Email</label>
                <input type="text" required value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800" />
              </div>
              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nội dung thông báo</label>
                <textarea required rows="7" value={emailContent} onChange={(e) => setEmailContent(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 leading-relaxed"></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all" onClick={() => setIsNotifyModalOpen(false)}>Hủy</button>
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