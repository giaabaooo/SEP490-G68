import React from 'react';

const Home = () => {
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
    <>
      <style>{`
        .home-page { min-height: 100vh; }
        .hero-section { padding: 60px 20px; display: flex; justify-content: center; }
        .hero-content { background: linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%); border-radius: 24px; padding: 60px 40px; text-align: center; max-width: 1000px; width: 100%; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02); }
        .hero-content h1 { font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 12px; }
        .hero-content p { font-size: 16px; color: #64748b; margin-bottom: 40px; }
        .search-box { display: flex; align-items: center; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 30px; padding: 8px 8px 8px 24px; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
        .search-box input { flex: 1; border: none; outline: none; padding: 10px; font-size: 15px; }
        .btn-search { background-color: #1d4ed8; color: #ffffff; border: none; padding: 12px 24px; border-radius: 24px; font-weight: 600; cursor: pointer; }
        .main-content { max-width: 1200px; margin: 0 auto; padding: 0 20px 60px; }
        .content-tabs { display: flex; justify-content: center; gap: 16px; margin-bottom: 40px; }
        .content-tab { padding: 10px 24px; font-size: 14px; font-weight: 600; color: #64748b; border-radius: 20px; cursor: pointer; }
        .content-tab.active { background-color: #e0e7ff; color: #1d4ed8; }
        .job-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .job-card { background: #ffffff; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02); display: flex; flex-direction: column; }
        .job-header { display: flex; gap: 16px; margin-bottom: 20px; }
        .company-logo { width: 48px; height: 48px; border-radius: 12px; display: flex; justify-content: center; align-items: center; color: white; font-size: 20px; font-weight: 700; flex-shrink: 0; }
        .job-title-group h3 { font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.4; margin-bottom: 4px; }
        .company-info { font-size: 13px; color: #64748b; display: flex; gap: 8px; align-items: center; }
        .rating { color: #f59e0b; font-weight: 600; }
        .job-details { margin-bottom: 16px; }
        .location { font-size: 13px; color: #64748b; margin-bottom: 6px; }
        .salary { font-size: 14px; font-weight: 700; color: #10b981; }
        .tags-container { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
        .skill-tag { background-color: #eff6ff; color: #3b82f6; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
        .test-requirement { background-color: #f8fafc; padding: 10px 12px; border-radius: 8px; font-size: 12px; color: #475569; margin-bottom: 20px; margin-top: auto; }
        .card-actions { display: flex; gap: 12px; }
        .btn-apply { flex: 1; background-color: #1d4ed8; color: white; border: none; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-outline { flex: 1; background-color: transparent; color: #1e293b; border: 1px solid #cbd5e1; padding: 10px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-apply:hover { background-color: #1e40af; }
        .btn-outline:hover { background-color: #f1f5f9; }
      `}</style>

      <div className="home-page">
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

        <main className="main-content">
          <div className="content-tabs">
            <span className="content-tab active">Việc làm nổi bật (4)</span>
            <span className="content-tab">Khóa học đề xuất (3)</span>
            <span className="content-tab">Cố vấn 1:1 (3)</span>
          </div>

          <div className="job-grid">
            {jobs.map((job) => (
              <div className="job-card" key={job.id}>
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

                <div className="job-details">
                  <p className="location">{job.location}</p>
                  <p className="salary">{job.salary}</p>
                </div>

                <div className="tags-container">
                  {job.tags.map((tag, idx) => (
                    <span className="skill-tag" key={idx}>{tag}</span>
                  ))}
                </div>

                <div className="test-requirement">
                  Yêu cầu test: <strong>{job.testReq}</strong>
                </div>

                <div className="card-actions">
                  <button className="btn-apply">Ứng tuyển bằng AI CV</button>
                  <button className="btn-outline">Làm test năng lực</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default Home;