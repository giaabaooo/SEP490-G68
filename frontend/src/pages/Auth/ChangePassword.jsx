import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ChangePassword = () => {
  // 👉 THÊM STATE ĐỂ LƯU EMAIL
  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp!');
      return;
    }
    // Xử lý logic đổi mật khẩu ở đây, gửi kèm theo email
    console.log('Cập nhật mật khẩu mới cho tài khoản:', email);
  };

  return (
    <>
      <style>{`
        .auth-wrapper { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4f8; padding: 20px; font-family: 'Inter', sans-serif; }
        .auth-card { background: #fff; width: 100%; max-width: 480px; padding: 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08); }
        .title { font-size: 24px; font-weight: 700; color: #0f172a; margin-bottom: 30px; text-align: center; }
        .form { display: flex; flex-direction: column; gap: 20px; }
        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 13px; font-weight: 600; color: #475569; }
        .input-group input { width: 100%; padding: 14px 16px; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 14px; outline: none; background: #f8fafc; transition: all 0.2s; box-sizing: border-box; }
        .input-group input:focus { background: #ffffff; border-color: #3b82f6; box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1); }
        .btn-submit { width: 100%; padding: 14px; background-color: #3b82f6; color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; cursor: pointer; transition: background-color 0.2s; margin-top: 10px; }
        .btn-submit:hover { background-color: #2563eb; }
        .back-link { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 24px; font-size: 14px; color: #64748b; text-decoration: none; font-weight: 500; transition: color 0.2s; }
        .back-link:hover { color: #0f172a; }
      `}</style>

      <div className="auth-wrapper">
        <div className="auth-card">
          <h2 className="title">Đổi mật khẩu mới</h2>
          
          <form className="form" onSubmit={handleSubmit}>
            
            {/* Ô NHẬP EMAIL Ở ĐÂY */}
            <div className="input-group">
              <label>Địa chỉ Email</label>
              <input 
                type="email" 
                placeholder="Nhập email tài khoản của bạn" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div className="input-group">
              <label>Mật khẩu hiện tại</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu hiện tại" 
                value={oldPassword} 
                onChange={(e) => setOldPassword(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Mật khẩu mới</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
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
            
            <button type="submit" className="btn-submit">
              Cập nhật mật khẩu
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

export default ChangePassword;