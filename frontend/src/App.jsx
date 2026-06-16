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
import Profile from './pages/Profile/Profile';

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
          
          {/* === CÁC TRANG DÀNH CHO ADMIN (Đang phát triển) === */}
          <Route path="/admin" element={<ComingSoon />} />
          
          {/* === CÁC TRANG DÀNH CHO EMPLOYER/BUSINESS (Đang phát triển) === */}
          <Route path="/business" element={<ComingSoon />} />
          <Route path="/dashboard" element={<ComingSoon />} />
          <Route path="/job-postings" element={<ComingSoon />} />
          <Route path="/applications" element={<ComingSoon />} />
          <Route path="/skill-tests" element={<ComingSoon />} />

          {/* === CÁC TRANG DÀNH CHO CANDIDATE (Đang phát triển) === */}
          <Route path="/candidate" element={<ComingSoon />} />
          <Route path="/jobs" element={<ComingSoon />} />
          <Route path="/ai-cv" element={<ComingSoon />} />
          <Route path="/practice" element={<ComingSoon />} />
          <Route path="/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÙNG CHUNG (Đang phát triển) === */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;