import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2pdf from 'html2pdf.js';

// Component Textarea tự co giãn chiều cao theo nội dung
const AutoResizeTextarea = ({ value, onChange, placeholder, style, className }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      style={{ ...style, overflow: 'hidden', resize: 'none', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: 'inherit' }}
    />
  );
};

const EditCV = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cvRef = useRef();
  
  const [loading, setLoading] = useState(false);
  
  // Trạng thái Design
  const [design, setDesign] = useState({
    font: 'Times New Roman',
    color: '#059669',
    lineSpacing: 1.5
  });

  // Trạng thái Data của CV
  const [data, setData] = useState({
    personal: { fullName: '', jobTitle: '', email: '', phone: '', link: '' },
    objective: '',
    education: [{ school: '', major: '', time: '', description: '' }],
    experience: [{ company: '', position: '', time: '', description: '' }],
    skills: ''
  });

  // Nếu chuyển hướng từ trang Upload AI Parser, nhận data từ location.state
  useEffect(() => {
    if (location.state && location.state.parsedData) {
      setData(location.state.parsedData);
      toast.success('AI đã trích xuất dữ liệu thành công. Vui lòng kiểm tra lại!');
    }
  }, [location]);

  // Handle thay đổi dữ liệu
  const handlePersonalChange = (e) => {
    setData({ ...data, personal: { ...data.personal, [e.target.name]: e.target.value } });
  };

  const handleArrayChange = (index, field, value, type) => {
    const newArr = [...data[type]];
    newArr[index][field] = value;
    setData({ ...data, [type]: newArr });
  };

  const addArrayItem = (type) => {
    const newItem = type === 'education' 
      ? { school: '', major: '', time: '', description: '' }
      : { company: '', position: '', time: '', description: '' };
    setData({ ...data, [type]: [...data[type], newItem] });
  };

  // VALIDATE & LƯU DB
  const saveToDatabase = async () => {
    // Validate
    if (!data.personal.fullName.trim()) return toast.error('Vui lòng nhập Họ Tên');
    if (!data.personal.email.trim()) return toast.error('Vui lòng nhập Email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.personal.email)) return toast.error('Email không hợp lệ');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/cv/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title: `CV của ${data.personal.fullName}`, design, data })
      });

      if (!response.ok) throw new Error('Lỗi lưu CV');
      toast.success('Lưu CV thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi lưu vào hệ thống');
    } finally {
      setLoading(false);
    }
  };

  // XUẤT PDF
  const downloadPDF = () => {
    const element = cvRef.current;
    const opt = {
      margin:       0,
      filename:     `CV_${data.personal.fullName || 'Careerio'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <style>{`
        .builder-layout { display: flex; height: calc(100vh - 76px); background: #f0f4f8; overflow: hidden; }
        
        /* Cột trái: Design Control */
        .sidebar-tools { width: 320px; background: white; padding: 20px; border-right: 1px solid #e2e8f0; overflow-y: auto; display: flex; flex-direction: column; gap: 24px; box-shadow: 2px 0 10px rgba(0,0,0,0.05); z-index: 10; }
        .tool-group { display: flex; flex-direction: column; gap: 10px; }
        .tool-title { font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.5px; }
        .tool-select { width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; outline: none; background: #f8fafc; }
        
        .color-picker { display: flex; gap: 10px; flex-wrap: wrap; }
        .color-btn { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; transition: 0.2s; }
        .color-btn.active { border-color: #1e293b; box-shadow: 0 0 0 2px white inset; }

        .btn-action-group { display: flex; gap: 10px; margin-top: auto; }
        .btn-primary { flex: 1; padding: 12px; background: #059669; color: white; text-align: center; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }
        .btn-primary:hover { background: #047857; }
        .btn-secondary { flex: 1; padding: 12px; background: #1e293b; color: white; text-align: center; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; }

        /* Cột phải: Khung vẽ CV */
        .cv-preview-area { flex: 1; overflow-y: auto; padding: 40px 20px; display: flex; justify-content: center; }
        
        /* Tờ giấy A4 */
        .cv-paper { width: 210mm; min-height: 297mm; background: white; padding: 15mm; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border-radius: 4px; }
        
        /* Styling các input trên giấy sao cho nhìn như văn bản tĩnh */
        .cv-input { border: none; background: transparent; outline: none; width: 100%; font-family: inherit; }
        .cv-input:focus { background: #f8fafc; border-radius: 4px; }
        
        .cv-name-input { font-size: 28px; font-weight: 700; text-align: center; text-transform: uppercase; margin-bottom: 5px; }
        .cv-title-input { font-size: 16px; text-align: center; font-weight: 500; margin-bottom: 15px; }
        
        .contact-row { display: flex; justify-content: center; gap: 20px; font-size: 12px; flex-wrap: wrap; margin-bottom: 30px; }
        
        .cv-section-title { font-size: 16px; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid; padding-bottom: 5px; margin-bottom: 15px; margin-top: 25px; }
        
        .cv-item { margin-bottom: 15px; position: relative; }
        .cv-item-header { display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; margin-bottom: 5px; }
        .cv-item-sub { font-style: italic; font-size: 13px; margin-bottom: 5px; }
        
        .btn-add-item { display: block; font-size: 12px; color: #3b82f6; background: transparent; border: 1px dashed #3b82f6; width: 100%; padding: 5px; cursor: pointer; border-radius: 4px; margin-top: 10px; opacity: 0; transition: opacity 0.2s; }
        .cv-paper:hover .btn-add-item { opacity: 1; } /* Chỉ hiện nút add khi di chuột vào tờ giấy */
      `}</style>

      <div className="builder-layout">
        
        {/* PANEL TRÁI: ĐIỀU KHIỂN DESIGN */}
        <div className="sidebar-tools">
          <div className="tool-group">
            <div className="tool-title">Font chữ</div>
            <select className="tool-select" value={design.font} onChange={(e) => setDesign({...design, font: e.target.value})}>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Arial">Arial</option>
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
            </select>
          </div>

          <div className="tool-group">
            <div className="tool-title">Khoảng cách dòng ({design.lineSpacing})</div>
            <input 
              type="range" min="1" max="2" step="0.1" 
              value={design.lineSpacing} 
              onChange={(e) => setDesign({...design, lineSpacing: parseFloat(e.target.value)})}
            />
          </div>

          <div className="tool-group">
            <div className="tool-title">Màu chủ đề</div>
            <div className="color-picker">
              {['#059669', '#2563eb', '#dc2626', '#d97706', '#4f46e5', '#1e293b'].map(color => (
                <div 
                  key={color} 
                  className={`color-btn ${design.color === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setDesign({...design, color})}
                />
              ))}
            </div>
          </div>

          <div className="btn-action-group">
            <button className="btn-primary" onClick={saveToDatabase} disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu vào hệ thống'}
            </button>
            <button className="btn-secondary" onClick={downloadPDF}>
              Tải PDF
            </button>
          </div>
        </div>

        {/* PANEL PHẢI: TRANG GIẤY CV */}
        <div className="cv-preview-area">
          <div 
            className="cv-paper" 
            ref={cvRef} 
            style={{ 
              fontFamily: design.font, 
              lineHeight: design.lineSpacing,
              color: '#1e293b'
            }}
          >
            {/* THÔNG TIN CÁ NHÂN */}
            <div style={{ color: design.color }}>
              <input type="text" name="fullName" className="cv-input cv-name-input" placeholder="HỌ VÀ TÊN" value={data.personal.fullName} onChange={handlePersonalChange} style={{ color: design.color }} />
              <input type="text" name="jobTitle" className="cv-input cv-title-input" placeholder="Vị trí ứng tuyển (Vd: Software Engineer)" value={data.personal.jobTitle} onChange={handlePersonalChange} />
            </div>

            <div className="contact-row">
              <input type="text" name="phone" className="cv-input" style={{ width: '120px' }} placeholder="📞 Số điện thoại" value={data.personal.phone} onChange={handlePersonalChange} />
              <input type="text" name="email" className="cv-input" style={{ width: '200px' }} placeholder="✉️ Email" value={data.personal.email} onChange={handlePersonalChange} />
              <input type="text" name="link" className="cv-input" style={{ width: '200px' }} placeholder="🔗 Link (Github/LinkedIn)" value={data.personal.link} onChange={handlePersonalChange} />
            </div>

            {/* MỤC TIÊU NGHỀ NGHIỆP */}
            <div className="cv-section-title" style={{ borderColor: design.color, color: design.color }}>Mục tiêu nghề nghiệp</div>
            <AutoResizeTextarea 
              className="cv-input" 
              placeholder="Nhập mục tiêu nghề nghiệp của bạn..." 
              value={data.objective} 
              onChange={(e) => setData({...data, objective: e.target.value})} 
            />

            {/* HỌC VẤN */}
            <div className="cv-section-title" style={{ borderColor: design.color, color: design.color }}>Học vấn</div>
            {data.education.map((edu, index) => (
              <div className="cv-item" key={index}>
                <div className="cv-item-header">
                  <input type="text" className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên trường học" value={edu.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} />
                  <input type="text" className="cv-input" style={{ textAlign: 'right', width: '30%' }} placeholder="Tháng/Năm - Tháng/Năm" value={edu.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'education')} />
                </div>
                <input type="text" className="cv-input cv-item-sub" placeholder="Chuyên ngành" value={edu.major} onChange={(e) => handleArrayChange(index, 'major', e.target.value, 'education')} />
                <AutoResizeTextarea className="cv-input" placeholder="Mô tả chi tiết (GPA, Đồ án...)" value={edu.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'education')} />
              </div>
            ))}
            <button className="btn-add-item" onClick={() => addArrayItem('education')}>+ Thêm Học Vấn</button>

            {/* KINH NGHIỆM */}
            <div className="cv-section-title" style={{ borderColor: design.color, color: design.color }}>Kinh nghiệm làm việc</div>
            {data.experience.map((exp, index) => (
              <div className="cv-item" key={index}>
                <div className="cv-item-header">
                  <input type="text" className="cv-input" style={{ fontWeight: 'bold', width: '70%' }} placeholder="Tên công ty" value={exp.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} />
                  <input type="text" className="cv-input" style={{ textAlign: 'right', width: '30%' }} placeholder="Tháng/Năm - Tháng/Năm" value={exp.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'experience')} />
                </div>
                <input type="text" className="cv-input cv-item-sub" placeholder="Vị trí công việc" value={exp.position} onChange={(e) => handleArrayChange(index, 'position', e.target.value, 'experience')} />
                <AutoResizeTextarea className="cv-input" placeholder="- Mô tả công việc..." value={exp.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')} />
              </div>
            ))}
            <button className="btn-add-item" onClick={() => addArrayItem('experience')}>+ Thêm Kinh Nghiệm</button>

            {/* KỸ NĂNG */}
            <div className="cv-section-title" style={{ borderColor: design.color, color: design.color }}>Kỹ năng chuyên môn</div>
            <AutoResizeTextarea 
              className="cv-input" 
              placeholder="Nhập các kỹ năng của bạn (Vd: ReactJS, Node.js, Python...)" 
              value={data.skills} 
              onChange={(e) => setData({...data, skills: e.target.value})} 
            />

          </div>
        </div>
      </div>
    </>
  );
};

export default EditCV;