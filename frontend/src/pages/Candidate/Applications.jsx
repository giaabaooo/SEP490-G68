import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, ChevronDown, ChevronUp, Check, Loader2, AlertCircle, X, ArrowRight, Sparkles, Clock, CheckCircle2, Award } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const formatDuration = (seconds) => {
  if (!seconds) return '---';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
};

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedCards, setExpandedCards] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const appsPerPage = 5;
  const navigate = useNavigate();

  const getPublicCvUrl = (cv, appliedCvId) => {
    const target = cv || appliedCvId;
    if (!target) return null;
    if (/^[0-9a-fA-F]{24}$/.test(target)) {
      return `${API_BASE}/api/cv/view/${target}`;
    }
    if (target.startsWith('http')) return target;
    if (target.startsWith('/')) return `${API_BASE}${target}`;
    return `${API_BASE}/${target}`;
  };

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Không thể tải hồ sơ ứng tuyển');
        }
        setApplications(data.data || []);
      } catch (err) {
        setError(err.message || 'Lỗi');
        toast.error(err.message || 'Lỗi khi tải hồ sơ ứng tuyển');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const toggleExpand = (id) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalPages = Math.ceil(applications.length / appsPerPage);
  const currentApps = applications.slice((currentPage - 1) * appsPerPage, currentPage * appsPerPage);

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 font-inter">
      <div className="mx-auto max-w-4xl px-4 flex flex-col gap-6">
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 mb-2">
          <h1 className="text-2xl font-black text-slate-900 mb-1">Việc làm đã ứng tuyển</h1>
          <p className="text-sm font-medium text-slate-500">Danh sách các công việc bạn đã nộp hồ sơ. Theo dõi chi tiết tiến trình từng giai đoạn tại đây.</p>
        </div>

        <div className="flex-1 flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-600 font-medium text-sm">Đang tải hồ sơ...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3 font-bold">
              <AlertCircle className="w-6 h-6" /> <span>{error}</span>
            </div>
          ) : currentApps.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-5xl mb-4 text-slate-400">📁</div>
              <p className="text-slate-600 font-medium">Bạn chưa ứng tuyển công việc nào.</p>
            </div>
          ) : (
            currentApps.map((app) => {
              const employer = app.jobId?.recruiterId?.companyName || app.jobId?.recruiterId?.fullName || 'Công ty Chưa rõ';
              const jobTitle = app.jobId?.title || 'Chưa cập nhật vị trí';
              const appliedDate = new Date(app.appliedAt || app.createdAt || Date.now());
              const updatedDate = new Date(app.updatedAt || app.createdAt || Date.now());
              const cvUrl = getPublicCvUrl(app.appliedCvFileUrl, app.appliedCvId || app.userId?.cvUrl);
              const isExpanded = expandedCards[app._id || app.id];

              const jobHasTest = !!app.hasTest || !!app.assessmentId || !!app.jobId?.requireTest;
              const testId = app.assessmentId?._id || (typeof app.assessmentId === 'string' ? app.assessmentId : null) || app.jobId?.assessmentId;

              // Xác định các bước trên thanh Stepper
              const steps = jobHasTest 
                ? ['Hồ sơ mới', 'Đánh giá năng lực', 'Phỏng vấn', 'Kết quả']
                : ['Hồ sơ mới', 'Phỏng vấn', 'Kết quả'];

              // Tính toán index active của Stepper
              let activeStepIndex = 0;
              let isTestDoneWaitingInterview = false;

              if (jobHasTest) {
                if (['Offered', 'Rejected'].includes(app.status)) {
                  activeStepIndex = 3;
                } else if (app.status === 'Interviewing') {
                  activeStepIndex = 2;
                } else if (app.status === 'Testing') {
                  if (app.testStatus === 'Completed') {
                    // Đã làm xong test, hoàn tất bước Đánh giá năng lực và đang chờ duyệt Phỏng vấn
                    activeStepIndex = 1.5;
                    isTestDoneWaitingInterview = true;
                  } else {
                    activeStepIndex = 1;
                  }
                } else {
                  activeStepIndex = 0;
                }
              } else {
                if (['Offered', 'Rejected'].includes(app.status)) {
                  activeStepIndex = 2;
                } else if (app.status === 'Interviewing') {
                  activeStepIndex = 1;
                } else {
                  activeStepIndex = 0;
                }
              }

              // Xây dựng danh sách sự kiện tiến trình chi tiết
              const timelineEvents = [];

              // 1. Sự kiện nộp hồ sơ
              timelineEvents.push({
                key: 'applied',
                title: 'Ứng viên nộp hồ sơ thành công',
                time: appliedDate,
                desc: app.aiScore > 0 ? `Hồ sơ đã gửi đến NTD. Điểm AI đánh giá CV ban đầu: ${app.aiScore}% phù hợp.` : 'Hồ sơ đã gửi đến NTD và được tiếp nhận vào hệ thống.',
                isDone: true,
                badge: 'Hoàn tất'
              });

              // 2. Sự kiện Bài test (nếu job có yêu cầu test)
              if (jobHasTest) {
                if (app.testStatus === 'Completed') {
                  timelineEvents.push({
                    key: 'test_completed',
                    title: `Đã hoàn thành Bài kiểm tra năng lực (${app.testScore}/100 điểm)`,
                    time: app.testSubmittedAt ? new Date(app.testSubmittedAt) : updatedDate,
                    desc: `Thời gian làm bài: ${formatDuration(app.testDuration)}. Cảnh báo rời màn hình: ${app.tabSwitches || 0} lần. Kết quả đã chuyển sang NTD xét duyệt.`,
                    isDone: true,
                    badge: app.testScore >= 70 ? 'Điểm tốt' : 'Đã nộp',
                    badgeColor: app.testScore >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-purple-50 text-purple-700 border-purple-200'
                  });
                } else if (app.testStatus === 'In_Progress') {
                  timelineEvents.push({
                    key: 'test_in_progress',
                    title: 'Đang làm bài kiểm tra năng lực',
                    time: app.testStartedAt ? new Date(app.testStartedAt) : updatedDate,
                    desc: 'Bạn đã mở và bắt đầu làm bài test. Hãy hoàn tất và nộp bài để đủ điều kiện xét duyệt.',
                    isCurrent: app.status === 'Testing',
                    actionBtn: testId ? { text: 'Tiếp tục làm bài', onClick: () => navigate(`/assessments/${testId}/take`) } : null
                  });
                } else {
                  timelineEvents.push({
                    key: 'test_pending',
                    title: 'Yêu cầu làm bài kiểm tra năng lực',
                    time: appliedDate,
                    desc: 'Vị trí này yêu cầu hoàn thành bài kiểm tra chuyên môn trực tuyến để xét duyệt tiếp.',
                    isCurrent: app.status === 'Testing' || app.status === 'Applied',
                    actionBtn: testId ? { text: 'Làm bài Test ngay', onClick: () => navigate(`/assessments/${testId}/take`) } : null
                  });
                }
              }

              // 3. Sự kiện Phỏng vấn
              if (['Interviewing', 'Offered'].includes(app.status)) {
                timelineEvents.push({
                  key: 'interviewing',
                  title: 'Nhà tuyển dụng mời tham gia Phỏng vấn',
                  time: updatedDate,
                  desc: 'Chúc mừng bạn! Hồ sơ và năng lực đã vượt qua vòng sơ loại. Nhà tuyển dụng đang sắp xếp Lịch phỏng vấn và sẽ liên hệ chi tiết.',
                  isDone: app.status === 'Offered',
                  isCurrent: app.status === 'Interviewing',
                  badge: 'Đang diễn ra',
                  badgeColor: 'bg-blue-50 text-blue-700 border-blue-200'
                });
              } else if (jobHasTest && app.testStatus === 'Completed' && app.status === 'Testing') {
                timelineEvents.push({
                  key: 'awaiting_interview',
                  title: 'Chờ NTD đánh giá kết quả & xếp lịch Phỏng vấn',
                  time: updatedDate,
                  desc: 'Bạn đã hoàn tất bài test. NTD sẽ xem lại điểm số cùng CV của bạn để quyết định gửi lịch phỏng vấn.',
                  isCurrent: true,
                  badge: 'Chờ xếp lịch'
                });
              }

              // 4. Sự kiện Kết quả cuối cùng
              if (app.status === 'Offered') {
                timelineEvents.push({
                  key: 'offered',
                  title: 'Đề nghị nhận việc (Job Offer)',
                  time: updatedDate,
                  desc: 'Chúc mừng bạn đã trúng tuyển! Hãy kiểm tra hòm thư email hoặc trao đổi trực tiếp với NTD để xác nhận nhận việc.',
                  isDone: true,
                  isCurrent: true,
                  badge: 'Trúng tuyển 🎉',
                  badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
                });
              } else if (app.status === 'Rejected') {
                timelineEvents.push({
                  key: 'rejected',
                  title: 'Kết quả: Chưa phù hợp đợt tuyển dụng này',
                  time: updatedDate,
                  desc: 'Cảm ơn bạn đã dành thời gian ứng tuyển. Hồ sơ hiện chưa phù hợp với đợt này. Chúc bạn thành công ở các cơ hội tiếp theo!',
                  isDone: true,
                  isCurrent: true,
                  badge: 'Đã từ chối',
                  badgeColor: 'bg-rose-50 text-rose-700 border-rose-200'
                });
              }

              // Sắp xếp các sự kiện mới nhất lên đầu cho Timeline
              const sortedEvents = [...timelineEvents].reverse();

              return (
                <div key={app._id || app.id} className="bg-white rounded-[24px] border border-slate-200 overflow-hidden shadow-[0_2px_12px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgb(0,0,0,0.06)] hover:border-emerald-300 transition-all duration-300">
                  <div className="p-6">
                    <div className="flex gap-5 mb-5">
                      <div className="w-16 h-16 shrink-0 border border-slate-100 rounded-2xl p-2 bg-slate-50 flex items-center justify-center overflow-hidden shadow-sm">
                        <img 
                          src={app.jobId?.companyLogo || `https://ui-avatars.com/api/?name=${employer}&background=f1f5f9&color=64748b`} 
                          alt="Logo" 
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[18px] font-black text-slate-900 hover:text-emerald-600 cursor-pointer line-clamp-1">{jobTitle}</h3>
                        <p className="text-[13px] font-bold text-slate-600 mt-1 line-clamp-1">{employer}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-[12px] font-semibold text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{appliedDate.toLocaleDateString('vi-VN')} {appliedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          
                          {cvUrl ? (
                            <a href={cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[12px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors">
                              <FileText className="w-3.5 h-3.5" /> <span>CV ứng tuyển</span>
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-[12px] font-semibold text-slate-500">
                              <FileText className="w-3.5 h-3.5" /> Không có CV
                            </span>
                          )}

                          {/* Badge trạng thái làm test */}
                          {jobHasTest && app.testStatus === 'Completed' && (
                            <span className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 text-[12px] font-bold text-purple-700">
                              <Award className="w-3.5 h-3.5 text-purple-600" /> 
                              <span>Bài test: {app.testScore}/100đ</span>
                            </span>
                          )}
                        </div>
                        
                        {/* Nhãn thông báo kết quả */}
                        {app.status === 'Rejected' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-rose-100">
                            Hồ sơ chưa phù hợp với đợt tuyển dụng này
                          </div>
                        )}
                        {app.status === 'Offered' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                            🎉 Chúc mừng bạn đã nhận được Đề nghị nhận việc (Offer)!
                          </div>
                        )}
                        {app.status === 'Interviewing' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                            📅 Đang trong vòng Phỏng vấn
                          </div>
                        )}
                        {app.status === 'Testing' && app.testStatus === 'Completed' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider rounded-lg border border-emerald-100">
                            ✓ Đã hoàn thành bài test ({app.testScore}/100đ) - Chờ NTD xét duyệt kết quả
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Banner nhắc nhở làm bài Test nếu chưa nộp */}
                    {jobHasTest && app.testStatus !== 'Completed' && app.status !== 'Rejected' && testId && (
                      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-indigo-950">Bài kiểm tra năng lực chuyên môn</h4>
                            <p className="text-xs text-indigo-700 mt-0.5">
                              {app.testStatus === 'In_Progress' 
                                ? 'Bạn đang có bài test chưa nộp. Hãy tiếp tục làm bài để hoàn tất hồ sơ.'
                                : 'Vị trí này yêu cầu hoàn thành bài kiểm tra online để NTD xét duyệt vào vòng Phỏng vấn.'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => navigate(`/assessments/${testId}/take`)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                        >
                          {app.testStatus === 'In_Progress' ? 'Tiếp tục làm bài' : 'Làm bài Test ngay'} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex justify-between items-center mt-4 mb-8 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[13px] font-bold text-slate-700 ml-2">
                        Hồ sơ cập nhật lúc: <span className="font-medium text-slate-500">{updatedDate.toLocaleDateString('vi-VN')} {updatedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                      </p>
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="relative flex justify-between items-center w-full px-4 sm:px-8 mb-4 pb-6">
                      <div className="absolute left-[12%] right-[12%] top-3 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full"></div>
                      
                      <div 
                        className={`absolute left-[12%] top-3 -translate-y-1/2 h-1 z-0 transition-all duration-500 rounded-full ${app.status === 'Rejected' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{ width: `${(activeStepIndex / (steps.length - 1)) * 76}%` }}
                      ></div>

                      {steps.map((step, index) => {
                        const isCompleted = isTestDoneWaitingInterview ? index <= 1 : index < activeStepIndex;
                        const isCurrent = isTestDoneWaitingInterview ? index === 2 : index === activeStepIndex;
                        const isRejected = app.status === 'Rejected' && isCurrent;

                        let dotBg = 'bg-white border-slate-200 text-slate-300';
                        let textColor = 'text-slate-500 font-medium';

                        if (isCompleted) {
                          dotBg = 'bg-emerald-500 border-emerald-500 text-white';
                          textColor = 'text-slate-900 font-bold';
                        } else if (isCurrent) {
                          dotBg = isRejected ? 'bg-rose-500 border-rose-500 text-white shadow-rose-500/30' : 'bg-blue-600 border-blue-600 text-white shadow-blue-600/30';
                          textColor = isRejected ? 'text-rose-600 font-black' : 'text-blue-600 font-black';
                        }

                        let stepLabel = step;
                        if (index === steps.length - 1 && isCurrent) {
                          stepLabel = app.status === 'Offered' ? 'Nhận việc' : app.status === 'Rejected' ? 'Từ chối' : step;
                        }

                        return (
                          <div key={index} className="relative z-10 flex flex-col items-center gap-2 bg-white">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${dotBg} ${isCurrent ? 'ring-4 ring-blue-50 scale-110' : ''}`}>
                              {(isCompleted || (isCurrent && !isRejected)) && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              {isRejected && <X className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className={`text-[12px] absolute top-8 w-24 text-center ${textColor}`}>
                              {stepLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Chi tiết tiến trình ứng tuyển */}
                  <div className="border-t border-slate-100 bg-white">
                    <button 
                      onClick={() => toggleExpand(app._id || app.id)}
                      className="w-full flex justify-between items-center px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-slate-900">Chi tiết tiến trình ứng tuyển</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {sortedEvents.length} mốc thời gian
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600">
                         {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 py-5 pt-2 animate-fade-in bg-slate-50/30">
                        <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-3 my-2">
                          
                          {sortedEvents.map((event, eIdx) => {
                            const isLatest = eIdx === 0;
                            const isRejectedEvent = event.key === 'rejected';

                            return (
                              <div key={event.key} className="relative">
                                {/* Dot indicator */}
                                <div className={`absolute -left-[31px] top-1 w-4 h-4 bg-white border-[3px] rounded-full ${
                                  isRejectedEvent 
                                    ? 'border-rose-500 ring-4 ring-rose-50' 
                                    : isLatest 
                                      ? 'border-emerald-500 ring-4 ring-emerald-50' 
                                      : 'border-slate-300'
                                }`}></div>

                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {isLatest && (
                                    <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md ${
                                      isRejectedEvent ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      Mới nhất
                                    </span>
                                  )}
                                  {event.badge && !isLatest && (
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${event.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                      {event.badge}
                                    </span>
                                  )}
                                  <span className="text-[11px] font-semibold text-slate-600">
                                    {event.time.toLocaleDateString('vi-VN')} {event.time.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                                </div>

                                <h4 className={`text-[14px] font-bold ${isLatest ? 'text-slate-900' : 'text-slate-700'}`}>
                                  {event.title}
                                </h4>
                                
                                <p className="text-[12px] font-medium text-slate-700 mt-1 leading-relaxed">
                                  {event.desc}
                                </p>

                                {event.actionBtn && (
                                  <div className="mt-3">
                                    <button
                                      onClick={event.actionBtn.onClick}
                                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                      {event.actionBtn.text} <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm cursor-pointer ${
                    currentPage === page 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20' 
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  } border`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Applications;