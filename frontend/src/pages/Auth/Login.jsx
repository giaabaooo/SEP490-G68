import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Ngăn user đã login quay lại trang này
  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Email hoặc mật khẩu không chính xác');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('Đăng nhập thành công!');
      setTimeout(() => navigate('/home', { replace: true }), 800);
    } catch (error) {
      toast.error('Lỗi kết nối. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/auth/google-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: codeResponse.access_token }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Đăng nhập thất bại');
          return;
        }

        if (data.isNewUser) {
          sessionStorage.setItem('tempToken', data.token);
          sessionStorage.setItem('isNewGoogleUser', 'true');
          navigate('/onboarding', { replace: true });
        } else {
          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          toast.success('Đăng nhập thành công!');
          setTimeout(() => navigate('/home', { replace: true }), 800);
        }
      } catch (error) {
        toast.error('Lỗi kết nối. Vui lòng thử lại');
      } finally {
        setLoading(false);
      }
    },
    onError: () => toast.error('Lỗi Google Login. Vui lòng thử lại'),
    flow: 'implicit'
  });

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .login-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4f8; padding: 20px; font-family: 'Inter', sans-serif; }
        .login-card { display: flex; background: #fff; width: 100%; max-width: 960px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); overflow: hidden; }
        
        /* Left Side - Themed Gradient */
        .login-left { flex: 1; padding: 60px 40px; display: flex; flex-direction: column; justify-content: center; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; position: relative; overflow: hidden; }
        .login-left::after { content: ''; position: absolute; width: 400px; height: 400px; background: rgba(255,255,255,0.1); border-radius: 50%; top: -100px; right: -100px; }
        .login-left::before { content: ''; position: absolute; width: 300px; height: 300px; background: rgba(255,255,255,0.05); border-radius: 50%; bottom: -50px; left: -100px; }
        .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 30px; position: relative; z-index: 10; }
        .brand-name { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .title { font-size: 32px; font-weight: 700; color: #ffffff; margin-bottom: 20px; line-height: 1.3; position: relative; z-index: 10; }
        .desc { font-size: 15px; color: #bfdbfe; line-height: 1.6; position: relative; z-index: 10; }
        
        /* Right Side - Form */
        .login-right { flex: 1; padding: 60px 50px; background: #ffffff; }
        .tabs { display: flex; gap: 32px; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; }
        .tab { padding-bottom: 12px; font-size: 16px; font-weight: 600; color: #94a3b8; cursor: pointer; position: relative; transition: color 0.2s; }
        .tab:hover { color: #64748b; }
        .tab.active { color: #0f172a; }
        .tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background-color: #3b82f6; border-radius: 3px 3px 0 0; }
        
        .form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: #475569; }
        .input-group input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; color: #0f172a; outline: none; transition: all 0.2s; background: #f8fafc; }
        .input-group input::placeholder { color: #94a3b8; }
        .input-group input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; margin-top: 10px; transition: background-color 0.2s, transform 0.1s; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
        .btn-submit:hover { background-color: #2563eb; }
        .btn-submit:active { transform: translateY(1px); }
        
        .divider-text { display: flex; align-items: center; gap: 16px; margin: 24px 0; }
        .divider-text::before, .divider-text::after { content: ''; flex: 1; height: 1px; background-color: #e2e8f0; }
        .divider-text span { font-size: 13px; color: #64748b; font-weight: 500; }
        
        .btn-google { width: 100%; padding: 14px; background-color: #ffffff; color: #334155; font-weight: 600; font-size: 15px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .btn-google:hover { background-color: #f8fafc; border-color: #cbd5e1; }
        .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
        .google-icon { width: 20px; height: 20px; }
      `}</style>

      <div className="login-wrapper">
        <div className="login-card">
          
          <div className="login-left">
            <div className="brand">
              <Link to="/home" style={{ display: 'flex', alignItems: 'center' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#ffffff" />
                </svg>
              </Link>
              <span className="brand-name">Careerio</span>
            </div>
            <h1 className="title">Đánh giá thực chất.<br />Kết nối chính xác.</h1>
            <p className="desc">Hệ sinh thái Marketplace hỗ trợ ứng dụng Trí tuệ Nhân tạo AI vào quy trình tuyển dụng và đánh giá năng lực thực chiến.</p>
          </div>

          <div className="login-right">
            <div className="tabs">
              <div className="tab active">Đăng nhập</div>
              <Link to="/register" className="tab" style={{ textDecoration: 'none' }}>Đăng ký</Link>
            </div>
            
            <form className="form" onSubmit={handleLogin}>
              <div className="input-group">
                <label>Địa chỉ Email</label>
                <input type="email" placeholder="Nhập email của bạn..." value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Mật khẩu</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng nhập vào hệ thống'}
              </button>
            </form>
            
            <div className="divider-text">
              <span>hoặc tiếp tục với</span>
            </div>
            
            <button type="button" className="btn-google" onClick={() => googleLogin()} disabled={loading}>
              <svg className="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Đăng nhập bằng Google
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;