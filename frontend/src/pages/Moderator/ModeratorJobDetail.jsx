import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FileText, CircleDollarSign, Briefcase, MapPin, 
  Calendar, ClipboardCheck, AlignLeft, ArrowLeft, Loader2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ModeratorJobDetail = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '', salary: '', location: '', type: '', experience: '',
    deadline: '', tags: '', description: '', requirements: '', benefits: '',
    status: '', requireTest: false, moderatorEmail: ''
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/jobs/${jobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Không thể tải thông tin Job');
        
        const data = await res.json();
        setFormData({
          title: data.title || '',
          location: data.location || '',
          type: data.type || '',
          experience: data.experience || '',
          salary: data.salary || 'Thỏa thuận',
          deadline: data.deadline ? data.deadline.substring(0, 10) : '',
          tags: data.tags ? data.tags.join(', ') : '',
          description: data.description || '',
          requirements: data.requirements ? data.requirements.join('\n') : '',
          benefits: data.benefits ? data.benefits.join('\n') : '',
          status: data.status,
          requireTest: data.requireTest || false,
          moderatorEmail: data.moderatorEmail || '',
          testStatus: data.testStatus || null,
          assessmentId: data.assessmentId || null
        });
      } catch (error) {
        toast.error(error.message);
        navigate('/moderator/requests');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  if (loading) return <div className="flex justify-center items-center h-[60vh]"><Loader2 className="w-10 h-10 text-emerald-500 animate-spin" /></div>;

  const isExpired = formData.deadline ? new Date(formData.deadline) < new Date(new Date().setHours(0,0,0,0)) : false;

  return (
    <div className="bg-slate-50 min-h-screen p-8 animate-fade-in">
      <div className="max-w-[1050px] mx-auto">
        
        <button 
          onClick={() => navigate('/moderator/requests')}
          className="flex items-center text-slate-900 hover:text-emerald-700 font-black text-sm mb-6 bg-white px-4 py-2.5 rounded-xl shadow-sm border border-slate-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Yêu cầu Test
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
          
          {/* CỘT TRÁI */}
          <div className="space-y-6">
            <div className="bg-white p-7 rounded-[20px] shadow-sm border border-slate-300">
              <h3 className="text-base font-black text-slate-950 uppercase tracking-wide flex items-center gap-2 mb-5 pb-4 border-b border-slate-200">
                <FileText className="w-5 h-5 text-emerald-700" /> Thông tin cơ bản (Chỉ xem)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1.5">Tiêu đề công việc</label>
                  <input disabled value={formData.title} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-slate-950" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">Mức lương</label>
                    <div className="relative">
                      <CircleDollarSign className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
                      <input disabled value={formData.salary} className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-emerald-800" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">Loại hình</label>
                    <input disabled value={formData.type} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-slate-950" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">Địa điểm</label>
                    <input disabled value={formData.location} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-slate-950" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-900 mb-1.5">Kinh nghiệm</label>
                    <input disabled value={formData.experience} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-slate-950" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1.5">Từ khóa (Tags)</label>
                  <input disabled value={formData.tags} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-blue-800" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1.5">Hạn chót ứng tuyển</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
                    <input disabled value={formData.deadline} className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-sm font-black text-slate-950" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-7 rounded-[20px] border border-emerald-300 shadow-sm">
              <h3 className="text-base font-black text-emerald-950 uppercase tracking-wide flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-5 h-5 text-emerald-700" /> Trạng thái Bài Test
              </h3>
              {formData.testStatus === 'approved' ? (
                <>
                  <p className="text-sm font-bold text-emerald-900 mb-4">
                    Bài Test chuyên môn đã được xây dựng và phê duyệt sẵn sàng cho vị trí này.
                  </p>
                  <button 
                    onClick={() => {
                      if (formData.assessmentId) {
                        navigate(`/moderator/edit-test/${formData.assessmentId}`);
                      } else {
                        navigate('/moderator/test-bank');
                      }
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Chỉnh sửa Bài Test
                  </button>
                </>
              ) : isExpired ? (
                <>
                  <p className="text-sm font-bold text-rose-800 mb-4">
                    Vị trí này đã hết hạn nhận hồ sơ tuyển dụng. Bạn không thể tạo mới bài Test cho vị trí đã đóng.
                  </p>
                  <button 
                    disabled
                    className="w-full py-3.5 bg-slate-200 text-slate-600 font-black rounded-xl border border-slate-300 cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    Công việc đã hết hạn
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm font-bold text-emerald-900 mb-4">HR đang chờ bạn tạo bài Test cho Job này.</p>
                  <button 
                    onClick={() => navigate(`/moderator/create-test/${jobId}`)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-md transition-all flex justify-center items-center gap-2 cursor-pointer"
                  >
                    Tiến hành tạo Bài Test
                  </button>
                </>
              )}
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="bg-white p-7 rounded-[20px] shadow-sm border border-slate-300 h-full">
            <h3 className="text-base font-black text-slate-950 uppercase tracking-wide flex items-center gap-2 mb-5 pb-4 border-b border-slate-200">
              <AlignLeft className="w-5 h-5 text-emerald-700" /> Nội dung chi tiết (Chỉ xem)
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1.5">Mô tả công việc (JD)</label>
                <textarea disabled rows="6" value={formData.description} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-[14px] leading-relaxed font-bold text-slate-950 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1.5">Yêu cầu chuyên môn</label>
                <textarea disabled rows="6" value={formData.requirements} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-[14px] leading-relaxed font-bold text-slate-950 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1.5">Quyền lợi</label>
                <textarea disabled rows="5" value={formData.benefits} className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 text-[14px] leading-relaxed font-bold text-slate-950 resize-none" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModeratorJobDetail;