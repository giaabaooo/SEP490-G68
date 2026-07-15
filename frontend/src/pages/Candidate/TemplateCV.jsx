import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const TemplateCV = () => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const navigate = useNavigate();

  // Mẫu Template tĩnh truyền thống (Mô phỏng ảnh A4 thực tế)
  const templates = [
    { id: 1, name: 'Tiêu chuẩn', type: 'ATS', author: 'Đơn giản', image: 'https://placehold.co/600x848/ffffff/1e293b?text=CV+Tiêu+Chuẩn\n(ATS)', colors: ['#1e293b', '#3b82f6', '#10b981'] },
    { id: 2, name: 'Thanh lịch', type: 'ATS', author: 'Đơn giản', image: 'https://placehold.co/600x848/ffffff/1e293b?text=CV+Thanh+Lịch', colors: ['#0f172a', '#0ea5e9'] },
    { id: 3, name: 'Hiện Đại 1', type: 'Mới', author: 'Hiện đại', image: 'https://placehold.co/600x848/ffffff/1e293b?text=CV+Hiện+Đại', colors: ['#451a03', '#831843', '#1e3a8a'] },
    { id: 4, name: 'Ấn tượng 4', type: 'Sáng tạo', author: 'Chuyên nghiệp', image: 'https://placehold.co/600x848/ffffff/1e293b?text=CV+Ấn+Tượng', colors: ['#1e293b', '#0f172a'] },
  ];

  // Dữ liệu Template sinh ra bởi AI tuần này
  const aiGeneratedTemplates = [
    { name: "Cyberpunk Coder", targetIndustry: "AI / Web3 Engineer", designConfig: { primaryColor: "#8b5cf6", fontFamily: "Roboto", lineSpacing: 1.6 }, mockImageText: "Tech+CV" },
    { name: "Minimalist Marketer", targetIndustry: "Digital Marketing", designConfig: { primaryColor: "#f97316", fontFamily: "Inter", lineSpacing: 1.5 }, mockImageText: "Marketing+CV" },
    { name: "Fintech Leader", targetIndustry: "Finance / Blockchain", designConfig: { primaryColor: "#0ea5e9", fontFamily: "Times New Roman", lineSpacing: 1.4 }, mockImageText: "Finance+CV" }
  ];

  // Mở Modal và lưu lại mẫu đang chọn
  const openModal = (template) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  // Tạo CV Trắng
  const handleCreateBlank = () => {
    closeModal();
    navigate('/candidate/cv-builder', { 
      state: { dynamicConfig: selectedTemplate?.designConfig ? selectedTemplate : null } 
    });
  };

  // Upload CV PDF (Dùng AI Bóc tách)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return toast.error('Hệ thống chỉ hỗ trợ định dạng PDF.');
    }

    const formData = new FormData();
    formData.append('cvFile', file);
    setIsUploading(true);
    const toastId = toast.loading('AI đang phân tích và bóc tách dữ liệu CV của bạn...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/cv/parse-pdf`,  {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.parsedData) {
        toast.update(toastId, { render: "Bóc tách thành công! Đang chuyển trang...", type: "success", isLoading: false, autoClose: 2000 });
        closeModal();
        navigate('/candidate/cv-builder', { 
          state: { 
            parsedData: result.parsedData,
            dynamicConfig: selectedTemplate?.designConfig ? selectedTemplate : null
          } 
        });
      } else {
        throw new Error(result.message || "Không thể bóc tách dữ liệu.");
      }
    } catch (error) {
      toast.update(toastId, { render: "Lỗi: " + error.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  const filters = ['Tất cả', 'Đơn giản', 'Chuyên nghiệp', 'Hiện đại', 'Ấn tượng', 'Harvard', 'ATS'];

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        /* Reset & Font */
        .template-page { background: #f4f5f5; min-height: 100vh; padding: 40px 20px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
        .template-container { max-width: 1200px; margin: 0 auto; }
        
        /* Header */
        .page-header { text-align: center; margin-bottom: 40px; }
        .page-title { font-size: 28px; font-weight: 700; color: #212f3f; margin-bottom: 12px; }
        .page-subtitle { font-size: 15px; color: #555; max-width: 700px; margin: 0 auto; line-height: 1.5; }
        
        /* Filter */
        .filter-bar { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 30px; }
        .filter-btn { padding: 8px 16px; background: white; border: 1px solid #e5e7eb; border-radius: 20px; font-size: 14px; font-weight: 500; color: #4b5563; cursor: pointer; transition: all 0.2s; }
        .filter-btn:hover { border-color: #00b14f; color: #00b14f; }
        .filter-btn.active { background: #00b14f; color: white; border-color: #00b14f; }
        
        /* Grid & Cards */
        .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 24px; margin-bottom: 50px; }
        .template-card { background: transparent; }
        .img-wrapper { background: white; padding: 0; border: 1px solid #e5e7eb; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 12px; position: relative; overflow: hidden; aspect-ratio: 1 / 1.414; transition: transform 0.3s, box-shadow 0.3s; }
        .img-wrapper:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        .img-wrapper img { width: 100%; height: 100%; object-fit: cover; display: block; }
        
        /* Hover Action Overlay */
        .hover-action { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
        .img-wrapper:hover .hover-action { opacity: 1; }
        .btn-use-template { background: #00b14f; color: white; padding: 10px 24px; border-radius: 20px; font-weight: 600; font-size: 14px; border: none; cursor: pointer; transition: background 0.2s; }
        .btn-use-template:hover { background: #009040; }
        
        /* Info */
        .template-info { display: flex; justify-content: space-between; align-items: flex-start; padding: 0 4px; }
        .template-name { font-size: 16px; font-weight: 600; color: #212f3f; margin-bottom: 6px; }
        .template-badges { display: flex; gap: 6px; }
        .badge { background: #f3f4f6; color: #4b5563; font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 500; }
        .badge-ai { background: #fef08a; color: #854d0e; }
        .color-palette { display: flex; gap: 4px; }
        .color-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid #e5e7eb; }
        
        /* Section Divider */
        .section-divider { display: flex; align-items: center; gap: 15px; margin-bottom: 24px; }
        .section-divider::before, .section-divider::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
        .section-divider-title { font-size: 16px; font-weight: 700; color: #00b14f; display: flex; align-items: center; gap: 8px; text-transform: uppercase; }

        /* ================= MODAL CSS ================= */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(2px); animation: fadeIn 0.2s ease-out; }
        .modal-content { background: white; width: 100%; max-width: 500px; border-radius: 12px; padding: 30px; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .modal-close { position: absolute; top: 15px; right: 15px; background: transparent; border: none; font-size: 24px; color: #9ca3af; cursor: pointer; transition: 0.2s; }
        .modal-close:hover { color: #374151; }
        .modal-title { font-size: 20px; font-weight: 700; color: #1f2937; margin-bottom: 24px; text-align: center; }
        
        .modal-options { display: flex; flex-direction: column; gap: 16px; }
        .option-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px; display: flex; gap: 16px; align-items: center; cursor: pointer; transition: all 0.2s; background: #fff; text-align: left; }
        .option-card:hover { border-color: #00b14f; background: #f0fdf4; }
        .option-card.disabled { opacity: 0.6; cursor: not-allowed; pointer-events: none; }
        
        .option-icon { width: 48px; height: 48px; border-radius: 50%; background: #e0f2fe; color: #0284c7; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
        .option-icon.green { background: #dcfce7; color: #16a34a; }
        
        .option-text h4 { font-size: 15px; font-weight: 600; color: #1f2937; margin: 0 0 4px 0; }
        .option-text p { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.4; }

        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div className="template-page">
        <div className="template-container">
          
          <div className="page-header">
            <h1 className="page-title">Danh sách mẫu CV xin việc chuẩn 2026</h1>
            <p className="page-subtitle">Các mẫu CV được thiết kế theo chuẩn, đa dạng phong cách, tối ưu hoá cho hệ thống quét tự động ATS giúp bạn dễ dàng ghi điểm với nhà tuyển dụng.</p>
          </div>

          {/* KHU VỰC 1: TEMPLATE ĐỘNG DO AI SINH RA */}
          <div className="section-divider">
            <div className="section-divider-title">
              <span className="material-symbols-outlined">auto_awesome</span> Mới: AI Gợi Ý Tuần Này
            </div>
          </div>
          <div className="template-grid">
            {aiGeneratedTemplates.map(tpl => (
              <div className="template-card" key={tpl.name}>
                <div className="img-wrapper" style={{ border: `2px solid ${tpl.designConfig.primaryColor}30` }}>
                  {/* Sử dụng Placehold giả lập ảnh A4 */}
                  <img src={`https://placehold.co/600x848/${tpl.designConfig.primaryColor.replace('#','')}/ffffff?text=${tpl.mockImageText}`} alt={tpl.name} />
                  <div className="hover-action">
                    <button 
                      className="btn-use-template" 
                      style={{ backgroundColor: tpl.designConfig.primaryColor }}
                      onClick={() => openModal(tpl)}
                    >
                      Dùng mẫu AI này
                    </button>
                  </div>
                </div>
                <div className="template-info">
                  <div>
                    <div className="template-name" style={{ color: tpl.designConfig.primaryColor }}>{tpl.name}</div>
                    <div className="template-badges">
                      <span className="badge badge-ai">HOT</span>
                      <span className="badge">Dành cho {tpl.targetIndustry}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* KHU VỰC 2: TEMPLATE TRUYỀN THỐNG */}
          <div className="section-divider" style={{ marginTop: '40px' }}>
            <div className="section-divider-title" style={{ color: '#4b5563' }}>Thư Viện Mẫu Tiêu Chuẩn</div>
          </div>
          
          <div className="filter-bar">
            {filters.map(filter => (
              <button key={filter} className={`filter-btn ${activeFilter === filter ? 'active' : ''}`} onClick={() => setActiveFilter(filter)}>
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
                    <button className="btn-use-template" onClick={() => openModal(tpl)}>Dùng mẫu này</button>
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

      {/* MODAL LỰA CHỌN CÁCH TẠO CV */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3 className="modal-title">Bạn muốn tạo CV từ?</h3>
            
            <div className="modal-options">
              {/* Lựa chọn 1: Upload PDF (Auto-fill) */}
              <label className={`option-card ${isUploading ? 'disabled' : ''}`} style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}>
                <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
                <div className="option-icon">
                  {isUploading ? <span className="material-symbols-outlined animate-spin">sync</span> : <span className="material-symbols-outlined">upload_file</span>}
                </div>
                <div className="option-text">
                  <h4>Dùng AI trích xuất từ CV có sẵn</h4>
                  <p>{isUploading ? 'AI đang đọc dữ liệu, vui lòng chờ...' : 'Tải lên CV cũ (PDF), AI sẽ tự động đọc thông tin và điền vào mẫu mới giúp bạn.'}</p>
                </div>
              </label>

              {/* Lựa chọn 2: Tạo trắng */}
              <div className={`option-card ${isUploading ? 'disabled' : ''}`} onClick={!isUploading ? handleCreateBlank : undefined}>
                <div className="option-icon green">
                  <span className="material-symbols-outlined">edit_document</span>
                </div>
                <div className="option-text">
                  <h4>Tạo CV từ đầu</h4>
                  <p>Bắt đầu bằng một khung trắng và tự tay điền từng thông tin của bạn vào hệ thống.</p>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};

export default TemplateCV;