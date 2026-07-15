import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2pdf from 'html2pdf.js';

// Component Textarea tự co giãn
const AutoResizeTextarea = ({ value, onChange, placeholder, style, className, name }) => {
  const textareaRef = useRef(null);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);
  return (
    <textarea ref={textareaRef} name={name} value={value} onChange={onChange} placeholder={placeholder} className={className}
      style={{ ...style, overflow: 'hidden', resize: 'none', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit', whiteSpace: 'pre-wrap' }} />
  );
};

// Component "Biến hình": Chuyển thành thẻ <div> tĩnh khi in PDF, tàng hình nếu trống
const PrintableField = ({ isExporting, isTextarea, value, onChange, placeholder, className, style, name }) => {
  if (isExporting) {
    if (!value || value.trim() === '') return null; // Ẩn hoàn toàn nếu không có dữ liệu
    return (
      <div className={className} style={{ ...style, whiteSpace: isTextarea ? 'pre-wrap' : 'normal', wordBreak: 'break-word', display: 'block', minHeight: 'auto', padding: 0 }}>
        {value}
      </div>
    );
  }
  if (isTextarea) {
    return <AutoResizeTextarea name={name} value={value} onChange={onChange} placeholder={placeholder} className={className} style={style} />;
  }
  return <input type="text" name={name} value={value} onChange={onChange} placeholder={placeholder} className={className} style={style} />;
};

const EditCV = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cvRef = useRef();
  const fileInputRef = useRef(null);
  
  // Ref chặn tải đúp do StrictMode
  const autoDownloadTriggered = useRef(false);

  const [loading, setLoading] = useState(false);
  const [cvId, setCvId] = useState(null);
  const [isExporting, setIsExporting] = useState(false); // State phép thuật chuyển đổi CV thành bản tĩnh
  
  const [design, setDesign] = useState({ font: 'Roboto', color: '#059669', lineSpacing: 1.5 });

  const [data, setData] = useState({
    personal: { fullName: '', jobTitle: '', email: '', phone: '', dob: '', gender: '', address: '', link: '', avatar: '' },
    sectionTitles: {
      objective: 'MỤC TIÊU NGHỀ NGHIỆP', education: 'HỌC VẤN', experience: 'KINH NGHIỆM LÀM VIỆC',
      activities: 'HOẠT ĐỘNG', certificates: 'CHỨNG CHỈ', skills: 'KỸ NĂNG CHUYÊN MÔN', hobbies: 'SỞ THÍCH'
    },
    objective: '',
    education: [{ school: '', major: '', time: '', description: '' }],
    experience: [{ company: '', position: '', time: '', description: '' }],
    activities: [{ organization: '', role: '', time: '', description: '' }],
    certificates: [{ name: '', time: '' }],
    skills: '', hobbies: ''
  });

  useEffect(() => {
    if (location.state?.cvData) {
      const dbCV = location.state.cvData;
      setCvId(dbCV._id);
      setDesign(dbCV.design);
      setData(dbCV.data);
      
      // Khắc phục lỗi tải đúp bằng Ref
      if (location.state?.autoDownload && !autoDownloadTriggered.current) {
        autoDownloadTriggered.current = true;
        setTimeout(() => handleDownloadPDF(dbCV.data), 500); 
      }
    } 
    else if (location.state?.parsedData) {
      const aiData = location.state.parsedData;
      setData(prev => ({
        ...prev,
        personal: { ...prev.personal, ...(aiData.personal || {}) },
        objective: aiData.objective || '',
        education: aiData.education?.length ? aiData.education : prev.education,
        experience: aiData.experience?.length ? aiData.experience : prev.experience,
        activities: aiData.activities?.length ? aiData.activities : prev.activities,
        certificates: aiData.certificates?.length ? aiData.certificates : prev.certificates,
        skills: aiData.skills || '', hobbies: aiData.hobbies || ''
      }));
      toast.success('AI đã trích xuất dữ liệu thành công!');
    }
  }, [location]);

  const handlePersonalChange = (e) => setData({ ...data, personal: { ...data.personal, [e.target.name]: e.target.value } });
  const handleTitleChange = (e) => setData({ ...data, sectionTitles: { ...data.sectionTitles, [e.target.name]: e.target.value } });
  
  const handleArrayChange = (index, field, value, type) => {
    const newArr = [...data[type]];
    newArr[index][field] = value;
    setData({ ...data, [type]: newArr });
  };
  const addArrayItem = (type) => {
    const template = type === 'certificates' ? { name: '', time: '' } : { school: '', company: '', organization: '', major: '', position: '', role: '', time: '', description: '' };
    setData({ ...data, [type]: [...data[type], template] });
  };
  const removeArrayItem = (index, type) => {
    const newArr = data[type].filter((_, i) => i !== index);
    setData({ ...data, [type]: newArr.length ? newArr : [{}] }); 
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setData({ ...data, personal: { ...data.personal, avatar: reader.result } });
      reader.readAsDataURL(file);
    }
  };

  const saveToDatabase = async () => {
    if (!data.personal.fullName?.trim()) return toast.error('Vui lòng nhập Họ Tên');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const payload = { cvId, title: `CV - ${data.personal.fullName}`, design, data };
      const response = await fetch(`${apiUrl}/api/cv/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Lỗi lưu CV');
      toast.success('Lưu thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/candidate/manage-cv'), 1200);
    } catch (error) { toast.error(error.message); } finally { setLoading(false); }
  };

  // HÀM XUẤT PDF MỚI HOÀN TOÀN
  const handleDownloadPDF = (cvData = data) => {
    // 1. Validate thông tin cơ bản
    const isMissingInfo = !cvData.personal.fullName || !cvData.personal.email || !cvData.personal.phone || !cvData.objective;
    if (isMissingInfo) {
      const confirmDownload = window.confirm('CV của bạn vẫn còn thông tin quan trọng chưa điền. Bạn có chắc chắn muốn tải xuống bản PDF này không?');
      if (!confirmDownload) return;
    }

    toast.info('Đang chuẩn bị file PDF...');
    
    // 2. Kích hoạt Export Mode để biến form thành bản text tĩnh
    setIsExporting(true);

    // 3. Đợi React Render xong bản tĩnh (500ms) rồi mới chụp ảnh
    setTimeout(() => {
      const element = cvRef.current;
      const opt = {
        margin: [15, 0, 15, 0], // Căn lề trên dưới 15mm
        filename: `CV_${cvData.personal.fullName || 'Careerio'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          letterRendering: true, 
        }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] } 
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        toast.success('Tải PDF thành công!');
        setIsExporting(false); // 4. Tải xong thì khôi phục lại chế độ Edit
      });
    }, 500); 
  };

  // Helper kiểm tra xem mảng có dữ liệu thật không để ẩn luôn tiêu đề nếu trống
  const hasData = (arr, key) => arr.some(item => item[key] && item[key].trim() !== '');

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .builder-layout { display: flex; height: calc(100vh - 76px); background: #f0f4f8; overflow: hidden; }
        .sidebar-tools { width: 320px; background: white; padding: 20px; border-right: 1px solid #e2e8f0; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; z-index: 10; }
        .tool-group { display: flex; flex-direction: column; gap: 10px; }
        .tool-title { font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; }
        .tool-select, .tool-range { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; }
        .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: 0.2s; }
        .color-btn.active { border-color: #1e293b; box-shadow: 0 0 0 2px white inset; }
        
        .btn-action-group { display: flex; flex-direction: column; gap: 10px; margin-top: auto; }
        .btn-row { display: flex; gap: 10px; }
        .btn-primary, .btn-outline, .btn-secondary { flex: 1; padding: 12px; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; text-align: center; transition: 0.2s;}
        .btn-primary { background: #059669; color: white; } .btn-primary:hover { background: #047857; }
        .btn-outline { background: transparent; color: #059669; border: 1px solid #059669; } .btn-outline:hover { background: #059669; color: white; }
        .btn-secondary { background: #1e293b; color: white; width: 100%; } .btn-secondary:hover { background: #0f172a; }
        
        .cv-preview-area { flex: 1; overflow-y: auto; padding: 40px 20px; display: flex; justify-content: center; align-items: flex-start; background: #e2e8f0; }
        .cv-paper { width: 210mm; min-height: 297mm; height: max-content; background: white; padding: 20mm; box-shadow: 0 10px 30px rgba(0,0,0,0.2); margin-bottom: 40px; }
        
        .cv-input { border: none; background: transparent; outline: none; width: 100%; font-family: inherit; font-size: 14px; color: inherit; }
        .cv-input:hover, .cv-input:focus { background: #f8fafc; border-radius: 4px; }
        
        /* BẢO VỆ CHỐNG CẮT TRANG PDF NÂNG CAO */
        .page-break-safe { page-break-inside: avoid !important; break-inside: avoid-page !important; display: block !important; }
        
        .cv-header-layout { display: flex; flex-direction: row; gap: 24px; align-items: flex-start; margin-bottom: 30px; }
        .cv-avatar-box { width: 130px; height: 130px; border-radius: 50%; background: #f1f5f9; border: 2px dashed #cbd5e1; display: flex; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; position: relative; flex-shrink: 0; }
        .cv-avatar-box img { width: 100%; height: 100%; object-fit: cover; }
        .cv-avatar-text { font-size: 12px; color: #94a3b8; text-align: center; padding: 10px; }
        .cv-personal-info { flex: 1; display: flex; flex-direction: column; gap: 5px; justify-content: center; }
        
        .cv-name-input { font-size: 32px; font-weight: 800; text-transform: uppercase; margin-bottom: 0; padding: 0; line-height: 1.2; }
        .cv-title-input { font-size: 18px; font-weight: 500; color: #475569; margin-bottom: 12px; padding: 0; line-height: 1.2; }
        
        .contact-grid { display: flex; flex-wrap: wrap; gap: 10px 20px; font-size: 13px; color: #334155; }
        .contact-item { display: flex; align-items: center; gap: 8px; min-width: 45%; }
        .contact-item svg { width: 15px; height: 15px; flex-shrink: 0; }
        
        .cv-section-title-input { font-size: 16px; font-weight: 700; text-transform: uppercase; border: none; border-bottom: 2px solid; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; width: 100%; outline: none; background: transparent; font-family: inherit; }
        .cv-section-title-input:hover { background: #f8fafc; }
        
        .cv-item { margin-bottom: 20px; position: relative; display: block; }
        .cv-item-header { display: flex; flex-direction: row; justify-content: space-between; font-weight: 700; margin-bottom: 5px; align-items: flex-start; }
        .cv-item-sub { font-style: italic; margin-bottom: 5px; font-weight: 500; color: #475569;}
        
        .btn-add-item { display: block; font-size: 12px; color: #3b82f6; background: transparent; border: 1px dashed #3b82f6; width: 100%; padding: 8px; cursor: pointer; border-radius: 4px; transition: 0.2s; margin-top: 10px;}
        .btn-add-item:hover { background: #eff6ff; }
        .btn-remove-item { background: transparent; border: none; color: #ef4444; cursor: pointer; font-size: 14px; opacity: 0; transition: 0.2s; padding: 5px; margin-left: 10px; }
        .cv-item:hover .btn-remove-item { opacity: 1; }
      `}</style>

      <div className="builder-layout">
        <div className="sidebar-tools">
          <div className="tool-group">
            <div className="tool-title">Font chữ</div>
            <select className="tool-select" value={design.font} onChange={(e) => setDesign({...design, font: e.target.value})} disabled={isExporting}>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Inter">Inter</option>
            </select>
          </div>
          <div className="tool-group">
            <div className="tool-title">Khoảng cách dòng ({design.lineSpacing})</div>
            <input className="tool-range" type="range" min="1.2" max="2" step="0.1" value={design.lineSpacing} onChange={(e) => setDesign({...design, lineSpacing: parseFloat(e.target.value)})} disabled={isExporting}/>
          </div>
          <div className="tool-group">
            <div className="tool-title">Màu chủ đề</div>
            <div className="color-picker">
              {['#059669', '#2563eb', '#dc2626', '#d97706', '#4f46e5', '#8b5cf6', '#0ea5e9', '#1e293b'].map(color => (
                <div key={color} className={`color-btn ${design.color === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => !isExporting && setDesign({...design, color})} />
              ))}
            </div>
          </div>
          <div className="btn-action-group">
            <div className="btn-row">
              <button className="btn-outline" onClick={saveToDatabase} disabled={loading || isExporting}>{loading ? '...' : 'Lưu nháp'}</button>
              <button className="btn-primary" onClick={saveToDatabase} disabled={loading || isExporting}>Lưu & Thoát</button>
            </div>
            <button className="btn-secondary" onClick={() => handleDownloadPDF(data)} disabled={isExporting}>
              {isExporting ? 'Đang tạo bản in PDF...' : 'Tải PDF ngay'}
            </button>
          </div>
        </div>

        <div className="cv-preview-area">
          <div className="cv-paper" ref={cvRef} style={{ fontFamily: design.font, lineHeight: design.lineSpacing, color: '#1e293b' }}>
            
            {/* 1. Header Info */}
            <div className="cv-header-layout page-break-safe">
              {/* Ẩn cục Avatar nếu in PDF mà người dùng chưa up ảnh */}
              {!(isExporting && !data.personal.avatar) && (
                <div className="cv-avatar-box" onClick={() => !isExporting && fileInputRef.current.click()} style={{ border: isExporting ? 'none' : '2px dashed #cbd5e1' }}>
                  {data.personal.avatar ? <img src={data.personal.avatar} alt="Avatar" /> : (!isExporting && <div className="cv-avatar-text">Click tải ảnh lên</div>)}
                  <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </div>
              )}
              
              <div className="cv-personal-info">
                <PrintableField isExporting={isExporting} name="fullName" className="cv-input cv-name-input" placeholder="HỌ VÀ TÊN" value={data.personal.fullName} onChange={handlePersonalChange} style={{ color: design.color }} />
                <PrintableField isExporting={isExporting} name="jobTitle" className="cv-input cv-title-input" placeholder="Vị trí ứng tuyển" value={data.personal.jobTitle} onChange={handlePersonalChange} />
                
                <div className="contact-grid">
                  {(data.personal.dob || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <PrintableField isExporting={isExporting} name="dob" className="cv-input" placeholder="Ngày sinh" value={data.personal.dob} onChange={handlePersonalChange} />
                    </div>
                  )}
                  {(data.personal.gender || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      <PrintableField isExporting={isExporting} name="gender" className="cv-input" placeholder="Giới tính" value={data.personal.gender} onChange={handlePersonalChange} />
                    </div>
                  )}
                  {(data.personal.phone || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      <PrintableField isExporting={isExporting} name="phone" className="cv-input" placeholder="Số điện thoại" value={data.personal.phone} onChange={handlePersonalChange} />
                    </div>
                  )}
                  {(data.personal.email || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                      <PrintableField isExporting={isExporting} name="email" className="cv-input" placeholder="Email" value={data.personal.email} onChange={handlePersonalChange} />
                    </div>
                  )}
                  {(data.personal.address || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                      <PrintableField isExporting={isExporting} name="address" className="cv-input" placeholder="Địa chỉ" value={data.personal.address} onChange={handlePersonalChange} />
                    </div>
                  )}
                  {(data.personal.link || !isExporting) && (
                    <div className="contact-item">
                      <svg style={{color: design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      <PrintableField isExporting={isExporting} name="link" className="cv-input" placeholder="Link Portfolio / Linkedin" value={data.personal.link} onChange={handlePersonalChange} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 2. Mục tiêu nghề nghiệp */}
            {(data.objective || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="objective" className="cv-section-title-input" value={data.sectionTitles.objective} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Nhập mục tiêu nghề nghiệp..." value={data.objective} onChange={(e) => setData({...data, objective: e.target.value})} />
              </div>
            )}

            {/* 3. Học vấn */}
            {(hasData(data.education, 'school') || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="education" className="cv-section-title-input" value={data.sectionTitles.education} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                {data.education.map((item, index) => (
                  (item.school || !isExporting) && (
                    <div className="cv-item" key={index}>
                      <div className="cv-item-header">
                        <PrintableField isExporting={isExporting} className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên trường học" value={item.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} />
                        <div style={{ display: 'flex', width: '30%', justifyContent: 'flex-end', alignItems: 'center' }}>
                           <PrintableField isExporting={isExporting} className="cv-input" style={{ textAlign: 'right' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'education')} />
                           {!isExporting && <button className="btn-remove-item" onClick={() => removeArrayItem(index, 'education')}>✕</button>}
                        </div>
                      </div>
                      <PrintableField isExporting={isExporting} className="cv-input cv-item-sub" placeholder="Chuyên ngành" value={item.major} onChange={(e) => handleArrayChange(index, 'major', e.target.value, 'education')} />
                      <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Mô tả chi tiết" value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'education')} />
                    </div>
                  )
                ))}
                {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('education')}>+ Thêm {data.sectionTitles.education}</button>}
              </div>
            )}

            {/* 4. Kinh nghiệm */}
            {(hasData(data.experience, 'company') || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="experience" className="cv-section-title-input" value={data.sectionTitles.experience} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                {data.experience.map((item, index) => (
                  (item.company || !isExporting) && (
                    <div className="cv-item" key={index}>
                      <div className="cv-item-header">
                        <PrintableField isExporting={isExporting} className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên công ty / Dự án" value={item.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} />
                        <div style={{ display: 'flex', width: '30%', justifyContent: 'flex-end', alignItems: 'center' }}>
                           <PrintableField isExporting={isExporting} className="cv-input" style={{ textAlign: 'right' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'experience')} />
                           {!isExporting && <button className="btn-remove-item" onClick={() => removeArrayItem(index, 'experience')}>✕</button>}
                        </div>
                      </div>
                      <PrintableField isExporting={isExporting} className="cv-input cv-item-sub" placeholder="Vị trí công việc" value={item.position} onChange={(e) => handleArrayChange(index, 'position', e.target.value, 'experience')} />
                      <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Mô tả công việc..." value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')} />
                    </div>
                  )
                ))}
                {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('experience')}>+ Thêm {data.sectionTitles.experience}</button>}
              </div>
            )}

            {/* 5. Hoạt động */}
            {(hasData(data.activities, 'organization') || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="activities" className="cv-section-title-input" value={data.sectionTitles.activities} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                {data.activities.map((item, index) => (
                  (item.organization || !isExporting) && (
                    <div className="cv-item" key={index}>
                      <div className="cv-item-header">
                        <PrintableField isExporting={isExporting} className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên tổ chức / Câu lạc bộ" value={item.organization} onChange={(e) => handleArrayChange(index, 'organization', e.target.value, 'activities')} />
                        <div style={{ display: 'flex', width: '30%', justifyContent: 'flex-end', alignItems: 'center' }}>
                           <PrintableField isExporting={isExporting} className="cv-input" style={{ textAlign: 'right' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'activities')} />
                           {!isExporting && <button className="btn-remove-item" onClick={() => removeArrayItem(index, 'activities')}>✕</button>}
                        </div>
                      </div>
                      <PrintableField isExporting={isExporting} className="cv-input cv-item-sub" placeholder="Vai trò" value={item.role} onChange={(e) => handleArrayChange(index, 'role', e.target.value, 'activities')} />
                      <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Mô tả hoạt động..." value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'activities')} />
                    </div>
                  )
                ))}
                {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('activities')}>+ Thêm {data.sectionTitles.activities}</button>}
              </div>
            )}

            {/* 6. Chứng chỉ */}
            {(hasData(data.certificates, 'name') || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="certificates" className="cv-section-title-input" value={data.sectionTitles.certificates} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                {data.certificates.map((item, index) => (
                  (item.name || !isExporting) && (
                    <div className="cv-item" key={index}>
                      <div className="cv-item-header">
                        <PrintableField isExporting={isExporting} className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên chứng chỉ" value={item.name} onChange={(e) => handleArrayChange(index, 'name', e.target.value, 'certificates')} />
                        <div style={{ display: 'flex', width: '30%', justifyContent: 'flex-end', alignItems: 'center' }}>
                           <PrintableField isExporting={isExporting} className="cv-input" style={{ textAlign: 'right' }} placeholder="Năm cấp" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'certificates')} />
                           {!isExporting && <button className="btn-remove-item" onClick={() => removeArrayItem(index, 'certificates')}>✕</button>}
                        </div>
                      </div>
                    </div>
                  )
                ))}
                {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('certificates')}>+ Thêm {data.sectionTitles.certificates}</button>}
              </div>
            )}

            {/* 7. Kỹ năng */}
            {(data.skills || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="skills" className="cv-section-title-input" value={data.sectionTitles.skills} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Nhập các kỹ năng của bạn..." value={data.skills} onChange={(e) => setData({...data, skills: e.target.value})} />
              </div>
            )}

            {/* 8. Sở thích */}
            {(data.hobbies || !isExporting) && (
              <div className="page-break-safe">
                <PrintableField isExporting={isExporting} name="hobbies" className="cv-section-title-input" value={data.sectionTitles.hobbies} onChange={handleTitleChange} style={{ borderColor: design.color, color: design.color }} />
                <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" placeholder="Sở thích của bạn..." value={data.hobbies} onChange={(e) => setData({...data, hobbies: e.target.value})} />
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
};

export default EditCV;