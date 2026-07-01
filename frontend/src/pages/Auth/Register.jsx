import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      
      const body = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: role
      };
      
      if (role === 'business') {
        body.companyName = formData.companyName || '';
      }

      const registerRes = await fetch('http://localhost:5000/api/auth/register', {
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
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Đăng ký thành công!');
      
      // ĐÃ SỬA: Điều hướng dựa trên role vừa đăng ký
      setTimeout(() => {
        if (data.user.role === 'business') {
          navigate('/business/dashboard', { replace: true });
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
        .register-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4f8; padding: 20px; font-family: 'Inter', sans-serif; }
        .register-card { display: flex; background: #fff; width: 100%; max-width: 960px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); overflow: hidden; max-height: 90vh; }
        
        /* Left Side - Themed Gradient */
        .register-left { flex: 1; padding: 60px 40px; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; position: relative; overflow: hidden; }
        .register-left::after { content: ''; position: absolute; width: 400px; height: 400px; background: rgba(255,255,255,0.1); border-radius: 50%; top: -100px; right: -100px; }
        .register-left::before { content: ''; position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -50px; left: -100px; }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; position: relative; z-index: 10; }
        .brand-name { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .title { font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 20px; line-height: 1.3; position: relative; z-index: 10; }
        .desc { font-size: 15px; color: #bfdbfe; line-height: 1.6; position: relative; z-index: 10; }
        
        /* Right Side - Form */
        .register-right { flex: 1; padding: 40px 50px; background: #ffffff; overflow-y: auto; }
        .register-right::-webkit-scrollbar { width: 6px; }
        .register-right::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 10px; }
        
        .tabs { display: flex; gap: 32px; margin-bottom: 30px; border-bottom: 2px solid #f1f5f9; }
        .tab { padding-bottom: 12px; font-size: 16px; font-weight: 600; color: #94a3b8; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab:hover { color: #64748b; }
        .tab.active { color: #0f172a; }
        .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background-color: #3b82f6; border-radius: 3px 3px 0 0; }
        
        .form { display: flex; flex-direction: column; gap: 18px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: #475569; }
        .input-group input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; transition: all 0.2s; background: #f8fafc; }
        .input-group input::placeholder { color: #94a3b8; }
        .input-group input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        /* Chỉnh CSS nút Role */
        .role-selector { display: flex; gap: 12px; margin-top: 4px; }
        .role-btn { flex: 1; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; text-align: center; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; color: #64748b; background-color: #f8fafc; }
        .role-btn:hover { border-color: #cbd5e1; }
        .role-btn.active { border-color: #3b82f6; background-color: #eff6ff; color: #1d4ed8; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
        .btn-submit:hover { background-color: #2563eb; }
        .btn-submit:active { transform: translateY(1px); }
        
        /* OTP Step Styling */
        .otp-step { animation: fadeIn 0.3s ease; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 400px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .otp-title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 12px; text-align: center; }
        .otp-desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 32px; text-align: center; }
        .otp-desc strong { color: #0f172a; }
        .otp-inputs { display: flex; gap: 12px; margin-bottom: 24px; justify-content: center; }
        .otp-box { width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: 700; border: 1.5px solid #e2e8f0; border-radius: 12px; outline: none; color: #0f172a; background: #f8fafc; transition: all 0.2s; }
        .otp-box:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .otp-timeout { font-size: 13px; color: #94a3b8; margin-bottom: 32px; text-align: center; }
      `}</style>

      <div className="register-wrapper">
        <div className="register-card">
          
          <div className="register-left">
            <div className="brand">
              <Link to="/home" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#ffffff" />
                </svg>
              </Link>
              <span className="brand-name">Careerio</span>
            </div>
            <h1 className="title">Đánh giá thực chất.<br />Kết nối chính xác.</h1>
            <p className="desc">Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến.</p>
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
                  <input type="text" name="fullName" placeholder="VD: Nguyễn Văn A" value={formData.fullName} onChange={handleChange} required />
                </div>
                
                <div className="input-group">
                  <label>Email</label>
                  <input type="email" name="email" placeholder="Nhập địa chỉ email của bạn" value={formData.email} onChange={handleChange} required />
                </div>
                
                <div className="input-group">
                  <label>Mật khẩu</label>
                  <input type="password" name="password" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={handleChange} required />
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
                    <label>Tên công ty</label>
                    <input type="text" name="companyName" placeholder="Tên doanh nghiệp của bạn" value={formData.companyName} onChange={handleChange} required />
                  </div>
                )}

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Tạo tài khoản miễn phí'}
                </button>
              </form>
            ) : (
              <div className="otp-step">
                <h2 className="otp-title">Xác thực Email</h2>
                <p className="otp-desc">Chúng tôi đã gửi mã bảo mật 6 số đến:<br/><strong>{formData.email}</strong></p>
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
                    />
                  ))}
                </div>
                <p className="otp-timeout">Mã hết hạn trong 5 phút</p>
                <button className="btn-submit" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? 'Đang xác thực...' : 'Hoàn tất đăng ký'}
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