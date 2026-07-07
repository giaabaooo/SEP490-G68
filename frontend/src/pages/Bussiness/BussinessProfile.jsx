import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const HRProfile = () => {
  const token = localStorage.getItem('token');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Các trường dữ liệu từ luồng Onboarding
  const [profileData, setProfileData] = useState({
    email: '',
    companyName: '',
    taxCode: '',      // Thêm MST
    website: '',
    city: '',         // Thêm Thành phố
    companySize: '',  // Thêm Quy mô
    address: ''
  });

  const [formData, setFormData] = useState({ ...profileData });

  useEffect(() => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để xem hồ sơ doanh nghiệp.');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Không thể tải hồ sơ doanh nghiệp');
        }

        const data = await response.json();
        
        // 👉 ĐÃ THÊM: Map dữ liệu mới từ API
        const nextProfile = {
          email: data.email || '',
          companyName: data.companyName || '',
          taxCode: data.taxCode || '',
          website: data.website || '',
          city: data.city || '',
          companySize: data.companySize || '',
          address: data.address || ''
        };

        setProfileData(nextProfile);
        setFormData(nextProfile);
      } catch (error) {
        console.error(error);
        toast.error(error.message || 'Có lỗi xảy ra khi tải hồ sơ doanh nghiệp.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleEditClick = () => {
    setFormData({ ...profileData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.companyName.trim() || !formData.city || !formData.companySize || !formData.address.trim()) {
      toast.error('Vui lòng nhập đầy đủ các thông tin bắt buộc (*)!');
      return;
    }

    try {
      // Lưu ý: Không gửi taxCode lên để update vì trường này cố định sau khi xác thực
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          website: formData.website.trim(),
          city: formData.city,
          companySize: formData.companySize,
          address: formData.address.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật hồ sơ thất bại');
      }

      //  Map lại dữ liệu sau khi update thành công
      const nextProfile = {
        email: data.user?.email || profileData.email,
        companyName: data.user?.companyName || '',
        taxCode: profileData.taxCode, // Giữ nguyên MST cũ
        website: data.user?.website || '',
        city: data.user?.city || '',
        companySize: data.user?.companySize || '',
        address: data.user?.address || ''
      };

      setProfileData(nextProfile);
      setFormData(nextProfile);
      setIsEditing(false);
      toast.success('Cập nhật hồ sơ Nhà tuyển dụng thành công!');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu hồ sơ doanh nghiệp.');
    }
  };

  return (
    <div className="hr-profile-wrapper">
      <style>{`
        .hr-profile-wrapper {
          max-width: 860px;
          margin: 40px auto;
          padding: 32px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.03);
          font-family: 'Inter', sans-serif;
        }
        .hr-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f1f5f9;
        }
        .header-text h2 {
          margin: 0;
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
        }
        .header-text p {
          margin: 6px 0 0;
          color: #64748b;
          font-size: 14px;
        }
        
        /* --- Styles cho Chế độ Xem (View Mode) --- */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        /* Item chiếm full chiều ngang */
        .full-width {
          grid-column: span 2;
        }
        .info-item {
          background-color: #f8fafc;
          padding: 16px 20px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
          transition: background-color 0.2s;
        }
        .info-item:hover { background-color: #f1f5f9; }
        .info-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .info-value {
          font-size: 15px;
          color: #0f172a;
          font-weight: 500;
          word-break: break-word;
        }
        .info-value a { color: #3b82f6; text-decoration: none; }
        .info-value a:hover { text-decoration: underline; }

        /* --- Styles cho Form (Edit Mode) --- */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .form-group { margin-bottom: 0; }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #334155;
          font-size: 13px;
        }
        .form-control {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          color: #0f172a;
          transition: all 0.2s ease;
          box-sizing: border-box;
          background: #f8fafc;
        }
        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-control:disabled {
          background-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
          border-color: #e2e8f0;
        }
        textarea.form-control { resize: vertical; min-height: 80px; }
        select.form-control { appearance: none; cursor: pointer; }
        .required-asterisk { color: #ef4444; margin-left: 4px; }

        /* --- Styles cho Buttons --- */
        .btn { padding: 12px 24px; font-size: 14px; font-weight: 600; border-radius: 10px; cursor: pointer; transition: all 0.2s ease; border: none; }
        .btn-primary { background-color: #3b82f6; color: white; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2); }
        .btn-primary:hover { background-color: #2563eb; transform: translateY(-1px); }
        .btn-secondary { background-color: white; color: #475569; border: 1px solid #e2e8f0; }
        .btn-secondary:hover { background-color: #f8fafc; border-color: #cbd5e1; }
        .button-group { display: flex; justify-content: flex-end; gap: 12px; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; }
      `}</style>

      <div className="hr-profile-header">
        <div className="header-text">
          <h2>Hồ sơ Nhà tuyển dụng</h2>
          <p>Quản lý thông tin doanh nghiệp của bạn trên hệ thống.</p>
        </div>
        {!isEditing && !loading && (
          <button className="btn btn-primary" onClick={handleEditClick}>
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontWeight: '500' }}>
          Đang tải thông tin...
        </div>
      ) : !isEditing ? (
        /* ================= CHẾ ĐỘ XEM (VIEW MODE) ================= */
        <div className="info-grid">
          <div className="info-item full-width">
            <div className="info-label">Tên công ty</div>
            <div className="info-value" style={{ fontSize: '18px', fontWeight: '700' }}>
              {profileData.companyName || <span style={{ color: '#94a3b8', fontStyle: 'italic', fontWeight: '400' }}>Chưa cập nhật</span>}
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Mã số thuế (Xác thực)</div>
            <div className="info-value text-emerald-600 font-bold">
              {profileData.taxCode || <span style={{ color: '#ef4444' }}>Chưa xác thực</span>}
            </div>
          </div>
          
          <div className="info-item">
            <div className="info-label">Email đăng nhập</div>
            <div className="info-value">{profileData.email}</div>
          </div>

          <div className="info-item">
            <div className="info-label">Thành phố</div>
            <div className="info-value">
              {profileData.city || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
            </div>
          </div>

          <div className="info-item">
            <div className="info-label">Quy mô công ty</div>
            <div className="info-value">
              {profileData.companySize || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
            </div>
          </div>

          <div className="info-item full-width">
            <div className="info-label">Website công ty</div>
            <div className="info-value">
              {profileData.website ? (
                <a href={profileData.website} target="_blank" rel="noopener noreferrer">
                  {profileData.website}
                </a>
              ) : (
                <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>
              )}
            </div>
          </div>

          <div className="info-item full-width">
            <div className="info-label">Địa chỉ trụ sở chính</div>
            <div className="info-value">
              {profileData.address || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
            </div>
          </div>
        </div>
      ) : (
        /* ================= CHẾ ĐỘ SỬA (EDIT MODE) ================= */
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Tên công ty <span className="required-asterisk">*</span></label>
              <input
                type="text"
                name="companyName"
                className="form-control"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Ví dụ: Công ty Cổ phần Công nghệ Careerio"
              />
            </div>

            <div className="form-group">
              <label>Mã số thuế</label>
              <input
                type="text"
                className="form-control"
                value={formData.taxCode}
                disabled
                title="Mã số thuế đã được xác thực, không thể thay đổi."
              />
            </div>

            <div className="form-group">
              <label>Email đăng nhập</label>
              <input
                type="email"
                className="form-control"
                value={formData.email}
                disabled
                title="Email không thể thay đổi do ràng buộc với tài khoản."
              />
            </div>

            <div className="form-group">
              <label>Thành phố <span className="required-asterisk">*</span></label>
              <select 
                name="city" 
                className="form-control"
                value={formData.city} 
                onChange={handleChange}
              >
                <option value="" disabled>Chọn thành phố</option>
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Khác">Khác...</option>
              </select>
            </div>

            <div className="form-group">
              <label>Quy mô công ty <span className="required-asterisk">*</span></label>
              <select 
                name="companySize" 
                className="form-control"
                value={formData.companySize} 
                onChange={handleChange}
              >
                <option value="" disabled>Chọn quy mô</option>
                <option value="1-9">1-9 nhân viên</option>
                <option value="10-49">10-49 nhân viên</option>
                <option value="50-199">50-199 nhân viên</option>
                <option value="200-499">200-499 nhân viên</option>
                <option value="500+">500+ nhân viên</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label>Website công ty</label>
              <input
                type="url"
                name="website"
                className="form-control"
                value={formData.website}
                onChange={handleChange}
                placeholder="Ví dụ: https://careerio.com"
              />
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ trụ sở chi tiết <span className="required-asterisk">*</span></label>
              <textarea
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                placeholder="Ví dụ: Tầng 12, Tòa nhà ABC, Phường X, Quận Y..."
              />
            </div>
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Hủy thay đổi
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu thông tin
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HRProfile;