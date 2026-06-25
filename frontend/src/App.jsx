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
import Onboarding from './pages/Auth/Onboarding';
import Profile from './pages/Profile/Profile';

// === IMPORT TRANG HR ===
import HRDashboard from './pages/HR/HRDashboard';
import PostJob from './pages/HR/PostJob';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        
        {/* Nhóm các trang KHÔNG CÓ Navbar (Login, Register) */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>

        {/* Nhóm các trang CÓ Navbar & Footer */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          
          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<ComingSoon />} />
          
          {/* === CÁC TRANG DÀNH CHO EMPLOYER/BUSINESS (Đã cập nhật) === */}
          <Route path="/business" element={<ComingSoon />} />
          
          {/* Gắn trực tiếp trang HR Dashboard và Post Job vào đây */}
          <Route path="/hr/dashboard" element={<HRDashboard />} />
          <Route path="/hr/post-job" element={<PostJob />} />
          
          <Route path="/job-postings" element={<ComingSoon />} />
          <Route path="/applications" element={<ComingSoon />} />
          <Route path="/skill-tests" element={<ComingSoon />} />

          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          <Route path="/candidate" element={<ComingSoon />} />
          <Route path="/jobs" element={<ComingSoon />} />
          <Route path="/ai-cv" element={<ComingSoon />} />
          <Route path="/practice" element={<ComingSoon />} />
          <Route path="/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÙNG CHUNG === */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;