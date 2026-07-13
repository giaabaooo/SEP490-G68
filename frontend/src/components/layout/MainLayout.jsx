import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const location = useLocation();
  
  // Kiểm tra nếu là trang chủ thì cho full màn hình, ngược lại thì giới hạn chiều rộng
  const isHomePage = location.pathname === '/home' || location.pathname === '/';

  return (
    // Wrapper Flexbox giúp Footer luôn nằm ở đáy trang dù nội dung ngắn
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      
      <Navbar />
      
      {/* Vùng chứa nội dung chính (main content) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isHomePage ? (
          // Trang chủ render full chiều rộng
          <Outlet /> 
        ) : (
          // Các trang chức năng (Admin, Business, Candidate) bị giới hạn width để không bị "bột nở"
          <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '24px 20px', flex: 1 }}>
            <Outlet />
          </div>
        )}
      </main>

      <Footer />
      
    </div>
  );
};

export default MainLayout;