import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, DollarSign, Briefcase, Clock, Building, Globe, Users, Calendar, Share2, Bookmark, ArrowLeft, CheckCircle2, Loader2, UploadCloud, X, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  
  // States cho luồng Ứng tuyển
  const [hasApplied, setHasApplied] = useState(false);
  const [savedJobs, setSavedJobs] = useState([]);
  const [myCVs, setMyCVs] = useState([]); // Danh sách CV từ Builder
  const [selectedCvId, setSelectedCvId] = useState(null); // ID CV trên Careerio được chọn
  const [selectedFile, setSelectedFile] = useState(null); // File upload từ máy tính

  const getCurrentUser = () => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } 
    catch { return null; }
  };
  const currentUser = getCurrentUser();

  useEffect(() => {
    const syncSavedJobs = () => setSavedJobs(getSavedJobs());
    syncSavedJobs();
    window.addEventListener('saved-jobs-updated', syncSavedJobs);
    return () => window.removeEventListener('saved-jobs-updated', syncSavedJobs);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Lấy thông tin Job
    const fetchJobDetail = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/jobs/${id}`);
        if (!response.ok) throw new Error('Không tìm thấy công việc');
        setJob(await response.json());
      } catch (error) {
        toast.error('Lỗi khi tải chi tiết công việc!');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    };

    // Kiểm tra xem User đã ứng tuyển Job này chưa
    const checkApplicationStatus = async () => {
      if (!currentUser || currentUser.role !== 'candidate') return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/applications?jobId=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        // Nếu mảng data có phần tử tức là user (đang đăng nhập) đã ứng tuyển
        if (data.data && data.data.length > 0) {
          setHasApplied(true);
        }
      } catch (error) {
        console.error("Lỗi kiểm tra ứng tuyển:", error);
      }
    };

    fetchJobDetail();
    checkApplicationStatus();
  }, [id, navigate]);

  const handleToggleSaved = () => {
    if (!job) return;
    const result = toggleSavedJob(job);
    setSavedJobs(result.jobs);
  };

  // Hàm lấy danh sách CV đã tạo trên Careerio khi mở Modal
  const handleApplyClick = async () => {
    if (!currentUser) return toast.info('Vui lòng đăng nhập bằng tài khoản Ứng viên.');
    if (currentUser.role !== 'candidate') return toast.info('Chỉ tài khoản Ứng viên mới có thể ứng tuyển.');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/cv/my-cvs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Lọc lấy các CV hợp lệ (có data)
        setMyCVs(data);
      }
    } catch (error) {
      console.error('Lỗi tải danh sách CV:', error);
    }

    setApplyModalOpen(true);
  };

  // Xử lý nộp form
  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    if (!selectedFile && !selectedCvId && !currentUser?.cvUrl) {
      return toast.error('Vui lòng chọn hoặc tải lên một file CV để ứng tuyển.');
    }

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', id);
      
      // Gửi theo độ ưu tiên: File upload -> CV Careerio -> CV Profile
      if (selectedFile) {
        formData.append('cv', selectedFile);
      } else if (selectedCvId) {
        formData.append('appliedCvId', selectedCvId); // Tương thích với Backend schema
      }

      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Ứng tuyển thất bại.');
      }

      toast.success('Ứng tuyển thành công! Nhà tuyển dụng sẽ nhận được hồ sơ của bạn.');
      setHasApplied(true);
      setApplyModalOpen(false);
      setSelectedFile(null);
      setSelectedCvId(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setApplying(false);
    }
  };

  const isSaved = Boolean(job && savedJobs.some(saved => String(saved._id || saved.id) === String(job._id || job.id)));

  if (loading) return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
      <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
      <p className="text-slate-600 font-bold">Đang tải thông tin...</p>
    </div>
  );
  if (!job) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-16 font-inter">
      {/* HEADER SECTION */}
      <div className="bg-slate-900 pt-8 pb-16 px-4 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <button onClick={() => navigate('/jobs')} className="flex items-center text-slate-400 hover:text-white font-medium text-sm mb-6 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white/5 p-6 md:p-8 rounded-3xl backdrop-blur-sm border border-white/10">
            <div className="w-24 h-24 rounded-2xl bg-white p-2 shrink-0 flex items-center justify-center overflow-hidden">
               <img src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=059669`} alt={job.companyName} className="w-full h-full object-contain" />
            </div>
            
            <div className="flex-1 text-white">
              <h1 className="text-2xl md:text-3xl font-black mb-2">{job.title}</h1>
              <p className="text-lg text-emerald-400 font-bold mb-4">{job.companyName}</p>
              
              <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {job.location || 'Chưa cập nhật'}</div>
                <div className="flex items-center gap-2 text-emerald-400"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button 
                onClick={handleApplyClick} 
                className={`flex-1 font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg ${hasApplied ? 'bg-slate-700 hover:bg-slate-600 text-white shadow-slate-900/30 border border-slate-500' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'}`}
              >
                {hasApplied ? 'Đã ứng tuyển (Ứng tuyển lại)' : 'Ứng tuyển ngay'}
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleToggleSaved}
                  className={`flex-1 flex justify-center items-center py-3.5 px-6 rounded-xl transition-colors ${isSaved ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                >
                  <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                </button>
                <button className="flex-1 flex justify-center items-center bg-white/10 hover:bg-white/20 text-white py-3.5 px-6 rounded-xl transition-colors"><Share2 className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL ỨNG TUYỂN */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 md:p-8 shadow-2xl border border-slate-200 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Nộp hồ sơ ứng tuyển</h3>
                <p className="text-sm text-slate-500 mt-1">Vị trí: <span className="font-semibold text-slate-700">{job.title}</span></p>
              </div>
              <button onClick={() => setApplyModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmitApplication} className="space-y-6">
              
              {/* Lựa chọn 1: CV tạo trên Careerio */}
              <div>
                <p className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Chọn CV đã tạo trên hệ thống</p>
                {myCVs.length > 0 ? (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {myCVs.map((cv) => (
                      <div 
                        key={cv._id} 
                        onClick={() => { setSelectedCvId(cv._id); setSelectedFile(null); }}
                        className={`p-3 border rounded-xl cursor-pointer flex items-center justify-between transition-all ${selectedCvId === cv._id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-300 bg-white'}`}
                      >
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${selectedCvId === cv._id ? 'bg-emerald-500' : 'bg-slate-300'}`}>CV</div>
                           <div>
                             <p className={`text-sm font-bold ${selectedCvId === cv._id ? 'text-emerald-800' : 'text-slate-700'}`}>{cv.title || 'CV Chưa đặt tên'}</p>
                             <p className="text-xs text-slate-500">Cập nhật: {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}</p>
                           </div>
                        </div>
                        {selectedCvId === cv._id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic p-3 bg-slate-50 rounded-xl border border-slate-100">Bạn chưa có CV hoàn chỉnh nào trên hệ thống.</p>
                )}
              </div>

              <div className="relative flex items-center py-2">
                 <div className="flex-grow border-t border-slate-200"></div>
                 <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-wider">Hoặc</span>
                 <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Lựa chọn 2: Upload File PDF máy tính */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-slate-800">Tải lên CV mới từ máy tính</label>
                  {selectedFile && <span className="text-xs font-bold text-rose-500 cursor-pointer hover:underline" onClick={()=>setSelectedFile(null)}>Xóa file</span>}
                </div>
                <label 
                  onClick={() => setSelectedCvId(null)} // Nếu click upload thì bỏ chọn CV hệ thống
                  className={`flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${selectedFile ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-blue-400'}`}
                >
                  {selectedFile ? (
                    <>
                      <FileText className="w-8 h-8 text-blue-600 mb-1" />
                      <span className="text-sm font-semibold text-blue-700 text-center">{selectedFile.name}</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                      <span className="text-sm font-medium text-slate-600">Nhấn để chọn file PDF/Word tải lên</span>
                      <span className="text-xs text-slate-400">Dung lượng tối đa 5MB</span>
                    </>
                  )}
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setSelectedCvId(null); }} />
                </label>
              </div>

              <button type="submit" disabled={applying} className="w-full mt-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {applying ? 'Đang gửi hồ sơ...' : 'Nộp CV Ứng Tuyển'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MAIN CONTENT DETAILS */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 flex flex-col lg:flex-row gap-6">
        
        {/* Left Column */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
            <h2 className="text-xl font-black text-slate-900 mb-4 border-l-4 border-emerald-500 pl-3">Mô tả công việc</h2>
            <div className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-8 text-sm">
              {job.description}
            </div>

            <h2 className="text-xl font-black text-slate-900 mb-4 border-l-4 border-emerald-500 pl-3">Yêu cầu ứng viên</h2>
            <ul className="space-y-3 mb-8">
              {job.requirements?.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-black text-slate-900 mb-4 border-l-4 border-emerald-500 pl-3">Quyền lợi</h2>
            <ul className="space-y-3">
              {job.benefits?.map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <h3 className="font-black text-lg text-slate-900 mb-6">Thông tin chung</h3>
            
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0"><Calendar className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-0.5">NGÀY ĐĂNG</p>
                  <p className="font-bold text-slate-800 text-sm">{job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0"><Clock className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-0.5">HẠN NỘP HỒ SƠ</p>
                  <p className="font-bold text-rose-600 text-sm">{job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 shrink-0"><Users className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 mb-0.5">QUY MÔ CÔNG TY</p>
                  <p className="font-bold text-slate-800 text-sm">{job.companySize || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>
            
            {job.website && (
              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                <a href={job.website} target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline text-sm font-semibold truncate">
                  {job.website}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* CSS For Modal Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default JobDetail;