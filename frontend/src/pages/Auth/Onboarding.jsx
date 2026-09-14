import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, User, MapPin, FileText, Phone, ChevronRight, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Search, Loader2
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { fetchProvinces } from '../../services/locationService';
import { lookupTaxCode } from '../../services/taxService';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [tempEmail, setTempEmail] = useState('');
  const [provinces, setProvinces] = useState([]);

  // Tra cứu MST
  const [lookingUpTax, setLookingUpTax] = useState(false);
  const [taxLookupInfo, setTaxLookupInfo] = useState(null);

  const [isStandardUser, setIsStandardUser] = useState(false);

  useEffect(() => {
    fetchProvinces().then(setProvinces).catch(console.error);
  }, []);

  const [candidateData, setCandidateData] = useState({ phone: '', city: 'Hà Nội' });
  const [businessData, setBusinessData] = useState({ companyName: '', taxCode: '', address: '', city: 'Hà Nội', phone: '' });

  useEffect(() => {
    const tempTkn = sessionStorage.getItem('tempToken');
    const tempMail = sessionStorage.getItem('tempEmail');
    const authToken = localStorage.getItem('token');
    const storedUserStr = localStorage.getItem('user');

    if (tempTkn) {
      // Trường hợp 1: Google OAuth tài khoản mới
      setTempToken(tempTkn);
      setTempEmail(tempMail || '');
      setIsStandardUser(false);
    } else if (authToken && storedUserStr) {
      // Trường hợp 2: Tài khoản thường đã đăng ký/đăng nhập hoàn tất hồ sơ
      try {
        const storedUser = JSON.parse(storedUserStr);
        setIsStandardUser(true);
        setRole(storedUser.role || 'business');
        setTempEmail(storedUser.email || '');

        if (storedUser.role === 'business') {
          setBusinessData(prev => ({
            ...prev,
            companyName: storedUser.companyName || prev.companyName,
            taxCode: storedUser.taxCode || prev.taxCode,
            address: storedUser.address || prev.address,
            city: storedUser.city || prev.city,
            phone: storedUser.phone || prev.phone
          }));
          setStep(2);
        } else {
          setCandidateData(prev => ({
            ...prev,
            phone: storedUser.phone || prev.phone,
            city: storedUser.city || prev.city
          }));
          setStep(2);
        }
      } catch (e) {
        console.error('Error parsing stored user in onboarding:', e);
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleCandidateChange = (e) => setCandidateData({ ...candidateData, [e.target.name]: e.target.value });
  const handleBusinessChange = (e) => setBusinessData({ ...businessData, [e.target.name]: e.target.value });

  // Tra cứu thông tin công ty qua MST từ API VietQR / Tổng cục Thuế (Không dùng AI)
  const handleTaxLookup = async () => {
    const rawCode = businessData.taxCode?.trim();
    if (!rawCode) {
      toast.warning('Vui lòng nhập Mã Số Thuế để tra cứu');
      return;
    }

    setLookingUpTax(true);
    setTaxLookupInfo(null);
    try {
      const res = await lookupTaxCode(rawCode);
      if (res.success) {
        let matchedCity = businessData.city;
        if (res.address) {
          const found = provinces.find(p => res.address.toLowerCase().includes(p.cleanName.toLowerCase()));
          if (found) matchedCity = found.cleanName;
        }

        setBusinessData(prev => ({
          ...prev,
          companyName: res.companyName || prev.companyName,
          address: res.address || prev.address,
          city: matchedCity
        }));

        setTaxLookupInfo({
          success: true,
          name: res.companyName,
          status: res.status,
          address: res.address
        });
        toast.success(`Đã tự động lấy dữ liệu: ${res.companyName}`);
      } else {
        setTaxLookupInfo({ success: false, message: res.message });
        toast.info(res.message);
      }
    } catch (err) {
      toast.error('Lỗi khi tra cứu MST');
    } finally {
      setLookingUpTax(false);
    }
  };

  // Hoàn tất trực tiếp: Gửi tempToken + Role + Profile data lên Server (Không cần OTP vì Google đã xác thực)
  const handleComplete = async (e) => {
    e.preventDefault();

    if (role === 'candidate') {
      if (!candidateData.phone.trim()) {
        toast.warning('Vui lòng nhập số điện thoại liên hệ');
        return;
      }
    } else if (role === 'business') {
      if (!businessData.companyName.trim()) {
        toast.warning('Vui lòng nhập tên công ty/doanh nghiệp');
        return;
      }
      if (!businessData.taxCode.trim()) {
        toast.warning('Vui lòng nhập mã số thuế');
        return;
      }
      if (!businessData.address.trim()) {
        toast.warning('Vui lòng nhập địa chỉ cụ thể');
        return;
      }
    }

    setLoading(true);
    try {
      if (tempToken) {
        // LUỒNG 1: Google OAuth Onboarding (Người dùng mới tạo tài khoản qua Google)
        const payload = {
          tempToken,
          role,
          phone: role === 'candidate' ? candidateData.phone.trim() : businessData.phone.trim(),
          city: role === 'candidate' ? candidateData.city : businessData.city,
          companyName: role === 'business' ? businessData.companyName.trim() : '',
          taxCode: role === 'business' ? businessData.taxCode.trim() : '',
          address: role === 'business' ? businessData.address.trim() : ''
        };

        const res = await fetch(`${API_BASE}/api/auth/google-onboarding/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Hoàn tất thiết lập thất bại');

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.removeItem('tempToken');
        sessionStorage.removeItem('tempEmail');
      } else {
        // LUỒNG 2: Tài khoản thường đã đăng ký & xác thực OTP (Cập nhật hồ sơ doanh nghiệp / ứng viên)
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại');

        const updatePayload = role === 'business' ? {
          companyName: businessData.companyName.trim(),
          taxCode: businessData.taxCode.trim(),
          address: businessData.address.trim(),
          city: businessData.city,
          phone: businessData.phone.trim()
        } : {
          phone: candidateData.phone.trim(),
          city: candidateData.city
        };

        const res = await fetch(`${API_BASE}/api/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });
        const updatedUser = await res.json();
        if (!res.ok) throw new Error(updatedUser.message || 'Cập nhật thông tin thất bại');

        localStorage.setItem('user', JSON.stringify(updatedUser.user || updatedUser));
      }

      toast.success('Thiết lập tài khoản thành công! Đang vào hệ thống...');

      setTimeout(() => {
        if (role === 'business') {
          navigate('/bussiness/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      }, 1000);

    } catch (err) {
      toast.error(err.message || 'Không thể hoàn tất hồ sơ. Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .onboard-wrapper {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%);
          padding: 24px;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
        .onboard-card {
          background: #ffffff;
          width: 100%;
          max-width: 680px;
          padding: 44px 40px;
          border-radius: 24px;
          box-shadow: 0 20px 45px rgba(5, 150, 105, 0.08), 0 4px 16px rgba(15, 23, 42, 0.04);
          border: 1px solid #e2e8f0;
          position: relative;
        }
        .brand-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .brand-header img {
          height: 60px;
          width: auto;
          object-fit: contain;
          margin-bottom: 12px;
        }
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ecfdf5;
          color: #065f46;
          border: 1px solid #a7f3d0;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 20px;
        }
        .title-section {
          text-align: center;
          margin-bottom: 28px;
        }
        .title-section h1 {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .title-section p {
          font-size: 15px;
          color: #64748b;
          line-height: 1.5;
        }
        
        .role-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 32px;
        }
        .role-card {
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px 20px;
          cursor: pointer;
          text-align: center;
          transition: all 0.25s ease;
          background: #f8fafc;
          position: relative;
        }
        .role-card:hover {
          border-color: #10b981;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(5, 150, 105, 0.08);
        }
        .role-card.selected {
          border-color: #059669;
          background: #f0fdf4;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.15);
        }
        .role-card-icon {
          width: 56px;
          height: 56px;
          margin: 0 auto 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
          color: #059669;
        }
        .role-card.selected .role-card-icon {
          background: #059669;
          color: #ffffff;
        }
        .role-card h3 {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .role-card p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.45;
          margin: 0;
        }
        
        .input-group {
          margin-bottom: 20px;
          text-align: left;
        }
        .input-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #334155;
        }
        .input-wrapper input, .input-wrapper select {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .input-wrapper input:focus, .input-wrapper select:focus {
          background: #ffffff;
          border-color: #059669;
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.12);
        }

        .btn-lookup {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 0 16px;
          background: #059669;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .btn-lookup:hover:not(:disabled) {
          background: #047857;
        }
        .btn-lookup:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .tax-success-box {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 13px;
          color: #15803d;
          line-height: 1.4;
          animation: fadeIn 0.25s ease;
        }

        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .btn-submit {
          width: 100%;
          padding: 15px;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-submit:hover:not(:disabled) {
          background: linear-gradient(135deg, #047857 0%, #065f46 100%);
          transform: translateY(-1px);
        }
        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-back {
          width: 100%;
          padding: 13px;
          background: #f1f5f9;
          color: #475569;
          font-size: 14px;
          font-weight: 600;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .btn-back:hover:not(:disabled) {
          background: #e2e8f0;
          color: #1e293b;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="onboard-wrapper">
        <div className="onboard-card">
          
          <div className="brand-header">
            <Link to="/home">
              <img src="/logo-careerio.png" alt="Careerio Logo" />
            </Link>
            <br />
            {tempEmail && (
              <div className="verified-badge">
                <ShieldCheck size={16} />
                <span>{isStandardUser ? 'Tài khoản: ' : 'Google: '}<strong>{tempEmail}</strong> (Đã xác thực)</span>
              </div>
            )}
          </div>

          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title-section">
                <h1>Chào mừng bạn đến với Careerio!</h1>
                <p>Vui lòng chọn vai trò chính để chúng tôi cá nhân hóa trải nghiệm của bạn.</p>
              </div>

              <div className="role-grid">
                <div 
                  className={`role-card ${role === 'candidate' ? 'selected' : ''}`} 
                  onClick={() => setRole('candidate')}
                >
                  <div className="role-card-icon">
                    <User size={28} />
                  </div>
                  <h3>Tôi là Ứng viên</h3>
                  <p>Tìm kiếm việc làm, tạo CV chuẩn ATS, luyện phỏng vấn AI và đánh giá năng lực.</p>
                </div>

                <div 
                  className={`role-card ${role === 'business' ? 'selected' : ''}`} 
                  onClick={() => setRole('business')}
                >
                  <div className="role-card-icon">
                    <Building2 size={28} />
                  </div>
                  <h3>Nhà tuyển dụng</h3>
                  <p>Đăng tin tuyển dụng, quản lý hồ sơ, tạo bài kiểm tra năng lực và phỏng vấn nhân tài.</p>
                </div>
              </div>

              <button className="btn-submit" onClick={() => setStep(2)}>
                <span>Tiếp tục thiết lập hồ sơ</span>
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleComplete} style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="title-section">
                <h1>{role === 'candidate' ? 'Hoàn tất Hồ sơ Ứng viên' : 'Thông tin Doanh nghiệp Tuyển dụng'}</h1>
                <p>
                  {role === 'candidate' 
                    ? 'Chỉ còn một bước ngắn để bắt đầu tìm việc và ứng tuyển ngay hôm nay.' 
                    : 'Nhập Mã Số Thuế để hệ thống tự động điền Tên Công Ty và Trụ Sở chính thức.'}
                </p>
              </div>

              {role === 'candidate' ? (
                <>
                  <div className="input-group">
                    <label>Số điện thoại liên hệ *</label>
                    <div className="input-wrapper">
                      <input 
                        type="tel" 
                        name="phone" 
                        value={candidateData.phone} 
                        onChange={handleCandidateChange} 
                        placeholder="VD: 0912345678" 
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Khu vực làm việc mong muốn *</label>
                    <div className="input-wrapper">
                      <select name="city" value={candidateData.city} onChange={handleCandidateChange}>
                        {provinces.map(p => (
                          <option key={p.code} value={p.cleanName}>{p.cleanName}</option>
                        ))}
                        {candidateData.city && !provinces.some(p => p.cleanName === candidateData.city) && (
                          <option value={candidateData.city}>{candidateData.city}</option>
                        )}
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Mã Số Thuế kèm Tra Cứu Tự Động */}
                  <div className="input-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ margin: 0 }}>Mã Số Thuế Doanh Nghiệp (MST) *</label>
                      <span style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>Tự động tra cứu Cục Thuế</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="input-wrapper" style={{ flex: 1 }}>
                        <input 
                          type="text" 
                          name="taxCode" 
                          value={businessData.taxCode} 
                          onChange={handleBusinessChange} 
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleTaxLookup();
                            }
                          }}
                          placeholder="VD: 0101778163" 
                          required
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={handleTaxLookup} 
                        disabled={lookingUpTax}
                        className="btn-lookup"
                        title="Tra cứu tên công ty và địa chỉ tự động"
                      >
                        {lookingUpTax ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
                        <span>{lookingUpTax ? 'Đang tra...' : 'Tra cứu MST'}</span>
                      </button>
                    </div>

                    {taxLookupInfo && taxLookupInfo.success && (
                      <div className="tax-success-box">
                        <CheckCircle2 size={16} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong>{taxLookupInfo.name}</strong>
                          <span style={{ display: 'block', fontSize: '12px', color: '#64748b' }}>
                            Trạng thái: <span style={{ color: '#059669', fontWeight: 600 }}>{taxLookupInfo.status}</span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Tên Công Ty / Doanh Nghiệp *</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        name="companyName" 
                        value={businessData.companyName} 
                        onChange={handleBusinessChange} 
                        placeholder="VD: CÔNG TY CỔ PHẦN VIỄN THÔNG FPT" 
                        required
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Số điện thoại liên hệ HR / Hotline</label>
                    <div className="input-wrapper">
                      <input 
                        type="tel" 
                        name="phone" 
                        value={businessData.phone} 
                        onChange={handleBusinessChange} 
                        placeholder="VD: 02439998888 hoặc 0912345678" 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Khu Vực Trụ Sở *</label>
                    <div className="input-wrapper">
                      <select name="city" value={businessData.city} onChange={handleBusinessChange}>
                        {provinces.map(p => (
                          <option key={p.code} value={p.cleanName}>{p.cleanName}</option>
                        ))}
                        {businessData.city && !provinces.some(p => p.cleanName === businessData.city) && (
                          <option value={businessData.city}>{businessData.city}</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Địa Chỉ Trụ Sở Cụ Thể *</label>
                    <div className="input-wrapper">
                      <input 
                        type="text" 
                        name="address" 
                        value={businessData.address} 
                        onChange={handleBusinessChange} 
                        placeholder="VD: Tầng 2, Tòa nhà FPT Cầu Giấy, Số 17 phố Duy Tân" 
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? (
                  <span>Đang thiết lập hồ sơ...</span>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Hoàn tất đăng ký & Bắt đầu</span>
                  </>
                )}
              </button>
              
              {!isStandardUser ? (
                <button 
                  type="button" 
                  className="btn-back" 
                  onClick={() => setStep(1)} 
                  disabled={loading}
                >
                  <ArrowLeft size={16} />
                  <span>Quay lại chọn vai trò</span>
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn-back" 
                  onClick={() => navigate(role === 'business' ? '/bussiness/dashboard' : '/home')} 
                  disabled={loading}
                >
                  <span>Bỏ qua & Đến Bảng điều khiển</span>
                </button>
              )}
            </form>
          )}

        </div>
      </div>
    </>
  );
};

export default Onboarding;