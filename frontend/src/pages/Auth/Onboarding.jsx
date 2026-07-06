import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: 'candidate',
    phone: '',
    companyName: ''
  });

  useEffect(() => {
    const isNew = sessionStorage.getItem('isNewGoogleUser');
    if (!isNew) {
      navigate('/home');
    }
  }, [navigate]);

 const handleSubmitOnboarding = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const token = sessionStorage.getItem('tempToken');
    
    if (!token) {
      toast.error('Không tìm thấy phiên đăng nhập. Vui lòng thử lại.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          role: formData.role, 
          phone: formData.phone,
          companyName: formData.role === 'business' ? formData.companyName : "" 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Cập nhật thất bại');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('isNewGoogleUser');

      toast.success('Hồ sơ đã hoàn tất!');
      
      setTimeout(() => {
         if (data.user.role === 'business') {
            navigate('/business/dashboard', { replace: true }); 
         } else {
            navigate('/home', { replace: true });
         }
      }, 800);

    } catch (error) {
      toast.error('Lỗi kết nối Server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <style>{`
        .onboard-wrap { min-height: 100vh; display: flex; justify-content: center; align-items: center; background: #f0f4fb; padding: 20px;}
        .onboard-card { background: white; padding: 40px; border-radius: 12px; width: 100%; max-width: 500px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .logo-container { text-align: center; margin-bottom: 24px; }
        .onboard-title { font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 10px; text-align: center; }
        .onboard-desc { font-size: 14px; color: #64748b; margin-bottom: 30px; text-align: center; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 8px; }
        .input-group input { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
        .role-selector { display: flex; gap: 12px; }
        .role-btn { flex: 1; padding: 12px; text-align: center; border: 2px solid #cbd5e1; border-radius: 8px; cursor: pointer; font-weight: 600; color: #64748b; }
        .role-btn.active { border-color: #1d4ed8; background: #eff6ff; color: #1d4ed8; }
        .btn-submit { width: 100%; padding: 14px; background: #1d4ed8; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 10px; }
        .btn-submit:hover { background: #1e40af; }
      `}</style>

      <div className="onboard-wrap">
        <div className="onboard-card">
          <div className="logo-container">
            <img src="/logo-careerio.png" alt="Careerio Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h1 className="onboard-title">Hoàn tất hồ sơ</h1>
          <p className="onboard-desc">Vì đây là lần đầu bạn đăng nhập bằng Google, vui lòng bổ sung thông tin sau để tiếp tục.</p>

          <form onSubmit={handleSubmitOnboarding}>
            <div className="input-group">
              <label>Vai trò của bạn</label>
              <div className="role-selector">
                <div className={`role-btn ${formData.role === 'candidate' ? 'active' : ''}`} onClick={() => setFormData({...formData, role: 'candidate'})}>
                  Ứng viên
                </div>
                <div className={`role-btn ${formData.role === 'business' ? 'active' : ''}`} onClick={() => setFormData({...formData, role: 'business'})}>
                  Nhà tuyển dụng
                </div>
              </div>
            </div>

            <div className="input-group">
              <label>Số điện thoại liên hệ</label>
              <input type="tel" required placeholder="0987654321" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>

            {formData.role === 'business' && (
              <div className="input-group">
                <label>Tên doanh nghiệp</label>
                <input type="text" required placeholder="Công ty TNHH..." value={formData.companyName} onChange={(e) => setFormData({...formData, companyName: e.target.value})} />
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Xác nhận thông tin'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Onboarding;