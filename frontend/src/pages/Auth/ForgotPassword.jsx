import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState('email');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Không thể gửi mã OTP');
        return;
      }

      toast.success(data.message || 'Đã gửi mã OTP');
      setStep('otp');
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'OTP không hợp lệ');
        return;
      }

      toast.success('OTP hợp lệ. Hãy nhập mật khẩu mới');
      setStep('reset');
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Không thể đặt lại mật khẩu');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Đặt lại mật khẩu thành công! Đang đăng nhập...');

      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 800);
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      toast.error('Vui lòng nhập email trước');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.message || 'Không thể gửi lại OTP');
        return;
      }

      toast.success('Đã gửi lại mã OTP');
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .auth-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4f8; padding: 20px; font-family: 'Inter', sans-serif; }
        .auth-card { background: #fff; width: 100%; max-width: 480px; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
        .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 10px; text-align: center; }
        .desc { font-size: 14px; color: #64748b; margin-bottom: 30px; text-align: center; line-height: 1.5; }
        .form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: #475569; }
        .input-group input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .input-group input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .otp-input { text-align: center; font-size: 20px !important; letter-spacing: 8px; font-weight: bold; }
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #2563eb; }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }
        .back-link { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; font-size: 14px; color: #64748b; text-decoration: none; font-weight: 500; transition: color 0.2s; cursor: pointer; }
        .back-link:hover { color: #0f172a; }
        .resend-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 16px; }
        .resend-link { color: #3b82f6; font-weight: 600; cursor: pointer; text-decoration: none; border: none; background: none; }
        .resend-link:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="title">Khôi phục mật khẩu</h2>

          {step === 'email' && (
            <>
              <p className="desc">Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi cho bạn một mã OTP để đặt lại mật khẩu.</p>

              <form className="form" onSubmit={handleSendEmail}>
                <div className="input-group">
                  <label>Địa chỉ Email</label>
                  <input
                    type="email"
                    placeholder="Nhập email của bạn..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
                </button>
              </form>

              <Link to="/login" className="back-link">
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </Link>
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="desc">
                Mã xác nhận gồm 6 chữ số đã được gửi đến email <br/>
                <strong style={{ color: '#0f172a' }}>{email}</strong>
              </p>

              <form className="form" onSubmit={handleVerifyOtp}>
                <div className="input-group">
                  <label>Mã OTP</label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    className="otp-input"
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Đang xác minh...' : 'Xác nhận OTP'}
                </button>
              </form>

              <div className="resend-text">
                Chưa nhận được mã? <button type="button" className="resend-link" onClick={handleResendOtp} disabled={loading}>Gửi lại</button>
              </div>

              <div className="back-link" onClick={() => setStep('email')}>
                <ArrowLeft size={16} /> Thay đổi địa chỉ email
              </div>
            </>
          )}

          {step === 'reset' && (
            <>
              <p className="desc">Tạo mật khẩu mới cho tài khoản <strong style={{ color: '#0f172a' }}>{email}</strong>.</p>

              <form className="form" onSubmit={handleResetPassword}>
                <div className="input-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-submit" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
                </button>
              </form>

              <div className="back-link" onClick={() => setStep('otp')}>
                <ArrowLeft size={16} /> Quay lại nhập OTP
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;