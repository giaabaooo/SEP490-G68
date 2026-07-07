import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, DollarSign, Briefcase, Clock, Building, 
  Globe, Users, Calendar, Share2, Bookmark, ArrowLeft, CheckCircle2 
} from 'lucide-react';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock data mô phỏng lấy từ API dựa theo ID
  const job = {
    id: id,
    title: 'Senior React Native Developer',
    company: 'TechCorp Vietnam',
    logo: 'https://ui-avatars.com/api/?name=TechCorp&background=eff6ff&color=3b82f6',
    location: 'Tầng 12, Tòa nhà Tech, Cầu Giấy, Hà Nội',
    salary: '25,000,000 - 40,000,000 VND',
    type: 'Full-time',
    experience: '3-5 năm',
    postedAt: '2 giờ trước',
    deadline: '30/08/2026',
    tags: ['React Native', 'JavaScript', 'Mobile', 'Redux'],
    companySize: '100 - 500 nhân viên',
    website: 'https://techcorp.vn',
    description: `Chúng tôi đang tìm kiếm một Senior React Native Developer đầy nhiệt huyết để tham gia vào đội ngũ phát triển sản phẩm cốt lõi. Bạn sẽ đóng vai trò quan trọng trong việc xây dựng và tối ưu hóa các ứng dụng di động có hàng triệu người dùng.`,
    requirements: [
      'Ít nhất 3 năm kinh nghiệm làm việc thực tế với React Native.',
      'Nắm vững JavaScript/TypeScript, ES6+.',
      'Kinh nghiệm làm việc với Redux, Context API hoặc Zustand.',
      'Hiểu biết sâu sắc về vòng đời của ứng dụng iOS và Android.',
      'Có khả năng tối ưu hóa hiệu suất ứng dụng (performance tuning).',
      'Kỹ năng làm việc nhóm tốt, tư duy giải quyết vấn đề độc lập.'
    ],
    benefits: [
      'Mức lương cạnh tranh, review lương 2 lần/năm.',
      'Thưởng tháng 13, thưởng dự án, thưởng hiệu quả công việc.',
      'Bảo hiểm y tế tư nhân cao cấp (Bảo Việt/PTI).',
      'Môi trường làm việc trẻ trung, năng động, Agile/Scrum.',
      'Cung cấp MacBook Pro M3 và màn hình rời.',
      'Trợ cấp ăn trưa, gửi xe, team building hàng tháng.'
    ]
  };

  // Giả lập hiệu ứng tải trang
  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex justify-center items-center text-blue-600 font-bold">Đang tải thông tin...</div>;
  }

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
            <img src={job.logo} alt={job.company} className="w-24 h-24 rounded-2xl bg-white p-2 shrink-0 object-cover" />
            
            <div className="flex-1 text-white">
              <h1 className="text-2xl md:text-4xl font-black mb-2">{job.title}</h1>
              <p className="text-lg text-blue-300 font-bold mb-4">{job.company}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-300">
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</div>
                <div className="flex items-center gap-1.5 text-emerald-400"><DollarSign className="w-4 h-4" /> {job.salary}</div>
                <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {job.experience}</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
              <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-blue-600/30">
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

      {/* 🌟 Main Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-6 relative z-20 flex flex-col lg:flex-row gap-8">
        
        {/* Cột trái: Chi tiết công việc */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-200">
            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8 pb-8 border-b border-slate-100">
              <span className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl">{job.type}</span>
              {job.tags.map(tag => (
                <span key={tag} className="px-4 py-2 bg-blue-50 text-blue-600 text-sm font-bold rounded-xl">{tag}</span>
              ))}
            </div>

            {/* Mô tả */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 mb-4">Mô tả công việc</h2>
              <p className="text-slate-600 leading-relaxed">{job.description}</p>
            </div>

            {/* Yêu cầu */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-900 mb-4">Yêu cầu ứng viên</h2>
              <ul className="space-y-3">
                {job.requirements.map((req, idx) => (
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
                {job.benefits.map((benefit, idx) => (
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
                  <p className="font-bold text-slate-800">{job.postedAt}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Hạn ứng tuyển</p>
                  <p className="font-bold text-slate-800">{job.deadline}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 mb-3">
                Ứng tuyển ngay
              </button>
              <p className="text-center text-xs text-slate-500 font-medium">Bạn có thể sử dụng AI để tối ưu CV cho công việc này.</p>
            </div>
          </div>

          {/* Box Công ty */}
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-200">
            <div className="flex items-center gap-4 mb-6">
              <img src={job.logo} alt={job.company} className="w-14 h-14 rounded-xl border border-slate-100" />
              <div>
                <h3 className="font-black text-slate-900">{job.company}</h3>
                <Link to="#" className="text-sm font-bold text-blue-600 hover:underline">Xem trang công ty</Link>
              </div>
            </div>
            
            <div className="space-y-4 text-sm font-medium text-slate-600">
              <div className="flex items-start gap-3">
                <Building className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Trụ sở: {job.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Quy mô: {job.companySize}</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                <a href={job.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{job.website}</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default JobDetail;