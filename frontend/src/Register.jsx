import React, { useState } from 'react';
import './Register.css';

const Register = () => {
  // state quản lý vai trò: 'candidate' (Ứng viên) hoặc 'employer' (Nhà tuyển dụng)
  const [role, setRole] = useState('candidate');
  
  // state quản lý bước: 1 (Điền form) hoặc 2 (Nhập OTP)
  const [step, setStep] = useState(1);

  const handleRegister = (e) => {
    e.preventDefault();
    setStep(2); // Chuyển sang bước nhập OTP khi bấm Tạo tài khoản
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        
        {/* === CỘT TRÁI === */}
        <div className="register-left">
          <div className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8"/>
            </svg>
            <span className="brand-name">Careerio</span>
          </div>
          <h1 className="title">Đánh giá thực chất. Kết nối chính xác.</h1>
          <p className="desc">
            Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến, tối ưu CV và phỏng vấn giả lập.
          </p>
        </div>

        <div className="divider"></div>

        {/* === CỘT PHẢI === */}
        <div className="register-right">
          <div className="tabs">
            <div className="tab">Đăng nhập</div>
            <div className="tab active">Đăng ký</div>
          </div>

          {step === 1 ? (
            /* === BƯỚC 1: FORM ĐĂNG KÝ === */
            <form className="form" onSubmit={handleRegister}>
              <div className="input-group">
                <label>Họ và tên</label>
                <input type="text" placeholder="Nguyễn Văn A" required />
              </div>

              <div className="input-group">
                <label>Địa chỉ Email</label>
                <input type="email" placeholder="email@example.com" required />
              </div>

              <div className="input-group">
                <label>Mật khẩu</label>
                <input type="password" placeholder="••••••••" required />
              </div>

              <div className="input-group">
                <label>Tôi muốn tham gia với vai trò:</label>
                <div className="role-selector">
                  <div 
                    className={`role-btn ${role === 'candidate' ? 'active' : ''}`}
                    onClick={() => setRole('candidate')}
                  >
                    Ứng viên
                  </div>
                  <div 
                    className={`role-btn ${role === 'employer' ? 'active' : ''}`}
                    onClick={() => setRole('employer')}
                  >
                    Nhà tuyển dụng
                  </div>
                </div>
              </div>

              {/* Các trường nhập liệu chỉ hiện ra khi chọn Nhà tuyển dụng (Ảnh 1) */}
              {role === 'employer' && (
                <div className="employer-fields">
                  <div className="input-group">
                    <label>Tên doanh nghiệp / Công ty</label>
                    <input type="text" placeholder="Công ty TNHH Giải pháp Công nghệ..." required />
                  </div>

                  <div className="input-group">
                    <label>Quy mô công ty</label>
                    <select required>
                      <option value="">10 - 50 nhân viên (SMEs)</option>
                      <option value="50-100">50 - 100 nhân viên</option>
                      <option value="100+">Trên 100 nhân viên</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label>Địa chỉ trụ sở chính</label>
                    <input type="text" placeholder="Quận 1, TP. Hồ Chí Minh..." required />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-submit">Tạo tài khoản</button>
            </form>
          ) : (
            /* === BƯỚC 2: NHẬP MÃ OTP (Ảnh 3) === */
            <div className="otp-step">
              <h2 className="otp-title">Bước 2: Xác thực mã OTP</h2>
              <p className="otp-desc">
                Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến email của bạn: <strong>(example@email.com)</strong>
              </p>
              
              <div className="otp-inputs">
                {/* Tạo 6 ô nhập mã OTP */}
                {[...Array(6)].map((_, index) => (
                  <input key={index} type="text" maxLength="1" className="otp-box" />
                ))}
              </div>
              
              <p className="otp-timeout">Mã hết hạn trong 5 phút</p>
              
              <button 
                className="btn-submit" 
                onClick={() => alert("Đăng ký thành công!")}
              >
                Xác nhận
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;