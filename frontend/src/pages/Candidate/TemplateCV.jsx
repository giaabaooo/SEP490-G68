import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TemplateCV = () => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const navigate = useNavigate();

  // Đã thay đổi link placeholder sang placehold.co để tránh bị chặn
  const templates = [
    { id: 1, name: 'Tiêu chuẩn', type: 'ATS', author: 'Đơn giản', image: 'https://placehold.co/400x550/e2e8f0/475569?text=Standard+CV', colors: ['#1e293b', '#3b82f6', '#10b981'] },
    { id: 2, name: 'Tiêu chuẩn (ít kinh nghiệm)', type: 'ATS', author: 'Đơn giản', image: 'https://placehold.co/400x550/e2e8f0/475569?text=Entry+Level+CV', colors: ['#0f172a', '#0ea5e9'] },
    { id: 3, name: 'Ấn tượng 6', type: 'ATS', author: 'Hiện đại', image: 'https://placehold.co/400x550/e2e8f0/475569?text=Creative+CV', colors: ['#451a03', '#831843', '#1e3a8a'] },
    { id: 4, name: 'Chuyên nghiệp 2', type: 'Harvard', author: 'Chuyên nghiệp', image: 'https://placehold.co/400x550/e2e8f0/475569?text=Pro+CV', colors: ['#1e293b', '#0f172a'] },
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Giả lập API AI Parser mất 2s để đọc PDF
    toast.info('AI đang đọc và bóc tách dữ liệu CV của bạn...');
    
    setTimeout(() => {
      // Dữ liệu giả lập AI trả về sau khi đọc file PDF của bạn
      const mockParsedData = {
        personal: { fullName: 'Nguyễn Gia Bảo', jobTitle: 'Software Engineer', email: 'giabao@gmail.com', phone: '0394747067', link: 'github.com/giabao' },
        objective: 'Tận dụng kiến thức nền tảng vững chắc về phát triển web (React, Node.js) để xây dựng các ứng dụng có hiệu suất cao.',
        education: [{ school: 'FPT University', major: 'Software Engineering', time: '09/2022 - 12/2026', description: 'Hoàn thành khóa luận xuất sắc...' }],
        experience: [{ company: 'FPT Software', position: 'Intern .NET', time: '03/2025 - 08/2025', description: '- Học tập và phát triển ứng dụng .NET\n- Quen thuộc với quy trình phát triển phần mềm' }],
        skills: 'JavaScript, React, Node.js, Java, Python, SQL Server'
      };

      // Chuyển hướng sang trang Edit kèm dữ liệu JSON đã bóc tách
      navigate('/candidate/cv-builder', { state: { parsedData: mockParsedData } });
    }, 2000);
  };

  const filters = ['Tất cả', 'Đơn giản', 'Chuyên nghiệp', 'Hiện đại', 'Ấn tượng', 'Harvard', 'ATS'];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .template-page { background: #f8fafc; min-height: 100vh; padding: 40px 20px; font-family: 'Inter', sans-serif; }
        .template-container { max-width: 1200px; margin: 0 auto; }
        
        .page-header { text-align: center; margin-bottom: 40px; }
        .page-title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 12px; }
        .page-subtitle { font-size: 15px; color: #64748b; max-width: 700px; margin: 0 auto; line-height: 1.5; }
        
        .filter-bar { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 40px; }
        .filter-btn { padding: 8px 20px; background: white; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .filter-btn:hover { border-color: #cbd5e1; color: #1e293b; }
        .filter-btn.active { background: #059669; color: white; border-color: #059669; }

        .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 30px; }
        .template-card { background: transparent; }
        
        .img-wrapper { background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 16px; position: relative; overflow: hidden; cursor: pointer; transition: transform 0.3s; }
        .img-wrapper:hover { transform: translateY(-5px); box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
        .img-wrapper img { width: 100%; height: auto; border: 1px solid #f1f5f9; border-radius: 4px; display: block; }
        
        .hover-action { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .img-wrapper:hover .hover-action { opacity: 1; }
        .btn-use-template { background: #059669; color: white; padding: 12px 24px; border-radius: 8px; font-weight: 600; border: none; cursor: pointer; }
        
        .template-info { display: flex; justify-content: space-between; align-items: flex-start; }
        .template-name { font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .template-badges { display: flex; gap: 8px; }
        .badge { background: #e2e8f0; color: #475569; font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
        
        .color-palette { display: flex; gap: 6px; }
        .color-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 0 1px #cbd5e1; cursor: pointer; }
        
        .ai-upload-banner { background: linear-gradient(135deg, #1e3a8a, #3b82f6); border-radius: 16px; padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.2); }
        .ai-upload-text h3 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
        .ai-upload-text p { font-size: 15px; color: #bfdbfe; }
        .btn-upload { background: white; color: #1d4ed8; padding: 12px 24px; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; }
      `}</style>

      <div className="template-page">
        <div className="template-container">
          
          <div className="page-header">
            <h1 className="page-title">Mẫu CV xin việc chuẩn 2026</h1>
            <p className="page-subtitle">Tuyển chọn các mẫu CV đa dạng phong cách, tối ưu hoá cho hệ thống ATS, giúp bạn tạo dấu ấn cá nhân và kết nối mạnh mẽ với nhà tuyển dụng.</p>
          </div>

          <div className="ai-upload-banner">
            <div className="ai-upload-text">
              <h3>Đã có sẵn CV file PDF?</h3>
              <p>Tải lên đây, AI của chúng tôi sẽ tự động nhận diện và chuyển đổi sang mẫu CV bạn thích.</p>
            </div>
            
            <label className="btn-upload" style={{ cursor: 'pointer' }}>
              <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload CV ngay
            </label>
          </div>

          <div className="filter-bar">
            {filters.map(filter => (
              <button 
                key={filter} 
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="template-grid">
            {templates.map(tpl => (
              <div className="template-card" key={tpl.id}>
                <div className="img-wrapper">
                  <img src={tpl.image} alt={tpl.name} />
                  <div className="hover-action">
                    <button className="btn-use-template">Dùng mẫu này</button>
                  </div>
                </div>
                <div className="template-info">
                  <div>
                    <div className="template-name">{tpl.name}</div>
                    <div className="template-badges">
                      <span className="badge">{tpl.type}</span>
                      <span className="badge">{tpl.author}</span>
                    </div>
                  </div>
                  <div className="color-palette">
                    {tpl.colors.map((color, index) => (
                      <div key={index} className="color-dot" style={{ backgroundColor: color }}></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
};

export default TemplateCV;