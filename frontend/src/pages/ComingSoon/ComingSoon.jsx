import React from 'react';
import { Link } from 'react-router-dom';

const ComingSoon = () => {
  return (
    <>
      <style>{`
        .coming-soon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 70vh; /* Chiếm phần lớn chiều cao màn hình nhưng vẫn chừa chỗ cho Navbar/Footer */
          text-align: center;
          padding: 40px 20px;
          background-color: #f8fafc;
        }
        .coming-soon-icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .coming-soon-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 16px;
        }
        .coming-soon-desc {
          font-size: 16px;
          color: #64748b;
          max-width: 500px;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .btn-back-home {
          background-color: #1d4ed8;
          color: #ffffff;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 600;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .btn-back-home:hover {
          background-color: #1e40af;
        }
      `}</style>

      <div className="coming-soon-wrapper">
        <div className="coming-soon-icon">🚀</div>
        <h1 className="coming-soon-title">Tính năng đang phát triển</h1>
        <p className="coming-soon-desc">
          Module này hiện đang được đội ngũ thiết kế và lập trình. 
          Tính năng sẽ sớm được ra mắt trong các phiên bản cập nhật tiếp theo!
        </p>
        <Link to="/home" className="btn-back-home">
          Quay về Trang chủ
        </Link>
      </div>
    </>
  );
};

export default ComingSoon;