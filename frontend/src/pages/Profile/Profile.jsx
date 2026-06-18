import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states: 'info' | 'about' | 'experience' | 'education' | 'cv' | null
  const [modalType, setModalType] = useState(null);
  
  // Forms states
  const [infoForm, setInfoForm] = useState({ fullName: '', title: '', phone: '', address: '', avatar: '' });
  const [aboutForm, setAboutForm] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [cvForm, setCvForm] = useState('');
  
  // Experience Form
  const [expForm, setExpForm] = useState({ company: '', role: '', startDate: '', endDate: '', current: false, description: '' });
  const [editExpIndex, setEditExpIndex] = useState(-1); // -1 means adding new

  // Education Form
  const [eduForm, setEduForm] = useState({ school: '', degree: '', major: '', startDate: '', endDate: '', description: '' });
  const [editEduIndex, setEditEduIndex] = useState(-1); // -1 means adding new

  useEffect(() => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để truy cập trang cá nhân.');
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [token, navigate]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Không thể tải thông tin trang cá nhân');
      }
      const data = await response.json();
      setProfile(data);
      
      // Initialize forms
      setInfoForm({
        fullName: data.fullName || '',
        title: data.title || '',
        phone: data.phone || '',
        address: data.address || '',
        avatar: data.avatar || ''
      });
      setAboutForm(data.aboutMe || '');
      setCvForm(data.cvUrl || '');
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi tải dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async (updatedFields, successMessage) => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedFields)
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }
      
      setProfile(data.user);
      
      // Update local storage user info if name or basic info changes
      const localUser = JSON.parse(localStorage.getItem('user')) || {};
      const updatedUser = { ...localUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success(successMessage || 'Cập nhật thành công!');
      setModalType(null);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Có lỗi xảy ra khi lưu.');
    }
  };

  // --- Handlers ---
  const handleInfoSubmit = (e) => {
    e.preventDefault();
    saveProfile(infoForm, 'Đã cập nhật thông tin liên hệ!');
  };

  const handleAboutSubmit = (e) => {
    e.preventDefault();
    saveProfile({ aboutMe: aboutForm }, 'Đã cập nhật phần giới thiệu bản thân!');
  };

  const handleCvSubmit = (e) => {
    e.preventDefault();
    saveProfile({ cvUrl: cvForm }, 'Đã cập nhật đường dẫn CV!');
  };

  // Skill handlers
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!skillInput.trim()) return;
    const cleanSkill = skillInput.trim();
    if (profile.skills.includes(cleanSkill)) {
      toast.warning('Kỹ năng này đã tồn tại!');
      return;
    }
    const updatedSkills = [...profile.skills, cleanSkill];
    saveProfile({ skills: updatedSkills }, `Đã thêm kỹ năng: ${cleanSkill}`);
    setSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = profile.skills.filter(s => s !== skillToRemove);
    saveProfile({ skills: updatedSkills }, `Đã xóa kỹ năng: ${skillToRemove}`);
  };

  // Experience handlers
  const openExpModal = (index = -1) => {
    if (index === -1) {
      setExpForm({ company: '', role: '', startDate: '', endDate: '', current: false, description: '' });
      setEditExpIndex(-1);
    } else {
      const exp = profile.experience[index];
      setExpForm({
        company: exp.company || '',
        role: exp.role || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: exp.current || false,
        description: exp.description || ''
      });
      setEditExpIndex(index);
    }
    setModalType('experience');
  };

  const handleExpSubmit = (e) => {
    e.preventDefault();
    let updatedExp = [...profile.experience];
    if (editExpIndex === -1) {
      updatedExp.push(expForm);
    } else {
      updatedExp[editExpIndex] = expForm;
    }
    saveProfile({ experience: updatedExp }, editExpIndex === -1 ? 'Đã thêm kinh nghiệm làm việc!' : 'Đã cập nhật kinh nghiệm làm việc!');
  };

  const handleDeleteExp = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa kinh nghiệm này không?')) {
      const updatedExp = profile.experience.filter((_, idx) => idx !== index);
      saveProfile({ experience: updatedExp }, 'Đã xóa kinh nghiệm làm việc!');
    }
  };

  // Education handlers
  const openEduModal = (index = -1) => {
    if (index === -1) {
      setEduForm({ school: '', degree: '', major: '', startDate: '', endDate: '', description: '' });
      setEditEduIndex(-1);
    } else {
      const edu = profile.education[index];
      setEduForm({
        school: edu.school || '',
        degree: edu.degree || '',
        major: edu.major || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        description: edu.description || ''
      });
      setEditEduIndex(index);
    }
    setModalType('education');
  };

  const handleEduSubmit = (e) => {
    e.preventDefault();
    let updatedEdu = [...profile.education];
    if (editEduIndex === -1) {
      updatedEdu.push(eduForm);
    } else {
      updatedEdu[editEduIndex] = eduForm;
    }
    saveProfile({ education: updatedEdu }, editEduIndex === -1 ? 'Đã thêm học vấn!' : 'Đã cập nhật học vấn!');
  };

  const handleDeleteEdu = (index) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa học vấn này không?')) {
      const updatedEdu = profile.education.filter((_, idx) => idx !== index);
      saveProfile({ education: updatedEdu }, 'Đã xóa học vấn!');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', fontFamily: 'sans-serif' }}>
        <div className="spinner"></div>
        <style>{`
          .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #1d4ed8; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <style>{`
        /* Profile Layout & Theme Styling */
        .profile-container {
          max-width: 1100px;
          margin: 40px auto;
          padding: 0 20px;
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #334155;
          line-height: 1.6;
        }

        /* Profile Header Card */
        .profile-header-card {
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.01);
          overflow: hidden;
          margin-bottom: 30px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .cover-photo {
          height: 180px;
          background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #3b82f6 100%);
          position: relative;
        }
        .cover-photo::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: radial-gradient(rgba(255, 255, 255, 0.15) 1.5px, transparent 0);
          background-size: 24px 24px;
          opacity: 0.4;
        }
        
        .header-main {
          padding: 0 40px 30px 40px;
          position: relative;
          display: flex;
          align-items: flex-end;
          gap: 28px;
          margin-top: -60px;
        }
        
        .avatar-container {
          width: 130px;
          height: 130px;
          border-radius: 28px;
          background: #ffffff;
          border: 5px solid #ffffff;
          box-shadow: 0 8px 24px rgba(148, 163, 184, 0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }
        .avatar-container:hover {
          transform: scale(1.03);
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          color: #1d4ed8;
          font-size: 46px;
          font-weight: 800;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .header-info {
          flex-grow: 1;
          padding-bottom: 5px;
        }
        .header-name {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 6px 0;
          letter-spacing: -0.5px;
        }
        .header-title {
          font-size: 17px;
          font-weight: 600;
          color: #1d4ed8;
          margin: 0 0 16px 0;
          background: #eff6ff;
          display: inline-block;
          padding: 4px 14px;
          border-radius: 99px;
        }
        .header-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          font-size: 14px;
          color: #475569;
        }
        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f8fafc;
          padding: 6px 12px;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
        }
        .meta-item svg {
          color: #64748b;
        }
        
        .btn-edit-header {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        .btn-edit-header:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.25);
        }

        /* Profile Body Layout */
        .profile-body-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 30px;
        }
        
        @media (max-width: 768px) {
          .profile-body-grid {
            grid-template-columns: 1fr;
          }
          .header-main {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0 20px 20px 20px;
            margin-top: -50px;
          }
          .header-meta {
            justify-content: center;
          }
          .btn-edit-header {
            margin-top: 15px;
          }
        }

        /* Section Cards */
        .profile-section-card {
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.03);
          padding: 26px;
          margin-bottom: 26px;
          transition: box-shadow 0.3s ease;
        }
        .profile-section-card:hover {
          box-shadow: 0 15px 35px -10px rgba(148, 163, 184, 0.15);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 1px solid #f8fafc;
          padding-bottom: 12px;
        }
        .section-title {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          letter-spacing: -0.3px;
        }
        
        .btn-action {
          background: #eff6ff;
          color: #1d4ed8;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 8px 14px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .btn-action:hover {
          background: #1d4ed8;
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* Text Block */
        .about-text {
          font-size: 15px;
          color: #475569;
          white-space: pre-line;
          line-height: 1.7;
        }
        .placeholder-text {
          color: #94a3b8;
          font-style: italic;
          font-size: 14px;
          padding: 10px 0;
        }

        /* Timeline Items (Experience, Education) */
        .timeline-container {
          position: relative;
          padding-left: 24px;
        }
        .timeline-container::before {
          content: '';
          position: absolute;
          left: 5px;
          top: 10px;
          bottom: 10px;
          width: 2px;
          background: #e2e8f0;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 30px;
        }
        .timeline-item:last-child {
          margin-bottom: 0;
        }
        .timeline-dot {
          position: absolute;
          left: -24px;
          top: 6px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #ffffff;
          border: 3px solid #1d4ed8;
          box-shadow: 0 0 0 4px #eff6ff;
          transition: transform 0.2s ease, background-color 0.2s ease;
        }
        .timeline-item:hover .timeline-dot {
          transform: scale(1.2);
          background-color: #1d4ed8;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 6px;
        }
        .timeline-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .timeline-subtitle {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          margin: 2px 0 0 0;
        }
        .timeline-date {
          font-size: 12px;
          color: #1d4ed8;
          background: #eff6ff;
          padding: 4px 10px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 10px;
          font-weight: 600;
        }
        .timeline-desc {
          font-size: 14px;
          color: #475569;
          margin: 0;
          white-space: pre-line;
          background: #f8fafc;
          padding: 12px 16px;
          border-radius: 12px;
          border-left: 3px solid #cbd5e1;
        }
        
        .timeline-actions {
          display: flex;
          gap: 8px;
        }
        .btn-icon {
          background: #f1f5f9;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-icon:hover {
          transform: scale(1.1);
        }
        .btn-icon.edit:hover {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .btn-icon.delete:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        /* Skills Tags */
        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .skill-badge {
          background: #f8fafc;
          color: #334155;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .skill-badge:hover {
          background: #eff6ff;
          border-color: #bfdbfe;
          color: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.08);
        }
        .btn-remove-skill {
          background: #e2e8f0;
          border: none;
          color: #475569;
          cursor: pointer;
          font-size: 10px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .btn-remove-skill:hover {
          background: #ef4444;
          color: #ffffff;
        }
        
        .skill-form {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .skill-form input {
          flex-grow: 1;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 13px;
          outline: none;
          transition: all 0.2s ease;
        }
        .skill-form input:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
        }
        .btn-add-skill {
          background: #1d4ed8;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-add-skill:hover {
          background: #1e40af;
          transform: translateY(-1px);
        }

        /* CV / Attachment Section */
        .cv-attachment-card {
          background: linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%);
          border: 1px dashed #93c5fd;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: transform 0.2s ease;
        }
        .cv-attachment-card:hover {
          transform: scale(1.02);
        }
        .cv-icon {
          width: 48px;
          height: 48px;
          background: #1d4ed8;
          color: white;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2);
        }
        .cv-details {
          flex-grow: 1;
        }
        .cv-title {
          font-weight: 800;
          font-size: 15px;
          color: #1e3a8a;
          margin: 0 0 4px 0;
        }
        .cv-link {
          font-size: 13px;
          color: #2563eb;
          text-decoration: none;
          word-break: break-all;
          font-weight: 600;
          display: inline-block;
        }
        .cv-link:hover {
          text-decoration: underline;
          color: #1d4ed8;
        }

        /* Modals (Pure CSS/JS overlay, NO BLUR filters) */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.65);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-container {
          background: #ffffff;
          border-radius: 20px;
          max-width: 550px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .modal-header {
          padding: 20px 26px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title {
          margin: 0;
          font-size: 19px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.3px;
        }
        .btn-close {
          background: transparent;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #94a3b8;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .btn-close:hover {
          background: #f1f5f9;
          color: #475569;
        }
        .modal-body {
          padding: 26px;
        }
        .form-group {
          margin-bottom: 18px;
        }
        .form-group.checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: -6px;
        }
        .form-group.checkbox label {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
          color: #334155;
          cursor: pointer;
        }
        .form-group.checkbox input {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 6px;
        }
        .form-group input, .form-group textarea, .form-group select {
          width: 100%;
          padding: 11px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          color: #1e293b;
          transition: all 0.2s ease;
        }
        .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29, 78, 216, 0.1);
        }
        .modal-footer {
          padding: 16px 26px;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-cancel {
          background: #f1f5f9;
          color: #475569;
          border: none;
          padding: 11px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-cancel:hover {
          background: #e2e8f0;
        }
        .btn-save {
          background: #1d4ed8;
          color: white;
          border: none;
          padding: 11px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.2);
        }
        .btn-save:hover {
          background: #1e40af;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(29, 78, 216, 0.3);
        }
      `}</style>

      <div className="profile-container">
        <ToastContainer position="top-right" autoClose={3000} />
        
        {/* HEADER CARD */}
        <div className="profile-header-card">
          <div className="cover-photo"></div>
          <div className="header-main">
            <div className="avatar-container">
              {profile.avatar ? (
                <img src={profile.avatar} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.fullName?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="header-info">
              <h1 className="header-name">{profile.fullName}</h1>
              <p className="header-title">{profile.title || 'Chưa cập nhật vị trí công việc'}</p>
              
              <div className="header-meta">
                {profile.address && (
                  <div className="meta-item">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{profile.address}</span>
                  </div>
                )}
                <div className="meta-item">
                  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="meta-item">
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{profile.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <button className="btn-edit-header" onClick={() => setModalType('info')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span>Sửa thông tin</span>
            </button>
          </div>
        </div>

        {/* PROFILE BODY */}
        <div className="profile-body-grid">
          {/* LEFT COLUMN: ABOUT, EXPERIENCE, EDUCATION */}
          <div className="left-column">
            
            {/* GIỚI THIỆU BẢN THÂN */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Giới thiệu bản thân</span>
                </h2>
                <button className="btn-action" onClick={() => { setAboutForm(profile.aboutMe || ''); setModalType('about'); }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Sửa</span>
                </button>
              </div>
              {profile.aboutMe ? (
                <div className="about-text">{profile.aboutMe}</div>
              ) : (
                <div className="placeholder-text">Hãy viết một đoạn giới thiệu ngắn về bản thân, kinh nghiệm nổi bật hoặc mục tiêu nghề nghiệp của bạn.</div>
              )}
            </div>

            {/* KINH NGHIỆM LÀM VIỆC */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Kinh nghiệm làm việc</span>
                </h2>
                <button className="btn-action" onClick={() => openExpModal(-1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Thêm kinh nghiệm</span>
                </button>
              </div>

              {profile.experience && profile.experience.length > 0 ? (
                <div className="timeline-container">
                  {profile.experience.map((exp, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-header">
                        <div>
                          <h3 className="timeline-title">{exp.role}</h3>
                          <div className="timeline-subtitle">{exp.company}</div>
                        </div>
                        <div className="timeline-actions">
                          <button className="btn-icon edit" onClick={() => openExpModal(idx)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteExp(idx)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                      <span className="timeline-date">
                        {exp.startDate} - {exp.current ? 'Hiện tại' : exp.endDate}
                      </span>
                      {exp.description && <p className="timeline-desc">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder-text">Chưa cập nhật thông tin kinh nghiệm làm việc.</div>
              )}
            </div>

            {/* HỌC VẤN */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  <span>Học vấn</span>
                </h2>
                <button className="btn-action" onClick={() => openEduModal(-1)}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Thêm học vấn</span>
                </button>
              </div>

              {profile.education && profile.education.length > 0 ? (
                <div className="timeline-container">
                  {profile.education.map((edu, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-header">
                        <div>
                          <h3 className="timeline-title">{edu.school}</h3>
                          <div className="timeline-subtitle">{edu.degree} - {edu.major}</div>
                        </div>
                        <div className="timeline-actions">
                          <button className="btn-icon edit" onClick={() => openEduModal(idx)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path></svg>
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteEdu(idx)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
                        </div>
                      </div>
                      <span className="timeline-date">
                        {edu.startDate} - {edu.endDate}
                      </span>
                      {edu.description && <p className="timeline-desc">{edu.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="placeholder-text">Chưa cập nhật thông tin học vấn.</div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: SKILLS, CV ATTACHMENT */}
          <div className="right-column">
            
            {/* KỸ NĂNG */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Kỹ năng</span>
                </h2>
              </div>
              
              <div className="skills-container">
                {profile.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, idx) => (
                    <span className="skill-badge" key={idx}>
                      <span>{skill}</span>
                      <button className="btn-remove-skill" onClick={() => handleRemoveSkill(skill)}>
                        &times;
                      </button>
                    </span>
                  ))
                ) : (
                  <div className="placeholder-text" style={{ width: '100%', marginBottom: '10px' }}>Chưa cập nhật kỹ năng.</div>
                )}
              </div>

              <form className="skill-form" onSubmit={handleAddSkill}>
                <input 
                  type="text" 
                  placeholder="Thêm kỹ năng mới..." 
                  value={skillInput} 
                  onChange={(e) => setSkillInput(e.target.value)}
                />
                <button type="submit" className="btn-add-skill">Thêm</button>
              </form>
            </div>

            {/* CV ĐÍNH KÈM */}
            <div className="profile-section-card">
              <div className="section-header">
                <h2 className="section-title">
                  <svg width="20" height="20" fill="none" stroke="#1d4ed8" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Hồ sơ / CV đính kèm</span>
                </h2>
                <button className="btn-action" onClick={() => { setCvForm(profile.cvUrl || ''); setModalType('cv'); }}>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Cập nhật</span>
                </button>
              </div>

              {profile.cvUrl ? (
                <div className="cv-attachment-card">
                  <div className="cv-icon">PDF</div>
                  <div className="cv-details">
                    <p className="cv-title">Curriculum Vitae</p>
                    <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer" className="cv-link">
                      Mở đường dẫn CV ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="placeholder-text">Chưa đính kèm liên kết CV (Ví dụ link Google Drive, OneDrive, v.v.).</div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* MODAL 1: EDIT CONTACT INFO */}
      {modalType === 'info' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cập nhật thông tin liên hệ</h3>
              <button className="btn-close" onClick={() => setModalType(null)}>&times;</button>
            </div>
            <form onSubmit={handleInfoSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input 
                    type="text" 
                    required 
                    value={infoForm.fullName}
                    onChange={(e) => setInfoForm({ ...infoForm, fullName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Vị trí công việc (Title)</label>
                  <input 
                    type="text" 
                    placeholder="Ví dụ: React Frontend Engineer, Node.js Backend Developer"
                    value={infoForm.title}
                    onChange={(e) => setInfoForm({ ...infoForm, title: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="text" 
                      value={infoForm.phone}
                      onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Hà Nội, Việt Nam"
                      value={infoForm.address}
                      onChange={(e) => setInfoForm({ ...infoForm, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ảnh đại diện (URL)</label>
                  <input 
                    type="text" 
                    placeholder="Đường dẫn ảnh đại diện công khai"
                    value={infoForm.avatar}
                    onChange={(e) => setInfoForm({ ...infoForm, avatar: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT ABOUT ME */}
      {modalType === 'about' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Giới thiệu bản thân</h3>
              <button className="btn-close" onClick={() => setModalType(null)}>&times;</button>
            </div>
            <form onSubmit={handleAboutSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tóm tắt thông tin / Giới thiệu</label>
                  <textarea 
                    rows="6" 
                    placeholder="Hãy viết mô tả chi tiết về bản thân..."
                    value={aboutForm}
                    onChange={(e) => setAboutForm(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXPERIENCE (ADD / EDIT) */}
      {modalType === 'experience' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editExpIndex === -1 ? 'Thêm kinh nghiệm làm việc' : 'Sửa kinh nghiệm làm việc'}
              </h3>
              <button className="btn-close" onClick={() => setModalType(null)}>&times;</button>
            </div>
            <form onSubmit={handleExpSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên công ty *</label>
                  <input 
                    type="text" 
                    required 
                    value={expForm.company}
                    onChange={(e) => setExpForm({ ...expForm, company: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Vị trí / Chức danh *</label>
                  <input 
                    type="text" 
                    required 
                    value={expForm.role}
                    onChange={(e) => setExpForm({ ...expForm, role: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thời gian bắt đầu *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 03/2022" 
                      required 
                      value={expForm.startDate}
                      onChange={(e) => setExpForm({ ...expForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời gian kết thúc</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 08/2023"
                      disabled={expForm.current}
                      required={!expForm.current}
                      value={expForm.endDate}
                      onChange={(e) => setExpForm({ ...expForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group checkbox">
                  <input 
                    type="checkbox" 
                    id="exp-current"
                    checked={expForm.current}
                    onChange={(e) => setExpForm({ ...expForm, current: e.target.checked, endDate: e.target.checked ? '' : expForm.endDate })}
                  />
                  <label htmlFor="exp-current">Tôi đang làm việc tại đây</label>
                </div>
                <div className="form-group">
                  <label>Mô tả công việc</label>
                  <textarea 
                    rows="4" 
                    placeholder="Mô tả các nhiệm vụ, thành tích đạt được trong công việc..."
                    value={expForm.description}
                    onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDUCATION (ADD / EDIT) */}
      {modalType === 'education' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editEduIndex === -1 ? 'Thêm học vấn' : 'Sửa học vấn'}
              </h3>
              <button className="btn-close" onClick={() => setModalType(null)}>&times;</button>
            </div>
            <form onSubmit={handleEduSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Trường học *</label>
                  <input 
                    type="text" 
                    required 
                    value={eduForm.school}
                    onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bằng cấp</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: Đại học, Thạc sĩ, Chứng chỉ"
                      value={eduForm.degree}
                      onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Chuyên ngành *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ví dụ: Công nghệ thông tin"
                      value={eduForm.major}
                      onChange={(e) => setEduForm({ ...eduForm, major: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thời gian bắt đầu *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 09/2018"
                      required 
                      value={eduForm.startDate}
                      onChange={(e) => setEduForm({ ...eduForm, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời gian tốt nghiệp *</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 06/2022"
                      required 
                      value={eduForm.endDate}
                      onChange={(e) => setEduForm({ ...eduForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Mô tả chi tiết</label>
                  <textarea 
                    rows="3" 
                    placeholder="Mô tả đề án, điểm số hoặc các hoạt động nổi bật..."
                    value={eduForm.description}
                    onChange={(e) => setEduForm({ ...eduForm, description: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CV ATTACHMENT */}
      {modalType === 'cv' && (
        <div className="modal-overlay" onClick={() => setModalType(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cập nhật liên kết CV</h3>
              <button className="btn-close" onClick={() => setModalType(null)}>&times;</button>
            </div>
            <form onSubmit={handleCvSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Đường dẫn tài liệu CV (Google Drive, Dropbox, v.v.)</label>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/..."
                    required
                    value={cvForm}
                    onChange={(e) => setCvForm(e.target.value)}
                  />
                  <small style={{ display: 'block', marginTop: '6px', color: '#64748b' }}>
                    * Vui lòng đảm bảo liên kết được để ở chế độ xem công khai (Public) để nhà tuyển dụng có thể truy cập được.
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setModalType(null)}>Hủy</button>
                <button type="submit" className="btn-save">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;
