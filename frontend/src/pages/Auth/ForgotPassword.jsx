import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  // State để kiểm soát việc đang ở bước nhập Email hay bước nhập OTP
  const [isOtpSent, setIsOtpSent] = useState(false);

  // Xử lý gửi Email
  const handleSendEmail = (e) => {
    e.preventDefault();
    // Giả lập gọi API gửi OTP thành công
    console.log('Đã gửi mã OTP khôi phục đến email:', email);
    setIsOtpSent(true); // Chuyển sang giao diện nhập OTP
  };

  // Xử lý xác nhận OTP
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    // Xử lý logic gọi API gửi mã OTP lên Server để kiểm tra
    console.log('Mã OTP người dùng nhập là:', otp);
    alert('Xác thực OTP thành công! Tại đây bạn có thể chuyển hướng user sang trang đặt mật khẩu mới.');
  };

  return (
    <>
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
        
        /*  Style riêng cho ô nhập OTP (căn giữa, dãn chữ) */
        .otp-input { text-align: center; font-size: 20px !important; letter-spacing: 8px; font-weight: bold; }
        
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #2563eb; }
        .back-link { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; font-size: 14px; color: #64748b; text-decoration: none; font-weight: 500; transition: color 0.2s; cursor: pointer; }
        .back-link:hover { color: #0f172a; }
        
        .resend-text { text-align: center; font-size: 13px; color: #64748b; margin-top: 16px; }
        .resend-link { color: #3b82f6; font-weight: 600; cursor: pointer; text-decoration: none; border: none; background: none; }
        .resend-link:hover { text-decoration: underline; }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="title">Khôi phục mật khẩu</h2>
          
          {!isOtpSent ? (
            /* =========================================
               BƯỚC 1: FORM NHẬP EMAIL
               ========================================= */
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
                
                <button type="submit" className="btn-submit">
                  Gửi mã xác nhận
                </button>
              </form>
              
              <Link to="/login" className="back-link">
                <ArrowLeft size={16} /> Quay lại đăng nhập
              </Link>
            </>
          ) : (
            /* =========================================
               BƯỚC 2: FORM NHẬP MÃ OTP
               ========================================= */
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
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))} // Dùng regex để chặn gõ chữ cái
                    className="otp-input"
                    required 
                  />
                </div>
                
                <button type="submit" className="btn-submit">
                  Xác nhận OTP
                </button>
              </form>
              
              <div className="resend-text">
                Chưa nhận được mã? <button type="button" className="resend-link" onClick={() => alert('Đã gửi lại mã OTP!')}>Gửi lại</button>
              </div>

              {/* Nút quay lại để sửa Email nếu nhập sai */}
              <div className="back-link" onClick={() => setIsOtpSent(false)}>
                <ArrowLeft size={16} /> Thay đổi địa chỉ email
              </div>
            </>
          )}
          
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;