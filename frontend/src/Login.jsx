import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  // Biến trạng thái để mô phỏng việc hiển thị lỗi (như ảnh 2 của bạn)
  const [isError, setIsError] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // Ngăn trang bị reload lại

    try {
      setIsError(false);

      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/home');
    } catch (error) {
      console.error(error);
      setIsError(true);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">

        {/* === CỘT TRÁI === */}
        <div className="login-left">
          <div className="brand">
            {/* Logo Careerio vẽ bằng SVG */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8" />
            </svg>
            <span className="brand-name">Careerio</span>
          </div>

          <h1 className="title">Đánh giá thực chất. Kết nối chính xác.</h1>

          <p className="desc">
            Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến, tối ưu CV và phỏng vấn giả lập.
          </p>
        </div>

        {/* === ĐƯỜNG KẺ GIỮA === */}
        <div className="divider"></div>

        {/* === CỘT PHẢI === */}
        <div className="login-right">

          <div className="tabs">
            <div className="tab active">Đăng nhập</div>

            <Link
              to="/register"
              className="tab"
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              Đăng ký
            </Link>
          </div>

          <form className="form" onSubmit={handleLogin}>

            {/* Ô nhập Email */}
            <div className="input-group">
              <label>Địa chỉ Email</label>

              <input
                type="email"
                placeholder="email@example.com"
                className={isError ? 'input-filled' : ''}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Ô nhập Mật khẩu (Có xử lý đổi màu khi lỗi) */}
            <div className={`input-group ${isError ? 'has-error' : ''}`}>
              <label>Mật khẩu</label>

              <div className="password-input-wrapper">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                {/* Icon con mắt gạch chéo hiển thị khi có lỗi */}
                {isError && (
                  <svg
                    className="eye-icon"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </div>

              {/* Dòng chữ báo lỗi */}
              {isError && (
                <span className="error-text">
                  Email hoặc mật khẩu không chính xác.
                </span>
              )}
            </div>

            <button type="submit" className="btn-submit">
              Đăng nhập
            </button>

          </form>

          <p className="hint">
            Gợi ý: Nhập email chứa từ <strong>"hr"</strong> (ví dụ: hr@company.com) để đăng nhập thẳng vào vai trò Nhà tuyển dụng.
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;