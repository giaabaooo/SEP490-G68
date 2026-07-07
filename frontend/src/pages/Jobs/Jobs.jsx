import React, { useState } from 'react';
import { Search, MapPin, Briefcase, DollarSign, Clock, Filter, ChevronDown, Bookmark } from 'lucide-react';
// 👉 ĐÃ THÊM: Import thẻ Link để điều hướng
import { Link } from 'react-router-dom';

const Jobs = () => {
  // Dữ liệu mock
  const [jobs] = useState([
    {
      id: 1,
      title: 'Senior React Native Developer',
      company: 'TechCorp Vietnam',
      logo: 'https://ui-avatars.com/api/?name=TechCorp&background=eff6ff&color=3b82f6',
      location: 'Hà Nội',
      salary: '25,000,000 - 40,000,000 VND',
      type: 'Full-time',
      experience: '3-5 năm',
      postedAt: '2 giờ trước',
      tags: ['React Native', 'JavaScript', 'Mobile'],
      hot: true,
    },
    {
      id: 2,
      title: 'Node.js Backend Engineer',
      company: 'DataSmart Solutions',
      logo: 'https://ui-avatars.com/api/?name=DataSmart&background=f0fdf4&color=22c55e',
      location: 'TP. Hồ Chí Minh',
      salary: 'Thỏa thuận',
      type: 'Remote',
      experience: '1-3 năm',
      postedAt: '5 giờ trước',
      tags: ['Node.js', 'MongoDB', 'AWS'],
      hot: false,
    },
    {
      id: 3,
      title: 'UI/UX Designer',
      company: 'Creative Studio',
      logo: 'https://ui-avatars.com/api/?name=Creative+Studio&background=fdf4ff&color=c026d3',
      location: 'Đà Nẵng',
      salary: '15,000,000 - 25,000,000 VND',
      type: 'Full-time',
      experience: 'Không yêu cầu kinh nghiệm',
      postedAt: '1 ngày trước',
      tags: ['Figma', 'UI Design', 'Prototyping'],
      hot: false,
    },
  ]);

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

          <div className="bg-white p-2 md:p-3 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-4xl mx-auto">
            <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input type="text" placeholder="Tiêu đề công việc, kỹ năng..." className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium placeholder:font-normal" />
            </div>
            
            <div className="hidden md:block w-px h-10 bg-slate-200 self-center"></div>
            
            <div className="flex-1 flex items-center px-4 py-2 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <select className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-medium appearance-none cursor-pointer">
                <option value="">Tất cả địa điểm</option>
                <option value="HN">Hà Nội</option>
                <option value="HCM">TP. Hồ Chí Minh</option>
                <option value="DN">Đà Nẵng</option>
              </select>
            </div>
            
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl md:rounded-full transition-colors w-full md:w-auto mt-2 md:mt-0">
              Tìm việc ngay
            </button>
          </div>
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
              <span className="text-xs font-bold text-blue-600 cursor-pointer hover:underline">Xóa bộ lọc</span>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Hình thức làm việc</h4>
                <div className="space-y-2">
                  {['Full-time', 'Part-time', 'Remote', 'Freelance'].map(type => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-slate-100"></div>

              <div>
                <h4 className="font-bold text-slate-800 mb-3 text-sm">Kinh nghiệm</h4>
                <div className="space-y-2">
                  {['Chưa có kinh nghiệm', 'Dưới 1 năm', '1-3 năm', '3-5 năm', 'Trên 5 năm'].map(exp => (
                    <label key={exp} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
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
            <p className="font-medium text-slate-500">Tìm thấy <span className="font-bold text-slate-900">{jobs.length}</span> công việc phù hợp</p>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
              Sắp xếp theo: <span className="font-bold text-slate-900">Mới nhất</span> <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all group relative">
              {job.hot && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg border-2 border-white">
                  Tuyển gấp
                </div>
              )}
              
              <div className="flex flex-col md:flex-row gap-5">
                <img src={job.logo} alt={job.company} className="w-16 h-16 rounded-2xl border border-slate-100 shrink-0 object-cover" />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      {/*  Bọc Link quanh Tiêu đề để chuyển trang */}
                      <Link to={`/jobs/${job.id}`}>
                        <h2 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">
                          {job.title}
                        </h2>
                      </Link>
                      <p className="text-sm font-bold text-slate-500 mt-1">{job.company}</p>
                    </div>
                    <button className="text-slate-300 hover:text-blue-600 transition-colors hidden md:block">
                      <Bookmark className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm font-medium text-slate-600">
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</div>
                    <div className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-4 h-4" /> {job.salary}</div>
                    <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">{job.type}</span>
                    {job.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                  <div className="flex items-center gap-1 text-xs font-medium text-slate-400">
                    <Clock className="w-3.5 h-3.5" /> {job.postedAt}
                  </div>
                  {/*  Bọc Link cho nút Ứng tuyển để chuyển trang luôn */}
                  <Link to={`/jobs/${job.id}`}>
                    <button className="bg-slate-900 hover:bg-blue-600 text-white text-sm font-bold py-2.5 px-6 rounded-xl transition-colors">
                      Ứng tuyển
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center pt-8">
            <button className="bg-white border border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-50 transition-colors">
              Tải thêm công việc
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Jobs;