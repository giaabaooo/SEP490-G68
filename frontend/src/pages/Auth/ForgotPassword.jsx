// File: src/pages/Auth/ForgotPassword.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Xử lý logic gửi email khôi phục mật khẩu ở đây
    console.log('Gửi yêu cầu khôi phục cho:', email);
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
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.2s; }
        .btn-submit:hover { background-color: #2563eb; }
        .back-link { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; font-size: 14px; color: #64748b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .back-link:hover { color: #0f172a; }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="title">Khôi phục mật khẩu</h2>
          <p className="desc">Nhập địa chỉ email đã đăng ký của bạn. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.</p>
          
          <form className="form" onSubmit={handleSubmit}>
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
              Gửi liên kết khôi phục
            </button>
          </form>
          
          <Link to="/login" className="back-link">
            <ArrowLeft size={16} /> Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;