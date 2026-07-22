import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FileText, CircleDollarSign, Briefcase, MapPin, 
  Calendar, ClipboardCheck, AlignLeft, ArrowLeft, Loader2
} from 'lucide-react';

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
        const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
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
          moderatorEmail: data.moderatorEmail || ''
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

  return (
    <div className="bg-slate-50 min-h-screen p-8 animate-fade-in">
      <div className="max-w-[1050px] mx-auto">
        
        <button 
          onClick={() => navigate('/moderator/requests')}
          className="flex items-center text-slate-500 hover:text-emerald-600 font-bold text-sm mb-6 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại Yêu cầu Test
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
          
          {/* CỘT TRÁI */}
          <div className="space-y-6">
            <div className="bg-white p-7 rounded-[20px] shadow-sm border border-slate-200">
              <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
                <FileText className="w-5 h-5 text-emerald-600" /> Thông tin cơ bản (Chỉ xem)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Tiêu đề công việc</label>
                  <input disabled value={formData.title} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Mức lương</label>
                    <div className="relative">
                      <CircleDollarSign className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input disabled value={formData.salary} className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-emerald-700" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Loại hình</label>
                    <input disabled value={formData.type} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Địa điểm</label>
                    <input disabled value={formData.location} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Kinh nghiệm</label>
                    <input disabled value={formData.experience} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Từ khóa (Tags)</label>
                  <input disabled value={formData.tags} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Hạn chót ứng tuyển</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input disabled value={formData.deadline} className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-7 rounded-[20px] border border-emerald-100">
              <h3 className="text-[15px] font-black text-emerald-800 uppercase tracking-wide flex items-center gap-2 mb-2">
                <ClipboardCheck className="w-5 h-5" /> Trạng thái Yêu cầu
              </h3>
              <p className="text-sm font-medium text-emerald-700 mb-4">HR đang chờ bạn tạo bài Test cho Job này.</p>
              <button 
                onClick={() => navigate(`/moderator/create-test/${jobId}`)}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex justify-center items-center gap-2"
              >
                Tiến hành tạo Bài Test
              </button>
            </div>
          </div>

          {/* CỘT PHẢI */}
          <div className="bg-white p-7 rounded-[20px] shadow-sm border border-slate-200 h-full">
            <h3 className="text-[15px] font-black text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-5 pb-4 border-b border-slate-100">
              <AlignLeft className="w-5 h-5 text-emerald-600" /> Nội dung chi tiết (Chỉ xem)
            </h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Mô tả công việc (JD)</label>
                <textarea disabled rows="6" value={formData.description} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] leading-relaxed font-medium text-slate-700 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Yêu cầu chuyên môn</label>
                <textarea disabled rows="6" value={formData.requirements} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] leading-relaxed font-medium text-slate-700 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Quyền lợi</label>
                <textarea disabled rows="5" value={formData.benefits} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[14px] leading-relaxed font-medium text-slate-700 resize-none" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModeratorJobDetail;