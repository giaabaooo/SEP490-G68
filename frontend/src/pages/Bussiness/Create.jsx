import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FileText, CircleDollarSign, Briefcase, MapPin, 
  Calendar, ClipboardCheck, AlignLeft, Send, Save, ArrowLeft,
  CheckCircle2, AlertCircle
} from 'lucide-react';

const Create = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    salary: '',
    location: 'Hà Nội',
    type: 'Full-time',
    experience: 'Không yêu cầu kinh nghiệm',
    deadline: '',
    tags: '',
    description: '',
    requirements: '',
    benefits: '',
    requireTest: false,
    moderatorEmail: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();
    
    if (!formData.title || !formData.deadline || !formData.description) {
      toast.error('Vui lòng điền các trường bắt buộc (*)');
      return;
    }

    if (formData.requireTest && !formData.moderatorEmail) {
      toast.error('Vui lòng nhập Email người kiểm duyệt Bài Test!');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Vui lòng đăng nhập trước');
      navigate('/login');
      return;
    }

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        status: isDraft ? 'draft' : 'active'
      };

      const res = await fetch('http://localhost:5000/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Tạo công việc thất bại');

      if (formData.requireTest) {
        toast.success('Đã lưu Job và Gửi yêu cầu Test cho Moderator!');
      } else if (isDraft) {
        toast.success('Đã lưu Bản Nháp thành công!');
      } else {
        toast.success('Đăng tin tuyển dụng thành công!');
      }
      
      setTimeout(() => navigate('/bussiness/post-job'), 1500);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-job-page animate-fade-in">
      <div className="job-form-container">
        
        <button 
          onClick={() => navigate('/bussiness/dashboard')}
          className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-sm mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
          Quay lại Dashboard
        </button>

        <form>
          <div className="form-grid">
            {/* ================= CỘT TRÁI ================= */}
            <div className="left-col">
              <div className="card">
                <h3 className="card-title">
                  <FileText className="icon" /> Thông tin cơ bản
                </h3>
                
                <div className="form-group">
                  <label>Tiêu đề công việc <span className="req">*</span></label>
                  <div className="input-wrapper">
                    <input required name="title" value={formData.title} onChange={handleChange} placeholder="VD: Senior ReactJS Developer" />
                  </div>
                </div>

                <div className="row-2">
                  <div className="form-group">
                    <label>Mức lương</label>
                    <div className="input-wrapper">
                      <CircleDollarSign className="input-icon" />
                      <input name="salary" value={formData.salary} onChange={handleChange} placeholder="VD: 25 - 40 triệu" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Loại hình</label>
                    <div className="input-wrapper">
                      <Briefcase className="input-icon" />
                      <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="Full-time">Full-time</option>
                        <option value="Part-time">Part-time</option>
                        <option value="Remote">Remote</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="row-2">
                  <div className="form-group">
                    <label>Địa điểm làm việc</label>
                    <div className="input-wrapper">
                      <MapPin className="input-icon" />
                      <select name="location" value={formData.location} onChange={handleChange}>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                        <option value="Khác">Khác...</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Kinh nghiệm</label>
                    <div className="input-wrapper">
                      <select name="experience" value={formData.experience} onChange={handleChange} style={{ paddingLeft: '14px' }}>
                        <option value="Không yêu cầu kinh nghiệm">Không yêu cầu</option>
                        <option value="Dưới 1 năm">Dưới 1 năm</option>
                        <option value="1-3 năm">1-3 năm</option>
                        <option value="3-5 năm">3-5 năm</option>
                        <option value="Trên 5 năm">Trên 5 năm</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '4px' }}>
                  <label>Từ khóa kỹ năng (Tags)</label>
                  <div className="input-wrapper">
                    <input name="tags" value={formData.tags} onChange={handleChange} placeholder="VD: ReactJS, NodeJS (Cách nhau dấu phẩy)" style={{ paddingLeft: '14px' }} />
                  </div>
                </div>

                <div className="form-group pt-5 mt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
                  <label>Hạn chót ứng tuyển <span className="req">*</span></label>
                  <div className="input-wrapper">
                    <Calendar className="input-icon" />
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} required style={{ borderColor: formData.deadline ? '#2563EB' : '', cursor: 'pointer' }} />
                  </div>
                </div>
              </div>

              {/* CARD: YÊU CẦU KIỂM DUYỆT (MODERATOR) */}
              <div className="card assessment-card">
                <div className="assessment-header">
                  <div className="icon-box"><ClipboardCheck className="w-6 h-6" /></div>
                  <div>
                    <h3 className="card-title" style={{ marginBottom: 4, color: '#1E40AF', border: 'none', padding: 0 }}>Luồng Kiểm duyệt Bài Test</h3>
                    <p className="card-desc">Chỉ định một Chuyên gia (SME) tạo bài Test đánh giá năng lực cho Job này.</p>
                  </div>
                </div>
                
                <label className="checkbox-wrapper">
                  <input 
                    type="checkbox" 
                    name="requireTest" 
                    checked={formData.requireTest} 
                    onChange={handleChange} 
                  />
                  <span>Yêu cầu tạo Test & Kiểm duyệt nội dung</span>
                </label>

                {formData.requireTest && (
                  <div className="moderator-email-box animate-fade-in">
                    <label>Email người kiểm duyệt (SME) <span className="req">*</span></label>
                    <input 
                      type="email" 
                      name="moderatorEmail" 
                      value={formData.moderatorEmail} 
                      onChange={handleChange}
                      placeholder="vd: techlead@congty.com"
                    />
                    <div className="helper-text">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Job sẽ ở trạng thái Nháp (Draft) cho đến khi bài Test được tạo và phê duyệt.
                    </div>
                  </div>
                )}
                
                {formData.requireTest && formData.moderatorEmail && (
                  <div className="assessment-success">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Hệ thống sẽ cấp quyền Moderator cho Email này.</span>
                  </div>
                )}
              </div>
            </div>

            {/* ================= CỘT PHẢI ================= */}
            <div className="right-col">
              <div className="card h-full">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #F3F4F6', paddingBottom:'16px', marginBottom:'20px' }}>
                  <h3 className="card-title" style={{ margin:0, border:0, padding:0 }}>
                    <AlignLeft className="icon" /> Chi tiết công việc
                  </h3>
                </div>

                <div className="form-group">
                  <label>Mô tả công việc (JD) <span className="req">*</span></label>
                  <textarea required name="description" rows="6" value={formData.description} onChange={handleChange} placeholder="- Tham gia phát triển dự án...&#10;- Báo cáo tiến độ công việc..." />
                </div>

                <div className="form-group">
                  <label>Yêu cầu chuyên môn <span className="req">*</span></label>
                  <textarea required name="requirements" rows="6" value={formData.requirements} onChange={handleChange} placeholder="- Có ít nhất 2 năm kinh nghiệm...&#10;- Thành thạo ReactJS, Javascript..." />
                </div>

                <div className="form-group">
                  <label>Quyền lợi & Đãi ngộ <span className="req">*</span></label>
                  <textarea required name="benefits" rows="6" value={formData.benefits} onChange={handleChange} placeholder="- Lương tháng 13, BHXH full lương...&#10;- Môi trường làm việc trẻ trung..." />
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="form-footer">
            <button type="button" className="btn-cancel" onClick={() => navigate('/bussiness/post-job')}>Hủy bỏ</button>
            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="btn-draft">
              <Save className="w-4 h-4" /> Lưu Bản Nháp
            </button>
            <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="btn-submit">
              {loading ? 'Đang xử lý...' : (formData.requireTest ? 'Lưu & Gửi Yêu Cầu Test' : <><Send className="w-4 h-4" /> Đăng tin tuyển dụng</>)}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        /* IMPORT FONT INTER TỪ GOOGLE FONTS */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        /* ÉP FONT CHO TOÀN BỘ TRANG */
        .create-job-page * {
          font-family: 'Inter', sans-serif !important;
        }

        .create-job-page {
          background-color: #F8FAFC;
          border-radius: 24px;
          color: #0F172A;
        }
        .job-form-container {
          max-width: 1050px;
          margin: 0 auto;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1.3fr; 
          gap: 24px;
        }
        @media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }

        .card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
          border: 1px solid #E2E8F0;
          margin-bottom: 24px;
        }
        .card-title {
          font-size: 16px; font-weight: 800; color: #0F172A;
          margin: 0 0 20px;
          display: flex; align-items: center; gap: 10px;
          padding-bottom: 16px;
          border-bottom: 1px solid #F1F5F9;
        }
        .card-title .icon { color: #2563EB; width: 22px; height: 22px; }
        
        .form-group { margin-bottom: 20px; }
        .form-group label {
          display: block; font-size: 13px; font-weight: 700; color: #334155; margin-bottom: 8px;
        }
        .form-group label .req { color: #EF4444; }

        .input-wrapper { position: relative; }
        .input-wrapper .input-icon {
          position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
          width: 18px; height: 18px; color: #94A3B8; pointer-events: none;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: #0F172A;
          outline: none;
          transition: all 0.2s;
          background: #FFFFFF;
          box-sizing: border-box;
        }
        input::placeholder, textarea::placeholder { color: #94A3B8; font-weight: 400; }
        .input-wrapper input, .input-wrapper select { padding-left: 42px; }
        
        input:focus, select:focus, textarea:focus {
          border-color: #3B82F6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }
        
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .assessment-card {
          background: linear-gradient(to bottom right, #F0F9FF, #FFFFFF);
          border: 1px solid #BAE6FD;
        }
        .assessment-header { display: flex; gap: 16px; margin-bottom: 20px; }
        .assessment-header .icon-box {
          width: 52px; height: 52px;
          background: #DBEAFE; color: #1E40AF;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .card-desc { font-size: 13px; color: #475569; margin: 0; line-height: 1.5; font-weight: 500; }

        /* FIX UI CHECKBOX ĐẸP HƠN */
        .checkbox-wrapper {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 16px; background: white;
          border-radius: 12px; border: 1px solid #BFDBFE;
          cursor: pointer; transition: 0.2s;
        }
        .checkbox-wrapper:hover { border-color: #60A5FA; }
        
        .checkbox-wrapper input[type="checkbox"] {
          width: 20px; height: 20px;
          cursor: pointer; padding: 0; margin: 0; flex-shrink: 0;
          accent-color: #2563EB; /* Đổi màu nút tick sang xanh dương */
        }
        
        .checkbox-wrapper span {
          font-size: 14px; font-weight: 700; color: #334155; user-select: none;
        }

        .moderator-email-box {
          margin-top: 16px; background: white; padding: 16px;
          border-radius: 12px; border: 1px solid #DBEAFE;
        }
        .moderator-email-box label {
          display: block; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px;
        }
        .helper-text {
          display: flex; align-items: flex-start; gap: 6px; margin-top: 10px;
          font-size: 12px; color: #D97706; font-weight: 500; line-height: 1.4;
        }

        .assessment-success {
          margin-top: 16px;
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 700; color: #059669;
          background: #D1FAE5; padding: 10px 14px; border-radius: 8px; border: 1px solid #A7F3D0;
        }

        .form-footer {
          display: flex; justify-content: flex-end; gap: 12px;
          margin-top: 12px; padding-top: 24px;
          border-top: 1px solid #E2E8F0;
        }
        .btn-cancel, .btn-draft, .btn-submit {
          display: flex; align-items: center; gap: 8px; 
          border-radius: 12px; font-size: 14px; font-weight: 700; 
          cursor: pointer; transition: all 0.2s;
        }
        .btn-cancel {
          padding: 12px 24px; border: 1px solid #CBD5E1; background: white; color: #475569;
        }
        .btn-cancel:hover { background: #F1F5F9; }
        
        .btn-draft {
          padding: 12px 24px; border: none; background: #F1F5F9; color: #334155;
        }
        .btn-draft:hover { background: #E2E8F0; }

        .btn-submit {
          padding: 12px 28px; border: none; background: #2563EB; color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .btn-submit:hover { background: #1D4ED8; transform: translateY(-1px); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
      `}</style>
    </div>
  );
};

export default Create;