import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';

// Import Layouts
import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';
// ĐỔI TÊN Ở ĐÂY: từ HRLayout thành BusinessLayout
import BusinessLayout from './components/layout/BusinessLayout';

// Import Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Onboarding from './pages/Auth/Onboarding';
import Profile from './pages/Profile/Profile';

// === IMPORT TRANG BUSINESS (Đã đổi từ HR) ===
import BusinessDashboard from './pages/Business/BusinessDashboard';
import PostJob from './pages/Business/PostJob';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthGuard />} />
        
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

        {/* Nhóm các trang BUSINESS với Navbar riêng (Thay thế HR) */}
        <Route element={<BusinessLayout />}>
          <Route path="/business/dashboard" element={<BusinessDashboard />} />
          <Route path="/business/post-job" element={<PostJob />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;