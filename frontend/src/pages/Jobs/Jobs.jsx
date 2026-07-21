import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter, ChevronDown, Bookmark, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]); // State lưu danh sách tỉnh thành
  const [savedJobs, setSavedJobs] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedExps, setSelectedExps] = useState([]);

  // Fetch API Tỉnh Thành Việt Nam
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/?depth=1')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Lỗi tải danh sách địa điểm:', err));
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
      
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Lỗi tải danh sách công việc:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedExps]);

  useEffect(() => {
    const syncSavedJobs = () => setSavedJobs(getSavedJobs());
    syncSavedJobs();
    window.addEventListener('saved-jobs-updated', syncSavedJobs);
    return () => window.removeEventListener('saved-jobs-updated', syncSavedJobs);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleTypeChange = (type) => setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const handleExpChange = (exp) => setSelectedExps(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);

  const handleToggleSaved = (job) => {
    const result = toggleSavedJob(job);
    setSavedJobs(result.jobs);
  };

  const clearFilters = () => {
    setSearchTerm(''); setLocation(''); setSelectedTypes([]); setSelectedExps([]);
    setTimeout(() => fetchJobs(), 0);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-inter">
      {/* HERO SECTION */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 pt-20 pb-28 px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Khám phá <span className="text-emerald-400">công việc mơ ước</span>
          </h1>
          <p className="text-slate-300 mb-10 text-lg">Hàng ngàn cơ hội việc làm thực chiến đang chờ đón bạn gia nhập.</p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Vị trí, kỹ năng, công ty..." 
                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium placeholder:font-normal placeholder:text-slate-400" 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px h-10 bg-slate-200 self-center"></div>
            <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <select className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium cursor-pointer" value={location} onChange={(e) => setLocation(e.target.value)}>
                <option value="">Tất cả địa điểm</option>
                {/* Render API Địa điểm thật */}
                {provinces.map(p => (
                  <option key={p.code} value={p.name.replace('Thành phố ', '').replace('Tỉnh ', '')}>
                    {p.name.replace('Thành phố ', '').replace('Tỉnh ', '')}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl md:rounded-full transition-colors w-full md:w-auto">
              Tìm việc
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <div className="w-full lg:w-[280px] shrink-0">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2"><Filter className="w-5 h-5 text-emerald-600" /> Lọc kết quả</h3>
              {(selectedTypes.length > 0 || selectedExps.length > 0) && (
                <button onClick={clearFilters} className="text-xs font-semibold text-rose-500 hover:underline">Xóa lọc</button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 text-sm">Hình thức làm việc</h4>
                <div className="space-y-3">
                  {['Full-time', 'Part-time', 'Remote', 'Freelance'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={selectedTypes.includes(type)} onChange={() => handleTypeChange(type)} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="w-full h-px bg-slate-100"></div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3 text-sm">Kinh nghiệm</h4>
                <div className="space-y-3">
                  {['Không yêu cầu kinh nghiệm', 'Dưới 1 năm', '1-3 năm', '3-5 năm', 'Trên 5 năm'].map(exp => (
                    <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={selectedExps.includes(exp)} onChange={() => handleExpChange(exp)} />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Job List */}
        <div className="flex-1 space-y-4">
          <div className="flex justify-between items-center mb-4 px-1">
            <p className="font-medium text-slate-500 text-sm">
              Tìm thấy <span className="font-bold text-slate-900">{jobs.length}</span> việc làm
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              Sắp xếp: <span className="font-bold text-slate-900">Mới nhất</span> <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Đang tải danh sách công việc...</p>
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => {
              const jobId = job._id || job.id;
              const isSaved = savedJobs.some(saved => String(saved._id || saved.id) === String(jobId));

              return (
                <div key={jobId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group relative">
                  {job.status === 'Active' && job.hot && (
                    <div className="absolute top-0 right-6 bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-b-lg shadow-sm">Tuyển gấp</div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-5">
                    <Link to={`/jobs/${jobId}`} className="flex-1 flex flex-col md:flex-row gap-5">
                      <div className="w-16 h-16 rounded-xl border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center bg-white">
                        <img src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=059669`} alt={job.companyName} className="w-full h-full object-contain" />
                      </div>
                      
                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{job.title}</h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{job.companyName}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-600">
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location || 'Chưa cập nhật'}</div>
                          <div className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                          <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">{job.type}</span>
                          {job.tags && job.tags.slice(0,3).map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleSaved(job);
                        }}
                        className={`transition-colors mb-auto hidden md:block ${isSaved ? 'text-emerald-600' : 'text-slate-300 hover:text-emerald-600'}`}
                        aria-label={isSaved ? 'Bỏ lưu việc làm' : 'Lưu việc làm'}
                      >
                        <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mt-auto">
                        <Clock className="w-3.5 h-3.5" /> 
                        {job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy kết quả</h3>
              <p className="text-slate-500 font-medium text-sm">Hãy thử thay đổi từ khóa hoặc tiêu chí tìm kiếm.</p>
              <button onClick={clearFilters} className="mt-6 bg-slate-100 text-slate-700 font-bold py-2 px-6 rounded-xl hover:bg-slate-200 transition-colors">Xóa bộ lọc</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;