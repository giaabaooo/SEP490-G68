import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, FileText, BrainCircuit, Target, CheckCircle2, MapPin, DollarSign, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FileText className="w-7 h-7 text-blue-600" />,
      bg: 'bg-blue-50',
      title: 'Tạo CV bằng AI',
      desc: 'Sở hữu CV chuyên nghiệp, chuẩn ATS chỉ trong vài phút với sự hỗ trợ từ Trí tuệ nhân tạo.'
    },
    {
      icon: <BrainCircuit className="w-7 h-7 text-emerald-600" />,
      bg: 'bg-emerald-50',
      title: 'Phỏng vấn mô phỏng AI',
      desc: 'Trải nghiệm phỏng vấn 1:1 với AI, nhận đánh giá chi tiết và cải thiện kỹ năng trả lời.'
    },
    {
      icon: <Target className="w-7 h-7 text-amber-600" />,
      bg: 'bg-amber-50',
      title: 'Đánh giá năng lực',
      desc: 'Tham gia các bài test chuyên môn để khẳng định trình độ và làm nổi bật hồ sơ của bạn.'
    },
    {
      icon: <Sparkles className="w-7 h-7 text-purple-600" />,
      bg: 'bg-purple-50',
      title: 'Matching thông minh',
      desc: 'Hệ thống tự động phân tích và kết nối bạn với những cơ hội việc làm phù hợp nhất.'
    }
  ];

  const jobs = [
    {
      id: 1,
      logoColor: 'bg-indigo-600',
      logoLetter: 'T',
      title: 'Senior Frontend Engineer (React/Next.js)',
      company: 'TechVibe Solution',
      rating: '4.8',
      location: 'Quận 3, TP. Hồ Chí Minh',
      salary: '25 - 35 Triệu VNĐ',
      tags: ['React', 'Next.js', 'TypeScript'],
      testReq: 'Frontend Core Assessment'
    },
    {
      id: 2,
      logoColor: 'bg-purple-500',
      logoLetter: 'C',
      title: 'AI Product Developer (Python/PyTorch)',
      company: 'Cognitive Labs',
      rating: '4.9',
      location: 'Hà Nội (Hybrid)',
      salary: '30 - 45 Triệu VNĐ',
      tags: ['Python', 'PyTorch', 'LLMs'],
      testReq: 'Python & AI Engineering'
    },
    {
      id: 3,
      logoColor: 'bg-emerald-500',
      logoLetter: 'N',
      title: 'Fullstack Node.js Developer',
      company: 'Nexa Corporation',
      rating: '4.5',
      location: 'Đà Nẵng (Remote)',
      salary: '20 - 28 Triệu VNĐ',
      tags: ['Node.js', 'Express', 'Docker'],
      testReq: 'Node.js Backend Test'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-sans">
      
      {/* HERO SECTION */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Background blobs for soft UI effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-blue-100/60 via-emerald-50/30 to-transparent rounded-full blur-3xl -z-10"></div>
        
        <div className="max-w-4xl mx-auto text-center z-10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4" />
            Nền tảng Tuyển dụng Kỷ nguyên AI
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-[1.2] mb-6 tracking-tight">
            Kết nối việc làm thực chiến, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">
              Phát triển sự nghiệp cùng AI
            </span>
          </h1>
          
          <p className="text-lg text-slate-500 font-medium mb-10 max-w-2xl mx-auto">
            Careerio cung cấp hệ sinh thái toàn diện: Tạo CV chuẩn ATS, đánh giá năng lực bằng bài Test thực tế và luyện tập phỏng vấn tự động với Trí tuệ nhân tạo.
          </p>
          
          {/* SEARCH BOX */}
          <div className="max-w-2xl mx-auto bg-white p-2 rounded-full shadow-lg shadow-blue-900/5 border border-slate-200 flex items-center">
            <div className="pl-5 pr-3 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Tìm kiếm công việc, kỹ năng (ví dụ: React, AI, Python)..." 
              className="flex-1 bg-transparent border-none outline-none text-slate-700 font-medium placeholder:text-slate-400 w-full"
            />
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-full font-bold transition-all shadow-md shadow-blue-200 whitespace-nowrap">
              Tìm việc ngay
            </button>
          </div>
          
          {/* Quick Keywords */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <span className="text-sm font-medium text-slate-400 mr-2">Gợi ý:</span>
            {['Frontend', 'Backend', 'AI Engineer', 'Figma', 'Marketing'].map((kw) => (
              <span key={kw} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full hover:border-blue-400 hover:text-blue-600 cursor-pointer transition-colors">
                {kw}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* TÍNH NĂNG NỔI BẬT */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Trải nghiệm tính năng vượt trội</h2>
          <p className="text-slate-500 font-medium">Hỗ trợ bạn từ khâu chuẩn bị hồ sơ đến khi nhận được thư mời làm việc.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
              <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VIỆC LÀM NỔI BẬT */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">Việc làm đang tuyển</h2>
            <p className="text-slate-500 font-medium">Khám phá các cơ hội nghề nghiệp hàng đầu dành cho bạn.</p>
          </div>
          <button 
            onClick={() => navigate('/jobs')} 
            className="flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all flex flex-col group" key={job.id}>
              
              <div className="flex gap-4 mb-5">
                <div className={`w-14 h-14 rounded-2xl ${job.logoColor} flex items-center justify-center text-white text-xl font-black shrink-0 shadow-sm`}>
                  {job.logoLetter}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                    <span>{job.company}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span className="text-amber-500 font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/> {job.rating}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 mb-5">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" /> {job.location}
                </div>
                <div className="flex items-center gap-2 text-sm font-black text-emerald-600">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> {job.salary}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                {job.tags.map((tag, idx) => (
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold" key={idx}>{tag}</span>
                ))}
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-start gap-2 mb-6 mt-auto">
                <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <p className="text-xs font-semibold text-slate-700">Yêu cầu Test: <span className="text-blue-700 font-bold">{job.testReq}</span></p>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-sm transition-colors">
                  Ứng tuyển
                </button>
                <button className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2.5 rounded-xl font-bold text-sm transition-colors">
                  Làm Test
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;