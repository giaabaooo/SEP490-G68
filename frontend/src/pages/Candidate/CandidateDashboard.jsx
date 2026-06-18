import React from 'react';
import { Briefcase, Award, User, Clock, Sparkles, Check, Play, ArrowRight } from 'lucide-react';

const CandidateDashboard = () => {
  // --- MOCK DATA ---
  const user = { fullName: "Vũ Văn Quang" };

  const stats = [
    { label: "Hồ sơ đã nộp", value: "3 công việc", icon: Briefcase, iconColor: "text-indigo-500", bgColor: "bg-indigo-50" },
    { label: "Bài test năng lực", value: "4 bài test", icon: Award, iconColor: "text-emerald-500", bgColor: "bg-emerald-50" },
    { label: "Phỏng vấn thử AI", value: "Chưa tham gia", icon: User, iconColor: "text-purple-500", bgColor: "bg-purple-50" },
    { label: "Lộ trình học tập", value: "1 tích cực", icon: Clock, iconColor: "text-orange-500", bgColor: "bg-orange-50" },
  ];

  const roadmapSteps = [
    { title: "Cơ bản về Java Spring Boot", status: "completed", description: "Đã hoàn thành • Đánh giá tốt", stepNumber: 1 },
    { title: "C# & ASP.NET Microservices", status: "current", description: "Đang học • Gợi ý: Khóa học FPT Software", stepNumber: 2 },
    { title: "System Design cho Learnify & Sport Store", status: "locked", description: "Chưa mở khóa", stepNumber: 3 },
  ];

  const testHistory = [
    { name: "Java Spring Boot Core Skills", score: "85/100", status: "Đạt" },
    { name: "C# & ASP.NET Engineering", score: "45/100", status: "Cần cải thiện" },
  ];
  // ----------------------------------------------------

  const RoadmapStepIcon = ({ status, stepNumber }) => {
    if (status === 'completed') {
      return (
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 z-10 relative">
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </div>
      );
    }
    if (status === 'current') {
      return (
        <div className="w-7 h-7 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0 z-10 relative">
          <Play className="w-3.5 h-3.5 text-orange-500 ml-0.5" fill="currentColor" />
        </div>
      );
    }
    return (
      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center shrink-0 z-10 relative">
        {stepNumber}
      </div>
    );
  };

  const TestStatusBadge = ({ status }) => {
    const isPassed = status === "Đạt";
    return (
      <span className={`text-xs font-medium ${isPassed ? 'text-emerald-600' : 'text-rose-500'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-[#f8f9fb] min-h-screen p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Bảng điều khiển Ứng viên</h1>
          <p className="text-[15px] text-slate-500 mt-1">
            Chào mừng bạn quay lại, <span className="font-semibold text-slate-800">{user.fullName}</span>. Xem tổng quan lộ trình sự nghiệp và các hoạt động đánh giá của bạn.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm shadow-slate-100/50">
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{stat.label}</p>
                  <p className="text-lg font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid (Tỷ lệ 5-7 để giống ảnh 40/60) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Cột trái: Lộ trình học tập */}
          <div className="xl:col-span-5 bg-white p-6 rounded-[20px] border border-blue-100 shadow-sm shadow-blue-50 flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-1">Lộ trình học tập cá nhân hóa</h2>
                <p className="text-sm text-slate-500 pr-4 leading-relaxed">Tự động xây dựng từ khoảng trống kỹ năng sau bài test Python & AI.</p>
              </div>
              <div className="flex items-center gap-1.5 bg-[#2563eb] text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shrink-0 mt-1">
                <Sparkles className="w-3.5 h-3.5" />
                Generated
              </div>
            </div>

            <div className="mt-8 space-y-0 relative flex-grow">
              {/* Đường kẻ dọc nối các step */}
              <div className="absolute left-[13px] top-4 bottom-8 w-[2px] bg-slate-100 z-0"></div>
              
              {roadmapSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-4 pb-8 relative z-10">
                  <RoadmapStepIcon status={step.status} stepNumber={step.stepNumber} />
                  <div className="pt-0.5">
                    <p className={`text-[15px] font-bold ${step.status === 'locked' ? 'text-slate-500' : 'text-slate-900'}`}>
                      {step.title}
                    </p>
                    <p className="text-[13px] text-slate-500 mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full py-3.5 mt-2 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-800 text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
              Xem chi tiết lộ trình học & thi lại <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Cột phải: Bao gồm Phỏng vấn & Lịch sử test */}
          <div className="xl:col-span-7 space-y-6 flex flex-col">
            
            {/* Luyện phỏng vấn thử với AI */}
            <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm shadow-slate-100/50">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Luyện phỏng vấn thử với AI</h2>
              <p className="text-[14px] text-slate-500 mb-6">Trải nghiệm giao diện phỏng vấn video giả lập chuyên nghiệp bám sát CV & JD tuyển dụng.</p>
              
              <div className="border border-dashed border-slate-200 rounded-xl py-10 px-4 flex flex-col items-center justify-center text-center">
                <p className="text-[14px] text-slate-500 mb-5">Bạn chưa tham gia buổi phỏng vấn giả lập nào.</p>
                <button className="px-5 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-800 text-[13px] font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm">
                  Bắt đầu Mock Interview mới <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lịch sử bài thi năng lực */}
            <div className="bg-white p-6 rounded-[20px] border border-slate-100 shadow-sm shadow-slate-100/50 flex-grow">
              <h2 className="text-lg font-bold text-slate-900 mb-6">Lịch sử bài thi năng lực</h2>
              
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="pb-4 font-medium text-[13px] text-slate-400 border-b border-slate-100 w-1/2">Bài kiểm tra</th>
                      <th className="pb-4 font-medium text-[13px] text-slate-400 border-b border-slate-100">Điểm số</th>
                      <th className="pb-4 font-medium text-[13px] text-slate-400 border-b border-slate-100">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px]">
                    {testHistory.map((test, index) => (
                      <tr key={index} className="group">
                        <td className={`py-4 font-bold text-slate-800 ${index !== testHistory.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          {test.name}
                        </td>
                        <td className={`py-4 text-slate-600 font-medium ${index !== testHistory.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          {test.score}
                        </td>
                        <td className={`py-4 ${index !== testHistory.length - 1 ? 'border-b border-slate-50' : ''}`}>
                          <TestStatusBadge status={test.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;