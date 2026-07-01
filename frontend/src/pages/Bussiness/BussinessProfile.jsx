import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const HRProfile = () => {
  const token = localStorage.getItem('token');

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profileData, setProfileData] = useState({
    email: '',
    companyName: '',
    website: '',
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
        const nextProfile = {
          email: data.email || '',
          companyName: data.companyName || '',
          website: data.website || '',
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

    if (!formData.companyName.trim()) {
      toast.error('Vui lòng nhập Tên công ty!');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: formData.companyName.trim(),
          website: formData.website.trim(),
          address: formData.address.trim()
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật hồ sơ thất bại');
      }

      const nextProfile = {
        email: data.user?.email || profileData.email,
        companyName: data.user?.companyName || '',
        website: data.user?.website || '',
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
          max-width: 800px;
          margin: 40px auto;
          padding: 30px;
          background-color: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .hr-profile-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .header-text h2 {
          margin: 0;
          color: #1e293b;
          font-size: 24px;
        }
        .header-text p {
          margin: 8px 0 0;
          color: #64748b;
          font-size: 14px;
        }
        
        /* --- Styles cho Chế độ Xem (View Mode) --- */
        .info-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .info-item {
          background-color: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }
        .info-label {
          font-size: 13px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .info-value {
          font-size: 16px;
          color: #0f172a;
          word-break: break-word;
        }
        .info-value a {
          color: #2563eb;
          text-decoration: none;
        }
        .info-value a:hover {
          text-decoration: underline;
        }

        /* --- Styles cho Form (Edit Mode) --- */
        .form-group {
          margin-bottom: 20px;
        }
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #334155;
          font-size: 14px;
        }
        .form-control {
          width: 100%;
          padding: 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 15px;
          color: #1e293b;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }
        .form-control:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .form-control:disabled {
          background-color: #f1f5f9;
          color: #94a3b8;
          cursor: not-allowed;
        }
        textarea.form-control {
          resize: vertical;
          min-height: 100px;
        }
        .required-asterisk {
          color: #ef4444;
          margin-left: 4px;
        }

        /* --- Styles cho Buttons --- */
        .btn {
          padding: 10px 20px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        .btn-primary {
          background-color: #2563eb;
          color: white;
        }
        .btn-primary:hover {
          background-color: #1d4ed8;
        }
        .btn-secondary {
          background-color: white;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        .btn-secondary:hover {
          background-color: #f1f5f9;
        }
        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
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
        <div style={{ textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
          Đang tải hồ sơ...
        </div>
      ) : !isEditing ? (
        /* ================= CHẾ ĐỘ XEM (VIEW MODE) ================= */
        <div className="info-grid">
          <div className="info-item">
            <div className="info-label">Email đăng nhập</div>
            <div className="info-value">{profileData.email}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Tên công ty</div>
            <div className="info-value">
              {profileData.companyName || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
            </div>
          </div>
          <div className="info-item">
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
          <div className="info-item">
            <div className="info-label">Địa chỉ trụ sở</div>
            <div className="info-value">
              {profileData.address || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cập nhật</span>}
            </div>
          </div>
        </div>
      ) : (
        /* ================= CHẾ ĐỘ SỬA (EDIT MODE) ================= */
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email đăng nhập</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              disabled
              title="Email không thể thay đổi do ràng buộc với tài khoản"
            />
          </div>

          <div className="form-group">
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

          <div className="form-group">
            <label>Địa chỉ trụ sở <span className="required-asterisk">*</span></label>
            <textarea
              name="address"
              className="form-control"
              value={formData.address}
              onChange={handleChange}
              placeholder="Nhập địa chỉ chi tiết của công ty..."
            />
          </div>

          <div className="button-group">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Hủy
            </button>
            <button type="submit" className="btn btn-primary">
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default HRProfile;