import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [isError, setIsError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setIsError(false);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

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
    <>
      <style>{`
        .login-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle at center, #f0f4fb 0%, #e1e9f4 100%); }
        .login-card { display: flex; background: #fff; width: 820px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04); overflow: hidden; }
        .login-left { flex: 1; padding: 48px; display: flex; flex-direction: column; justify-content: center; }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        .brand-name { font-size: 22px; font-weight: 700; color: #1d4ed8; }
        .title { font-size: 22px; font-weight: 700; color: #111827; margin-bottom: 16px; line-height: 1.3; }
        .desc { font-size: 13px; color: #4b5563; line-height: 1.6; }
        .divider { width: 1px; background-color: #f3f4f6; margin: 40px 0; }
        .login-right { flex: 1; padding: 48px; }
        .tabs { display: flex; gap: 24px; margin-bottom: 32px; border-bottom: 1px solid #e5e7eb; }
        .tab { padding-bottom: 12px; font-size: 14px; font-weight: 600; color: #6b7280; cursor: pointer; position: relative; }
        .tab.active { color: #111827; }
        .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; width: 100%; height: 2px; background-color: #1d4ed8; }
        .form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 12px; font-weight: 600; color: #374151; }
        .input-group input { width: 100%; padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #111827; outline: none; transition: all 0.2s; }
        .input-group input::placeholder { color: #9ca3af; }
        .input-group input:focus { border-color: #1d4ed8; box-shadow: 0 0 0 2px rgba(29, 78, 216, 0.1); }
        .input-filled { background-color: #eff6ff !important; border-color: #bfdbfe !important; }
        .has-error input { background-color: #fef2f2; border-color: #f87171; color: #b91c1c; }
        .has-error input:focus { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1); }
        .password-input-wrapper { position: relative; }
        .eye-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); cursor: pointer; }
        .error-text { font-size: 12px; color: #dc2626; margin-top: 2px; font-weight: 500; }
        .btn-submit { width: 100%; padding: 12px; background-color: #1d4ed8; color: #fff; font-weight: 600; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; margin-top: 8px; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #1e40af; }
        .hint { margin-top: 24px; font-size: 11px; color: #6b7280; line-height: 1.5; }
        .hint strong { color: #374151; }
      `}</style>

      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-left">
            <div className="brand">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8" />
              </svg>
              <span className="brand-name">Careerio</span>
            </div>
            <h1 className="title">Đánh giá thực chất. Kết nối chính xác.</h1>
            <p className="desc">Hệ sinh thái Marketplace hỗ trợ ứng tuyển và tuyển dụng dựa trên năng lực thực chiến, tối ưu CV và phỏng vấn giả lập.</p>
          </div>

          <div className="divider"></div>

          <div className="login-right">
            <div className="tabs">
              <div className="tab active">Đăng nhập</div>
              <Link to="/register" className="tab" style={{ textDecoration: 'none', color: 'inherit' }}>
                Đăng ký
              </Link>
            </div>

            <form className="form" onSubmit={handleLogin}>
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
                  {isError && (
                    <svg className="eye-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  )}
                </div>
                {isError && <span className="error-text">Email hoặc mật khẩu không chính xác.</span>}
              </div>

              <button type="submit" className="btn-submit">Đăng nhập</button>
            </form>

            <p className="hint">Gợi ý: Nhập email chứa từ <strong>"hr"</strong> (ví dụ: hr@company.com) để đăng nhập thẳng vào vai trò Nhà tuyển dụng.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;