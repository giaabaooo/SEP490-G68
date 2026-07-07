import React, { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 

const Create = () => {
  const navigate = useNavigate();
  
  //  Các trường dữ liệu mới khớp với JobDetail
  const [formData, setFormData] = useState({
    title: '', 
    location: 'Hà Nội',
    type: 'Full-time',
    experience: 'Không yêu cầu kinh nghiệm',
    salary: '', 
    deadline: '', 
    tags: '',
    description: '', 
    requirements: '',
    benefits: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập trước');
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          location: formData.location,
          type: formData.type,
          experience: formData.experience,
          salary: formData.salary,
          deadline: formData.deadline,
          // Chuyển tags từ chuỗi (cách nhau dấu phẩy) thành mảng để lưu vào DB
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
          description: formData.description,
          requirements: formData.requirements,
          benefits: formData.benefits
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tạo công việc thất bại');

      toast.success('Đăng tin tuyển dụng thành công!');
      setTimeout(() => navigate('/bussiness/post-job'), 1000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => navigate('/bussiness/dashboard')}
          className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 transition-colors group bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Quay lại Dashboard
        </button>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Tạo tin tuyển dụng mới</h1>
            <p className="text-sm md:text-base font-medium text-slate-500 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
              Điền đầy đủ thông tin để hệ thống AI đánh giá độ tương thích của CV ứng viên chính xác nhất.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* TIÊU ĐỀ */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Tiêu đề công việc <span className="text-red-500">*</span></label>
              <input 
                type="text" name="title" value={formData.title} onChange={handleChange} required
                placeholder="VD: Senior React Native Developer"
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-slate-400"
              />
            </div>

            {/* THÔNG TIN CHUNG (GRID 2 CỘT) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* CỘT 1 */}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Địa điểm làm việc <span className="text-red-500">*</span></label>
                  <select 
                    name="location" value={formData.location} onChange={handleChange} required
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="Hà Nội">Hà Nội</option>
                    <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                    <option value="Đà Nẵng">Đà Nẵng</option>
                    <option value="Cần Thơ">Cần Thơ</option>
                    <option value="Khác">Khác...</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Hình thức làm việc <span className="text-red-500">*</span></label>
                  <select 
                    name="type" value={formData.type} onChange={handleChange} required
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="Full-time">Full-time (Toàn thời gian)</option>
                    <option value="Part-time">Part-time (Bán thời gian)</option>
                    <option value="Remote">Remote (Làm việc từ xa)</option>
                    <option value="Freelance">Freelance (Cộng tác viên)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Mức lương (VND)</label>
                  <input 
                    type="text" name="salary" value={formData.salary} onChange={handleChange}
                    placeholder="VD: 25,000,000 - 40,000,000 VND hoặc Thỏa thuận"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* CỘT 2 */}
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Kinh nghiệm yêu cầu <span className="text-red-500">*</span></label>
                  <select 
                    name="experience" value={formData.experience} onChange={handleChange} required
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium appearance-none cursor-pointer"
                  >
                    <option value="Không yêu cầu kinh nghiệm">Không yêu cầu kinh nghiệm</option>
                    <option value="Dưới 1 năm">Dưới 1 năm</option>
                    <option value="1-3 năm">1-3 năm</option>
                    <option value="3-5 năm">3-5 năm</option>
                    <option value="Trên 5 năm">Trên 5 năm</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Từ khóa kỹ năng (Tags)</label>
                  <input 
                    type="text" name="tags" value={formData.tags} onChange={handleChange}
                    placeholder="VD: React Native, JavaScript, Redux (Cách nhau bằng dấu phẩy)"
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium placeholder:font-normal placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2.5">Hạn chót ứng tuyển <span className="text-red-500">*</span></label>
                  <input 
                    type="date" name="deadline" value={formData.deadline} onChange={handleChange} required
                    className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700"
                  />
                </div>
              </div>

            </div>

            {/* MÔ TẢ CHI TIẾT */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Mô tả công việc <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="description" value={formData.description} onChange={handleChange} required
                placeholder="Mô tả chi tiết về công việc, trách nhiệm, nhiệm vụ hằng ngày..."
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Yêu cầu ứng viên <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="requirements" value={formData.requirements} onChange={handleChange} required
                placeholder="Kỹ năng chuyên môn, kinh nghiệm, bằng cấp, kỹ năng mềm..."
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Quyền lợi dành cho bạn <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="benefits" value={formData.benefits} onChange={handleChange} required
                placeholder="Chế độ bảo hiểm, thưởng lễ tết, tháng 13, cấp thiết bị làm việc..."
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium resize-none placeholder:font-normal placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="button" onClick={() => navigate('/bussiness/post-job')} className="px-8 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors mr-4">
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

export default Create;