import React, { useState, useEffect } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter, ChevronDown, Bookmark, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Jobs = () => {
  // 1. STATE LƯU TRỮ DỮ LIỆU
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. STATE CHO BỘ LỌC TÌM KIẾM
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedExps, setSelectedExps] = useState([]);

  // 3. HÀM GỌI API LẤY DANH SÁCH CÔNG VIỆC TỪ BACKEND
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      
      if (searchTerm) queryParams.append('keyword', searchTerm);
      if (location) queryParams.append('location', location);
      if (selectedTypes.length > 0) queryParams.append('type', selectedTypes.join(','));
      if (selectedExps.length > 0) queryParams.append('experience', selectedExps.join(','));

      const response = await fetch(`http://localhost:5000/api/jobs?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Lấy dữ liệu thất bại');
      
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Lỗi khi tải danh sách công việc:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gọi API lần đầu khi vào trang & mỗi khi check/uncheck bộ lọc bên trái
  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTypes, selectedExps]);

  // 4. CÁC HÀM XỬ LÝ SỰ KIỆN
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleTypeChange = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const handleExpChange = (exp) => {
    setSelectedExps(prev => prev.includes(exp) ? prev.filter(e => e !== exp) : [...prev, exp]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocation('');
    setSelectedTypes([]);
    setSelectedExps([]);
    // Reload lại toàn bộ data gốc
    setTimeout(() => fetchJobs(), 0);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-12 animate-fade-in">
      {/* 🌟 HERO SECTION & SEARCH BAR */}
      <div className="bg-slate-900 pt-16 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-blue-500 blur-[120px] rounded-full"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Tìm kiếm <span className="text-blue-400">công việc mơ ước</span> của bạn
          </h1>
          <p className="text-slate-300 mb-10 text-base md:text-lg">Hàng ngàn cơ hội việc làm thực chiến đang chờ đón bạn.</p>

          <form onSubmit={handleSearchSubmit} className="bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Tiêu đề công việc, kỹ năng, công ty..." 
                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium placeholder:font-normal" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="hidden md:block w-px h-10 bg-slate-200 self-center"></div>
            
            <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <select 
                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium appearance-none cursor-pointer"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Tất cả địa điểm</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
              </select>
            </div>
            
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl md:rounded-full transition-colors w-full md:w-auto mt-2 md:mt-0 flex items-center justify-center gap-2">
              Tìm việc ngay
            </button>
          </form>
        </div>
      </div>

      {/* 🌟 MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 flex flex-col lg:flex-row gap-8">
        
        {/* Cột trái: Bộ lọc (Filters) */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Filter className="w-5 h-5" /> Bộ lọc
              </h3>
              {(selectedTypes.length > 0 || selectedExps.length > 0 || searchTerm || location) && (
                <span onClick={clearFilters} className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Xóa tất cả</span>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Hình thức làm việc</h4>
                <div className="space-y-2">
                  {['Full-time', 'Part-time', 'Remote', 'Freelance'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeChange(type)}
                      />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Kinh nghiệm</h4>
                <div className="space-y-2">
                  {['Không yêu cầu kinh nghiệm', 'Dưới 1 năm', '1-3 năm', '3-5 năm', 'Trên 5 năm'].map(exp => (
                    <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                        checked={selectedExps.includes(exp)}
                        onChange={() => handleExpChange(exp)}
                      />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{exp}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cột phải: Danh sách công việc */}
        <div className="w-full lg:w-3/4 space-y-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <p className="font-medium text-slate-500">
              Tìm thấy <span className="font-bold text-slate-900">{jobs.length}</span> công việc phù hợp
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              Sắp xếp theo: <span className="font-bold text-slate-900">Mới nhất</span> <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* TRẠNG THÁI LOADING HOẶC RENDER LIST JOB */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[24px] border border-slate-200">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-500 font-medium">Đang tải danh sách công việc...</p>
            </div>
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative">
                {job.status === 'Active' && job.hot && (
                  <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border-2 border-white">
                    Tuyển gấp
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row gap-5">
                  <img 
                    src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=3b82f6`} 
                    alt={job.companyName} 
                    className="w-16 h-16 rounded-2xl border border-slate-100 shrink-0 object-cover" 
                  />
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link to={`/jobs/${job.id}`}>
                          <h2 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">
                            {job.title}
                          </h2>
                        </Link>
                        <p className="text-sm font-bold text-slate-500 mt-1">{job.companyName}</p>
                      </div>
                      <button className="text-slate-300 hover:text-blue-600 transition-colors hidden md:block">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location || 'Chưa cập nhật'}</div>
                      <div className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                      <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{job.type}</span>
                      {job.tags && job.tags.map((tag, idx) => (
                        <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                    <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mb-2 md:mb-0">
                      <Clock className="w-3.5 h-3.5" /> 
                      {job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                    </div>
                    <Link to={`/jobs/${job.id}`}>
                      <button className="bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-colors">
                        Ứng tuyển
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-[24px] p-12 shadow-sm border border-slate-200 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Không tìm thấy công việc nào</h3>
              <p className="text-slate-500 font-medium">Vui lòng thử lại với từ khóa hoặc tiêu chí lọc khác.</p>
              <button 
                onClick={clearFilters}
                className="mt-6 bg-blue-50 text-blue-600 font-bold py-2.5 px-6 rounded-xl transition-colors hover:bg-blue-100"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;