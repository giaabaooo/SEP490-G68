import React, { useState, useEffect } from 'react';
import { Calendar, FileText, MessageCircle, ChevronDown, ChevronUp, Check, Loader2, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [expandedCards, setExpandedCards] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const appsPerPage = 5;

  const getPublicCvUrl = (cv) => cv ? (cv.startsWith('http') ? cv : `${API_BASE}${cv}`) : null;

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

  const STEPS = ['Hồ sơ mới', 'Làm Test', 'Phỏng vấn', 'Kết quả'];

  const getStatusData = (status) => {
    switch(status) {
      case 'Offered': 
        return { index: 3, label: 'Nhận việc', color: 'emerald', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
      case 'Rejected': 
        return { index: 3, label: 'Từ chối', color: 'rose', bgClass: 'bg-rose-500', textClass: 'text-rose-600' };
      case 'Interviewing': 
        return { index: 2, label: 'Phỏng vấn', color: 'blue', bgClass: 'bg-blue-500', textClass: 'text-blue-600' };
      case 'Testing': 
        return { index: 1, label: 'Làm Test', color: 'amber', bgClass: 'bg-amber-500', textClass: 'text-amber-600' };
      default: 
        return { index: 0, label: 'Hồ sơ mới', color: 'slate', bgClass: 'bg-emerald-500', textClass: 'text-emerald-600' };
    }
  };

  const totalPages = Math.ceil(applications.length / appsPerPage);
  const currentApps = applications.slice((currentPage - 1) * appsPerPage, currentPage * appsPerPage);

  return (
    <div className="min-h-screen bg-white py-10 font-inter">
      <div className="mx-auto max-w-4xl px-4 flex flex-col gap-6">
        
        <div className="bg-slate-50/50 rounded-3xl p-6 shadow-sm border border-slate-200 mb-2">
          <h1 className="text-2xl font-black text-black mb-1">Việc làm đã ứng tuyển</h1>
          <p className="text-sm font-medium text-black">Danh sách các công việc bạn đã nộp hồ sơ. Theo dõi trạng thái chi tiết tại đây.</p>
        </div>

        <div className="flex-1 flex flex-col gap-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-4" />
              <p className="text-black font-medium text-sm">Đang tải hồ sơ...</p>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3 font-bold">
              <AlertCircle className="w-6 h-6" /> <span>{error}</span>
            </div>
          ) : currentApps.length === 0 ? (
            <div className="py-20 text-center bg-slate-50/50 rounded-3xl border border-slate-200">
              <div className="text-5xl mb-4 text-black">📁</div>
              <p className="text-black font-medium">Bạn chưa ứng tuyển công việc nào.</p>
            </div>
          ) : (
            currentApps.map((app) => {
              const employer = app.jobId?.recruiterId?.companyName || app.jobId?.recruiterId?.fullName || 'Công ty Chưa rõ';
              const jobTitle = app.jobId?.title || 'Chưa cập nhật vị trí';
              const appliedDate = new Date(app.appliedAt || app.createdAt || Date.now());
              const updatedDate = new Date(app.updatedAt || app.createdAt || Date.now());
              const cvUrl = getPublicCvUrl(app.appliedCvFileUrl || app.userId?.cvUrl);
              const isExpanded = expandedCards[app._id || app.id];
              
              const statusData = getStatusData(app.status);
              const activeStepIndex = statusData.index;

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
                        <h3 className="text-[18px] font-black text-black hover:text-emerald-600 cursor-pointer line-clamp-1">{jobTitle}</h3>
                        <p className="text-[13px] font-bold text-black mt-1 line-clamp-1">{employer}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-black">
                          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-[12px] font-semibold text-black">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span>{appliedDate.toLocaleDateString('vi-VN')} {appliedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          
                          {cvUrl ? (
                            <a href={cvUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 text-[12px] font-bold text-emerald-600 hover:bg-emerald-100 transition-colors">
                              <FileText className="w-3.5 h-3.5" /> <span>CV ứng tuyển</span>
                            </a>
                          ) : (
                            <span className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 text-[12px] font-semibold text-black">
                              <FileText className="w-3.5 h-3.5" /> Không có CV
                            </span>
                          )}
                        </div>
                        
                        {app.status === 'Rejected' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-rose-50 text-rose-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-rose-100">
                            Độ phù hợp Thấp. CV cần tối ưu
                          </div>
                        )}
                        {app.status === 'Offered' && (
                          <div className="mt-3 inline-block px-3 py-1 bg-emerald-50 text-emerald-600 text-[11px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                            Chúc mừng bạn đã trúng tuyển!
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-6 mb-8 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[13px] font-bold text-black ml-2">
                        Hồ sơ cập nhật lúc: <span className="font-medium text-black">{updatedDate.toLocaleDateString('vi-VN')}</span>
                      </p>
                    </div>

                    <div className="relative flex justify-between items-center w-full px-4 sm:px-8 mb-4 pb-6">
                      <div className="absolute left-[12%] right-[12%] top-3 -translate-y-1/2 h-1 bg-slate-100 z-0 rounded-full"></div>
                      
                      <div 
                        className={`absolute left-[12%] top-3 -translate-y-1/2 h-1 z-0 transition-all duration-500 rounded-full ${app.status === 'Rejected' ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 76}%` }}
                      ></div>

                      {STEPS.map((step, index) => {
                        const isCompleted = index < activeStepIndex;
                        const isCurrent = index === activeStepIndex;
                        const isRejected = app.status === 'Rejected' && isCurrent;

                        let dotBg = 'bg-white border-slate-200';
                        let textColor = 'text-black font-medium';

                        if (isCompleted) {
                          dotBg = 'bg-emerald-500 border-emerald-500 text-white';
                          textColor = 'text-black font-bold';
                        } else if (isCurrent) {
                          dotBg = isRejected ? 'bg-rose-500 border-rose-500 text-white shadow-rose-500/30' : `${statusData.bgClass} ${statusData.border} text-white shadow-emerald-500/30`;
                          textColor = isRejected ? 'text-rose-600 font-black' : `${statusData.textClass} font-black`;
                        }

                        let stepLabel = step;
                        if (index === 3 && isCurrent) {
                           stepLabel = statusData.label;
                        }

                        return (
                          <div key={index} className="relative z-10 flex flex-col items-center gap-2 bg-white">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${dotBg} ${isCurrent ? 'ring-4 ring-white scale-110' : ''}`}>
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

                  <div className="border-t border-slate-100 bg-white">
                    <button 
                      onClick={() => toggleExpand(app._id || app.id)}
                      className="w-full flex justify-between items-center px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <span className="text-[13px] font-bold text-black">Chi tiết tiến trình ứng tuyển</span>
                      <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-black">
                         {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 py-4 pt-0 animate-fade-in">
                        <div className="relative pl-4 border-l-2 border-slate-100 space-y-5 ml-2 mt-2">
                          
                          <div className="relative">
                            <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 bg-white border-[3px] rounded-full ${app.status === 'Rejected' ? 'border-rose-500' : 'border-emerald-500'}`}></div>
                            <span className={`inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest rounded-md mb-1.5 ${app.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>Mới nhất</span>
                            <h4 className="text-[14px] font-bold text-black">
                              {app.status === 'Offered' ? 'NTD đã gửi đề nghị Nhận việc (Offer)' : 
                               app.status === 'Rejected' ? 'NTD đã phản hồi (Từ chối)' : 
                               app.status === 'Interviewing' ? 'NTD đang sắp xếp Lịch phỏng vấn' :
                               app.status === 'Testing' ? 'NTD yêu cầu bạn thực hiện Bài Test' :
                               'NTD đã tiếp nhận Hồ sơ mới'}
                            </h4>
                            <p className="text-[12px] font-medium text-black mt-1">Cập nhật: {updatedDate.toLocaleDateString('vi-VN')} {updatedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>

                          <div className="relative opacity-50">
                            <div className="absolute -left-[23px] top-1 w-3.5 h-3.5 bg-white border-[3px] border-slate-300 rounded-full"></div>
                            <h4 className="text-[14px] font-bold text-black">Ứng viên nộp hồ sơ thành công</h4>
                            <p className="text-[12px] font-medium text-black mt-1">{appliedDate.toLocaleDateString('vi-VN')} {appliedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>

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
                className="px-4 py-2 rounded-xl border border-slate-200 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm ${
                    currentPage === page 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-600/20' 
                      : 'bg-white border-slate-200 text-black hover:bg-slate-50'
                  } border`}
                >
                  {page}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-slate-200 text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm"
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