import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { MapPin, DollarSign, ChevronRight } from 'lucide-react';

// Component hiển thị bản thu nhỏ của Template (Skeleton CV)
const MiniTemplatePreview = ({ layout, color }) => {
  return (
    <div className="w-full h-full bg-white p-2 sm:p-3 flex flex-col gap-2 pointer-events-none select-none overflow-hidden scale-100 transform origin-top border border-slate-100 rounded-sm">
      {layout === '2-col' && (
        <>
          <div className="w-full h-6 rounded-sm" style={{ backgroundColor: color }}></div>
          <div className="flex gap-2 flex-1 overflow-hidden">
            <div className="w-1/3 flex flex-col gap-1.5 border-r border-slate-100 pr-1.5">
              <div className="w-8 h-8 rounded-full bg-slate-200 mb-1 mx-auto"></div>
              <div className="w-full h-1 bg-slate-200 rounded-full"></div>
              <div className="w-3/4 h-1 bg-slate-200 rounded-full mx-auto"></div>
              <div className="w-full h-1 bg-slate-200 rounded-full mt-1"></div>
              <div className="w-1/2 h-1 bg-slate-200 rounded-full"></div>
            </div>
            <div className="w-2/3 flex flex-col gap-2 pl-1">
              <div className="w-1/2 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
              <div className="w-full h-1 bg-slate-100 rounded-full"></div>
              <div className="w-full h-1 bg-slate-100 rounded-full"></div>
              <div className="w-5/6 h-1 bg-slate-100 rounded-full mb-0.5"></div>
              <div className="w-1/2 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
              <div className="w-full h-1 bg-slate-100 rounded-full"></div>
              <div className="w-4/5 h-1 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        </>
      )}

      {layout === 'minimalist' && (
        <>
          <div className="flex flex-col gap-1.5 border-b-2 pb-2 mb-0.5" style={{ borderColor: color }}>
            <div className="w-1/2 h-3 rounded-full" style={{ backgroundColor: color }}></div>
            <div className="flex gap-1.5">
              <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
              <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="w-1/3 h-1.5 rounded-full mt-0.5" style={{ backgroundColor: color }}></div>
            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
            <div className="w-3/4 h-1 bg-slate-100 rounded-full"></div>
            
            <div className="w-1/3 h-1.5 rounded-full mt-1" style={{ backgroundColor: color }}></div>
            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
            <div className="w-5/6 h-1 bg-slate-100 rounded-full"></div>
          </div>
        </>
      )}

      {(!layout || layout === 'classic') && (
        <div className="flex flex-col items-center gap-1.5 h-full">
          <div className="w-1/2 h-2.5 bg-slate-700 rounded-full mt-1 mb-0.5"></div>
          <div className="flex gap-1.5 mb-2">
            <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-8 h-1 bg-slate-200 rounded-full"></div>
          </div>
          <div className="w-full flex flex-col gap-2">
            <div className="w-full border-b border-slate-300 pb-1">
              <div className="w-1/4 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
            <div className="w-full h-1 bg-slate-100 rounded-full"></div>
            
            <div className="w-full border-b border-slate-300 pb-1 mt-1">
              <div className="w-1/4 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
            </div>
            <div className="flex justify-between">
              <div className="w-1/3 h-1 bg-slate-200 rounded-full"></div>
              <div className="w-1/5 h-1 bg-slate-100 rounded-full"></div>
            </div>
            <div className="w-full h-1 bg-slate-50 rounded-full"></div>
            <div className="w-5/6 h-1 bg-slate-50 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const ManageCV = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { fullName: 'Ứng viên' };
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggestedJobs, setSuggestedJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);

  // State Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const cvsPerPage = 4;

  // Lấy keyword (Vị trí công việc) từ CV đầu tiên để hiển thị title gợi ý
  const getMainJobKeyword = () => {
    if (cvList.length > 0 && cvList[0].data?.personal?.jobTitle) {
      return cvList[0].data.personal.jobTitle;
    }
    return '';
  };

  useEffect(() => {
    const fetchJobs = async (keyword) => {
      try {
        setLoadingJobs(true);
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/jobs`); 
        
        if (response.ok) {
          const result = await response.json();
          const allJobs = result.data || result.jobs || result || [];
          
          let matched = allJobs;
          if (keyword) {
             matched = allJobs.filter(j => j.title?.toLowerCase().includes(keyword.toLowerCase()));
             if (matched.length === 0) matched = allJobs;
          }
          
          setSuggestedJobs(matched.slice(0, 4));
        }
      } catch (error) {
        console.error('Lỗi khi tải việc làm:', error);
      } finally {
        setLoadingJobs(false);
      }
    };

    const fetchMyCVs = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/cv/my-cvs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setCvList(data);
          
          // Gắn luồng tải việc làm sau khi tải xong CV để lấy Keyword
          const keyword = data.length > 0 ? data[0].data?.personal?.jobTitle : '';
          fetchJobs(keyword);
        } else {
          toast.error('Không thể tải danh sách CV');
          setLoadingJobs(false);
        }
      } catch (error) {
        toast.error('Lỗi kết nối máy chủ');
        setLoadingJobs(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMyCVs();
  }, []);

  const handleEdit = (cv) => {
    navigate('/candidate/cv-builder', { state: { cvData: cv } });
  };

  const handleDownload = (cv) => {
    navigate('/candidate/cv-builder', { state: { cvData: cv, autoDownload: true } });
  };

  const totalPages = Math.ceil(cvList.length / cvsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [cvList.length, currentPage, totalPages]);

  const currentCvs = cvList.slice((currentPage - 1) * cvsPerPage, currentPage * cvsPerPage);

  return (
    <div className="max-w-7xl mx-auto my-8 px-4 font-inter animate-fade-in">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (MAIN PANEL): DANH SÁCH CV */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h1 className="text-xl md:text-2xl font-black text-slate-900">CV đã tạo trên Careerio</h1>
              <button 
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-emerald-200"
                onClick={() => navigate('/candidate/cv-templates')}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
                Tạo CV mới
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400 font-medium animate-pulse">Đang tải dữ liệu...</div>
            ) : currentCvs.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <div className="text-4xl mb-3">📄</div>
                <p className="text-slate-500 font-medium">Bạn chưa có bản CV nào.<br/>Hãy tạo CV đầu tiên của mình nhé!</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {currentCvs.map(cv => (
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-emerald-300 transition-all group" key={cv._id}>
                      <div className="h-[280px] bg-slate-50 border-b border-slate-100 p-6 relative flex justify-center items-center overflow-hidden">
                        {/* Hiển thị Layout Skeleton thay cho ảnh mặc định */}
                        <div className="w-[180px] h-[254px] shadow-md mx-auto">
                          <MiniTemplatePreview layout={cv.design?.layout} color={cv.design?.color || '#059669'} />
                        </div>
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                          <button className="bg-white text-emerald-600 font-bold px-4 py-2 rounded-xl text-sm hover:scale-105 transition-transform shadow-md" onClick={() => handleEdit(cv)}>Chỉnh sửa</button>
                          <button className="bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-slate-900 transition-transform shadow-md" onClick={() => handleDownload(cv)}>Tải xuống</button>
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{cv.title || 'CV Chưa đặt tên'}</h3>
                        <p className="text-slate-400 text-xs font-medium">Cập nhật: {new Date(cv.updatedAt).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8 mb-2">
                    <button 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm"
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
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        } border`}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 bg-white font-bold text-sm transition-colors shadow-sm"
                    >
                      Sau
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN USER & JOB MATCHING */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-black border-2 border-blue-100">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chào mừng trở lại</p>
                <h3 className="text-lg font-black text-slate-900">{user.fullName}</h3>
                <span className="inline-block bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-md mt-1">Đã xác thực tài khoản</span>
              </div>
            </div>
          </div>

          {/* GỢI Ý VIỆC LÀM DỰA TRÊN CV */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="mb-4">
              <h3 className="font-black text-slate-900 text-base">Việc làm phù hợp</h3>
              <p className="text-xs font-medium text-slate-500 mt-1">
                Dựa trên {getMainJobKeyword() ? <span className="font-bold text-blue-600">{getMainJobKeyword()}</span> : 'kỹ năng của bạn'}
              </p>
            </div>

            <div className="space-y-3">
              {loadingJobs ? (
                 <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Đang tìm việc làm...</div>
              ) : suggestedJobs.length === 0 ? (
                 <div className="py-8 text-center text-slate-400 text-sm italic">Chưa có việc làm phù hợp hiện tại.</div>
              ) : (
                suggestedJobs.map((job) => (
                  <div key={job._id || job.id} onClick={() => navigate(`/jobs/${job._id || job.id}`)} className="block p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700 line-clamp-1 pr-2">{job.title}</h4>
                      <span className="p-1 bg-white rounded-full text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-100 shadow-sm shrink-0 transition-colors">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-2.5 line-clamp-1">{job.companyId?.companyName || job.company || 'Công ty bảo mật'}</p>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100 text-[11px] font-semibold text-slate-600">
                        <MapPin className="w-3 h-3 text-emerald-500" />
                        <span className="truncate max-w-[80px]">{job.location || job.workLocation || 'Từ xa'}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-md border border-slate-100 text-[11px] font-semibold text-slate-600">
                        <DollarSign className="w-3 h-3 text-amber-500" />
                        <span className="truncate max-w-[80px]">{job.salary || job.salaryRange || 'Thỏa thuận'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button 
              onClick={() => navigate('/jobs')}
              className="w-full mt-4 py-2.5 rounded-xl border border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white font-bold text-sm transition-colors"
            >
              Xem tất cả việc làm
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ManageCV;