import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Sparkles, FileText, BrainCircuit, Target, CheckCircle2, 
  MapPin, DollarSign, ArrowRight, Bookmark, Briefcase, Clock, 
  Loader2, Zap, Building2, ChevronRight, Filter, TrendingUp, Award
} from 'lucide-react';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';
import { fetchProvinces } from '../../services/locationService';

const Home = () => {
  const navigate = useNavigate();

  // State
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'test', 'hot', 'hanoi', 'hcm'
  const [savedJobs, setSavedJobs] = useState([]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  // Nạp danh sách tỉnh thành từ API v2
  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  // Lấy dữ liệu công việc thật từ Backend
  useEffect(() => {
    let isMounted = true;
    const fetchRealJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/jobs`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setJobs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Lỗi tải danh sách việc làm:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchRealJobs();
    return () => { isMounted = false; };
  }, [API_BASE]);

  // Đồng bộ danh sách công việc đã lưu
  useEffect(() => {
    const syncSaved = () => setSavedJobs(getSavedJobs());
    syncSaved();
    window.addEventListener('saved-jobs-updated', syncSaved);
    return () => window.removeEventListener('saved-jobs-updated', syncSaved);
  }, []);

  const handleToggleSave = (job, e) => {
    e.stopPropagation();
    const result = toggleSavedJob(job);
    setSavedJobs(result.jobs);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.append('keyword', searchTerm.trim());
    if (selectedLocation) params.append('location', selectedLocation);
    navigate(`/jobs?${params.toString()}`);
  };

  const handleKeywordClick = (kw) => {
    setSearchTerm(kw);
    navigate(`/jobs?keyword=${encodeURIComponent(kw)}`);
  };

  // Lọc danh sách việc làm hiển thị trên trang Home
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    // Lọc theo search input nếu có
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(j => 
        j.title?.toLowerCase().includes(term) ||
        j.companyName?.toLowerCase().includes(term) ||
        (Array.isArray(j.tags) && j.tags.some(t => t.toLowerCase().includes(term)))
      );
    }

    // Lọc theo địa điểm nếu có
    if (selectedLocation) {
      list = list.filter(j => 
        (j.location || '').toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Lọc theo Tab
    if (activeTab === 'test') {
      list = list.filter(j => j.testStatus === 'approved' || j.requireTest);
    } else if (activeTab === 'hot') {
      list = list.filter(j => j.hot || j.status === 'Active');
    } else if (activeTab === 'hanoi') {
      list = list.filter(j => (j.location || '').toLowerCase().includes('hà nội'));
    } else if (activeTab === 'hcm') {
      list = list.filter(j => (j.location || '').toLowerCase().includes('hồ chí minh'));
    }

    return list;
  }, [jobs, searchTerm, selectedLocation, activeTab]);

  const features = [
    {
      icon: <FileText className="w-7 h-7 text-blue-600" />,
      bg: 'bg-blue-50 text-blue-600 border-blue-100',
      title: 'Tạo CV chuẩn ATS',
      desc: 'Sở hữu CV chuyên nghiệp, bố cục chuẩn A4 chỉ trong vài phút với trình tạo thông minh.',
      actionText: 'Tạo CV ngay',
      path: '/candidate/cv-templates'
    },
    {
      icon: <BrainCircuit className="w-7 h-7 text-emerald-600" />,
      bg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      title: 'Phỏng vấn mô phỏng AI',
      desc: 'Trải nghiệm phỏng vấn 1:1 cùng AI theo từng JD tuyển dụng, nhận báo cáo nhận xét chi tiết.',
      actionText: 'Luyện phỏng vấn',
      path: '/candidate/ai-interview'
    },
    {
      icon: <Target className="w-7 h-7 text-amber-600" />,
      bg: 'bg-amber-50 text-amber-600 border-amber-100',
      title: 'Đánh giá năng lực',
      desc: 'Tham gia các bài test chuyên môn và luyện tập trắc nghiệm để khẳng định trình độ thực chiến.',
      actionText: 'Làm bài kiểm tra',
      path: '/candidate/tests'
    },
    {
      icon: <Sparkles className="w-7 h-7 text-purple-600" />,
      bg: 'bg-purple-50 text-purple-600 border-purple-100',
      title: 'Matching & Đánh giá CV',
      desc: 'Hệ thống tự động phân tích độ khớp giữa CV của bạn với JD, đưa ra gợi ý nâng cao cơ hội đậu.',
      actionText: 'Khám phá việc làm',
      path: '/jobs'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-4 overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[480px] bg-gradient-to-b from-blue-100/70 via-indigo-50/40 to-transparent rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-sm font-bold mb-6 shadow-xs">
            <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
            Nền tảng Tuyển dụng & Đánh giá Năng lực Kỷ nguyên AI
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.2] mb-6 tracking-tight">
            Kết nối việc làm thực chiến, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">
              Bứt phá sự nghiệp cùng AI
            </span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-500 font-medium mb-10 max-w-2xl mx-auto leading-relaxed">
            Hệ sinh thái thông minh hỗ trợ bạn toàn diện: Tạo CV chuẩn ATS, đánh giá năng lực qua bài test thực tế và luyện tập phỏng vấn tự động cùng AI.
          </p>
          
          {/* SEARCH BOX FORM */}
          <form onSubmit={handleSearchSubmit} className="max-w-3xl mx-auto bg-white p-2.5 rounded-2xl md:rounded-full shadow-xl shadow-blue-900/5 border border-slate-200 flex flex-col md:flex-row items-center gap-2 hover:border-blue-300 transition-all">
            <div className="flex-1 flex items-center px-4 w-full">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Vị trí, kỹ năng (ví dụ: Fullstack AI, React, Java)..." 
                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-semibold placeholder:font-medium placeholder:text-slate-400 py-2.5 text-sm md:text-base"
              />
            </div>

            <div className="hidden md:block w-px h-8 bg-slate-200"></div>

            <div className="flex items-center px-4 w-full md:w-56">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <select 
                value={selectedLocation} 
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-transparent border-none outline-none pl-2.5 text-slate-700 font-bold text-sm cursor-pointer py-2.5"
              >
                <option value="">Tất cả địa điểm</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.cleanName}>{p.cleanName}</option>
                ))}
                {selectedLocation && selectedLocation !== 'Remote' && !provinces.some(p => p.cleanName === selectedLocation) && (
                  <option value={selectedLocation}>{selectedLocation}</option>
                )}
                <option value="Remote">Làm việc từ xa (Remote)</option>
              </select>
            </div>

            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl md:rounded-full font-bold transition-all shadow-md shadow-blue-200 whitespace-nowrap w-full md:w-auto flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Tìm việc ngay
            </button>
          </form>
          
          {/* Quick Keywords */}
          <div className="flex flex-wrap justify-center items-center gap-2 mt-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Gợi ý tìm kiếm:</span>
            {['Fullstack AI', 'React Native', 'Java', 'Flutter', 'Node.js', 'Frontend'].map((kw) => (
              <button 
                key={kw} 
                type="button"
                onClick={() => handleKeywordClick(kw)}
                className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/40 cursor-pointer transition-all shadow-2xs"
              >
                {kw}
              </button>
            ))}
          </div>

          {/* Real stats ribbon */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 max-w-3xl mx-auto pt-8 border-t border-slate-200/60">
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-slate-900 mb-0.5">{jobs.length > 0 ? `${jobs.length}+` : '15+'}</div>
              <p className="text-xs font-semibold text-slate-500">Cơ hội việc làm mở</p>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-blue-600 mb-0.5">100%</div>
              <p className="text-xs font-semibold text-slate-500">CV chuẩn ATS</p>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-emerald-600 mb-0.5">1:1 AI</div>
              <p className="text-xs font-semibold text-slate-500">Luyện phỏng vấn</p>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl md:text-3xl font-black text-amber-500 mb-0.5">Real-test</div>
              <p className="text-xs font-semibold text-slate-500">Đánh giá thực tế</p>
            </div>
          </div>
        </div>
      </section>

      {/* TÍNH NĂNG NỔI BẬT (Interactive Features) */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2.5">Trải nghiệm hệ sinh thái toàn diện</h2>
          <p className="text-slate-500 font-medium text-sm md:text-base">Các công cụ đắc lực giúp bạn gia tăng tỷ lệ trúng tuyển việc làm mục tiêu.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              onClick={() => navigate(feature.path)}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-2xs`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{feature.desc}</p>
              </div>

              <div className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>{feature.actionText}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* VIỆC LÀM THỰC TẾ ĐANG TUYỂN (Featured Real Jobs) */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-2 border border-blue-100">
              <Briefcase className="w-3.5 h-3.5" /> Cơ hội nghề nghiệp
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1.5">Việc làm nổi bật</h2>
            <p className="text-slate-500 font-medium text-sm">Các vị trí tuyển dụng thực tế từ các doanh nghiệp uy tín.</p>
          </div>
          <button 
            onClick={() => navigate('/jobs')} 
            className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-4 py-2.5 rounded-xl text-sm transition-all border border-blue-200"
          >
            Xem tất cả {jobs.length > 0 && `(${jobs.length})`} <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs w-fit">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Tất cả ({jobs.length})
          </button>
          <button 
            onClick={() => setActiveTab('test')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'test' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileText className="w-3.5 h-3.5" /> Có bài Test ({jobs.filter(j => j.testStatus === 'approved' || j.requireTest).length})
          </button>
          <button 
            onClick={() => setActiveTab('hot')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'hot' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Zap className="w-3.5 h-3.5" /> Tuyển gấp / Hot
          </button>
          <button 
            onClick={() => setActiveTab('hanoi')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'hanoi' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            Hà Nội
          </button>
          <button 
            onClick={() => setActiveTab('hcm')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'hcm' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            TP. Hồ Chí Minh
          </button>
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs animate-pulse space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="w-3/4 h-4 bg-slate-100 rounded"></div>
                    <div className="w-1/2 h-3 bg-slate-100 rounded"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="w-full h-3 bg-slate-100 rounded"></div>
                  <div className="w-2/3 h-3 bg-slate-100 rounded"></div>
                </div>
                <div className="flex gap-2 pt-4">
                  <div className="flex-1 h-9 bg-slate-100 rounded-xl"></div>
                  <div className="w-9 h-9 bg-slate-100 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">Chưa tìm thấy việc làm phù hợp</h3>
            <p className="text-slate-500 text-sm mb-6">Thử thay đổi từ khóa tìm kiếm hoặc bấm xem tất cả để cập nhật các công việc mới nhất.</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedLocation(''); setActiveTab('all'); }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all"
            >
              Xem tất cả việc làm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.slice(0, 9).map((job) => {
              const jobId = job._id || job.id;
              const isSaved = savedJobs.some(s => String(s._id || s.id) === String(jobId));
              const companyName = job.companyName || job.company || 'Doanh nghiệp';
              const formattedSalary = job.salary ? (job.salary.includes('$') || job.salary.toLowerCase().includes('triệu') ? job.salary : `${job.salary} VNĐ`) : 'Thỏa thuận';

              return (
                <div 
                  key={jobId}
                  onClick={() => navigate(`/jobs/${jobId}`)}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer group relative"
                >
                  <div>
                    {/* Header: Logo & Title */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex gap-3.5 items-center">
                        <div className="w-13 h-13 rounded-2xl border border-slate-100 p-1.5 shrink-0 overflow-hidden flex items-center justify-center bg-slate-50 group-hover:scale-105 transition-transform">
                          {job.companyLogo ? (
                            <img src={job.companyLogo} alt={companyName} className="w-full h-full object-contain" />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg">
                              {companyName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                            {job.title}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">{companyName}</p>
                        </div>
                      </div>

                      {/* Bookmark save button */}
                      <button
                        type="button"
                        onClick={(e) => handleToggleSave(job, e)}
                        className={`p-2 rounded-xl border transition-colors shrink-0 ${isSaved ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                        title={isSaved ? 'Bỏ lưu' : 'Lưu việc làm'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Badges: Test, Hot */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-4">
                      {job.testStatus === 'approved' && (
                        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border border-indigo-100">
                          <FileText className="w-3 h-3" /> CÓ BÀI TEST
                        </span>
                      )}
                      {(job.hot || job.status === 'Active') && (
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 border border-rose-100">
                          <Zap className="w-3 h-3 fill-current" /> TUYỂN DỤNG
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {job.type || 'Full-time'}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2 mb-4 text-xs font-medium text-slate-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{job.location || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex items-center gap-2 font-black text-emerald-600">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{formattedSalary}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {Array.isArray(job.tags) && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {job.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-slate-50 border border-slate-200/80 text-slate-600 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-auto">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${jobId}`); }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-2xs text-center"
                    >
                      Ứng tuyển ngay
                    </button>
                    {job.testStatus === 'approved' ? (
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${jobId}`); }}
                        className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold py-2 rounded-xl text-xs transition-colors whitespace-nowrap"
                        title="Xem bài kiểm tra của công việc này"
                      >
                        Làm Test
                      </button>
                    ) : (
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate('/candidate/ai-interview', { state: { jobTitle: job.title } }); 
                        }}
                        className="px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 rounded-xl text-xs transition-colors whitespace-nowrap flex items-center gap-1"
                        title="Luyện phỏng vấn AI với vị trí này"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" /> Phỏng vấn AI
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredJobs.length > 9 && (
          <div className="text-center mt-10">
            <button 
              onClick={() => navigate('/jobs')}
              className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold px-8 py-3 rounded-2xl text-sm transition-all shadow-xs inline-flex items-center gap-2"
            >
              Xem thêm {filteredJobs.length - 9} việc làm khác <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        )}
      </section>

      {/* RECRUITER & CANDIDATE BANNER (Dual CTA) */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Candidate CTA */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-800/80 text-blue-200 text-xs font-bold mb-4 border border-blue-700">
                <Sparkles className="w-3 h-3" /> Dành cho Ứng viên
              </div>
              <h3 className="text-2xl font-black mb-3">Tự tin chinh phục mọi nhà tuyển dụng</h3>
              <p className="text-blue-100 text-sm font-medium leading-relaxed mb-6">
                Tạo CV chuẩn chỉnh, nhận phân tích độ tương đồng với JD và luyện tập trả lời phỏng vấn thông minh cùng trợ lý AI.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              <button 
                onClick={() => navigate('/candidate/cv-templates')}
                className="bg-white text-blue-900 hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm"
              >
                Mẫu CV chuyên nghiệp
              </button>
              <button 
                onClick={() => navigate('/candidate/ai-interview')}
                className="bg-blue-800/60 hover:bg-blue-800 text-white border border-blue-600/50 font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition-all"
              >
                Luyện phỏng vấn AI
              </button>
            </div>
          </div>

          {/* Business CTA */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-8 relative overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-800 text-emerald-400 text-xs font-bold mb-4 border border-slate-700">
                <Building2 className="w-3 h-3" /> Dành cho Doanh nghiệp
              </div>
              <h3 className="text-2xl font-black mb-3">Tìm kiếm nhân tài công nghệ thực chiến</h3>
              <p className="text-slate-300 text-sm font-medium leading-relaxed mb-6">
                Đăng tin tuyển dụng, tự động sàng lọc hồ sơ bằng AI và tích hợp bài kiểm tra năng lực độc quyền để chọn đúng người.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 relative z-10">
              <button 
                onClick={() => navigate('/bussiness/post-job')}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition-all shadow-sm shadow-emerald-900/20"
              >
                Đăng tin tuyển dụng ngay
              </button>
              <button 
                onClick={() => navigate('/bussiness/dashboard')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-5 py-2.5 rounded-xl text-xs md:text-sm transition-all"
              >
                Quản lý tuyển dụng
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;