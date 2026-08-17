import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, Clock, Bookmark, ArrowLeft, CheckCircle2, Loader2, UploadCloud, X, FileText, CheckCircle, Sparkles, ThumbsUp, AlertTriangle, ArrowRight, History, Users, Tag } from 'lucide-react';
import { toast } from 'react-toastify';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// ================= MODAL BÁO HẾT LƯỢT =================
const UpgradeModal = ({ isOpen, onClose, title, message }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">{message}</p>
                <button onClick={() => navigate('/upgrade')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer">
                    Nâng cấp gói ngay
                </button>
            </div>
        </div>
    );
};
// =======================================================

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [applyCount, setApplyCount] = useState(0);
  const [myLatestStatus, setMyLatestStatus] = useState(null);
  const [savedJobs, setSavedJobs] = useState([]);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false); 
  const [modalStage, setModalStage] = useState('select_cv'); 
  const [wizardMode, setWizardMode] = useState('apply'); // 'apply' hoặc 'review'
  
  const [myCVs, setMyCVs] = useState([]);
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [useAI, setUseAI] = useState(true);

  const [reviewData, setReviewData] = useState(null);
  const [assessmentData, setAssessmentData] = useState({ hasTest: false, assessmentId: null });
  const [reviewHistory, setReviewHistory] = useState([]);
  const [usageInfo, setUsageInfo] = useState(null);

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }})();

  useEffect(() => {
    const syncSavedJobs = () => setSavedJobs(getSavedJobs());
    syncSavedJobs();
    window.addEventListener('saved-jobs-updated', syncSavedJobs);
    return () => window.removeEventListener('saved-jobs-updated', syncSavedJobs);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchJobDetail = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/jobs/${id}`);
        if (!response.ok) throw new Error('Không tìm thấy công việc');
        setJob(await response.json());
      } catch (error) {
        toast.error('Lỗi khi tải chi tiết công việc!');
        navigate('/jobs');
      } finally { setLoading(false); }
    };

    const checkAppAndHistory = async () => {
      if (!currentUser || currentUser.role !== 'candidate') return;
      try {
        const token = localStorage.getItem('token');
        // ĐÃ FIX: Sắp xếp theo ngày mới nhất để lấy đúng trạng thái ứng tuyển cuối cùng
        const resApp = await fetch(`${API_BASE}/api/applications?jobId=${id}&sort=-updatedAt`, { headers: { Authorization: `Bearer ${token}` } });
        const dataApp = await resApp.json();
        
        if (dataApp.data && dataApp.data.length > 0) {
            const appRecord = dataApp.data[0];
            setApplyCount(appRecord.applyCount || 1);
            setMyLatestStatus(appRecord.status); 
        }

        const resHist = await fetch(`${API_BASE}/api/applications/review-history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (resHist.ok) setReviewHistory(await resHist.json());

        const resUsage = await fetch(`${API_BASE}/api/payment/my-usage`, { headers: { Authorization: `Bearer ${token}` } });
        if (resUsage.ok) setUsageInfo(await resUsage.json());
      } catch (error) { console.error(error); }
    };

    fetchJobDetail();
    checkAppAndHistory();
  }, [id, navigate]);

  const handleToggleSaved = () => { if (job) setSavedJobs(toggleSavedJob(job).jobs); };

  const isPro = usageInfo?.subscription?.plan === 'pro';
  const limitCvReview = isPro ? 50 : 2;
  const usedCvReview = usageInfo?.subscription?.usage?.cvReviewCount || 0;
  const remainCvReview = Math.max(0, limitCvReview - usedCvReview);

  const isExpired = job?.deadline ? new Date(job.deadline).getTime() < new Date().getTime() : false;
  const isClosed = job?.status === 'Closed' || isExpired;

  const handleOpenWizard = async (mode) => {
    // FIX: Redirect tới Login
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
        toast.info('Vui lòng đăng nhập để thực hiện ứng tuyển & đánh giá CV!');
        navigate('/login');
        return;
    }
    if (currentUser.role !== 'candidate') return toast.info('Chỉ tài khoản Ứng viên mới có thể thực hiện chức năng này.');
    if (mode === 'apply' && isClosed) return toast.error('Công việc này đã hết hạn hoặc đã đóng.');
    
    setWizardMode(mode);
    setModalStage('select_cv');
    setReviewData(null);
    setUseAI(mode === 'review' ? true : true); 
    setModalOpen(true);

    try {
      const response = await fetch(`${API_BASE}/api/cv/my-cvs`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) setMyCVs(await response.json());
    } catch (error) { console.error('Lỗi tải CV:', error); }
  };

  const handlePreviewCV = async (e) => {
    e.preventDefault();
    if (!selectedFile && !selectedCvId && !currentUser?.cvUrl) return toast.error('Vui lòng chọn hoặc tải lên một file CV.');

    if (!useAI && wizardMode === 'apply') {
        handleFinalSubmit();
        return;
    }

    if (useAI && remainCvReview <= 0) {
        setModalOpen(false);
        setShowUpgradeModal(true);
        return;
    }

    setModalStage('analyzing');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', id);
      if (selectedFile) formData.append('cv', selectedFile);
      else if (selectedCvId) formData.append('appliedCvId', selectedCvId);

      const response = await fetch(`${API_BASE}/api/applications/preview-match`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });

      if (!response.ok) {
          if (response.status === 403) {
             setModalOpen(false);
             setShowUpgradeModal(true);
             return;
          }
          throw new Error('Không thể phân tích CV lúc này.');
      }
      
      const data = await response.json();
      setReviewData(data.aiResult); 
      setModalStage('review_result');

      setUsageInfo(prev => ({
         ...prev,
         subscription: {
             ...prev.subscription,
             usage: { ...prev.subscription.usage, cvReviewCount: prev.subscription.usage.cvReviewCount + 1 }
         }
      }));

      const resHist = await fetch(`${API_BASE}/api/applications/review-history/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (resHist.ok) setReviewHistory(await resHist.json());

    } catch (error) {
      toast.error(error.message);
      setModalStage('select_cv'); 
    }
  };

  const handleFinalSubmit = async () => {
    setModalStage('applying');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', id);
      if (selectedFile) formData.append('cv', selectedFile);
      else if (selectedCvId) formData.append('appliedCvId', selectedCvId);
      
      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Ứng tuyển thất bại.');

      setApplyCount(prev => prev + 1);
      
      if (data.hasTest) setAssessmentData({ hasTest: true, assessmentId: data.assessmentId });
      setModalStage('success');
    } catch (error) {
      toast.error(error.message);
      setModalStage(useAI ? 'review_result' : 'select_cv'); 
    }
  };

  const handleEditCV = () => {
      if (selectedCvId) {
          const cvToEdit = myCVs.find(cv => cv._id === selectedCvId);
          if (cvToEdit) {
              navigate('/candidate/cv-builder', { state: { cvData: cvToEdit, aiReviewData: reviewData } });
              return;
          }
      }
      navigate('/candidate/cv-templates', { state: { aiReviewData: reviewData, pendingFile: selectedFile } });
  };

  const viewHistoryDetail = (historyItem) => {
      setWizardMode('review');
      setReviewData({
          score: historyItem.score, verdict: historyItem.verdict, pros: historyItem.pros, cons: historyItem.cons, advice: historyItem.advice
      });
      setModalStage('review_result');
      setModalOpen(true);
  };

  const isSaved = Boolean(job && savedJobs.some(saved => String(saved._id || saved.id) === String(job._id || job.id)));

  if (loading) return <div className="min-h-screen flex flex-col justify-center items-center bg-[#f8fafc]"><Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" /><p className="text-slate-500 font-bold">Đang tải...</p></div>;
  if (!job) return null;

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-16 font-inter">
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        title="Hết lượt phân tích CV" 
        message="Mỗi tài khoản miễn phí chỉ có 2 lượt phân tích CV bằng AI mỗi tháng. Vui lòng nâng cấp gói Pro để sử dụng 50 lượt phân tích chuyên sâu!" 
      />

      <div className="bg-white border-b border-slate-200 pt-8 pb-12 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto">
          <button onClick={() => navigate('/jobs')} className="flex items-center text-slate-500 hover:text-blue-600 font-semibold text-sm mb-6 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Quay lại danh sách
          </button>

          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            <div className="w-28 h-28 rounded-2xl border border-slate-100 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-sm bg-white">
               <img src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=1e3a8a`} alt={job.companyName} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">{job.title}</h1>
              <p className="text-lg text-slate-600 font-semibold mb-4">{job.companyName}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-600">
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><MapPin className="w-4 h-4 text-blue-500" /> {job.location || 'Chưa cập nhật'}</div>
                <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 text-emerald-700"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100"><Briefcase className="w-4 h-4 text-amber-500" /> {job.experience}</div>
                
                {/* ĐÃ THÊM: Loại hình và Số lượng tuyển dụng */}
                <div className="flex items-center gap-1.5 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100 text-purple-700"><Tag className="w-4 h-4" /> {job.type || 'Chưa cập nhật'}</div>
                <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 text-orange-700"><Users className="w-4 h-4" /> {job.vacancies ? `${job.vacancies} người` : 'Chưa cập nhật'}</div>
              </div>

              {myLatestStatus && (
                 <div className="mt-4">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold shadow-sm ${
                         myLatestStatus === 'Applied' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                         myLatestStatus === 'Testing' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                         myLatestStatus === 'Interviewing' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                         myLatestStatus === 'Offered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                         myLatestStatus === 'Rejected' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                         'bg-slate-50 text-slate-700 border-slate-200'
                     }`}>
                         <CheckCircle2 className="w-4 h-4" />
                         Trạng thái hồ sơ: {
                             myLatestStatus === 'Applied' ? 'Hồ sơ ứng tuyển' :
                             myLatestStatus === 'Testing' ? 'Làm bài kiểm tra' :
                             myLatestStatus === 'Interviewing' ? 'Đang phỏng vấn' :
                             myLatestStatus === 'Offered' ? 'Đề nghị (Offer)' :
                             myLatestStatus === 'Rejected' ? 'Đã từ từ chối' : myLatestStatus
                         }
                     </span>
                 </div>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={() => handleOpenWizard('apply')} 
                disabled={applyCount >= 3 || isClosed}
                className={`w-full md:w-56 font-bold py-3.5 px-6 rounded-xl transition-all text-sm tracking-wide ${isClosed ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed' : applyCount >= 3 ? 'bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'}`}
              >
                {isClosed ? 'ĐÃ ĐÓNG / HẾT HẠN' : applyCount >= 3 ? 'ĐÃ ĐẠT GIỚI HẠN NỘP (3/3)' : applyCount > 0 ? `NỘP LẠI CV (${applyCount}/3)` : 'ỨNG TUYỂN NGAY'}
              </button>
              
              <button type="button" onClick={handleToggleSaved} className={`w-full md:w-56 flex justify-center items-center py-3.5 px-6 rounded-xl font-bold transition-colors border text-sm gap-2 ${isSaved ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} /> {isSaved ? 'Đã lưu job' : 'Lưu tin này'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
         <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div> Mô tả công việc</h2>
                <div className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap text-[15px]">{job.description}</div>
            </div>
            
            <div className="mb-10">
                <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div> Yêu cầu ứng viên</h2>
                <ul className="space-y-4">
                {job.requirements?.map((req, idx) => {
                    // ĐÃ FIX: Dùng Regex cắt bỏ cụm (xx% - Trọng điểm) hoặc (xx%) để không lộ cho ứng viên
                    const cleanReq = req.replace(/\s*\(\d+%[^)]*\)/g, '');
                    return (
                        <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium text-[15px]">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 shrink-0"></div><span className="leading-relaxed">{cleanReq}</span>
                        </li>
                    );
                })}
                </ul>
            </div>

            {job.benefits && job.benefits.length > 0 && (
                <div>
                    <h2 className="text-xl font-black text-slate-900 mb-5 flex items-center gap-2"><div className="w-1.5 h-6 bg-blue-500 rounded-full"></div> Quyền lợi</h2>
                    <ul className="space-y-4">
                    {job.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-600 font-medium text-[15px]">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /><span className="leading-relaxed">{benefit}</span>
                        </li>
                    ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
        
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white rounded-3xl p-6 relative overflow-hidden shadow-sm border border-slate-200">
             <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-slate-900">AI CV Review</h3>
                        <p className="text-slate-500 text-xs font-semibold">Tối ưu hồ sơ - Tăng cơ hội</p>
                    </div>
                 </div>
                 {usageInfo && (
                     <div className="bg-blue-100 text-blue-700 text-[10px] px-2.5 py-1 rounded-md font-black whitespace-nowrap">
                         Còn {remainCvReview}/{limitCvReview} lượt
                     </div>
                 )}
             </div>
             
             <button 
                onClick={() => {
                   // FIX: Redirect tới Login
                   const token = localStorage.getItem('token');
                   if (!token) {
                       toast.info('Vui lòng đăng nhập để phân tích CV bằng AI!');
                       navigate('/login');
                       return;
                   }
                   if (remainCvReview <= 0) setShowUpgradeModal(true);
                   else handleOpenWizard('review'); 
                }}
                className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
             >
                Test CV bằng AI ngay <ArrowRight className="w-4 h-4" />
             </button>

             {reviewHistory.length > 0 && (
                <div className="mt-6 pt-5 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Lịch sử phân tích</p>
                    <div className="space-y-2.5">
                        {reviewHistory.slice(0, 3).map((hist, idx) => (
                            <div key={idx} onClick={() => viewHistoryDetail(hist)} className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-slate-100">
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Bản nháp {new Date(hist.createdAt).toLocaleDateString('vi-VN')}</p>
                                    <p className={`text-[10px] font-bold ${hist.score >= 75 ? 'text-emerald-600' : hist.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{hist.verdict}</p>
                                </div>
                                <span className={`text-sm font-black ${hist.score >= 75 ? 'text-emerald-600' : hist.score >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>{hist.score}</span>
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-black text-base text-slate-900 mb-5">Thông tin tuyển dụng</h3>
            <div className="space-y-5">
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0"><Clock className="w-5 h-5" /></div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">HẠN NỘP HỒ SƠ</p>
                  <p className={`font-bold text-sm ${isExpired ? 'text-rose-500' : 'text-slate-800'}`}>
                     {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'} {isExpired && '(Đã hết hạn)'}
                  </p>
                </div>
              </div>
              {job.testStatus === 'approved' && (
                 <div className="flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0"><FileText className="w-5 h-5" /></div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">BÀI KIỂM TRA</p>
                      <p className="font-bold text-indigo-600 text-sm">Bắt buộc làm Test</p>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[99] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl rounded-[24px] bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in">
            
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
               <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  {/* TEXT MODAL THAY ĐỔI THEO LUỒNG */}
                  {wizardMode === 'review' ? (
                     modalStage === 'select_cv' ? 'Chọn CV để AI phân tích' : 
                     modalStage === 'analyzing' ? 'AI đang phân tích...' : 
                     modalStage === 'review_result' ? 'Kết quả Đánh giá CV' : 'Đang xử lý...'
                  ) : (
                     modalStage === 'select_cv' ? 'Chọn CV ứng tuyển' : 
                     modalStage === 'analyzing' ? 'AI đang chấm điểm...' : 
                     modalStage === 'review_result' ? 'Kết quả Đánh giá CV' :
                     modalStage === 'applying' ? 'Đang nộp hồ sơ...' : 'Nộp thành công!'
                  )}
               </h3>
               <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
               {modalStage === 'select_cv' && (
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      if (!useAI && wizardMode === 'apply' && applyCount >= 3) {
                          toast.error("Bạn đã đạt giới hạn 3 lần nộp cho công việc này!");
                          return;
                      }
                      handlePreviewCV(e);
                  }} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-slate-800 mb-3 block">1. Chọn CV trên hệ thống</label>
                        {myCVs.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                            {myCVs.map((cv) => (
                                <div key={cv._id} onClick={() => { setSelectedCvId(cv._id); setSelectedFile(null); }} className={`p-4 rounded-xl cursor-pointer border-2 transition-all ${selectedCvId === cv._id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300 bg-white'}`}>
                                    <p className={`text-sm font-bold line-clamp-1 mb-1 ${selectedCvId === cv._id ? 'text-blue-700' : 'text-slate-700'}`}>{cv.title || 'CV Chưa đặt tên'}</p>
                                    <p className="text-xs font-medium text-slate-400">Cập nhật: {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}</p>
                                </div>
                            ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center"><p className="text-sm text-slate-500">Chưa có CV trên hệ thống.</p></div>
                        )}
                    </div>

                    <div className="flex items-center gap-4"><div className="flex-1 h-px bg-slate-100"></div><span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Hoặc</span><div className="flex-1 h-px bg-slate-100"></div></div>

                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label className="text-sm font-bold text-slate-800">2. Tải lên từ thiết bị</label>
                            {selectedFile && <span className="text-xs font-bold text-rose-500 cursor-pointer" onClick={()=>setSelectedFile(null)}>Xóa file</span>}
                        </div>
                        <label onClick={() => setSelectedCvId(null)} className={`flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed transition-all cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-400'}`}>
                            {selectedFile ? (
                                <><FileText className="w-8 h-8 text-blue-600 mb-1" /><span className="text-sm font-bold text-blue-700 text-center">{selectedFile.name}</span></>
                            ) : (
                                <><UploadCloud className="w-8 h-8 text-slate-300 mb-1" /><span className="text-sm font-bold text-slate-600">Nhấn để tải file PDF/Word</span></>
                            )}
                            <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setSelectedCvId(null); }} />
                        </label>
                    </div>
                    
                    {wizardMode === 'apply' && (
                        <label className="flex items-center gap-3 p-4 border border-blue-100 rounded-xl bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors mt-6">
                            <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} />
                            <div>
                                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                    Chạy AI phân tích nháp trước khi nộp <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-[10px] uppercase font-black tracking-wide">Khuyên dùng</span>
                                </p>
                                <p className="text-xs font-medium text-slate-500 mt-1">Giúp nhận lời khuyên sửa CV để tăng cơ hội đậu (Sẽ tiêu hao <strong className="text-blue-600">1 lượt Review của bạn</strong>).</p>
                            </div>
                        </label>
                    )}

                    <div className="pt-4 border-t border-slate-100">
                        <button type="submit" disabled={!useAI && wizardMode === 'apply' && applyCount >= 3} className={`w-full py-4 text-white rounded-xl font-bold text-[15px] transition-all flex items-center justify-center gap-2 ${useAI ? 'bg-slate-900 hover:bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:bg-slate-400 disabled:cursor-not-allowed'}`}>
                           {useAI ? <><Sparkles className="w-5 h-5 text-yellow-400" /> Bắt đầu chấm điểm CV</> : (applyCount >= 3 ? 'Bạn đã hết lượt nộp (3/3)' : 'Nộp hồ sơ ngay')}
                        </button>
                    </div>
                  </form>
               )}

               {modalStage === 'analyzing' && (
                  <div className="py-24 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-6" />
                      <h3 className="text-xl font-black text-slate-800 mb-2">Đang phân tích độ tương thích...</h3>
                      <p className="text-sm font-medium text-slate-500">Quá trình này sử dụng AI để đối chiếu từ khóa và kinh nghiệm.</p>
                  </div>
               )}

               {modalStage === 'review_result' && reviewData && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 shadow-sm">
                          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className="text-slate-200" strokeWidth="3" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                              <path className={`${reviewData.score >= 75 ? 'text-emerald-500' : reviewData.score >= 60 ? 'text-amber-500' : 'text-rose-500'}`} strokeDasharray={`${reviewData.score}, 100`} strokeWidth="3" strokeLinecap="round" stroke="currentColor" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                               <span className={`text-2xl font-black ${reviewData.score >= 75 ? 'text-emerald-600' : reviewData.score >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{reviewData.score}</span>
                            </div>
                          </div>
                          <div className="text-center md:text-left">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">MỨC ĐỘ PHÙ HỢP</p>
                              <h4 className="text-lg font-black text-slate-800 mb-2">{reviewData.verdict}</h4>
                              <p className="text-sm font-medium text-slate-600">Với số điểm này, bạn nên xem xét kỹ các gợi ý bên dưới để bổ sung từ khóa vào CV trước khi nộp để lọt qua vòng lọc hồ sơ.</p>
                          </div>
                      </div>

                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                          <h5 className="font-black text-amber-800 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Nhận xét & Hướng dẫn sửa CV chi tiết</h5>
                          <div className="text-[14px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {reviewData.advice}
                          </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                          {/* NÚT SỬA LẠI CV (LUÔN HIỆN) */}
                          <button onClick={handleEditCV} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl transition-all">
                             Sửa lại CV ngay
                          </button>
                          
                          {/* NẾU ĐIỂM >= 60 MỚI CHO NỘP */}
                          {reviewData.score >= 60 && (
                             <button onClick={handleFinalSubmit} disabled={applyCount >= 3 || isClosed} className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-sm ${applyCount >= 3 || isClosed ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                {isClosed ? 'Job đã đóng' : applyCount >= 3 ? 'Đã hết lượt nộp' : wizardMode === 'review' ? 'Quyết định nộp CV này' : 'Bỏ qua, tiếp tục nộp'}
                             </button>
                          )}
                      </div>
                      
                      {/* CẢNH BÁO KHI ĐIỂM DƯỚI 60 */}
                      {reviewData.score < 60 && (
                          <p className="text-center text-rose-500 text-xs font-bold mt-2">
                             Điểm CV của bạn dưới 60%, hãy nhấn "Sửa lại CV ngay" để tối ưu theo gợi ý của AI trước khi nộp nhé!
                          </p>
                      )}
                  </div>
               )}

               {modalStage === 'applying' && (
                  <div className="py-20 flex flex-col items-center justify-center text-center">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                      <h3 className="text-lg font-bold text-slate-800">Đang nộp hồ sơ...</h3>
                  </div>
               )}

               {modalStage === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center text-center animate-scale-in">
                      <CheckCircle className="w-16 h-16 text-emerald-500 mb-4" />
                      <h3 className="text-2xl font-black text-slate-900 mb-2">Nộp hồ sơ thành công!</h3>
                      <p className="text-slate-500 text-sm font-medium mb-8 max-w-sm">Hồ sơ và điểm đánh giá của bạn đã được gửi đến Nhà tuyển dụng.</p>
                      
                      <div className="flex gap-3 w-full max-w-xs">
                         <button onClick={() => setModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200">Đóng</button>
                         {assessmentData.hasTest && assessmentData.assessmentId && (
                            <button onClick={() => navigate(`/assessments/${assessmentData.assessmentId}/take`)} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                <FileText className="w-4 h-4" /> Làm Test
                            </button>
                         )}
                      </div>
                  </div>
               )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobDetail;