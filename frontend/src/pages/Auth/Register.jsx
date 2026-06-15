import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [role, setRole] = useState('candidate');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', companyName: '', size: '', address: ''
  });
  const [otp, setOtp] = useState(Array(6).fill(''));

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

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

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const endpoint = role === 'candidate' ? 'http://localhost:5000/api/auth/register' : 'http://localhost:5000/api/auth/register-business';
      const body = role === 'candidate' 
        ? { fullName: formData.fullName, email: formData.email, password: formData.password }
        : { fullName: formData.fullName, email: formData.email, password: formData.password, companyName: formData.companyName };

      const registerRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.message);
      
      setStep(2);
      toast.success('Vui lòng kiểm tra email để lấy mã OTP!');
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: otp.join('') })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem('token', data.token);
      toast.success('Đăng ký thành công!');
      setTimeout(() => navigate('/home'), 1500);
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
        .register-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #f0f4fb 0%, #e1e9f4 100%); padding: 20px; }
        .register-card { display: flex; background: #fff; width: 820px; max-height: 90vh; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden; }
        .register-left { flex: 1; padding: 48px; display: flex; flex-direction: column; justify-content: center; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .brand-name { font-size: 22px; font-weight: 700; color: #1d4ed8; }
        .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 16px; line-height: 1.3; }
        .desc { font-size: 13px; color: #4b5563; line-height: 1.6; }
        .divider { width: 1px; background-color: #f3f4f6; margin: 40px 0; }
        .register-right { flex: 1; padding: 40px 48px; overflow-y: auto; }
        .register-right::-webkit-scrollbar { width: 6px; }
        .register-right::-webkit-scrollbar-thumb { background-color: #d1d5db; border-radius: 10px; }
        .tabs { display: flex; gap: 24px; margin-bottom: 28px; border-bottom: 1px solid #e5e7eb; }
        .tab { padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; position: relative; }
        .tab.active { color: #111827; }
        .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background-color: #1d4ed8; }
        .form { display: flex; flex-direction: column; gap: 16px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 12px; font-weight: 600; color: #374151; }
        .input-group input, .input-group select { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; outline: none; background: #fff; transition: all 0.2s; }
        .input-group input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1); }
        .btn-submit { width: 100%; padding: 12px; background-color: #1d4ed8; color: #fff; font-weight: 600; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; margin-top: 10px; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #1e40af; }
        .otp-step { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .otp-title { font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 10px; }
        .otp-desc { font-size: 13px; color: #4b5563; line-height: 1.5; margin-bottom: 24px; }
        .otp-inputs { display: flex; gap: 12px; margin-bottom: 16px; }
        .otp-box { width: 42px; height: 46px; text-align: center; font-size: 18px; font-weight: 700; border: 1px solid #d1d5db; border-radius: 8px; outline: none; color: #111827; }
        .otp-box:focus { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1); }
        .otp-timeout { font-size: 12px; color: #6b7280; margin-bottom: 24px; }
      `}</style>

      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-left">
            <div className="brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" fill="#1d4ed8" />
              </svg>
              <span className="brand-name">Careerio</span>
            </div>
            <h1 className="title">Đánh giá thực chất. Kết nối chính xác.</h1>
            <p className="desc">Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến.</p>
          </div>
          <div className="divider"></div>

          <div className="register-right">
            <div className="tabs">
              <div className="tab" onClick={() => navigate('/login')}>Đăng nhập</div>
              <div className="tab active">Đăng ký</div>
            </div>

            {step === 1 ? (
              <form className="form" onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Họ và tên</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Mật khẩu</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="btn-submit">
                  {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
                </button>
              </form>
            ) : (
              <div className="otp-step">
                <h2 className="otp-title">Bước 2: Xác thực mã OTP</h2>
                <p className="otp-desc">Chúng tôi đã gửi mã đến: <strong>{formData.email}</strong></p>
                <div className="otp-inputs">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index} id={`otp-${index}`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength="1"
                      className="otp-box" value={otp[index]}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    />
                  ))}
                </div>
                <p className="otp-timeout">Mã hết hạn trong 5 phút</p>
                <button className="btn-submit" onClick={handleVerifyOtp}>
                  {loading ? 'Đang xác thực...' : 'Xác nhận'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;