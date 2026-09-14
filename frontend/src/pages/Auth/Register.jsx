import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Register = () => {
  const [role, setRole] = useState('candidate');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const [formData, setFormData] = useState({
    fullName: '', email: '', password: '', companyName: ''
  });
  const [otp, setOtp] = useState(Array(6).fill(''));

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleOtpChange = (value, index) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      setTimeout(() => document.getElementById(`otp-${index + 1}`)?.focus(), 0);
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;
    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    digits.forEach((digit, i) => {
      newOtp[i] = digit;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(digits.length, 5);
    document.getElementById(`otp-${nextIndex}`)?.focus();
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const cleanFullName = formData.fullName.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password.trim();

    if (!cleanFullName) {
      toast.warning('Vui lòng nhập họ và tên');
      return;
    }
    if (!cleanEmail) {
      toast.warning('Vui lòng nhập email');
      return;
    }
    if (cleanPassword.length < 6) {
      toast.warning('Mật khẩu phải có tối thiểu 6 ký tự');
      return;
    }
    if (role === 'business' && !formData.companyName?.trim()) {
      toast.warning('Vui lòng nhập tên công ty/doanh nghiệp');
      return;
    }

    try {
      setLoading(true);

      const body = {
        fullName: cleanFullName,
        email: cleanEmail,
        password: cleanPassword,
        role: role
      };

      if (role === 'business') {
        body.companyName = formData.companyName.trim();
      }

      const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const registerData = await registerRes.json();
      if (!registerRes.ok) throw new Error(registerData.message || 'Đăng ký thất bại');

      setStep(2);
      setCountdown(60);
      setOtp(Array(6).fill(''));
      toast.success('Mã OTP xác thực đã được gửi về email của bạn!');
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    } catch (err) {
      toast.error(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    try {
      setResending(true);
      const res = await fetch(`${API_BASE}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Không thể gửi lại mã');

      setCountdown(60);
      setOtp(Array(6).fill(''));
      toast.success('Đã gửi lại mã OTP mới về email!');
      setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
    } catch (err) {
      toast.error(err.message || 'Lỗi gửi lại OTP');
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length !== 6) {
      toast.warning('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: enteredOtp
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mã OTP không hợp lệ');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Đăng ký tài khoản thành công!');

      setTimeout(() => {
        if (data.user.role === 'business') {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'OTP không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .register-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f8fafc; padding: 20px; font-family: 'Inter', sans-serif; }
        .register-card { display: flex; background: #fff; width: 100%; max-width: 980px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); overflow: hidden; max-height: 92vh; border: 1px solid #e2e8f0; }
        
        .register-left { 
          flex: 1; padding: 60px 40px; display: flex; flex-direction: column; 
          justify-content: center; align-items: center; text-align: center; 
          background: linear-gradient(135deg, #064e3b 0%, #059669 100%); 
          color: white; position: relative; overflow: hidden; 
        }
        .register-left::after { content: ''; position: absolute; width: 400px; height: 400px; background: rgba(255,255,255,0.08); border-radius: 50%; top: -100px; right: -100px; }
        .register-left::before { content: ''; position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.04); border-radius: 50%; bottom: -50px; left: -100px; }
        
        .brand { margin-bottom: 40px; position: relative; z-index: 10; display: flex; justify-content: center; width: 100%; }
        .brand-logo-wrapper { 
          background: #ffffff; padding: 22px 40px; border-radius: 24px; display: inline-flex; 
          align-items: center; justify-content: center;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2), 0 0 0 10px rgba(255,255,255,0.12); 
          transition: transform 0.3s ease; 
        }
        .brand-logo-wrapper:hover { transform: translateY(-4px); }
        
        .title { font-size: 32px; font-weight: 800; color: #ffffff; margin-bottom: 16px; line-height: 1.35; position: relative; z-index: 10; }
        .desc { font-size: 15px; color: #a7f3d0; line-height: 1.6; position: relative; z-index: 10; max-width: 90%; font-weight: 500; }
        
        .register-right { flex: 1.1; padding: 40px 48px; background: #ffffff; overflow-y: auto; }
        .register-right::-webkit-scrollbar { width: 6px; }
        .register-right::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .tabs { display: flex; gap: 32px; margin-bottom: 28px; border-bottom: 2px solid #f1f5f9; }
        .tab { padding-bottom: 12px; font-size: 15px; font-weight: 700; color: #64748b; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab:hover { color: #0f172a; }
        .tab.active { color: #059669; }
        .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background-color: #059669; border-radius: 3px 3px 0 0; }
        
        .form { display: flex; flex-direction: column; gap: 16px; }
        .input-group { display: flex; flex-direction: column; gap: 6px; }
        .input-group label { font-size: 13px; font-weight: 700; color: #334155; }
        .input-group input { width: 100%; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 14px; color: #0f172a; outline: none; transition: all 0.2s; background: #f8fafc; }
        .input-group input::placeholder { color: #94a3b8; }
        .input-group input:focus { background: #ffffff; border-color: #059669; box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12); }
        
        .role-selector { display: flex; gap: 12px; margin-top: 4px; }
        .role-btn { flex: 1; padding: 12px 14px; border: 1.5px solid #cbd5e1; border-radius: 12px; text-align: center; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; color: #475569; background-color: #f8fafc; user-select: none; }
        .role-btn:hover { border-color: #94a3b8; }
        .role-btn.active { border-color: #059669; background-color: #ecfdf5; color: #065f46; box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12); }
        
        .btn-submit { width: 100%; padding: 14px; background-color: #059669; color: #fff; font-weight: 800; font-size: 15px; border: none; border-radius: 12px; cursor: pointer; margin-top: 10px; transition: all 0.2s; box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.25); }
        .btn-submit:hover { background-color: #047857; }
        .btn-submit:active { transform: translateY(1px); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        
        .otp-step { animation: fadeIn 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .otp-title { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 8px; text-align: center; }
        .otp-desc { font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 28px; text-align: center; }
        .otp-desc strong { color: #059669; font-weight: 800; }
        .otp-inputs { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }
        .otp-box { width: 48px; height: 56px; text-align: center; font-size: 22px; font-weight: 800; border: 1.5px solid #cbd5e1; border-radius: 12px; outline: none; color: #0f172a; background: #f8fafc; transition: all 0.2s; }
        .otp-box:focus { background: #ffffff; border-color: #059669; box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12); }
        .otp-timeout { font-size: 13px; color: #64748b; margin-bottom: 24px; text-align: center; font-weight: 600; }
      `}</style>

      <div className="register-wrapper">
        <div className="register-card">
          
          <div className="register-left">
            <div className="brand">
              <Link to="/home" className="brand-logo-wrapper" style={{ textDecoration: 'none' }}>
                <img src="/logo-careerio.png" alt="Careerio Logo" style={{ height: '70px', width: 'auto', objectFit: 'contain' }} />
              </Link>
            </div>
            <h1 className="title">Đánh giá thực chất.<br />Kết nối chính xác.</h1>
            <p className="desc">Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng thông minh dựa trên năng lực thực chiến.</p>
          </div>

          <div className="register-right">
            <div className="tabs">
              <Link to="/login" className="tab" style={{ textDecoration: 'none' }}>Đăng nhập</Link>
              <div className="tab active">Đăng ký</div>
            </div>

            {step === 1 ? (
              <form className="form" onSubmit={handleRegister}>
                <div className="input-group">
                  <label>Họ và tên</label>
                  <input 
                    type="text" 
                    name="fullName" 
                    placeholder="VD: Nguyễn Văn A" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="input-group">
                  <label>Email</label>
                  <input 
                    type="email" 
                    name="email" 
                    placeholder="Nhập địa chỉ email của bạn" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="input-group">
                  <label>Mật khẩu</label>
                  <input 
                    type="password" 
                    name="password" 
                    placeholder="Tối thiểu 6 ký tự" 
                    value={formData.password} 
                    onChange={handleChange} 
                    minLength="6" 
                    required 
                  />
                </div>
                
                <div className="input-group">
                  <label>Tôi muốn tham gia với vai trò:</label>
                  <div className="role-selector">
                    <div
                      className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
                      onClick={() => setRole('candidate')}
                    >
                      👤 Ứng viên
                    </div>
                    <div
                      className={`role-btn ${role === 'business' ? 'active' : ''}`}
                      onClick={() => setRole('business')}
                    >
                      🏢 Nhà tuyển dụng
                    </div>
                  </div>
                </div>

                {role === 'business' && (
                  <div className="input-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                    <label>Tên công ty / Doanh nghiệp</label>
                    <input 
                      type="text" 
                      name="companyName" 
                      placeholder="Tên doanh nghiệp của bạn" 
                      value={formData.companyName} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Tạo tài khoản miễn phí'}
                </button>
              </form>
            ) : (
              <div className="otp-step">
                <h2 className="otp-title">Xác thực Email</h2>
                <p className="otp-desc">
                  Chúng tôi đã gửi mã bảo mật 6 số đến:<br />
                  <strong>{formData.email}</strong>
                </p>
                <div className="otp-inputs">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index} 
                      id={`otp-${index}`} 
                      type="text" 
                      inputMode="numeric" 
                      autoComplete="one-time-code" 
                      maxLength="1"
                      className="otp-box" 
                      value={otp[index]}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      onPaste={handleOtpPaste}
                    />
                  ))}
                </div>
                
                <div className="otp-timeout flex items-center justify-center gap-2 mb-6">
                  {countdown > 0 ? (
                    <span className="text-slate-500 font-semibold">
                      Gửi lại mã sau: <strong className="text-emerald-700 font-black">{countdown}s</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resending}
                      className="text-xs font-black text-emerald-600 hover:text-emerald-800 hover:underline cursor-pointer border-none bg-transparent"
                    >
                      {resending ? 'Đang gửi lại...' : 'Chưa nhận được mã? Gửi lại ngay'}
                    </button>
                  )}
                </div>

                <button className="btn-submit" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(Array(6).fill('')); }}
                  className="mt-4 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer border-none bg-transparent hover:underline"
                >
                  ← Quay lại thay đổi thông tin
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
