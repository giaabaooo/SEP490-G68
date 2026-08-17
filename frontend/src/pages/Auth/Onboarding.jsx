import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, User, MapPin, FileText, Phone, ChevronRight, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [tempEmail, setTempEmail] = useState('');

  const [otp, setOtp] = useState(Array(6).fill(''));

  const [candidateData, setCandidateData] = useState({ phone: '', city: 'Hà Nội' });
  const [businessData, setBusinessData] = useState({ companyName: '', taxCode: '', address: '', city: 'Hà Nội' });

  useEffect(() => {
    // Chỉ cho phép vào trang này nếu có tempToken
    const tkn = sessionStorage.getItem('tempToken');
    const email = sessionStorage.getItem('tempEmail');
    if (!tkn) {
      navigate('/login', { replace: true });
      return;
    }
    setTempToken(tkn);
    setTempEmail(email);
  }, [navigate]);

  const handleCandidateChange = (e) => setCandidateData({ ...candidateData, [e.target.name]: e.target.value });
  const handleBusinessChange = (e) => setBusinessData({ ...businessData, [e.target.name]: e.target.value });

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) setTimeout(() => document.getElementById(`otp-${index + 1}`)?.focus(), 0);
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
    if (e.key === 'ArrowLeft' && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
    if (e.key === 'ArrowRight' && index < 5) document.getElementById(`otp-${index + 1}`)?.focus();
  };

  // Bước 2: Submit Form -> Gửi yêu cầu Backend phát OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();

    if (role === 'business') {
      if (!businessData.companyName.trim() || !businessData.taxCode.trim() || !businessData.address.trim()) {
        toast.warning('Vui lòng điền đầy đủ các trường thông tin doanh nghiệp bắt buộc');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        tempToken,
        role,
        ...(role === 'candidate' ? candidateData : businessData)
      };

      const res = await fetch('http://localhost:5000/api/auth/google-onboarding/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setStep(3); // Sang bước nhập OTP
      toast.success('Đã gửi OTP về email của bạn!');
    } catch (err) {
      toast.error(err.message || 'Lỗi gửi OTP');
    } finally {
      setLoading(false);
    }
  };

  // Bước 3: Nhập OTP xong -> Submit để BE ghi vào DB
  const handleVerifyComplete = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/google-onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tempEmail, otp: otp.join('') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Lưu Token thật, xóa temp
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('tempEmail');

      toast.success('Hoàn tất thiết lập hồ sơ!');

      setTimeout(() => {
        if (role === 'business') {
          navigate('/bussiness/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }, 1500);

    } catch (err) {
      toast.error(err.message || 'OTP không hợp lệ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        /* CSS tương tự như mình đã cấp ở bản tối ưu trước, thêm style cho OTP Box */
        .onboard-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4f8; padding: 20px; font-family: 'Inter', sans-serif; }
        .onboard-card { background: #ffffff; width: 100%; max-width: 680px; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .title-section { text-align: center; margin-bottom: 30px; }
        .title-section h1 { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
        
        .role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 30px; }
        .role-card { border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; cursor: pointer; text-align: center; transition: all 0.2s; }
        .role-card.selected { border-color: #3b82f6; background: #eff6ff; }
        
        .input-group { margin-bottom: 16px; text-align: left; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #334155;}
        .input-wrapper input, .input-wrapper select { width: 100%; padding: 12px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; }
        
        .btn-submit { width: 100%; padding: 14px; background: #3b82f6; color: #fff; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; transition: 0.2s; }
        .btn-submit:hover { background: #2563eb; }
        .btn-back { width: 100%; padding: 14px; background: #f1f5f9; color: #334155; font-weight: 600; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px; }
        
        .otp-inputs { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .otp-box { width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #e2e8f0; border-radius: 10px; outline: none; }
        .otp-box:focus { border-color: #3b82f6; }
      `}</style>

      <div className="onboard-wrapper">
        <div className="onboard-card">
          
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title-section">
                <h1>Chào mừng bạn đến với Careerio!</h1>
                <p>Vui lòng chọn mục đích chính khi tham gia hệ thống.</p>
              </div>
              <div className="role-grid">
                <div className={`role-card ${role === 'candidate' ? 'selected' : ''}`} onClick={() => setRole('candidate')}>
                  <User size={30} style={{margin:'0 auto 10px', color: '#3b82f6'}} />
                  <h3>Tôi là Ứng viên</h3>
                </div>
                <div className={`role-card ${role === 'business' ? 'selected' : ''}`} onClick={() => setRole('business')}>
                  <Building2 size={30} style={{margin:'0 auto 10px', color: '#3b82f6'}} />
                  <h3>Nhà tuyển dụng</h3>
                </div>
              </div>
              <button className="btn-submit" onClick={() => setStep(2)}>Tiếp tục</button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleRequestOtp} style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title-section">
                <h1>{role === 'candidate' ? 'Hồ sơ Ứng viên' : 'Thông tin Doanh nghiệp'}</h1>
              </div>

              {role === 'candidate' ? (
                <>
                  <div className="input-group">
                    <label>Số điện thoại liên hệ</label>
                    <div className="input-wrapper"><input type="tel" name="phone" value={candidateData.phone} onChange={handleCandidateChange} placeholder="Nhập sđt..." required/></div>
                  </div>
                  <div className="input-group">
                    <label>Khu vực làm việc</label>
                    <div className="input-wrapper">
                      <select name="city" value={candidateData.city} onChange={handleCandidateChange}>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">Đà Nẵng</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label>Tên Công Ty *</label>
                    <div className="input-wrapper"><input type="text" name="companyName" value={businessData.companyName} onChange={handleBusinessChange} required/></div>
                  </div>
                  <div className="input-group">
                    <label>Mã Số Thuế *</label>
                    <div className="input-wrapper"><input type="text" name="taxCode" value={businessData.taxCode} onChange={handleBusinessChange} required/></div>
                  </div>
                  <div className="input-group">
                    <label>Khu Vực *</label>
                    <div className="input-wrapper">
                      <select name="city" value={businessData.city} onChange={handleBusinessChange}>
                        <option value="Hà Nội">Hà Nội</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      </select>
                    </div>
                  </div>
                  <div className="input-group">
                    <label>Địa Chỉ Cụ Thể *</label>
                    <div className="input-wrapper"><input type="text" name="address" value={businessData.address} onChange={handleBusinessChange} required/></div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Đang gửi mã...' : 'Xác nhận & Nhận mã OTP'}
              </button>
              <button type="button" className="btn-back" onClick={() => setStep(1)} disabled={loading}>Quay lại</button>
            </form>
          )}

          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title-section">
                <h1>Xác thực Email</h1>
                <p>Vui lòng nhập mã OTP vừa được gửi đến <b>{tempEmail}</b></p>
              </div>
              
              <div className="otp-inputs">
                {[...Array(6)].map((_, index) => (
                  <input key={index} id={`otp-${index}`} type="text" maxLength="1" className="otp-box" value={otp[index]}
                    onChange={(e) => handleOtpChange(e.target.value, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                  />
                ))}
              </div>

              <button className="btn-submit" onClick={handleVerifyComplete} disabled={loading}>
                {loading ? 'Đang xác thực...' : 'Hoàn tất'}
              </button>
              <button type="button" className="btn-back" onClick={() => setStep(2)} disabled={loading}>Quay lại</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Onboarding;