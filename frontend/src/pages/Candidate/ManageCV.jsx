import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ManageCV = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { fullName: 'Ứng viên' };

  // Dữ liệu dummy (Sau này lấy từ API)
  const cvList = [
    { id: 1, name: 'CV Fresher', date: 'Cập nhật 15-06-2026', image: 'https://via.placeholder.com/300x400.png?text=CV+Preview+1', isActive: false },
    { id: 2, name: 'Intern Front-end Developer', date: 'Cập nhật 17-04-2025', image: 'https://via.placeholder.com/300x400.png?text=CV+Preview+2', isActive: true },
  ];

  return (
    <>
      <style>{`
        .manage-cv-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px; font-family: 'Inter', sans-serif; }
        
        /* Left Column */
        .cv-main-panel { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .cv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .cv-title { font-size: 20px; font-weight: 700; color: #1e293b; }
        .btn-create-cv { background: #059669; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; transition: 0.2s; border: none; cursor: pointer; }
        .btn-create-cv:hover { background: #047857; }
        
        .cv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
        .cv-card { border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #fff; transition: box-shadow 0.2s; }
        .cv-card:hover { box-shadow: 0 10px 20px rgba(0,0,0,0.05); }
        .cv-image-wrapper { height: 350px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px; overflow: hidden; position: relative; }
        .cv-image-wrapper img { width: 100%; height: 100%; object-fit: contain; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .cv-image-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; gap: 10px; }
        .cv-image-wrapper:hover .cv-image-overlay { opacity: 1; }
        .btn-action { background: white; color: #334155; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .btn-action.edit { color: #059669; }
        
        .cv-info { padding: 16px; }
        .cv-name { font-weight: 600; color: #1e293b; font-size: 15px; margin-bottom: 4px; }
        .cv-date { color: #64748b; font-size: 13px; margin-bottom: 16px; }
        .cv-toggle { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #334155; font-weight: 500; }
        
        /* Switch Toggle CSS */
        .switch { position: relative; display: inline-block; width: 44px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #cbd5e1; transition: .4s; border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #059669; }
        input:checked + .slider:before { transform: translateX(20px); }

        /* Right Column */
        .sidebar-panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 24px; }
        .user-widget { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .user-avatar { width: 56px; height: 56px; border-radius: 50%; background: #eff6ff; display: flex; justify-content: center; align-items: center; font-size: 20px; font-weight: bold; color: #1d4ed8; }
        .user-greeting { font-size: 13px; color: #64748b; }
        .user-fullname { font-size: 16px; font-weight: 700; color: #1e293b; }
        .user-badge { display: inline-block; background: #e2e8f0; font-size: 11px; padding: 2px 8px; border-radius: 12px; margin-top: 4px; color: #475569;}
        
        .status-row { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; border-top: 1px solid #f1f5f9; }
        .status-label { font-weight: 600; font-size: 14px; color: #334155; }
        .status-desc { font-size: 13px; color: #64748b; line-height: 1.5; margin-top: 8px; }
        
        .promo-box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 20px; }
        .promo-title { font-weight: 600; font-size: 14px; color: #1e293b; margin-bottom: 8px; }
        .btn-outline { display: block; text-align: center; border: 1px solid #059669; color: #059669; padding: 8px; border-radius: 20px; font-weight: 600; font-size: 13px; text-decoration: none; margin-top: 12px; transition: 0.2s; }
        .btn-outline:hover { background: #059669; color: white; }
      `}</style>

      <div className="manage-cv-container">
        
        {/* CỘT TRÁI: DANH SÁCH CV */}
        <div className="cv-main-panel">
          <div className="cv-header">
            <h1 className="cv-title">CV đã tạo trên Careerio</h1>
            {/* Click vào đây sẽ sang trang chọn Template */}
            <button className="btn-create-cv" onClick={() => navigate('/candidate/cv-templates')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
              Tạo CV
            </button>
          </div>

          <div className="cv-grid">
            {cvList.map(cv => (
              <div className="cv-card" key={cv.id}>
                <div className="cv-image-wrapper">
                  <img src={cv.image} alt={cv.name} />
                  <div className="cv-image-overlay">
                    <button className="btn-action edit">Chỉnh sửa</button>
                    <button className="btn-action">Tải xuống</button>
                  </div>
                </div>
                <div className="cv-info">
                  <div className="cv-name">{cv.name}</div>
                  <div className="cv-date">{cv.date}</div>
                  <div className="cv-toggle">
                    <label className="switch">
                      <input type="checkbox" defaultChecked={cv.isActive} />
                      <span className="slider"></span>
                    </label>
                    <span style={{ color: cv.isActive ? '#059669' : '#64748b' }}>
                      {cv.isActive ? 'Cho phép NTD tìm kiếm' : 'Đang khoá tìm kiếm'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI: WIDGET THÔNG TIN */}
        <div>
          <div className="sidebar-panel">
            <div className="user-widget">
              <div className="user-avatar">{user.fullName.charAt(0).toUpperCase()}</div>
              <div>
                <div className="user-greeting">Chào bạn trở lại,</div>
                <div className="user-fullname">{user.fullName}</div>
                <div className="user-badge">Tài khoản đã xác thực</div>
              </div>
            </div>

            <div className="status-row">
              <span className="status-label">Gợi ý việc làm</span>
              <label className="switch"><input type="checkbox" defaultChecked /><span className="slider"></span></label>
            </div>
            
            <div className="status-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="status-label">Trạng thái tìm việc</span>
                <label className="switch"><input type="checkbox" /><span className="slider"></span></label>
              </div>
              <div className="status-desc">
                Bật tìm việc để nhận được nhiều cơ hội việc làm hấp dẫn từ các nhà tuyển dụng hàng đầu.
              </div>
            </div>

            <div className="promo-box">
              <div className="promo-title">Cho phép NTD tìm kiếm hồ sơ</div>
              <div className="status-desc" style={{ marginTop: 0 }}>
                Có 5 CV đang bật cho phép NTD tìm kiếm.
              </div>
              <Link to="#" className="btn-outline">Quản lý danh sách</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default ManageCV;