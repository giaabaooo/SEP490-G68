import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import Layouts
import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';

// Import Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import ComingSoon from './pages/ComingSoon/ComingSoon';

// Tích hợp 2 trang Dashboard mới (Giả định bạn lưu theo Cách 1)
import CandidateDashboard from './pages/Candidate/CandidateDashboard';
import BusinessDashboard from './pages/Business/BusinessDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        
        {/* Nhóm các trang KHÔNG CÓ Navbar (Login, Register) */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Nhóm các trang CÓ Navbar & Footer */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          
          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<ComingSoon />} />
          
          {/* === CÁC TRANG DÀNH CHO EMPLOYER/BUSINESS === */}
          <Route path="/business" element={<ComingSoon />} />
          {/* Đã thay thế ComingSoon bằng BusinessDashboard */}
          <Route path="/dashboard" element={<BusinessDashboard />} /> 
          <Route path="/job-postings" element={<ComingSoon />} />
          <Route path="/applications" element={<ComingSoon />} />
          <Route path="/skill-tests" element={<ComingSoon />} />

          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          {/* Đã cập nhật path rõ ràng hơn và gắn CandidateDashboard */}
          <Route path="/candidate/dashboard" element={<CandidateDashboard />} /> 
          <Route path="/jobs" element={<ComingSoon />} />
          <Route path="/ai-cv" element={<ComingSoon />} />
          <Route path="/practice" element={<ComingSoon />} />
          <Route path="/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÙNG CHUNG === */}
          <Route path="/profile" element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;