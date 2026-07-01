import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthGuard from './components/AuthGuard';

// Import Layouts
import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';
import BusinessLayout from './components/layout/BusinessLayout';

// Import Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Onboarding from './pages/Auth/Onboarding';
import Profile from './pages/Profile/Profile';

// === IMPORT TRANG BUSINESS ===
import BusinessDashboard from './pages/Bussiness/BusinessDashboard';
import PostJob from './pages/Bussiness/PostJob';
import BussinessProfile from './pages/Bussiness/BussinessProfile';
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

        {/* Nhóm các trang CÓ Navbar & Footer (Candidate & Chung) */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          
          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<ComingSoon />} />
          
          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          <Route path="/candidate" element={<ComingSoon />} />
          <Route path="/jobs" element={<ComingSoon />} />
          <Route path="/ai-cv" element={<ComingSoon />} />
          <Route path="/practice" element={<ComingSoon />} />
          <Route path="/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÙNG CHUNG === */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Nhóm các trang BUSINESS với Navbar riêng */}
        <Route element={<BusinessLayout />}>
          <Route path="/bussiness/dashboard" element={<BusinessDashboard />} />
          <Route path="/bussiness/post-job" element={<PostJob />} />
          
          
          <Route path="/bussiness/profile" element={<BussinessProfile />} />

          {/* Các tính năng chưa code sẽ hiển thị ComingSoon */}
          <Route path="/bussiness/job-postings" element={<ComingSoon />} />
          <Route path="/bussiness/applications" element={<ComingSoon />} />
          <Route path="/bussiness/skill-tests" element={<ComingSoon />} />
          <Route path="/bussiness/settings" element={<ComingSoon />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;