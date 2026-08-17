import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FileText, CircleDollarSign, Briefcase, MapPin, 
  Calendar, ClipboardCheck, AlignLeft, Send, Save, ArrowLeft,
  CheckCircle2, AlertCircle, X, Sparkles, Plus, Trash2, Users, Loader2, Info
} from 'lucide-react';

const TokenTopupModal = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600"><Sparkles className="w-8 h-8" /></div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Không đủ Token</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    Số dư Token AI của bạn không đủ để yêu cầu tạo Bài Test. Vui lòng nạp thêm để tiếp tục!
                </p>
                <button type="button" onClick={() => navigate('/upgrade')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                    Nạp Token Ngay
                </button>
            </div>
        </div>
    )
};

const EditJob = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [loading, setLoading] = useState(id ? true : false); 
  const [submitting, setSubmitting] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);

  // FIX: Thêm trường requirements vào formData
  const [formData, setFormData] = useState({
    title: '', salary: '', location: 'Hà Nội', type: 'Full-time', experience: 'Không yêu cầu kinh nghiệm',
    deadline: '', tags: '', description: '', requirements: '', benefits: '', requireTest: false, moderatorEmail: '',
    vacancies: 1, useAiReview: true, status: 'active'
  });

  const [categories, setCategories] = useState([{ name: '', weight: 100, isKey: false }]);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:5000/api/jobs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Không thể tải thông tin tin tuyển dụng');
        const data = await res.json();
        
        setFormData({
          title: data.title || '', location: data.location || '', type: data.type || '',
          experience: data.experience || '', salary: data.salary || '',
          deadline: data.deadline ? data.deadline.substring(0, 10) : data.recruitmentDeadline ? data.recruitmentDeadline.substring(0, 10) : '',
          tags: data.tags ? data.tags.join(', ') : '', 
          description: data.description || '',
          // FIX: Map dữ liệu requirements (Mảng -> Chuỗi nối bằng \n)
          requirements: data.requirements ? data.requirements.join('\n') : '',
          benefits: data.benefits ? data.benefits.join('\n') : '',
          status: data.status ? data.status.toLowerCase() : 'active',
          requireTest: data.requireTest || false, moderatorEmail: data.moderatorEmail || '',
          vacancies: data.vacancies || 1, useAiReview: data.useAiReview !== false, 
        });

        if (data.requirementCategories && data.requirementCategories.length > 0) {
            setCategories(data.requirementCategories);
        } else {
            setCategories([{ name: 'Đánh giá chung', weight: 100, isKey: true }]);
        }
      } catch (error) { toast.error(error.message); navigate('/bussiness/post-job'); } finally { setLoading(false); }
    };
    fetchJob();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCategoryChange = (index, field, value) => {
    const newCats = [...categories];
    newCats[index][field] = value;
    setCategories(newCats);
  };

  const addCategory = () => setCategories([...categories, { name: '', weight: 0, isKey: false }]);
  const removeCategory = (index) => {
    const newCats = categories.filter((_, i) => i !== index);
    if(newCats.length === 0) newCats.push({ name: '', weight: 100, isKey: false });
    setCategories(newCats);
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline || !formData.description || !formData.requirements) return toast.error('Vui lòng điền các trường bắt buộc (*)');
    
    const totalWeight = categories.reduce((sum, cat) => sum + Number(cat.weight), 0);
    if (totalWeight !== 100) return toast.error(`Tổng trọng số các tiêu chí phải bằng 100%. Hiện tại đang là ${totalWeight}%`);
    if (categories.some(c => !c.name.trim())) return toast.error('Tên tiêu chí không được để trống.');
    if (formData.requireTest && !formData.moderatorEmail) return toast.error('Vui lòng nhập Email người kiểm duyệt Bài Test!');

    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      // FIX: Xóa việc override formData.requirements bằng chuỗi sinh ra từ Bands. Giữ nguyên formData.requirements người dùng nhập.
      const payload = { 
          ...formData, 
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
          requirementCategories: categories,
          ...(isDraft !== undefined && !id ? { status: isDraft ? 'draft' : 'active' } : {}) 
      };

      const endpoint = id ? `http://localhost:5000/api/jobs/${id}` : `http://localhost:5000/api/jobs`;
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
          if (res.status === 402 || res.status === 403) return setShowTokenModal(true);
          throw new Error(data.message || 'Thao tác thất bại');
      }

      toast.success(id ? 'Cập nhật tin tuyển dụng thành công!' : 'Đăng tin tuyển dụng thành công!');
      setTimeout(() => navigate('/bussiness/post-job'), 1500);
    } catch (error) { toast.error(error.message); } finally { setSubmitting(false); }
  };

  const totalWeight = categories.reduce((sum, cat) => sum + Number(cat.weight), 0);

  if (loading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" /><p className="text-slate-500 font-bold">Đang tải thông tin...</p></div>;

  return (
    <div className="create-job-page animate-fade-in pb-12">
      <TokenTopupModal isOpen={showTokenModal} onClose={() => setShowTokenModal(false)} />
      <div className="job-form-container max-w-[1050px] mx-auto p-4">
        
        <button onClick={() => navigate('/bussiness/post-job')} className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Quay lại Danh sách
        </button>

        <form onSubmit={(e) => handleSubmit(e)}>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-6">
            
            {/* CỘT TRÁI */}
            <div className="space-y-6">
              <div className="bg-white rounded-[20px] p-7 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Thông tin cơ bản</h3>
                </div>
                
                <div className="mb-4">
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Tiêu đề công việc <span className="text-red-500">*</span></label>
                  <input required name="title" value={formData.title} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500" placeholder="VD: Senior ReactJS Developer" />
                </div>

                <div className="mb-4">
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Trạng thái tin tuyển dụng</label>
                  <select 
                    name="status" value={formData.status} onChange={handleChange} 
                    className={`w-full p-3 font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 ${formData.status === 'active' ? 'text-emerald-700 bg-emerald-50' : formData.status === 'closed' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-50'}`}
                  >
                    <option value="active">🟢 Đang mở tuyển (Active)</option>
                    <option value="draft">🟡 Bản nháp (Draft)</option>
                    <option value="closed">🔴 Đã đóng (Closed)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Số lượng tuyển</label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="number" min="1" name="vacancies" value={formData.vacancies} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Hạn chót <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="date" required name="deadline" value={formData.deadline} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Mức lương</label>
                    <div className="relative">
                      <CircleDollarSign className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input name="salary" value={formData.salary} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="VD: 25 - 40 triệu" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Loại hình</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <select name="type" value={formData.type} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100">
                        <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Remote">Remote</option><option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Địa điểm</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <select name="location" value={formData.location} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100">
                        <option value="Hà Nội">Hà Nội</option><option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option><option value="Đà Nẵng">Đà Nẵng</option><option value="Khác">Khác...</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Kinh nghiệm</label>
                    <select name="experience" value={formData.experience} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100">
                      <option value="Không yêu cầu kinh nghiệm">Không yêu cầu</option><option value="Dưới 1 năm">Dưới 1 năm</option><option value="1-3 năm">1-3 năm</option><option value="3-5 năm">3-5 năm</option><option value="Trên 5 năm">Trên 5 năm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Từ khóa kỹ năng (Tags)</label>
                  <input name="tags" value={formData.tags} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="VD: ReactJS, NodeJS" />
                </div>
              </div>

              {/* KHU VỰC CÀI ĐẶT BÀI TEST */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-[20px] p-7 border border-blue-200">
                <div className="flex gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0"><ClipboardCheck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-base font-black text-blue-900 mb-1">Kiểm duyệt Bài Test</h3>
                    <p className="text-xs text-slate-500 font-medium">Chỉ định Chuyên gia (SME) tạo Test.</p>
                  </div>
                </div>
                
                <label className="flex items-center gap-3 p-4 bg-white rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-all">
                  <input type="checkbox" name="requireTest" checked={formData.requireTest} onChange={handleChange} className="w-5 h-5 accent-blue-600" />
                  <span className="text-sm font-bold text-slate-700">Yêu cầu tạo Test & Kiểm duyệt</span>
                </label>

                {formData.requireTest && (
                  <div className="mt-4 bg-white p-4 rounded-xl border border-blue-100 animate-fade-in">
                    <label className="block text-xs font-bold text-slate-700 mb-2">Email người kiểm duyệt (SME) <span className="text-red-500">*</span></label>
                    <input type="email" name="moderatorEmail" value={formData.moderatorEmail} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100" placeholder="vd: techlead@congty.com" />
                    <div className="mt-3 flex items-start gap-2 text-xs font-medium text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        Tạm thu 200 Token để cấp Hạn mức nội bộ cho Moderator tạo Test AI.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="space-y-6">
              <div className="bg-white rounded-[20px] p-7 shadow-sm border border-slate-200">
                <h3 className="text-base font-black text-slate-900 mb-5 pb-4 border-b border-slate-100 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-blue-600" /> Chi tiết & Chuyên môn</h3>
                
                <div className="mb-5">
                   <label className="block text-[13px] font-bold text-slate-700 mb-2">Mô tả công việc (JD) <span className="text-red-500">*</span></label>
                   <textarea required name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm" placeholder="- Tham gia phát triển dự án..." />
                </div>

                {/* FIX: Thêm Input Yêu cầu ứng viên vào Giao diện */}
                <div className="mb-5">
                   <label className="block text-[13px] font-bold text-slate-700 mb-2">Yêu cầu ứng viên <span className="text-red-500">*</span></label>
                   <textarea required name="requirements" rows="4" value={formData.requirements} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm" placeholder="- Kỹ năng chuyên môn, kinh nghiệm thực tế..." />
                </div>

                <div className="mb-5">
                   <label className="block text-[13px] font-bold text-slate-700 mb-2">Quyền lợi & Đãi ngộ <span className="text-red-500">*</span></label>
                   <textarea required name="benefits" rows="4" value={formData.benefits} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm" placeholder="- Lương tháng 13..." />
                </div>

                {/* KHU VỰC CHIA ĐẦU MỤC TIÊU CHÍ */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <div>
                            <h4 className="font-black text-slate-800 text-sm">Yêu cầu chuyên môn (Bands)</h4>
                            <p className="text-xs text-slate-500 mt-1">Chia nhỏ tiêu chí để AI chấm điểm chính xác hơn.</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 ${totalWeight === 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                            Tổng: {totalWeight}%
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                                <input type="text" placeholder="Tên tiêu chí (VD: Frontend React)" value={cat.name} onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)} className="flex-1 min-w-[150px] p-2 text-sm border-b border-slate-200 focus:border-blue-500 outline-none font-medium" />
                                <div className="flex items-center gap-2 shrink-0">
                                    <input type="number" min="0" max="100" value={cat.weight} onChange={(e) => handleCategoryChange(idx, 'weight', e.target.value)} className="w-16 p-2 text-sm text-center font-bold border rounded-lg bg-slate-50" title="Trọng số (%)" />
                                    <span className="text-xs font-bold text-slate-500">%</span>
                                    
                                    {/* GIẢI THÍCH TRỌNG ĐIỂM */}
                                    <div className="relative group flex items-center">
                                      <label className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer transition-colors ml-2 ${cat.isKey ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'}`}>
                                          <input type="checkbox" checked={cat.isKey} onChange={(e) => handleCategoryChange(idx, 'isKey', e.target.checked)} className="sr-only" />
                                          <Sparkles className={`w-4 h-4 ${cat.isKey ? 'text-amber-500' : 'text-slate-400'}`} />
                                      </label>
                                      {/* Tooltip */}
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center shadow-xl">
                                        Đánh dấu đây là <strong className="text-amber-300">Tiêu chí Trọng Điểm</strong>. AI sẽ soi xét cực kỳ khắt khe kỹ năng này trong CV ứng viên.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                      </div>
                                    </div>

                                    <button type="button" onClick={() => removeCategory(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-1"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addCategory} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"><Plus className="w-4 h-4" /> Thêm tiêu chí</button>
                </div>

                {/* TUỲ CHỌN AI REVIEW VỚI GIẢI THÍCH CHI TIẾT */}
                <div className="mt-5">
                    <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.useAiReview ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="pt-0.5">
                          <input type="checkbox" name="useAiReview" checked={formData.useAiReview} onChange={handleChange} className="w-4 h-4 accent-emerald-600" />
                        </div>
                        <div>
                            <span className={`text-sm font-black block flex items-center gap-1.5 ${formData.useAiReview ? 'text-emerald-900' : 'text-slate-700'}`}>
                                Sử dụng AI Sàng lọc Hồ sơ Tự động <Info className="w-4 h-4 text-emerald-500" />
                            </span>
                            <span className={`text-xs font-medium block mt-1.5 leading-relaxed ${formData.useAiReview ? 'text-emerald-700' : 'text-slate-500'}`}>
                                Khi ứng viên nộp CV, AI sẽ tự động phân tích và chấm điểm độ phù hợp (Match %) dựa trên các Tiêu chí bạn thiết lập ở trên. 
                                <br/><strong className="text-amber-600 mt-1 inline-block bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Lưu ý: Phí sàng lọc là 30 Token / 1 CV.</strong> Nếu tắt, CV sẽ được đẩy vào cột "Hồ sơ mới" để bạn duyệt thủ công.
                            </span>
                        </div>
                    </label>
                </div>

              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
            <button type="button" className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors" onClick={() => navigate('/bussiness/post-job')}>Hủy bỏ</button>
            {!id && <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"><Save className="w-4 h-4" /> Lưu Nháp</button>}
            <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg transition-colors flex items-center gap-2">
              {submitting ? 'Đang xử lý...' : id ? <><Save className="w-4 h-4" /> Cập nhật Job</> : (formData.requireTest ? 'Lưu & Gửi Yêu Cầu Test' : <><Send className="w-4 h-4" /> Đăng Job</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditJob;