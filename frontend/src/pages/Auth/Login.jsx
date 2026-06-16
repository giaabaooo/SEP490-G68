import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [isError, setIsError] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState('candidate');
  const [googleUser, setGoogleUser] = useState(null);
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
        toast.error(data.message || 'Email hoặc mật khẩu không chính xác');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('Đăng nhập thành công!');

      // Route dựa trên role
      setTimeout(() => {
        switch(data.user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'business':
            navigate('/business');
            break;
          case 'candidate':
            navigate('/candidate');
            break;
          default:
            navigate('/home');
        }
      }, 500);
    } catch (error) {
      console.error(error);
      setIsError(true);
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        setIsError(false);

        // Gửi access token tới backend
        const response = await fetch('http://localhost:5000/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: codeResponse.access_token }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error('Backend error:', data);
          toast.error(data.message || 'Đăng nhập thất bại');
          return;
        }

        // Nếu user mới, show modal chọn role
        if (data.isNewUser) {
          setGoogleUser(data);
          setSelectedRole('candidate');
          setShowRoleModal(true);
        } else {
          // User cũ - đăng nhập bình thường
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast.success('Đăng nhập thành công!');

          // Route dựa trên role
          setTimeout(() => {
            navigateByRole(data.user.role);
          }, 500);
        }
      } catch (error) {
        console.error('Google login error:', error);
        toast.error('Lỗi kết nối. Vui lòng thử lại');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      toast.error('Lỗi Google Login. Vui lòng thử lại');
    },
    flow: 'implicit'
  });

  const navigateByRole = (role) => {
    switch(role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'business':
        navigate('/business');
        break;
      case 'candidate':
        navigate('/candidate');
        break;
      default:
        navigate('/home');
    }
  };

  const handleRoleSelect = async (role) => {
    try {
      setLoading(true);
      
      // Update role via backend
      const response = await fetch('http://localhost:5000/api/auth/update-role', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${googleUser.token}`
        },
        body: JSON.stringify({ role }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Cập nhật role thất bại');
        return;
      }

      // Lưu vào localStorage
      const userData = { ...googleUser.user, role };
      localStorage.setItem('token', googleUser.token);
      localStorage.setItem('user', JSON.stringify(userData));

      setShowRoleModal(false);
      toast.success(`Đã chọn vai trò: ${role === 'candidate' ? 'Ứng viên' : 'Nhà tuyển dụng'}`);

      // Navigate sau 500ms
      setTimeout(() => {
        navigateByRole(role);
      }, 500);
    } catch (error) {
      console.error('Update role error:', error);
      toast.error('Lỗi cập nhật role');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Lỗi Google Login. Vui lòng thử lại');
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
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
        .has-error input { background-color: #fef2f2; border-color: #f87171; }
        .has-error input:focus { border-color: #ef4444; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.1); }
        .password-input-wrapper { position: relative; }
        .eye-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); cursor: pointer; }
        .error-text { font-size: 12px; color: #dc2626; margin-top: 2px; font-weight: 500; }
        .btn-submit { width: 100%; padding: 12px; background-color: #1d4ed8; color: #fff; font-weight: 600; font-size: 14px; border: none; border-radius: 6px; cursor: pointer; margin-top: 8px; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #1e40af; }
        .divider-text { display: flex; align-items: center; gap: 12px; margin: 20px 0; }
        .divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background-color: #e5e7eb; }
        .divider-text span { font-size: 12px; color: #9ca3af; white-space: nowrap; }
        .btn-google { width: 100%; padding: 12px; background-color: #fff; color: #111827; font-weight: 600; font-size: 14px; border: 1px solid #d1d5db; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .btn-google:hover { background-color: #f9fafb; border-color: #1d4ed8; }
        .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
        .google-icon { width: 18px; height: 18px; }
        .hint { margin-top: 24px; font-size: 11px; color: #6b7280; line-height: 1.5; }
        .hint strong { color: #374151; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
        .modal-content { background: #fff; border-radius: 12px; padding: 40px; max-width: 500px; width: 90%; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); }
        .modal-title { font-size: 20px; font-weight: 700; color: #111827; margin-bottom: 12px; text-align: center; }
        .modal-desc { font-size: 14px; color: #4b5563; text-align: center; margin-bottom: 24px; }
        .role-options { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
        .role-option { padding: 16px; border: 2px solid #d1d5db; border-radius: 8px; cursor: pointer; transition: all 0.2s; text-align: center; font-weight: 600; color: #4b5563; }
        .role-option:hover { border-color: #1d4ed8; background-color: #f9fafb; color: #1d4ed8; }
        .role-option.active { border-color: #1d4ed8; background-color: #eff6ff; color: #1d4ed8; }
        .modal-buttons { display: flex; gap: 12px; }
        .modal-btn { flex: 1; padding: 12px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .modal-btn-primary { background-color: #1d4ed8; color: #fff; }
        .modal-btn-primary:hover { background-color: #1e40af; }
        .modal-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .modal-btn-cancel { background-color: #e5e7eb; color: #111827; }
        .modal-btn-cancel:hover { background-color: #d1d5db; }
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

            <div className="divider-text">
              <span>Hoặc</span>
            </div>

            <button 
              type="button" 
              className="btn-google"
              onClick={() => googleLogin()}
              disabled={loading}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
            </button>

            <p className="hint">Gợi ý: Nhập email chứa từ <strong>"hr"</strong> (ví dụ: hr@company.com) để đăng nhập thẳng vào vai trò Nhà tuyển dụng.</p>
          </div>
        </div>
      </div>

      {/* Role Selection Modal */}
      {showRoleModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowRoleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Chọn vai trò của bạn</h2>
            <p className="modal-desc">Bạn vừa đăng ký thành công. Vui lòng chọn vai trò để tiếp tục</p>
            
            <div className="role-options">
              <div
                className={`role-option ${selectedRole === 'candidate' ? 'active' : ''}`}
                onClick={() => setSelectedRole('candidate')}
              >
                👤 Ứng viên (Tìm việc)
              </div>
              <div
                className={`role-option ${selectedRole === 'business' ? 'active' : ''}`}
                onClick={() => setSelectedRole('business')}
              >
                🏢 Nhà tuyển dụng (Tuyển dụng)
              </div>
            </div>

            <div className="modal-buttons">
              <button 
                className="modal-btn modal-btn-cancel"
                onClick={() => setShowRoleModal(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button 
                className="modal-btn modal-btn-primary"
                onClick={() => handleRoleSelect(selectedRole)}
                disabled={loading}
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;