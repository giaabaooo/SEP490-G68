import React from 'react';
import './Home.css';

const Home = () => {
  // Dữ liệu mẫu để render các thẻ công việc y hệt thiết kế
  const jobs = [
    {
      id: 1,
      logoColor: '#4f46e5',
      logoLetter: 'T',
      title: 'Senior Frontend Engineer (React/Next.js)',
      company: 'TechVibe Solution',
      rating: '4.8',
      location: 'Quận 3, TP. Hồ Chí Minh',
      salary: '25,000,000 - 35,000,000 VNĐ',
      tags: ['React', 'Next.js', 'TypeScript', 'CSS modules'],
      testReq: 'Frontend Core Assessment'
    },
    {
      id: 2,
      logoColor: '#a855f7',
      logoLetter: 'C',
      title: 'AI Product Developer (Python/PyTorch)',
      company: 'Cognitive Labs',
      rating: '4.9',
      location: 'Hà Nội (Hybrid)',
      salary: '30,000,000 - 45,000,000 VNĐ',
      tags: ['Python', 'PyTorch', 'LLMs', 'API Design'],
      testReq: 'Python & AI Engineering Test'
    },
    {
      id: 3,
      logoColor: '#10b981',
      logoLetter: 'N',
      title: 'Fullstack Node.js Developer',
      company: 'Nexa Corporation',
      rating: '4.5',
      location: 'Đà Nẵng (Remote)',
      salary: '20,000,000 - 28,000,000 VNĐ',
      tags: ['Node.js', 'Express', 'PostgreSQL', 'Docker'],
      testReq: 'Node.js Backend Test'
    }
  ];

  return (
    <div className="home-page">
      {/* === HEADER (THANH ĐIỀU HƯỚNG TRÊN CÙNG) === */}
      <header className="top-navbar">
        <div className="nav-left">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 7H16V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7ZM10 5H14V7H10V5ZM20 19H4V12H20V19ZM20 10H4V9H20V10Z" fill="#1d4ed8"/>
          </svg>
          <span className="brand-text">Careerio</span>
        </div>

        <div className="nav-center">
          <span className="nav-link active">Marketplace</span>
          <span className="nav-link">Employer ATS</span>
          <span className="nav-link">Test Creator</span>
        </div>

        <div className="nav-right">
          <div className="role-switch">
            <span className="role-option">Candidate</span>
            <span className="role-option active">Employer</span>
          </div>
          <div className="user-profile">
            <span>HR Manager</span>
            <div className="avatar-circle"></div>
          </div>
        </div>
      </header>

      {/* === HERO SECTION (PHẦN TÌM KIẾM TO Ở GIỮA) === */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Nền tảng Hỗ trợ Kết nối Tuyển dụng Thực chiến</h1>
          <p>Đánh giá thực chất, học tập định hướng và phỏng vấn tự động bằng Trí tuệ Nhân tạo AI.</p>
          
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input type="text" placeholder="Tìm kiếm công việc, kỹ năng (ví dụ: React, AI, Python)..." />
            <button className="btn-search">Tìm kiếm</button>
          </div>
        </div>
      </section>

      {/* === MAIN CONTENT (DANH SÁCH VIỆC LÀM) === */}
      <main className="main-content">
        <div className="content-tabs">
          <span className="content-tab active">Việc làm nổi bật (4)</span>
          <span className="content-tab">Khóa học đề xuất (3)</span>
          <span className="content-tab">Cố vấn 1:1 (3)</span>
        </div>

        <div className="job-grid">
          {jobs.map((job) => (
            <div className="job-card" key={job.id}>
              
              {/* Header Thẻ: Logo + Tên Cty */}
              <div className="job-header">
                <div className="company-logo" style={{ backgroundColor: job.logoColor }}>
                  {job.logoLetter}
                </div>
                <div className="job-title-group">
                  <h3>{job.title}</h3>
                  <div className="company-info">
                    <span className="company-name">{job.company}</span>
                    <span className="rating">⭐ {job.rating}</span>
                  </div>
                </div>
              </div>

              {/* Thông tin lương & địa điểm */}
              <div className="job-details">
                <p className="location">{job.location}</p>
                <p className="salary">{job.salary}</p>
              </div>

              {/* Các thẻ kỹ năng */}
              <div className="tags-container">
                {job.tags.map((tag, idx) => (
                  <span className="skill-tag" key={idx}>{tag}</span>
                ))}
              </div>

              {/* Yêu cầu Test */}
              <div className="test-requirement">
                Yêu cầu test: <strong>{job.testReq}</strong>
              </div>

              {/* Nút hành động */}
              <div className="card-actions">
                <button className="btn-apply">Ứng tuyển bằng AI CV</button>
                <button className="btn-outline">Làm test năng lực</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;