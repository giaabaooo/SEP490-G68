import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, DollarSign, Briefcase, Clock, Building, 
  Globe, Users, Calendar, Share2, Bookmark, ArrowLeft, CheckCircle2, Loader2, UploadCloud, X
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States lưu dữ liệu từ API
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [applying, setApplying] = useState(false);

  const getCurrentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  };

  // Gọi API lấy chi tiết công việc
  useEffect(() => {
    window.scrollTo(0, 0); // Cuộn lên đầu trang khi vào
    
    const fetchJobDetail = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/jobs/${id}`);
        if (!response.ok) {
          throw new Error('Không tìm thấy công việc');
        }
        const data = await response.json();
        setJob(data);
      } catch (error) {
        console.error(error);
        toast.error('Lỗi khi tải chi tiết công việc!');
        navigate('/jobs'); // Trả về trang danh sách nếu lỗi
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetail();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Đang tải thông tin chi tiết...</p>
      </div>
    );
  }

  if (!job) return null;

  const currentUser = getCurrentUser();

  const handleApplyClick = () => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập bằng tài khoản Ứng viên để ứng tuyển.');
      return;
    }

    if (currentUser.role !== 'candidate') {
      toast.info('Chỉ tài khoản Ứng viên mới có thể ứng tuyển vào công việc này.');
      return;
    }

    setApplyModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleSubmitApplication = async (e) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để ứng tuyển.');
      return;
    }
    if (currentUser.role !== 'candidate') {
      toast.error('Chỉ tài khoản Ứng viên mới có thể ứng tuyển.');
      return;
    }

    if (!selectedFile && !currentUser.cvUrl) {
      toast.error('Vui lòng chọn file CV hoặc cập nhật CV trong hồ sơ của bạn.');
      return;
    }

    setApplying(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('jobId', id);
      if (selectedFile) {
        formData.append('cv', selectedFile);
      }

      const response = await fetch(`${API_BASE}/api/applications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || 'Ứng tuyển thất bại. Vui lòng thử lại.');
        return;
      }

      toast.success('Ứng tuyển thành công! Nhà tuyển dụng sẽ nhận được hồ sơ của bạn.');
      setApplyModalOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi kết nối. Vui lòng thử lại sau.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16 animate-fade-in">
      {/* 🌟 Header Section */}
      <div className="bg-slate-900 pt-8 pb-16 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={() => navigate('/jobs')} 
            className="flex items-center text-slate-400 hover:text-white font-medium text-sm mb-6 transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại danh sách
          </button>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center bg-white/10 p-6 md:p-8 rounded-[32px] backdrop-blur-md border border-white/10">
            <img 
              src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=3b82f6`} 
              alt={job.companyName} 
              className="w-24 h-24 rounded-2xl bg-white p-2 shrink-0 object-cover" 
            />
            
            <div className="flex-1 text-white">
              <h1 className="text-2xl md:text-4xl font-black mb-2">{job.title}</h1>
              <p className="text-lg text-blue-300 font-bold mb-4">{job.companyName}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location || 'Chưa cập nhật'}</div>
                <div className="flex items-center gap-1.5 text-emerald-400"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.experience}</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button
            onClick={handleApplyClick}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30"
          >
            Ứng tuyển ngay
          </button>
              <div className="flex gap-3">
                <button className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-xl transition-colors">
                  <Bookmark className="w-5 h-5" /> Lưu
                </button>
                <button className="flex-1 flex justify-center items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-6 rounded-xl transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Apply Modal */}
      {applyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-xl rounded-[32px] bg-white p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Ứng tuyển vào vị trí này</h3>
                <p className="text-sm text-slate-500 mt-1">Tải lên CV của bạn hoặc sử dụng CV đã lưu trong hồ sơ.</p>
              </div>
              <button
                onClick={() => setApplyModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitApplication} className="space-y-5">
              <div className="rounded-3xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-sm font-bold text-slate-700 mb-2">CV hiện tại</p>
                {currentUser?.cvUrl ? (
                  <a
                    href={`${API_BASE}${currentUser.cvUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    Xem CV đã lưu trong hồ sơ
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">Bạn chưa có CV lưu sẵn trong hồ sơ.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-slate-500">Tải lên CV mới</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 cursor-pointer text-slate-600 hover:border-blue-500 hover:text-blue-700 transition-colors">
                  <UploadCloud className="w-5 h-5" />
                  <span>{selectedFile ? selectedFile.name : 'Chọn file CV (.pdf, .doc, .docx)'}</span>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} />
                </label>
                <p className="text-xs text-slate-400">Nếu bạn chọn file mới, nó sẽ được sử dụng khi ứng tuyển.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setApplyModalOpen(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all disabled:opacity-50"
                >
                  {applying ? 'Đang gửi...' : 'Ứng tuyển'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 Main Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 flex flex-col lg:flex-row gap-8">
        
        {/* Cột trái: Chi tiết công việc */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-slate-100">
              <span className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{job.type}</span>
              {job.tags && job.tags.map(tag => (
                <span key={tag} className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl">{tag}</span>
              ))}
            </div>

            {/* Mô tả */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 mb-4">Mô tả công việc</h2>
              {/* Vì data có thể có nhiều dòng, ta dùng whitespace-pre-wrap để giữ format xuống dòng */}
              <div className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </div>
            </div>

            {/* Yêu cầu */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 mb-4">Yêu cầu ứng viên</h2>
              <ul className="space-y-3">
                {job.requirements && job.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                    <div className="mt-1 bg-slate-100 p-1 rounded-full text-slate-400 shrink-0">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quyền lợi */}
            <div>
              <h2 className="text-xl font-black text-slate-900 mb-4">Quyền lợi dành cho bạn</h2>
              <ul className="space-y-3">
                {job.benefits && job.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Cột phải: Thông tin công ty & Summary */}
        <div className="w-full lg:w-1/3 space-y-6">
          
          {/* Box Tổng quan */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
            <h3 className="font-black text-lg text-slate-900 mb-6">Tổng quan công việc</h3>
            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ngày đăng</p>
                  <p className="font-bold text-slate-800">
                    {job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hạn ứng tuyển</p>
                  <p className="font-bold text-slate-800">
                    {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button
              onClick={handleApplyClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 mb-3"
            >
                Ứng tuyển ngay
              </button>
              <p className="text-center text-xs text-slate-500 font-medium">Bạn có thể sử dụng AI để tối ưu CV cho công việc này.</p>
            </div>
          </div>

          {/* Box Công ty */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <img 
                src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=3b82f6`} 
                alt={job.companyName} 
                className="w-14 h-14 rounded-xl border border-slate-100" 
              />
              <div>
                <h3 className="font-black text-slate-900">{job.companyName}</h3>
                <Link to="#" className="text-sm font-bold text-blue-600 hover:underline">Xem trang công ty</Link>
              </div>
            </div>
            
            <div className="space-y-4 text-sm font-medium text-slate-600">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Trụ sở: {job.companyLocation || 'Chưa cập nhật'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Quy mô: {job.companySize || 'Chưa cập nhật'}</span>
              </div>
              {job.website && (
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                  <a href={job.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
                    {job.website}
                  </a>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetail;