import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import html2pdf from 'html2pdf.js';
import { GripVertical, LayoutTemplate, Type, Palette, AlignLeft, Download, Save, X, Sparkles, CheckCircle2, AlertTriangle, ThumbsUp, ChevronRight, Settings } from 'lucide-react';

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

const PrintableField = ({ isExporting, isTextarea, value, onChange, placeholder, className, style, name }) => {
  if (isExporting) {
    if (!value || value.trim() === '') return null; 
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
  const middleColumnRef = useRef(null);
  
  const autoDownloadTriggered = useRef(false);

  const [loading, setLoading] = useState(false);
  const [cvId, setCvId] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [aiReview, setAiReview] = useState(null);
  const [design, setDesign] = useState({ font: 'Roboto', color: '#059669', lineSpacing: 1.5, layout: 'classic' });

  // TRẠNG THÁI CHO MENU PHẢI & AUTO-SCALE CV
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [cvScale, setCvScale] = useState(1);

  const defaultOrder = ['objective', 'experience', 'education', 'activities', 'certificates', 'skills', 'hobbies'];
  const [sectionOrder, setSectionOrder] = useState(defaultOrder);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

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

  // LOGIC AUTO-SCALE KHI CO KÉO MÀN HÌNH HOẶC ĐÓNG/MỞ MENU
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const containerWidth = entry.contentRect.width;
            const cvWidth = 794; // Chiều rộng chuẩn 210mm quy ra pixel
            const padding = 48; // Padding an toàn 2 bên
            
            if (containerWidth < cvWidth + padding) {
                setCvScale((containerWidth - padding) / cvWidth);
            } else {
                setCvScale(1);
            }
        }
    });

    if (middleColumnRef.current) {
        observer.observe(middleColumnRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (location.state?.aiReviewData) {
        setAiReview(location.state.aiReviewData);
    }

    if (location.state?.dynamicConfig) {
      setDesign(prev => ({ 
        ...prev, 
        color: location.state.dynamicConfig.primaryColor || prev.color,
        font: location.state.dynamicConfig.fontFamily || prev.font,
        layout: location.state.dynamicConfig.layout || prev.layout
      }));
    }

    if (location.state?.cvData) {
      const dbCV = location.state.cvData;
      setCvId(dbCV._id);
      setDesign(prev => ({ ...prev, ...dbCV.design }));
      setData(dbCV.data);
      if (dbCV.sectionOrder) setSectionOrder(dbCV.sectionOrder);
      
      if (location.state?.autoDownload && !autoDownloadTriggered.current) {
        autoDownloadTriggered.current = true;
        setTimeout(() => handleDownloadPDF(dbCV.data), 800); 
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
      toast.success('Dữ liệu đã trích xuất thành công!');
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

  const hasData = (arr, key) => arr.some(item => item[key] && item[key].trim() !== '');
  const isSectionEmpty = (key) => {
    if (key === 'objective' || key === 'skills' || key === 'hobbies') return !data[key] || !data[key].trim();
    if (key === 'education') return !hasData(data.education, 'school');
    if (key === 'experience') return !hasData(data.experience, 'company');
    if (key === 'activities') return !hasData(data.activities, 'organization');
    if (key === 'certificates') return !hasData(data.certificates, 'name');
    return true;
  };

  const onDragStart = (e, index) => { setDraggedItemIndex(index); };
  const onDragEnter = (e, index) => {
    if (draggedItemIndex === index) return;
    const newOrder = [...sectionOrder];
    const draggedItem = newOrder[draggedItemIndex];
    newOrder.splice(draggedItemIndex, 1);
    newOrder.splice(index, 0, draggedItem);
    setDraggedItemIndex(index);
    setSectionOrder(newOrder);
  };
  const onDragEnd = () => { setDraggedItemIndex(null); };

  const saveToDatabase = async () => {
    if (!data.personal.fullName?.trim()) return toast.error('Vui lòng nhập Họ Tên');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const payload = { cvId, title: `CV - ${data.personal.fullName}`, design, data, sectionOrder };
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

  const handleDownloadPDF = (cvData = data) => {
    const isMissingInfo = !cvData.personal.fullName || !cvData.personal.email || !cvData.personal.phone;
    if (isMissingInfo) {
      const confirmDownload = window.confirm('CV của bạn vẫn còn thông tin liên hệ quan trọng chưa điền. Bạn có chắc chắn muốn tải xuống?');
      if (!confirmDownload) return;
    }
    
    toast.info('Đang kết xuất PDF, vui lòng chờ...', { autoClose: 2000 });
    setIsExporting(true);
    
    setTimeout(() => {
      const element = cvRef.current;
      const opt = {
        margin: design.layout === 'minimalist' ? [0, 0, 0, 0] : [10, 0, 10, 0], 
        filename: `CV_${cvData.personal.fullName || 'Careerio'}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false, scrollY: 0 }, 
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] } 
      };
      
      html2pdf().set(opt).from(element).save().then(() => {
        toast.success('Tải PDF thành công!');
        setIsExporting(false); 
      }).catch(err => {
        console.error("Lỗi tạo PDF:", err);
        toast.error("Quá trình tạo PDF gặp sự cố.");
        setIsExporting(false);
      });
    }, 1000); 
  };

  const renderSection = (key) => {
    if (isExporting && isSectionEmpty(key)) return null;

    const SectionTitle = () => {
      let titleStyle = { color: design.color, borderBottom: `2px solid ${design.color}` };
      let className = "cv-section-title-input";
      
      if (design.layout === 'minimalist') {
        titleStyle = { color: '#ffffff', backgroundColor: design.color, padding: '6px 12px', display: 'inline-block', width: 'auto', borderRadius: '0 12px 12px 0', border: 'none', marginLeft: '-20mm' };
      } else if (design.layout === '2-col') {
        titleStyle = { color: design.color, borderBottom: `2px solid ${design.color}` };
      }

      return (
        <PrintableField isExporting={isExporting} name={key} className={className} value={data.sectionTitles[key]} onChange={handleTitleChange} style={titleStyle} />
      );
    };

    switch (key) {
      case 'objective':
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="page-break-safe mt-2">
              <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" style={{ color: '#334155' }} placeholder="Nhập mục tiêu nghề nghiệp..." value={data.objective} onChange={(e) => setData({...data, objective: e.target.value})} />
            </div>
          </div>
        );
      case 'skills':
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="page-break-safe mt-2">
              <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" style={{ color: '#334155' }} placeholder="Kỹ năng chuyên môn..." value={data.skills} onChange={(e) => setData({...data, skills: e.target.value})} />
            </div>
          </div>
        );
      case 'hobbies':
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="page-break-safe mt-2">
              <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input" style={{ color: '#334155' }} placeholder="Sở thích..." value={data.hobbies} onChange={(e) => setData({...data, hobbies: e.target.value})} />
            </div>
          </div>
        );
      case 'education':
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="mt-3 space-y-4">
              {data.education.map((item, index) => (
                (item.school || !isExporting) && (
                  <div className="cv-item group page-break-safe" key={index}>
                    <div className="flex justify-between font-bold items-start mb-1">
                      <PrintableField isExporting={isExporting} className="cv-input w-3/4" placeholder="Tên trường học" value={item.school} onChange={(e) => handleArrayChange(index, 'school', e.target.value, 'education')} />
                      <div className="flex w-1/4 justify-end items-center">
                         <PrintableField isExporting={isExporting} className="cv-input text-right text-sm font-normal" style={{ color: '#64748b' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'education')} />
                         {!isExporting && <button className="opacity-0 group-hover:opacity-100 text-red-500 ml-2" onClick={() => removeArrayItem(index, 'education')}><X className="w-4 h-4"/></button>}
                      </div>
                    </div>
                    <PrintableField isExporting={isExporting} className="cv-input italic font-medium mb-1" style={{ color: '#475569' }} placeholder="Chuyên ngành" value={item.major} onChange={(e) => handleArrayChange(index, 'major', e.target.value, 'education')} />
                    <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input text-sm" style={{ color: '#334155' }} placeholder="Mô tả chi tiết" value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'education')} />
                  </div>
                )
              ))}
              {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('education')}>+ Thêm {data.sectionTitles.education}</button>}
            </div>
          </div>
        );
      case 'experience':
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="mt-3 space-y-4">
              {data.experience.map((item, index) => (
                (item.company || !isExporting) && (
                  <div className="cv-item group page-break-safe" key={index}>
                    <div className="flex justify-between font-bold items-start mb-1">
                      <PrintableField isExporting={isExporting} className="cv-input w-3/4" placeholder="Tên công ty / Dự án" value={item.company} onChange={(e) => handleArrayChange(index, 'company', e.target.value, 'experience')} />
                      <div className="flex w-1/4 justify-end items-center">
                         <PrintableField isExporting={isExporting} className="cv-input text-right text-sm font-normal" style={{ color: '#64748b' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, 'experience')} />
                         {!isExporting && <button className="opacity-0 group-hover:opacity-100 text-red-500 ml-2" onClick={() => removeArrayItem(index, 'experience')}><X className="w-4 h-4"/></button>}
                      </div>
                    </div>
                    <PrintableField isExporting={isExporting} className="cv-input italic font-medium mb-1" style={{ color: '#475569' }} placeholder="Vị trí công việc" value={item.position} onChange={(e) => handleArrayChange(index, 'position', e.target.value, 'experience')} />
                    <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input text-sm" style={{ color: '#334155' }} placeholder="Mô tả công việc..." value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, 'experience')} />
                  </div>
                )
              ))}
              {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem('experience')}>+ Thêm {data.sectionTitles.experience}</button>}
            </div>
          </div>
        );
      case 'activities':
      case 'certificates':
        const isAct = key === 'activities';
        return (
          <div className="mb-6" key={key}>
            <div className="page-break-safe"><SectionTitle /></div>
            <div className="mt-3 space-y-4">
              {data[key].map((item, index) => (
                ((isAct ? item.organization : item.name) || !isExporting) && (
                  <div className="cv-item group page-break-safe" key={index}>
                    <div className="flex justify-between font-bold items-start mb-1">
                      <PrintableField isExporting={isExporting} className="cv-input w-3/4" placeholder={isAct ? "Tên tổ chức" : "Tên chứng chỉ"} value={isAct ? item.organization : item.name} onChange={(e) => handleArrayChange(index, isAct ? 'organization' : 'name', e.target.value, key)} />
                      <div className="flex w-1/4 justify-end items-center">
                         <PrintableField isExporting={isExporting} className="cv-input text-right text-sm font-normal" style={{ color: '#64748b' }} placeholder="Thời gian" value={item.time} onChange={(e) => handleArrayChange(index, 'time', e.target.value, key)} />
                         {!isExporting && <button className="opacity-0 group-hover:opacity-100 text-red-500 ml-2" onClick={() => removeArrayItem(index, key)}><X className="w-4 h-4"/></button>}
                      </div>
                    </div>
                    {isAct && <PrintableField isExporting={isExporting} className="cv-input italic font-medium mb-1" style={{ color: '#475569' }} placeholder="Vai trò" value={item.role} onChange={(e) => handleArrayChange(index, 'role', e.target.value, key)} />}
                    {isAct && <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input text-sm" style={{ color: '#334155' }} placeholder="Mô tả..." value={item.description} onChange={(e) => handleArrayChange(index, 'description', e.target.value, key)} />}
                  </div>
                )
              ))}
              {!isExporting && <button className="btn-add-item" onClick={() => addArrayItem(key)}>+ Thêm {data.sectionTitles[key]}</button>}
            </div>
          </div>
        );
      default: return null;
    }
  };

  const ContactInfoList = ({ stacked = false }) => (
    <div className={`flex ${stacked ? 'flex-col gap-2' : 'flex-wrap gap-x-6 gap-y-2'} text-sm mt-3`} style={{ color: stacked ? 'rgba(255,255,255,0.9)' : '#475569' }}>
      {(data.personal.dob || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><PrintableField isExporting={isExporting} name="dob" className="cv-input" placeholder="Ngày sinh" value={data.personal.dob} onChange={handlePersonalChange} /></div>}
      {(data.personal.gender || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><PrintableField isExporting={isExporting} name="gender" className="cv-input" placeholder="Giới tính" value={data.personal.gender} onChange={handlePersonalChange} /></div>}
      {(data.personal.phone || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg><PrintableField isExporting={isExporting} name="phone" className="cv-input" placeholder="Số điện thoại" value={data.personal.phone} onChange={handlePersonalChange} /></div>}
      {(data.personal.email || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><PrintableField isExporting={isExporting} name="email" className="cv-input" placeholder="Email" value={data.personal.email} onChange={handlePersonalChange} /></div>}
      {(data.personal.address || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg><PrintableField isExporting={isExporting} name="address" className="cv-input" placeholder="Địa chỉ" value={data.personal.address} onChange={handlePersonalChange} /></div>}
      {(data.personal.link || !isExporting) && <div className="flex items-center gap-2 page-break-safe"><svg width="14" height="14" style={{color: stacked ? 'rgba(255,255,255,0.8)' : design.color}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg><PrintableField isExporting={isExporting} name="link" className="cv-input" placeholder="Link (Linkedin/Portfolio)" value={data.personal.link} onChange={handlePersonalChange} /></div>}
    </div>
  );

  const AvatarUpload = ({ size = "120px" }) => {
    if (isExporting && !data.personal.avatar) return null;
    return (
      <div onClick={() => !isExporting && fileInputRef.current.click()} 
           className="shrink-0 rounded-full flex items-center justify-center overflow-hidden relative cursor-pointer" 
           style={{ width: size, height: size, border: isExporting ? 'none' : '2px dashed #cbd5e1', backgroundColor: '#f1f5f9' }}>
        {data.personal.avatar ? <img src={data.personal.avatar} alt="Avatar" className="w-full h-full object-cover" /> : (!isExporting && <div className="text-xs text-center p-2" style={{ color: '#94a3b8' }}>Tải ảnh</div>)}
        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarUpload} />
      </div>
    );
  };

  return (
    <>
      <style>{`
        .cv-input { border: none; background: transparent; outline: none; width: 100%; font-family: inherit; font-size: inherit; color: inherit; }
        .cv-input:hover, .cv-input:focus { background: rgba(0,0,0,0.03); border-radius: 4px; }
        .page-break-safe { page-break-inside: avoid !important; break-inside: avoid-page !important; display: block !important; }
        .cv-section-title-input { font-size: 16px; font-weight: bold; text-transform: uppercase; border: none; border-bottom: 2px solid; padding-bottom: 4px; width: 100%; outline: none; background: transparent; font-family: inherit; }
        .cv-section-title-input:hover { background: rgba(0,0,0,0.03); }
        .btn-add-item { display: block; font-size: 12px; color: #3b82f6; background: transparent; border: 1px dashed #3b82f6; width: 100%; padding: 8px; cursor: pointer; border-radius: 4px; margin-top: 10px; transition: 0.2s;}
        .btn-add-item:hover { background: #eff6ff; }
      `}</style>

      {/* Fix cứng màn hình (App-like UX) để các cột tự cuộn độc lập */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-100 font-sans">
        
        {/* === CỘT TRÁI: GỢI Ý TỪ AI === */}
        {aiReview && (
           <div className="w-full lg:w-[380px] shrink-0 bg-[#fffbeb] border-r border-amber-200 p-6 flex flex-col z-20 h-full overflow-y-auto custom-scrollbar shadow-sm">
               <h3 className="font-black text-amber-800 mb-6 flex items-center gap-2">
                   <Sparkles className="w-5 h-5" /> Gợi ý sửa CV từ AI
               </h3>
               
               <div className="flex items-end gap-3 mb-4">
                  <div className="text-5xl font-black text-amber-600 leading-none">{aiReview.score}</div>
                  <div className="text-sm font-bold text-amber-900 pb-1 uppercase tracking-wider">/ 100 Điểm</div>
               </div>
               <p className="text-sm font-bold text-amber-800 mb-6 border-b border-amber-200/50 pb-4">{aiReview.verdict}</p>

               <div className="bg-white/60 p-4 rounded-xl border border-amber-200/50 mb-6 shadow-sm">
                   <strong className="text-xs font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Lời khuyên chi tiết:</strong>
                   <div className="text-[13.5px] text-amber-900 leading-relaxed font-medium whitespace-pre-wrap">{aiReview.advice}</div>
               </div>

               {aiReview.cons && aiReview.cons.length > 0 && (
                   <div className="mb-6">
                       <strong className="text-xs font-black text-rose-700 uppercase tracking-widest flex items-center gap-1.5 mb-3"><AlertTriangle className="w-4 h-4"/> Điểm yếu cần khắc phục:</strong>
                       <ul className="space-y-2">
                           {aiReview.cons.map((c, i) => (
                               <li key={i} className="text-[13px] font-medium text-rose-800 flex items-start gap-2 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100">
                                   <div className="w-1 h-1 bg-rose-500 rounded-full mt-2 shrink-0"></div>
                                   <span className="leading-snug">{c}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
               )}

               {aiReview.pros && aiReview.pros.length > 0 && (
                   <div className="mb-6">
                       <strong className="text-xs font-black text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 mb-3"><ThumbsUp className="w-4 h-4"/> Điểm mạnh đang có:</strong>
                       <ul className="space-y-2">
                           {aiReview.pros.map((p, i) => (
                               <li key={i} className="text-[13px] font-medium text-emerald-800 flex items-start gap-2">
                                   <div className="w-1 h-1 bg-emerald-500 rounded-full mt-2 shrink-0"></div>
                                   <span className="leading-snug">{p}</span>
                               </li>
                           ))}
                       </ul>
                   </div>
               )}
           </div>
        )}

        {/* === CỘT GIỮA: VÙNG HIỂN THỊ CV CÓ AUTO-SCALE === */}
        <div ref={middleColumnRef} className="flex-1 relative h-full overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-100 transition-all duration-300">
          
          {/* Nút Đóng/Mở thanh công cụ bên phải (Floating Button) */}
          <div className="sticky top-6 flex justify-end px-6 z-30 h-0">
             <button 
                 onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
                 className="bg-white border border-slate-200 shadow-md rounded-full p-2.5 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-all"
                 title={isRightPanelOpen ? "Thu gọn thanh công cụ" : "Mở thanh công cụ"}
             >
                 {isRightPanelOpen ? <ChevronRight className="w-5 h-5"/> : <Settings className="w-5 h-5"/>}
             </button>
          </div>

          {/* Vùng chứa CV sẽ tự động Scale nhỏ lại khi thu nhỏ màn hình */}
          <div className="w-full flex justify-center py-10 transition-transform duration-300 origin-top" style={{ transform: `scale(${cvScale})` }}>
            <div ref={cvRef} 
                 className={`shrink-0 ${isExporting ? '' : 'shadow-2xl'}`} 
                 style={{ 
                   width: '210mm', 
                   minHeight: '297mm', 
                   height: 'max-content',
                   fontFamily: design.font, 
                   lineHeight: design.lineSpacing, 
                   color: '#1e293b',
                   backgroundColor: '#ffffff',
                   padding: design.layout === 'minimalist' ? '0' : '20mm' 
                 }}>
              
              {/* --- LAYOUT 1: CLASSIC --- */}
              {design.layout === 'classic' && (
                <>
                  <div className="flex gap-8 items-start mb-10 page-break-safe pb-6" style={{ borderBottom: `4px solid ${design.color}` }}>
                    <AvatarUpload size="130px" />
                    <div className="flex-1 flex flex-col justify-center pt-2">
                      <PrintableField isExporting={isExporting} name="fullName" className="cv-input text-3xl font-black uppercase tracking-tight" placeholder="HỌ VÀ TÊN" value={data.personal.fullName} onChange={handlePersonalChange} style={{ color: design.color }} />
                      <PrintableField isExporting={isExporting} name="jobTitle" className="cv-input text-lg font-medium mt-1" style={{ color: '#64748b' }} placeholder="Vị trí ứng tuyển" value={data.personal.jobTitle} onChange={handlePersonalChange} />
                      <ContactInfoList />
                    </div>
                  </div>
                  <div>{sectionOrder.map(key => renderSection(key))}</div>
                </>
              )}

              {/* --- LAYOUT 2: MINIMALIST --- */}
              {design.layout === 'minimalist' && (
                <>
                  <div className="page-break-safe p-[20mm] pb-8" style={{ backgroundColor: '#f8fafc', borderBottom: `4px solid ${design.color}` }}>
                    <PrintableField isExporting={isExporting} name="fullName" className="cv-input text-4xl font-black uppercase tracking-tight" placeholder="HỌ VÀ TÊN" value={data.personal.fullName} onChange={handlePersonalChange} style={{ color: design.color }} />
                    <PrintableField isExporting={isExporting} name="jobTitle" className="cv-input text-xl font-medium mt-2" style={{ color: '#64748b' }} placeholder="Vị trí ứng tuyển" value={data.personal.jobTitle} onChange={handlePersonalChange} />
                    <ContactInfoList />
                  </div>
                  <div className="px-[20mm] pt-8">{sectionOrder.map(key => renderSection(key))}</div>
                </>
              )}

              {/* --- LAYOUT 3: 2 COLUMN --- */}
              {design.layout === '2-col' && (
                <div className="flex w-full h-full min-h-[297mm]">
                  <div className="w-1/3 p-6" style={{ backgroundColor: design.color, color: '#ffffff' }}>
                    <div className="flex justify-center mb-8"><AvatarUpload size="140px" /></div>
                    <div className="mb-8">
                      <h3 className="text-sm font-bold uppercase tracking-widest pb-2 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>Liên hệ</h3>
                      <div style={{ color: 'rgba(255,255,255,0.9)' }}><ContactInfoList stacked={true} /></div>
                    </div>
                    {sectionOrder.includes('skills') && (
                      <div className="mb-8 page-break-safe">
                        <h3 className="text-sm font-bold uppercase tracking-widest pb-2 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                          <PrintableField isExporting={isExporting} name="skills" className="cv-input" value={data.sectionTitles.skills} onChange={handleTitleChange} />
                        </h3>
                        <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input text-sm" style={{ color: 'rgba(255,255,255,0.9)' }} placeholder="Kỹ năng..." value={data.skills} onChange={(e) => setData({...data, skills: e.target.value})} />
                      </div>
                    )}
                    {sectionOrder.includes('hobbies') && (
                      <div className="mb-8 page-break-safe">
                        <h3 className="text-sm font-bold uppercase tracking-widest pb-2 mb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                          <PrintableField isExporting={isExporting} name="hobbies" className="cv-input" value={data.sectionTitles.hobbies} onChange={handleTitleChange} />
                        </h3>
                        <PrintableField isExporting={isExporting} isTextarea={true} className="cv-input text-sm" style={{ color: 'rgba(255,255,255,0.9)' }} placeholder="Sở thích..." value={data.hobbies} onChange={(e) => setData({...data, hobbies: e.target.value})} />
                      </div>
                    )}
                  </div>
                  <div className="w-2/3 p-8">
                    <div className="mb-8 page-break-safe">
                      <PrintableField isExporting={isExporting} name="fullName" className="cv-input text-4xl font-black uppercase tracking-tight" style={{ color: '#1e293b' }} placeholder="HỌ VÀ TÊN" value={data.personal.fullName} onChange={handlePersonalChange} />
                      <PrintableField isExporting={isExporting} name="jobTitle" className="cv-input text-xl font-medium mt-2" placeholder="Vị trí ứng tuyển" value={data.personal.jobTitle} onChange={handlePersonalChange} style={{ color: design.color }} />
                    </div>
                    <div>
                      {sectionOrder.filter(key => key !== 'skills' && key !== 'hobbies').map(key => renderSection(key))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* === CỘT PHẢI: TOOLBAR SIDEBAR (CÓ THỂ ẨN/HIỆN ĐỂ MỞ RỘNG MÀN HÌNH) === */}
        <div className={`shrink-0 bg-white z-20 h-full transition-all duration-300 ease-in-out shadow-[-4px_0_15px_rgba(0,0,0,0.05)] border-l border-slate-200 ${isRightPanelOpen ? 'w-full lg:w-80' : 'w-0 border-none'}`}>
          <div className="w-80 h-full overflow-y-auto custom-scrollbar p-6 flex flex-col gap-8">
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2"><LayoutTemplate className="w-4 h-4"/> Bố cục (Layout)</h3>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" 
                      value={design.layout} onChange={(e) => setDesign({...design, layout: e.target.value})} disabled={isExporting}>
                <option value="classic">Tiêu chuẩn (Classic)</option>
                <option value="2-col">Chia 2 cột (Hiện đại)</option>
                <option value="minimalist">Tối giản (Minimalist)</option>
              </select>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2"><Palette className="w-4 h-4"/> Màu sắc</h3>
              <div className="flex flex-wrap gap-2.5">
                {['#059669', '#2563eb', '#dc2626', '#d97706', '#4f46e5', '#8b5cf6', '#0ea5e9', '#0f172a'].map(color => (
                  <button key={color} 
                          className={`w-7 h-7 rounded-full border-2 transition-transform ${design.color === color ? 'scale-110 border-slate-800 shadow-md' : 'border-transparent hover:scale-110'}`} 
                          style={{ backgroundColor: color }} 
                          onClick={() => !isExporting && setDesign({...design, color})} />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2"><Type className="w-4 h-4"/> Font chữ</h3>
              <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-emerald-500" 
                      value={design.font} onChange={(e) => setDesign({...design, font: e.target.value})} disabled={isExporting}>
                <option value="Roboto">Roboto</option>
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Inter">Inter</option>
              </select>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2"><AlignLeft className="w-4 h-4"/> Giãn dòng ({design.lineSpacing})</h3>
              <input className="w-full accent-emerald-600" type="range" min="1.2" max="2" step="0.1" 
                     value={design.lineSpacing} onChange={(e) => setDesign({...design, lineSpacing: parseFloat(e.target.value)})} disabled={isExporting}/>
            </div>

            {/* KÉO THẢ SẮP XẾP MỤC */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Sắp xếp mục</span>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">Kéo thả</span>
              </h3>
              <div className="flex flex-col gap-2">
                {sectionOrder.map((key, index) => (
                  <div key={key} draggable onDragStart={(e) => onDragStart(e, index)} onDragEnter={(e) => onDragEnter(e, index)} onDragEnd={onDragEnd} onDragOver={(e) => e.preventDefault()}
                       className={`flex items-center gap-3 bg-white border border-slate-200 p-2.5 rounded-xl cursor-grab active:cursor-grabbing hover:border-emerald-400 transition-all ${draggedItemIndex === index ? 'opacity-50 scale-95' : ''}`}>
                    <GripVertical className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-bold text-slate-700">{data.sectionTitles[key] || key}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NÚT HÀNH ĐỘNG */}
            <div className="mt-auto pt-6 flex flex-col gap-3 border-t border-slate-100">
              <div className="flex gap-2">
                <button className="flex-1 py-3 text-sm font-bold rounded-xl border border-emerald-600 text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2" 
                        onClick={saveToDatabase} disabled={loading || isExporting}>
                  <Save className="w-4 h-4"/> {loading ? '...' : 'Lưu nháp'}
                </button>
                <button className="flex-1 py-3 text-sm font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2" 
                        onClick={saveToDatabase} disabled={loading || isExporting}>
                  Lưu & Thoát
                </button>
              </div>
              <button className="w-full py-3.5 text-sm font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg transition-all flex items-center justify-center gap-2" 
                      onClick={() => handleDownloadPDF(data)} disabled={isExporting}>
                <Download className="w-4 h-4"/> {isExporting ? 'Đang tạo PDF...' : 'Tải xuống PDF'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default EditCV;