import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

const PostJob = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '', salary: '', deadline: '', description: '', requirements: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Đăng tin tuyển dụng thành công!');
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 transition-colors group bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Quay lại Dashboard
        </button>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Tạo tin tuyển dụng mới</h1>
            <p className="text-sm md:text-base font-medium text-slate-500 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              Hệ thống AI sẽ dùng dữ liệu này để tự động chấm điểm CV ứng viên.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Tiêu đề công việc <span className="text-red-500">*</span></label>
              <input 
                type="text" name="title" value={formData.title} onChange={handleChange} required
                placeholder="VD: Senior React Developer"
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Mức lương (VND)</label>
                <input 
                  type="text" name="salary" value={formData.salary} onChange={handleChange}
                  placeholder="VD: 20,000,000 - 30,000,000"
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Hạn chót <span className="text-red-500">*</span></label>
                <input 
                  type="date" name="deadline" value={formData.deadline} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Mô tả công việc <span className="text-red-500">*</span></label>
              <textarea 
                rows="5" name="description" value={formData.description} onChange={handleChange} required
                placeholder="Mô tả chi tiết về công việc..."
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Yêu cầu ứng viên <span className="text-red-500">*</span></label>
              <textarea 
                rows="5" name="requirements" value={formData.requirements} onChange={handleChange} required
                placeholder="Kỹ năng, kinh nghiệm, bằng cấp yêu cầu..."
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="button" onClick={() => navigate('/dashboard')} className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors mr-4">
                Hủy
              </button>
              <button type="submit" className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5">
                Đăng tin ngay
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;