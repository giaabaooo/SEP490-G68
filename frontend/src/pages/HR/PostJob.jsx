import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
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
    // Hiện thông báo bằng toastify
    toast.success('Đăng tin tuyển dụng thành công!');
    
    // Đợi 1.5 giây rồi về dashboard
    setTimeout(() => {
      navigate('/hr/dashboard');
    }, 1500);
  };

  return (
    <div className="bg-slate-50 font-sans text-slate-800 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        
        <button 
          onClick={() => navigate('/hr/dashboard')}
          className="flex items-center text-slate-500 hover:text-slate-900 font-medium text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Dashboard
        </button>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Tạo tin tuyển dụng mới</h1>
          <p className="text-sm text-slate-500 mb-8">Hệ thống AI sẽ dùng dữ liệu này để chấm điểm CV ứng viên.</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề công việc *</label>
              <input 
                type="text" name="title" value={formData.title} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mức lương (VND)</label>
                <input 
                  type="text" name="salary" value={formData.salary} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Hạn chót *</label>
                <input 
                  type="date" name="deadline" value={formData.deadline} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả công việc *</label>
              <textarea 
                rows="4" name="description" value={formData.description} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Yêu cầu ứng viên *</label>
              <textarea 
                rows="4" name="requirements" value={formData.requirements} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none text-sm"
              ></textarea>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button type="submit" className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm">
                Xuất bản
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostJob;