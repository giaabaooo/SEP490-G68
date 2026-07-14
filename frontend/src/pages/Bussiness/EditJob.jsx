import React, { useState, useEffect } from 'react';
import { ArrowLeft, Edit3, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify'; 

const EditJob = () => {
  const { id } = useParams(); // Lấy ID của công việc từ URL
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    title: '', 
    location: '',
    type: '',
    experience: '',
    salary: '', 
    deadline: '', 
    tags: '',
    description: '', 
    requirements: '',
    benefits: '',
    status: 'active' // Thêm trạng thái
  });

  // Gọi API lấy thông tin công việc hiện tại
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Không thể tải thông tin tin tuyển dụng');
        
        const data = await res.json();
        
        // Chuyển đổi dữ liệu Array từ Backend thành String để hiển thị lên Form
        setFormData({
          title: data.title || '',
          location: data.location || '',
          type: data.type || '',
          experience: data.experience || '',
          salary: data.salary || '',
          deadline: data.deadline ? data.deadline.substring(0, 10) : '', // Cắt lấy YYYY-MM-DD
          tags: data.tags ? data.tags.join(', ') : '',
          description: data.description || '',
          requirements: data.requirements ? data.requirements.join('\n') : '',
          benefits: data.benefits ? data.benefits.join('\n') : '',
          status: data.status === 'Active' ? 'active' : data.status === 'Draft' ? 'draft' : 'closed'
        });
      } catch (error) {
        toast.error(error.message);
        navigate('/bussiness/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      const res = await fetch(`http://localhost:5000/api/jobs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật thất bại');

      toast.success('Cập nhật tin tuyển dụng thành công!');
      setTimeout(() => navigate('/bussiness/dashboard'), 1000);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-slate-500 font-bold">Đang tải thông tin...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 pt-8">
      <div className="max-w-4xl mx-auto px-4">
        
        <button 
          onClick={() => navigate('/bussiness/dashboard')}
          className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 transition-colors group bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Hủy chỉnh sửa
        </button>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-8 border-b border-slate-100 pb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">Chỉnh sửa tin tuyển dụng</h1>
              <p className="text-sm font-medium text-slate-500">Cập nhật nội dung chi tiết cho tin tuyển dụng này.</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl">
              <Edit3 className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Tiêu đề công việc <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="title" value={formData.title} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              {/* Thêm trường Trạng thái */}
              <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Trạng thái tin tuyển dụng</label>
                <select 
                  name="status" value={formData.status} onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-bold cursor-pointer"
                  style={{
                    color: formData.status === 'active' ? '#059669' : formData.status === 'closed' ? '#dc2626' : '#64748b'
                  }}
                >
                  <option value="active">🟢 Đang mở tuyển (Active)</option>
                  <option value="draft">⚪ Bản nháp (Draft)</option>
                  <option value="closed">🔴 Đã đóng (Closed)</option>
                </select>
                <p className="text-xs text-slate-500 mt-2 font-medium">Chuyển sang "Đã đóng" nếu bạn đã tuyển đủ người.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Địa điểm làm việc <span className="text-red-500">*</span></label>
                <input 
                  type="text" name="location" value={formData.location} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Hình thức làm việc <span className="text-red-500">*</span></label>
                <select 
                  name="type" value={formData.type} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Kinh nghiệm yêu cầu <span className="text-red-500">*</span></label>
                <select 
                  name="experience" value={formData.experience} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                >
                  <option value="Không yêu cầu kinh nghiệm">Không yêu cầu kinh nghiệm</option>
                  <option value="Dưới 1 năm">Dưới 1 năm</option>
                  <option value="1-3 năm">1-3 năm</option>
                  <option value="3-5 năm">3-5 năm</option>
                  <option value="Trên 5 năm">Trên 5 năm</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Mức lương (VND)</label>
                <input 
                  type="text" name="salary" value={formData.salary} onChange={handleChange}
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Từ khóa kỹ năng (Tags)</label>
                <input 
                  type="text" name="tags" value={formData.tags} onChange={handleChange}
                  placeholder="Cách nhau bằng dấu phẩy"
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2.5">Hạn chót ứng tuyển <span className="text-red-500">*</span></label>
                <input 
                  type="date" name="deadline" value={formData.deadline} onChange={handleChange} required
                  className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Mô tả công việc <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="description" value={formData.description} onChange={handleChange} required
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Yêu cầu ứng viên <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="requirements" value={formData.requirements} onChange={handleChange} required
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-2.5">Quyền lợi dành cho bạn <span className="text-red-500">*</span></label>
              <textarea 
                rows="4" name="benefits" value={formData.benefits} onChange={handleChange} required
                className="w-full px-5 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 outline-none text-sm font-medium resize-none"
              ></textarea>
            </div>

            <div className="flex justify-end pt-6 border-t border-slate-100">
              <button type="submit" className="px-10 py-4 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                <Edit3 className="w-5 h-5" /> Lưu cập nhật
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditJob;