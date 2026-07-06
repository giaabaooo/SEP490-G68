import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Building, Mail, FileText, MapPin, Globe, ChevronRight, ArrowLeft, UploadCloud } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    otp: '',
    taxCode: '',
    licenseFile: null,
    companyName: '',
    website: '',
    address: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const nextStep = () => {
    if (currentStep === 1 && formData.otp.length < 6) {
      toast.warning('Vui lòng nhập đủ 6 số OTP');
      return;
    }
    if (currentStep === 2 && !formData.taxCode) {
      toast.warning('Vui lòng nhập Mã số thuế');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleFinish = (e) => {
    e.preventDefault();
    if (!formData.companyName || !formData.address) {
      toast.warning('Vui lòng nhập đủ thông tin công ty');
      return;
    }
    
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Xác minh doanh nghiệp thành công!');
      
      setTimeout(() => {
        navigate('/bussiness/dashboard', { replace: true });
      }, 1500);
    }, 1500);
  };

  const steps = [
    { id: 1, title: 'Xác minh Email', icon: Mail },
    { id: 2, title: 'Pháp lý', icon: FileText },
    { id: 3, title: 'Hồ sơ Công ty', icon: Building }
  ];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .onboard-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f8fafc; padding: 20px; font-family: 'Inter', sans-serif; }
        .onboard-card { background: #fff; width: 100%; max-width: 600px; padding: 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.04); border: 1px solid #f1f5f9; }
        
        .stepper { display: flex; justify-content: space-between; position: relative; margin-bottom: 40px; }
        .stepper::before { content: ''; position: absolute; top: 20px; left: 0; width: 100%; height: 2px; background: #e2e8f0; z-index: 1; }
        .stepper-progress { position: absolute; top: 20px; left: 0; height: 2px; background: #3b82f6; z-index: 2; transition: width 0.4s ease; }
        
        .step-item { position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 8px; background: #fff; padding: 0 10px; }
        .step-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 14px; border: 2px solid #e2e8f0; background: #fff; color: #94a3b8; transition: all 0.3s; }
        .step-item.active .step-circle { border-color: #3b82f6; background: #eff6ff; color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .step-item.completed .step-circle { border-color: #3b82f6; background: #3b82f6; color: #fff; }
        .step-title { font-size: 12px; font-weight: 600; color: #64748b; transition: color 0.3s; }
        .step-item.active .step-title, .step-item.completed .step-title { color: #0f172a; }

        .step-content { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .header-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-align: center; }
        .header-desc { font-size: 14px; color: #64748b; margin-bottom: 32px; text-align: center; line-height: 1.5; }
        
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #94a3b8; }
        .input-wrapper input { width: 100%; padding: 14px 16px 14px 44px; border: 1.5px solid #e2e8f0; border-radius: 12px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; }
        .input-wrapper input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .otp-input input { padding-left: 16px; text-align: center; font-size: 24px; letter-spacing: 12px; font-weight: 700; }
        
        .upload-box { border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px; text-align: center; background: #f8fafc; cursor: pointer; transition: all 0.2s; }
        .upload-box:hover { border-color: #3b82f6; background: #eff6ff; }
        
        .actions { display: flex; gap: 12px; margin-top: 32px; }
        .btn-prev { flex: 1; padding: 14px; background: #f1f5f9; color: #475569; font-weight: 600; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; }
        .btn-prev:hover { background: #e2e8f0; color: #0f172a; }
        .btn-next { flex: 2; padding: 14px; background: #3b82f6; color: #fff; font-weight: 600; border-radius: 12px; border: none; cursor: pointer; transition: all 0.2s; display: flex; justify-content: center; align-items: center; gap: 8px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25); }
        .btn-next:hover { background: #2563eb; transform: translateY(-1px); }
        .btn-next:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>

      <div className="onboard-wrapper">
        <div className="onboard-card">
          
          {/* STEPPER HEADER */}
          <div className="stepper">
            <div className="stepper-progress" style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}></div>
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className={`step-item ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}>
                  <div className="step-circle">
                    {currentStep > step.id ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className="step-title">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* STEP 1: XÁC MINH EMAIL */}
          {currentStep === 1 && (
            <div className="step-content">
              <h2 className="header-title">Xác minh tài khoản</h2>
              <p className="header-desc">Chúng tôi đã gửi mã OTP 6 số đến email của bạn. Vui lòng nhập mã để xác nhận đây là email công ty chính chủ.</p>
              
              <div className="input-group otp-input">
                <label>Mã OTP</label>
                <div className="input-wrapper">
                  <input 
                    type="text" 
                    name="otp"
                    maxLength="6"
                    placeholder="••••••" 
                    value={formData.otp}
                    onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/[^0-9]/g, '') }))}
                  />
                </div>
              </div>
              
              <div className="actions" style={{ marginTop: '40px' }}>
                <button className="btn-next" style={{ flex: 1 }} onClick={nextStep}>
                  Xác nhận & Tiếp tục <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: THÔNG TIN PHÁP LÝ */}
          {currentStep === 2 && (
            <div className="step-content">
              <h2 className="header-title">Xác minh Pháp lý</h2>
              <p className="header-desc">Để đảm bảo tính minh bạch trên Careerio, vui lòng cung cấp thông tin đăng ký kinh doanh của doanh nghiệp.</p>
              
              <div className="input-group">
                <label>Mã số thuế (MST) <span style={{color: '#ef4444'}}>*</span></label>
                <div className="input-wrapper">
                  <FileText className="input-icon" size={18} />
                  <input 
                    type="text" 
                    name="taxCode"
                    placeholder="Nhập 10 hoặc 13 số..." 
                    value={formData.taxCode}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Giấy phép ĐKKD (Tùy chọn)</label>
                <div className="upload-box">
                  <UploadCloud size={32} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>Click để tải lên tài liệu</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Hỗ trợ PDF, JPG, PNG (Tối đa 5MB)</p>
                </div>
              </div>
              
              <div className="actions">
                <button className="btn-prev" onClick={prevStep}>
                  <ArrowLeft size={18} /> Quay lại
                </button>
                <button className="btn-next" onClick={nextStep}>
                  Tiếp tục <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: HỒ SƠ DOANH NGHIỆP */}
          {currentStep === 3 && (
            <div className="step-content">
              <h2 className="header-title">Hồ sơ Công ty</h2>
              <p className="header-desc">Thông tin này sẽ được hiển thị công khai cho các ứng viên trên nền tảng Careerio.</p>
              
              <div className="input-group">
                <label>Tên Công ty hiển thị <span style={{color: '#ef4444'}}>*</span></label>
                <div className="input-wrapper">
                  <Building className="input-icon" size={18} />
                  <input 
                    type="text" 
                    name="companyName"
                    placeholder="VD: Công ty Cổ phần Công nghệ Careerio..." 
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Địa chỉ trụ sở chính <span style={{color: '#ef4444'}}>*</span></label>
                <div className="input-wrapper">
                  <MapPin className="input-icon" size={18} />
                  <input 
                    type="text" 
                    name="address"
                    placeholder="Nhập địa chỉ đầy đủ..." 
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Website Công ty (Tùy chọn)</label>
                <div className="input-wrapper">
                  <Globe className="input-icon" size={18} />
                  <input 
                    type="url" 
                    name="website"
                    placeholder="https://www.example.com" 
                    value={formData.website}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="actions">
                <button className="btn-prev" onClick={prevStep} disabled={loading}>
                  <ArrowLeft size={18} />
                </button>
                <button className="btn-next" onClick={handleFinish} disabled={loading}>
                  {loading ? 'Đang thiết lập...' : 'Hoàn tất & Truy cập hệ thống'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Onboarding;