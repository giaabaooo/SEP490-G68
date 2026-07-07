import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock } from 'lucide-react';
import { toast } from 'react-toastify';

const CVList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'];

  // View mode toggle
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'pipeline'

  // Notification Modal States
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState('Pass'); // 'Pass' | 'Reject' | 'Info'
  const [sendingEmail, setSendingEmail] = useState(false);

  const templates = {
    test: {
      subject: 'Thư mời thực hiện bài đánh giá năng lực - Careerio',
      content: (candidateName, jobTitle) => 
`Thân gửi ${candidateName},

Cảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi.

Chúng tôi rất ấn tượng với hồ sơ của bạn và muốn mời bạn tham gia thực hiện bài đánh giá kỹ năng chuyên môn. Điều này sẽ giúp chúng tôi hiểu rõ hơn về năng lực thực tế của bạn.

Vui lòng hoàn thành bài đánh giá của bạn trước thời hạn quy định.

Chúc bạn làm bài thật tốt!
Trân trọng,
Đội ngũ Tuyển dụng.`
    },
    interview: {
      subject: 'Thư mời phỏng vấn - Careerio',
      content: (candidateName, jobTitle) => 
`Thân gửi ${candidateName},

Cảm ơn bạn đã hoàn thành bài đánh giá năng lực cho vị trí ${jobTitle}.

Chúng tôi muốn mời bạn tham gia một buổi phỏng vấn trực tuyến để thảo luận chi tiết hơn về kinh nghiệm, kỹ năng và mức độ phù hợp của bạn với đội ngũ của chúng tôi.

Thời gian dự kiến: [Vui lòng điền giờ và ngày tại đây]
Hình thức: Phỏng vấn trực tuyến qua Google Meet.

Vui lòng phản hồi email này để xác nhận lịch phỏng vấn.

Trân trọng,
Đội ngũ Tuyển dụng.`
    },
    offer: {
      subject: 'Thư mời nhận việc (Job Offer) - Careerio',
      content: (candidateName, jobTitle) => 
`Thân gửi ${candidateName},

Chúc mừng bạn! Chúng tôi rất vui mừng được gửi lời mời hợp tác chính thức đến bạn cho vị trí ${jobTitle}.

Ban giám đốc và toàn thể đội ngũ đánh giá cao năng lực của bạn qua các vòng ứng tuyển và tin rằng bạn sẽ là một mảnh ghép tuyệt vời giúp công ty phát triển vững mạnh.

Chi tiết về mức lương, phúc lợi và ngày bắt đầu công việc sẽ được gửi kèm trong hợp đồng chính thức. Vui lòng phản hồi trước ngày [Vui lòng điền ngày phản hồi] để xác nhận đồng ý nhận việc.

Chào mừng bạn gia nhập đội ngũ của chúng tôi!
Trân trọng,
Bộ phận Nhân sự.`
    },
    reject: {
      subject: 'Thư cảm ơn ứng tuyển - Careerio',
      content: (candidateName, jobTitle) => 
`Thân gửi ${candidateName},

Cảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vị trí ${jobTitle} tại công ty chúng tôi.

Hồ sơ của bạn rất ấn tượng, tuy nhiên ở thời điểm hiện tại, chúng tôi đang tìm kiếm một ứng viên có kinh nghiệm phù hợp hơn với các tiêu chí đặc thù của dự án. Chúng tôi rất tiếc khi chưa thể đồng hành cùng bạn lần này.

Thông tin hồ sơ của bạn đã được lưu lại trong cơ sở dữ liệu của chúng tôi cho các cơ hội nghề nghiệp phù hợp hơn trong tương lai.

Chúc bạn luôn may mắn và thành công trên con đường sự nghiệp!
Trân trọng,
Đội ngũ Tuyển dụng.`
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

  const getAiScoreStyle = (score) => {
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (score >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchApplications = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      // When in Kanban Board mode, we want to view all items across all statuses
      if (viewMode === 'list' && activeFilter && activeFilter !== 'All') {
        params.append('status', activeFilter);
      }
      
      params.append('page', page);
      params.append('limit', viewMode === 'pipeline' ? 100 : limit);

      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/applications?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal,
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonErr = await res.json().catch(() => ({}));
          throw new Error(jsonErr.message || `Request failed ${res.status}`);
        }
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Server returned non-JSON response: ${text.slice(0,200)}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      setApplications(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeFilter, page, limit, viewMode]);

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, [fetchApplications]);

  // Update Status API
  const updateApplicationStatus = async (appId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${appId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật trạng thái');

      toast.success(`Cập nhật trạng thái sang: ${newStatus}`);
      
      // Sync local state
      setApplications(prev => prev.map(app => {
        if ((app._id || app.id) === appId) {
          return { ...app, status: newStatus };
        }
        return app;
      }));
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật trạng thái');
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    await updateApplicationStatus(appId, targetStatus);
  };

  // Open Notification Modal
  const handleOpenNotifyModal = (app) => {
    setSelectedApp(app);
    setIsNotifyModalOpen(true);
    
    let templateKey = 'test';
    let type = 'Pass';
    if (app.status === 'Interviewing') {
      templateKey = 'interview';
    } else if (app.status === 'Offered') {
      templateKey = 'offer';
    } else if (app.status === 'Rejected') {
      templateKey = 'reject';
      type = 'Reject';
    }

    const candidateName = app.userId?.fullName || 'Ứng viên';
    const jobTitle = app.jobId?.title || 'Vị trí ứng tuyển';
    
    setEmailType(type);
    setEmailSubject(templates[templateKey].subject);
    setEmailContent(templates[templateKey].content(candidateName, jobTitle));
  };

  // Send Notification API
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!selectedApp) return;

    try {
      setSendingEmail(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/applications/${selectedApp._id || selectedApp.id}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: emailSubject,
          content: emailContent,
          type: emailType
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi gửi thông báo');

      toast.success('Gửi thông báo thành công!');
      setIsNotifyModalOpen(false);
      
      // Update local state
      setApplications(prev => prev.map(app => {
        if ((app._id || app.id) === (selectedApp._id || selectedApp.id)) {
          return { ...app, mailSentStatus: data.mailSentStatus };
        }
        return app;
      }));
    } catch (err) {
      toast.error(err.message || 'Không thể gửi email thông báo');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Quản lý <span className="text-blue-600">Hồ sơ ứng viên</span>
          </h1>
          <p className="text-slate-500 text-base">Xem xét và đánh giá các CV đã nộp vào hệ thống</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => { setViewMode('list'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => { setViewMode('pipeline'); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'pipeline' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Pipeline (Cột)
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Tìm theo tên hoặc vị trí..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* Filters (List View Only) */}
      {viewMode === 'list' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 mr-2 shadow-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-700">Lọc:</span>
          </div>
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                activeFilter === filter 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {filter === 'All' ? 'Tất cả' : filter}
            </button>
          ))}
        </div>
      )}

      {/* PIPELINE VIEW */}
      {viewMode === 'pipeline' ? (
        <div className="flex gap-6 overflow-x-auto pb-6 items-start hide-scrollbar" style={{ minHeight: '600px' }}>
          {['Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'].map((status) => {
            const columnApps = applications.filter((app) => app.status === status);
            const statusNames = {
              Applied: 'Hồ sơ ứng tuyển',
              Testing: 'Làm bài kiểm tra',
              Interviewing: 'Đang phỏng vấn',
              Offered: 'Đề nghị (Offer)',
              Rejected: 'Đã từ chối'
            };
            const columnStyles = {
              Applied: 'border-t-4 border-t-slate-400 bg-slate-50/50',
              Testing: 'border-t-4 border-t-amber-500 bg-amber-50/10',
              Interviewing: 'border-t-4 border-t-blue-500 bg-blue-50/10',
              Offered: 'border-t-4 border-t-emerald-500 bg-emerald-50/10',
              Rejected: 'border-t-4 border-t-red-500 bg-red-50/10'
            };
            const badgeColors = {
              Applied: 'bg-slate-200 text-slate-700',
              Testing: 'bg-amber-100 text-amber-800',
              Interviewing: 'bg-blue-100 text-blue-800',
              Offered: 'bg-emerald-100 text-emerald-800',
              Rejected: 'bg-red-100 text-red-800'
            };

            return (
              <div
                key={status}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex-shrink-0 w-80 rounded-[28px] border border-slate-200 p-5 shadow-sm min-h-[500px] ${columnStyles[status]}`}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
                  <h3 className="font-black text-slate-800 text-sm tracking-tight">{statusNames[status]}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${badgeColors[status]}`}>
                    {columnApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {columnApps.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs font-medium bg-white/40">
                      <Download className="w-5 h-5 mb-2 text-slate-300 rotate-180" />
                      Kéo thả hồ sơ vào đây
                    </div>
                  ) : (
                    columnApps.map((app) => (
                      <div
                        key={app._id || app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app._id || app.id)}
                        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all cursor-grab active:cursor-grabbing group relative"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <img 
                            src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} 
                            alt={app.userId?.fullName} 
                            className="w-10 h-10 rounded-full border border-slate-100 object-cover" 
                          />
                          <div className="flex-grow">
                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors leading-tight mb-0.5">
                              {app.userId?.fullName || 'Unknown'}
                            </h4>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              {app.jobId?.title || '—'}
                            </p>
                          </div>
                        </div>

                        {/* AI Score Badge */}
                        <div className="flex items-center justify-between">
                          <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 text-[11px] font-bold ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                            {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                            <span>Match: {(app.aiScore ?? 0)}%</span>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Mail Sent Status Icon */}
                        {app.mailSentStatus && app.mailSentStatus !== 'Pending' && (
                          <div className="absolute top-4 right-4 flex items-center justify-center">
                            <span 
                              className={`w-2 h-2 rounded-full ${
                                app.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                              }`} 
                              title={app.mailSentStatus === 'Sent_Pass' ? 'Đã báo đạt' : 'Đã báo loại'}
                            ></span>
                          </div>
                        )}

                        {/* Quick Action Overlay on Hover */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                const cv = app.userId?.cvUrl;
                                if (cv) window.open(cv, '_blank');
                              }}
                              className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Xem CV"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenNotifyModal(app)}
                              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors"
                              title="Gửi thông báo"
                            >
                              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          
                          <div className="flex gap-1">
                            {status !== 'Offered' && (
                              <button
                                onClick={() => updateApplicationStatus(app._id || app.id, 'Offered')}
                                className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-colors"
                              >
                                Nhận
                              </button>
                            )}
                            {status !== 'Rejected' && (
                              <button
                                onClick={() => updateApplicationStatus(app._id || app.id, 'Rejected')}
                                className="px-2 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-black hover:bg-red-600 hover:text-white transition-colors"
                              >
                                Loại
                              </button>
                            )}
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
        <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ứng viên</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Vị trí ứng tuyển</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">AI Match</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ngày nộp</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Trạng thái</th>
                  <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="text-slate-400">Đang tải...</div>
                    </td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="text-red-500">{error}</div>
                    </td>
                  </tr>
                )}

                {!loading && !error && applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="text-slate-400 font-medium">Không tìm thấy hồ sơ nào phù hợp với bộ lọc.</div>
                    </td>
                  </tr>
                )}

                {applications.filter(app => activeFilter === 'All' || app.status === activeFilter).map((app) => (
                  <tr key={app._id || app.id} className="hover:bg-slate-50/60 transition-colors group animate-fade-in">
                    
                    {/* Candidate */}
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <img 
                          src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} 
                          alt={app.userId?.fullName || 'Ứng viên'} 
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover" 
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {app.userId?.fullName || 'Unknown'}
                            {app.mailSentStatus && app.mailSentStatus !== 'Pending' && (
                              <span 
                                className={`w-1.5 h-1.5 rounded-full inline-block ${
                                  app.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}
                                title={app.mailSentStatus === 'Sent_Pass' ? 'Đã báo đạt' : 'Đã báo loại'}
                              ></span>
                            )}
                          </p>
                          <p className="text-xs font-medium text-slate-400">ID: #{(app._id || app.id).toString().slice(-6).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Job Position */}
                    <td className="p-6">
                      <p className="font-bold text-slate-700 text-sm">{app.jobId?.title || '—'}</p>
                    </td>

                    {/* AI Match */}
                    <td className="p-6">
                      <div className="flex justify-center">
                        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                          {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                          <span className="font-black text-sm">{(app.aiScore ?? 0)}%</span>
                        </div>
                      </div>
                    </td>

                    {/* Date Applied */}
                    <td className="p-6">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm font-medium">{new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-6">
                      <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(app.status)}`}>
                        {app.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            const cv = app.userId?.cvUrl;
                            if (cv) window.open(cv, '_blank');
                          }}
                          className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors tooltip" 
                          title="Xem CV"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenNotifyModal(app)}
                          className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors tooltip"
                          title="Gửi thông báo"
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => updateApplicationStatus(app._id || app.id, 'Offered')}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors tooltip" 
                          title="Đề nghị nhận việc (Offer)"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateApplicationStatus(app._id || app.id, 'Rejected')}
                          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors tooltip" 
                          title="Từ chối (Reject)"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between p-4 border-t border-slate-100">
            <div className="text-sm text-slate-500">Tổng: {total} ứng viên</div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-white border disabled:opacity-40"
              >Trước</button>
              <div className="px-3 py-1 rounded-lg bg-slate-50 border">{page}</div>
              <button
                disabled={page * limit >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg bg-white border disabled:opacity-40"
              >Sau</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPOSE NOTIFICATION MODAL */}
      {isNotifyModalOpen && selectedApp && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in" 
          onClick={() => setIsNotifyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-[32px] w-full max-w-xl p-8 border border-slate-200 shadow-2xl animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-900">Gửi thông báo cho ứng viên</h3>
              <button 
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-xl font-bold"
                onClick={() => setIsNotifyModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm">
              <p className="text-slate-600 mb-1">Ứng viên: <strong className="text-slate-800">{selectedApp.userId?.fullName}</strong></p>
              <p className="text-slate-600">Vị trí ứng tuyển: <strong className="text-slate-800">{selectedApp.jobId?.title}</strong></p>
            </div>

            {/* Email Templates Picker */}
            <div className="mb-6">
              <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Mẫu thông báo nhanh</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'test', label: 'Mời làm test' },
                  { key: 'interview', label: 'Mời phỏng vấn' },
                  { key: 'offer', label: 'Mời nhận việc' },
                  { key: 'reject', label: 'Thư từ chối' }
                ].map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => {
                      const candidateName = selectedApp.userId?.fullName || 'Ứng viên';
                      const jobTitle = selectedApp.jobId?.title || 'Vị trí ứng tuyển';
                      setEmailSubject(templates[t.key].subject);
                      setEmailContent(templates[t.key].content(candidateName, jobTitle));
                      setEmailType(t.key === 'reject' ? 'Reject' : 'Pass');
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all border border-slate-200/50"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-5">
              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Loại thông báo</label>
                <select 
                  value={emailType}
                  onChange={(e) => setEmailType(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Pass">Đạt / Tiếp tục (Xanh)</option>
                  <option value="Reject">Không đạt / Từ chối (Đỏ)</option>
                  <option value="Info">Thông tin khác</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề Email</label>
                <input 
                  type="text" 
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Tiêu đề email..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">Nội dung thông báo</label>
                <textarea 
                  required
                  rows="7"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Nội dung gửi ứng viên..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-700 leading-relaxed"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-all"
                  onClick={() => setIsNotifyModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={sendingEmail}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                >
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