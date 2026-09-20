import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FileText, CircleDollarSign, Briefcase, MapPin, 
  Calendar, ClipboardCheck, AlignLeft, Send, Save, ArrowLeft,
  CheckCircle2, AlertCircle, AlertTriangle, X, Sparkles, Plus, Trash2, Users, Info, Loader2
} from 'lucide-react';
import { fetchProvinces } from '../../services/locationService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TokenTopupModal = ({ isOpen, onClose, requiredTokens, currentBalance }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                <button type="button" onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Số dư Token không đủ</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    Bạn cần <strong>{requiredTokens || 50} Token</strong> để cấp hạn mức tạo bài Test, nhưng số dư ví hiện tại chỉ còn <strong>{currentBalance || 0} Token</strong>. Vui lòng nạp thêm để tiếp tục!
                </p>
                <button type="button" onClick={() => navigate('/upgrade')} className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer">
                    Nạp Token Ngay
                </button>
            </div>
        </div>
    )
};

const Create = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [recruiterBalance, setRecruiterBalance] = useState(0);

  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);

    const fetchCredits = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/payment/my-usage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecruiterBalance(data.businessCredits?.balance || 0);
        }
      } catch (err) {}
    };
    fetchCredits();
  }, []);

  const [formData, setFormData] = useState({
    title: '', salary: '', location: 'Hà Nội', type: 'Full-time', experience: 'Không yêu cầu kinh nghiệm',
    deadline: '', tags: '', description: '', benefits: '', requireTest: false, moderatorEmail: '',
    vacancies: 1, useAiReview: true, testQuestionsCount: 10,
  });

  // Quản lý các nhóm tiêu chí đánh giá
  const [categories, setCategories] = useState([
    { name: '', weight: 100, isKey: false }
  ]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleCategoryChange = (index, field, value) => {
    const newCats = [...categories];
    newCats[index][field] = value;
    setCategories(newCats);
  };

  const addCategory = () => {
    setCategories([...categories, { name: '', weight: 0, isKey: false }]);
  };

  const removeCategory = (index) => {
    const newCats = categories.filter((_, i) => i !== index);
    if(newCats.length === 0) newCats.push({ name: '', weight: 100, isKey: false });
    setCategories(newCats);
  };

  const totalWeight = categories.reduce((sum, cat) => sum + (Number(cat.weight) || 0), 0);
  const questionsCount = Number(formData.testQuestionsCount) > 0 ? Number(formData.testQuestionsCount) : 10;
  const testTokensNeeded = questionsCount * 5;
  const hasEnoughTokens = recruiterBalance >= testTokensNeeded;

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    // 1. VALIDATE THÔNG TIN CƠ BẢN
    if (!formData.title?.trim()) return toast.error('Vui lòng nhập tiêu đề công việc (*)');
    if (!formData.vacancies || Number(formData.vacancies) <= 0) return toast.error('Số lượng tuyển dụng phải lớn hơn 0 (*)');
    if (!formData.deadline) return toast.error('Vui lòng chọn hạn nộp hồ sơ (*)');

    const deadlineDate = new Date(formData.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (deadlineDate < today) {
      return toast.error('Hạn nộp hồ sơ không được là ngày trong quá khứ (*)');
    }

    if (!formData.salary?.trim()) return toast.error('Vui lòng nhập mức lương (*)');
    if (!formData.type) return toast.error('Vui lòng chọn loại hình làm việc (*)');
    if (!formData.location) return toast.error('Vui lòng chọn địa điểm làm việc (*)');
    if (!formData.experience) return toast.error('Vui lòng chọn yêu cầu kinh nghiệm (*)');
    if (!formData.tags?.trim()) return toast.error('Vui lòng nhập từ khóa kỹ năng (Tags) (*)');

    // 2. VALIDATE CHI TIẾT & CHUYÊN MÔN
    if (!formData.description?.trim()) return toast.error('Vui lòng nhập mô tả công việc (JD) (*)');
    if (!formData.benefits?.trim()) return toast.error('Vui lòng nhập quyền lợi & đãi ngộ (*)');

    // 3. VALIDATE YÊU CẦU CHUYÊN MÔN (BANDS)
    if (!categories || categories.length === 0) {
      return toast.error('Vui lòng thiết lập ít nhất một tiêu chí chuyên môn (Bands) (*)');
    }
    if (categories.some(c => !c.name?.trim())) {
      return toast.error('Vui lòng nhập đầy đủ tên cho tất cả các tiêu chí chuyên môn (*)');
    }
    if (categories.some(c => Number(c.weight) <= 0)) {
      return toast.error('Trọng số của mỗi tiêu chí phải lớn hơn 0% (*)');
    }
    if (totalWeight > 100) {
      return toast.error(`Tổng trọng số các tiêu chí đã vượt quá 100% (Hiện tại: ${totalWeight}%). Vui lòng giảm bớt!`);
    }
    if (totalWeight < 100) {
      return toast.error(`Tổng trọng số các tiêu chí chưa đủ 100% (Hiện tại: ${totalWeight}%). Vui lòng phân bổ thêm ${100 - totalWeight}%!`);
    }

    // 4. VALIDATE BÀI TEST & MODERATOR NẾU BẬT
    if (formData.requireTest) {
      if (!formData.moderatorEmail?.trim()) {
        return toast.error('Vui lòng nhập Email người kiểm duyệt Bài Test (*)');
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.moderatorEmail.trim())) {
        return toast.error('Email người kiểm duyệt không đúng định dạng (*)');
      }
      if (questionsCount < 5 || questionsCount > 50) {
        return toast.error('Số lượng câu hỏi bài test phải từ 5 đến 50 câu (*)');
      }
      if (!hasEnoughTokens) {
        setShowTokenModal(true);
        return toast.error(`Số dư Token không đủ (Cần ${testTokensNeeded} Token, hiện có ${recruiterBalance} Token). Vui lòng nạp thêm!`);
      }
    }

    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      const requirementsText = categories.map(c => `- ${c.name} (${c.weight}%${c.isKey ? ' - Trọng điểm' : ''})`).join('\n');
      
      const payload = { 
          ...formData, 
          testQuestionsCount: questionsCount,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''), 
          status: isDraft ? 'draft' : 'active',
          requirements: requirementsText, 
          requirementCategories: categories 
      };

      const res = await fetch(`${API_BASE}/api/jobs`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (!res.ok) {
          if (res.status === 402 || res.status === 403) {
              setShowTokenModal(true);
              return;
          }
          throw new Error(data.message || 'Tạo công việc thất bại');
      }

      toast.success(isDraft ? 'Đã lưu Bản Nháp thành công!' : 'Đăng tin tuyển dụng thành công!');
      setTimeout(() => navigate('/bussiness/post-job'), 1000);
    } catch (error) { 
      toast.error(error.message); 
    } finally { 
      setSubmitting(false); 
    }
  };

  return (
    <div className="create-job-page animate-fade-in pb-12">
      <TokenTopupModal 
        isOpen={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
        requiredTokens={testTokensNeeded} 
        currentBalance={recruiterBalance} 
      />

      <div className="job-form-container max-w-[1050px] mx-auto p-4">
        
        <button type="button" onClick={() => navigate('/bussiness/post-job')} className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit transition-colors group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Quay lại Quản lý tuyển dụng
        </button>

        <form onSubmit={(e) => handleSubmit(e, false)}>
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

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Số lượng tuyển <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="number" min="1" required name="vacancies" value={formData.vacancies} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Hạn chót <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input type="date" required min={new Date().toISOString().split('T')[0]} name="deadline" value={formData.deadline} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 cursor-pointer" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Mức lương <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <CircleDollarSign className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input required name="salary" value={formData.salary} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="VD: 25 - 40 triệu" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Loại hình <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <select required name="type" value={formData.type} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer">
                        <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Remote">Remote</option><option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Địa điểm <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <select required name="location" value={formData.location} onChange={handleChange} className="w-full p-3 pl-10 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer">
                        {provinces.map(p => (
                          <option key={p.code} value={p.cleanName}>{p.cleanName}</option>
                        ))}
                        {formData.location && !provinces.some(p => p.cleanName === formData.location) && (
                          <option value={formData.location}>{formData.location}</option>
                        )}
                        <option value="Khác">Khác...</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[13px] font-bold text-slate-700 mb-2">Kinh nghiệm <span className="text-red-500">*</span></label>
                    <select required name="experience" value={formData.experience} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-100 cursor-pointer" style={{ paddingLeft: '14px' }}>
                      <option value="Không yêu cầu kinh nghiệm">Không yêu cầu</option><option value="Dưới 1 năm">Dưới 1 năm</option><option value="1-3 năm">1-3 năm</option><option value="3-5 năm">3-5 năm</option><option value="Trên 5 năm">Trên 5 năm</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-bold text-slate-700 mb-2">Từ khóa kỹ năng (Tags) <span className="text-red-500">*</span></label>
                  <input required name="tags" value={formData.tags} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100" placeholder="VD: ReactJS, NodeJS" />
                </div>
              </div>

              {/* KHU VỰC CÀI ĐẶT BÀI TEST */}
              <div className="bg-gradient-to-br from-blue-50 to-white rounded-[20px] p-7 border border-blue-200">
                <div className="flex gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0"><ClipboardCheck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-base font-black text-blue-900 mb-1">Kiểm duyệt Bài Test</h3>
                    <p className="text-xs text-slate-500 font-medium">Chỉ định Chuyên gia (SME) tạo Test đánh giá năng lực.</p>
                  </div>
                </div>
                
                {(() => {
                  const isDeadlineExpired = formData.deadline && new Date(formData.deadline).getTime() < new Date().getTime();
                  return (
                    <>
                      <label className={`flex items-center gap-3 p-4 bg-white rounded-xl border transition-all ${
                        isDeadlineExpired ? 'opacity-60 cursor-not-allowed border-slate-200 bg-slate-50' : 'border-blue-200 cursor-pointer hover:border-blue-400'
                      }`}>
                        <input 
                          type="checkbox" 
                          name="requireTest" 
                          disabled={isDeadlineExpired}
                          checked={isDeadlineExpired ? false : formData.requireTest} 
                          onChange={(e) => {
                            if (isDeadlineExpired) return;
                            handleChange(e);
                          }} 
                          className="w-5 h-5 accent-blue-600 disabled:cursor-not-allowed cursor-pointer" 
                        />
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">Yêu cầu tạo Test & Kiểm duyệt</span>
                          {isDeadlineExpired && (
                            <span className="text-[11px] font-bold text-red-500 block mt-0.5">⚠️ Hạn chót đã qua, không thể tạo bài test.</span>
                          )}
                        </div>
                      </label>

                      {!isDeadlineExpired && formData.requireTest && (
                        <div className="mt-4 bg-white p-5 rounded-xl border border-blue-100 shadow-sm space-y-4 animate-fade-in">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">Email người kiểm duyệt (SME) <span className="text-red-500">*</span></label>
                            <input type="email" required name="moderatorEmail" value={formData.moderatorEmail} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-100" placeholder="vd: techlead@congty.com" />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-2">Số lượng câu hỏi bài Test <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                min="5" 
                                max="50" 
                                required 
                                name="testQuestionsCount" 
                                value={formData.testQuestionsCount} 
                                onChange={handleChange} 
                                className="w-28 p-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-800 text-center focus:ring-2 focus:ring-blue-100" 
                              />
                              <span className="text-xs font-medium text-slate-500">câu hỏi (Khuyến nghị 10 - 20 câu)</span>
                            </div>
                          </div>

                          {/* BẢNG TÍNH TOKEN VÀ ĐỐI CHIẾU SỐ DƯ */}
                          <div className={`p-4 rounded-xl border transition-all ${hasEnoughTokens ? 'bg-blue-50/70 border-blue-200' : 'bg-rose-50 border-rose-200'}`}>
                            <div className="flex justify-between items-center text-xs mb-2">
                              <span className="font-bold text-slate-600">Quy đổi hạn mức AI:</span>
                              <span className="font-bold text-slate-700">{questionsCount} câu × 5 = <strong className="text-blue-600 font-black">{testTokensNeeded} Token</strong></span>
                            </div>
                            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                              <span className="font-bold text-slate-600">Số dư Token hiện tại:</span>
                              <span className={`text-sm font-black ${hasEnoughTokens ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {recruiterBalance} Token
                              </span>
                            </div>

                            {!hasEnoughTokens && (
                              <div className="mt-3 pt-3 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
                                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                                  <span>Thiếu {testTokensNeeded - recruiterBalance} Token để cấp quyền!</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setShowTokenModal(true)}
                                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer shrink-0"
                                >
                                  Nạp Token Ngay
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* CỘT PHẢI */}
            <div className="space-y-6">
              <div className="bg-white rounded-[20px] p-7 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2"><AlignLeft className="w-5 h-5 text-blue-600" /> Chi tiết & Chuyên môn</h3>
                </div>
                
                <div className="mb-5">
                   <label className="block text-[13px] font-bold text-slate-700 mb-2">Mô tả công việc (JD) <span className="text-red-500">*</span></label>
                   <textarea required name="description" rows="5" value={formData.description} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm" placeholder="- Tham gia phát triển dự án...&#10;- Báo cáo tiến độ công việc..." />
                </div>

                <div className="mb-5">
                   <label className="block text-[13px] font-bold text-slate-700 mb-2">Quyền lợi & Đãi ngộ <span className="text-red-500">*</span></label>
                   <textarea required name="benefits" rows="4" value={formData.benefits} onChange={handleChange} className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 text-sm" placeholder="- Lương tháng 13..." />
                </div>

                {/* KHU VỰC CHIA ĐẦU MỤC TIÊU CHÍ (BANDS) */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <div>
                            <h4 className="font-black text-slate-800 text-sm flex items-center gap-1">
                              Yêu cầu chuyên môn (Bands) <span className="text-red-500">*</span>
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Chia nhỏ tiêu chí để AI chấm điểm chính xác hơn.</p>
                        </div>
                        <div className={`px-3 py-1 rounded-lg text-xs font-black shrink-0 transition-all ${
                          totalWeight === 100 
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                            : totalWeight > 100 
                              ? 'bg-red-100 text-red-700 border border-red-300 animate-pulse' 
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}>
                            Tổng: {totalWeight}% {totalWeight === 100 ? '✓ Hợp lệ' : totalWeight > 100 ? '⚠️ Vượt 100%!' : '(Thiếu)'}
                        </div>
                    </div>

                    <div className="space-y-3 mb-4">
                        {categories.map((cat, idx) => (
                            <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                                <input type="text" placeholder="Tên tiêu chí (VD: Frontend React)" value={cat.name} onChange={(e) => handleCategoryChange(idx, 'name', e.target.value)} className="flex-1 min-w-[150px] p-2 text-sm border-b border-slate-200 focus:border-blue-500 outline-none font-medium" />
                                <div className="flex items-center gap-2 shrink-0">
                                    <input type="number" min="1" max="100" value={cat.weight} onChange={(e) => handleCategoryChange(idx, 'weight', e.target.value)} className="w-16 p-2 text-sm text-center font-bold border rounded-lg bg-slate-50" title="Trọng số (%)" />
                                    <span className="text-xs font-bold text-slate-500">%</span>
                                    
                                    {/* GIẢI THÍCH TRỌNG ĐIỂM BẰNG TOOLTIP NỔI */}
                                    <div className="relative group flex items-center">
                                      <label className={`flex items-center justify-center w-8 h-8 rounded-lg border cursor-pointer transition-colors ml-2 ${cat.isKey ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'}`}>
                                          <input type="checkbox" checked={cat.isKey} onChange={(e) => handleCategoryChange(idx, 'isKey', e.target.checked)} className="sr-only" />
                                          <Sparkles className={`w-4 h-4 ${cat.isKey ? 'text-amber-500' : 'text-slate-400'}`} />
                                      </label>
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center shadow-xl">
                                        Đánh dấu đây là <strong className="text-amber-300">Tiêu chí Trọng Điểm</strong>. AI sẽ soi xét cực kỳ khắt khe kỹ năng này trong CV ứng viên.
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                      </div>
                                    </div>

                                    <button type="button" onClick={() => removeCategory(idx)} className="p-2 text-slate-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addCategory} className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"><Plus className="w-4 h-4" /> Thêm tiêu chí</button>

                    {/* THÔNG BÁO / CẢNH BÁO TRỌNG SỐ */}
                    {totalWeight > 100 && (
                      <div className="mt-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-start gap-2.5 animate-bounce-short">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-red-800">Cảnh báo: Tổng trọng số các tiêu chí đã vượt quá 100% (Hiện tại: {totalWeight}%)</p>
                          <p className="font-normal text-red-600 mt-0.5">Vui lòng điều chỉnh lại tỷ lệ giữa các tiêu chí sao cho tổng cộng đạt chính xác 100% trước khi đăng tin.</p>
                        </div>
                      </div>
                    )}

                    {totalWeight < 100 && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                        <Info className="w-4 h-4 shrink-0 text-amber-600" />
                        <span>Tổng trọng số hiện tại là <strong>{totalWeight}%</strong> (Còn thiếu <strong>{100 - totalWeight}%</strong> để đạt 100%).</span>
                      </div>
                    )}

                    {totalWeight === 100 && (
                      <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                        <span>Tổng trọng số đã đạt 100% hợp lệ.</span>
                      </div>
                    )}
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
            <button type="button" className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => navigate('/bussiness/post-job')}>Hủy bỏ</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitting} className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2 cursor-pointer">
              <Save className="w-4 h-4" /> Lưu Nháp
            </button>
            <button type="submit" disabled={submitting} className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg transition-colors flex items-center gap-2 cursor-pointer">
              {submitting ? 'Đang xử lý...' : (formData.requireTest ? 'Lưu & Gửi Yêu Cầu Test' : <><Send className="w-4 h-4" /> Đăng Job</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Create;