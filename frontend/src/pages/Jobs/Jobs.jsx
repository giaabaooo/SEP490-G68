import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter, ChevronDown, Bookmark, Loader2, FileText, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]); 
  const [savedJobs, setSavedJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedExps, setSelectedExps] = useState([]);

  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=1').then(res => res.json()).then(data => setProvinces(data)).catch(console.error);
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) queryParams.append('keyword', searchTerm);
      if (location) queryParams.append('location', location);
      if (selectedTypes.length > 0) queryParams.append('type', selectedTypes.join(','));
      if (selectedExps.length > 0) queryParams.append('experience', selectedExps.join(','));

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/jobs?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Lấy dữ liệu thất bại');
      setJobs(await response.json());
    } catch (error) { console.error('Lỗi:', error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchJobs(); }, [selectedTypes, selectedExps]);

  useEffect(() => {
    const syncSavedJobs = () => setSavedJobs(getSavedJobs());
    syncSavedJobs();
    window.addEventListener('saved-jobs-updated', syncSavedJobs);
    return () => window.removeEventListener('saved-jobs-updated', syncSavedJobs);
  }, []);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchJobs(); };
  const handleTypeChange = (type) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const handleExpChange = (exp) => setSelectedExps(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  const handleToggleSaved = (job) => setSavedJobs(toggleSavedJob(job).jobs);
  const clearFilters = () => { setSearchTerm(''); setLocation(''); setSelectedTypes([]); setSelectedExps([]); setTimeout(() => fetchJobs(), 0); };

  return (
    <div className="bg-[#f8fafc] min-h-screen pb-12 font-inter">
      {/* HEADER SECTION TỐI GIẢN CHUẨN ENTERPRISE */}
      <div className="bg-white border-b border-slate-200 pt-16 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
            Khám phá <span className="text-blue-600">Công việc Mơ ước</span>
          </h1>
          <p className="text-slate-500 mb-10 text-base font-medium">Hàng ngàn cơ hội việc làm thực chiến đang chờ đón bạn.</p>

          <form onSubmit={handleSearchSubmit} className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row gap-2 max-w-4xl mx-auto hover:border-blue-300 transition-colors">
            <div className="flex-1 flex items-center px-4 py-2.5 bg-slate-50 md:bg-transparent rounded-xl">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input type="text" placeholder="Vị trí, kỹ năng, công ty..." className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-semibold placeholder:font-medium placeholder:text-slate-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-200 self-center"></div>
            <div className="flex-1 flex items-center px-4 py-2.5 bg-slate-50 md:bg-transparent rounded-xl mt-2 md:mt-0">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <select className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-semibold cursor-pointer" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Tất cả địa điểm</option>
                {provinces.map(p => (<option key={p.code} value={p.name.replace('Thành phố ', '').replace('Tỉnh ', '')}>{p.name.replace('Thành phố ', '').replace('Tỉnh ', '')}</option>))}
              </select>
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all w-full md:w-auto mt-2 md:mt-0 shadow-sm">
              Tìm việc
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 mt-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2"><Filter className="w-4 h-4 text-slate-500" /> Lọc kết quả</h3>
              {(selectedTypes.length > 0 || selectedExps.length > 0) && (
                <button onClick={clearFilters} className="text-xs font-bold text-blue-600 hover:underline">Xóa lọc</button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Hình thức làm việc</h4>
                <div className="space-y-3">
                  {['Full-time', 'Part-time', 'Remote', 'Freelance'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" checked={selectedTypes.includes(type)} onChange={() => handleTypeChange(type)} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="w-full h-px bg-slate-100"></div>
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Kinh nghiệm</h4>
                <div className="space-y-3">
                  {['Không yêu cầu kinh nghiệm', 'Dưới 1 năm', '1-3 năm', '3-5 năm', 'Trên 5 năm'].map(exp => (
                    <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors" checked={selectedExps.includes(exp)} onChange={() => handleExpChange(exp)} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <p className="font-medium text-slate-500 text-sm">Hiển thị <span className="font-bold text-slate-900">{jobs.length}</span> việc làm</p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-900">
              Sắp xếp: <span className="font-bold text-slate-900">Mới nhất</span> <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
              <p className="text-slate-500 font-medium text-sm">Đang tải danh sách...</p>
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => {
              const jobId = job._id || job.id;
              const isSaved = savedJobs.some(saved => String(saved._id || saved.id) === String(jobId));

              return (
                <div key={jobId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 group relative">
                  
                  {/* GIẢI QUYẾT LỖI ĐÈ GIAO DIỆN: Đặt Badges ở góc trên cùng bên trái của Avatar, và Bookmark góc phải */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                     <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl border border-slate-100 p-2 shrink-0 overflow-hidden flex items-center justify-center bg-white shadow-sm">
                            <img src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=1e3a8a`} alt={job.companyName} className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <Link to={`/jobs/${jobId}`}>
                                <h2 className="text-[17px] font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{job.title}</h2>
                                <p className="text-sm font-semibold text-slate-500 mt-1 hover:underline">{job.companyName}</p>
                            </Link>
                            
                            {/* Badges hiển thị ngay dưới Tên Công ty, cách ly hoàn toàn với Bookmark */}
                            <div className="flex items-center gap-2 mt-2.5">
                                {job.testStatus === 'approved' && (
                                <div className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1 border border-indigo-100">
                                    <FileText className="w-3 h-3" /> CÓ BÀI TEST
                                </div>
                                )}
                                {job.status === 'Active' && job.hot && (
                                <div className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded flex items-center gap-1 border border-rose-100">
                                    <Zap className="w-3 h-3 fill-current" /> TUYỂN GẤP
                                </div>
                                )}
                            </div>
                        </div>
                     </div>

                     {/* Nút Lưu Job đứng riêng biệt một góc */}
                     <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleSaved(job); }}
                        className={`transition-colors p-2 rounded-lg border ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                        title={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                  </div>

                  <Link to={`/jobs/${jobId}`} className="block">
                      <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600 mb-4">
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location || 'Chưa cập nhật'}</div>
                        <div className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                        <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md">{job.type}</span>
                            {job.tags && job.tags.slice(0,3).map((tag, idx) => (
                                <span key={idx} className="px-3 py-1 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium rounded-md">{tag}</span>
                            ))}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                            <Clock className="w-3.5 h-3.5" /> {job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                        </div>
                      </div>
                  </Link>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center">
              <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-slate-500 font-medium text-sm">Thử thay đổi từ khóa hoặc bộ lọc để tìm được công việc phù hợp.</p>
              <button onClick={clearFilters} className="mt-6 text-blue-600 font-bold text-sm hover:underline">Xóa bộ lọc</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;