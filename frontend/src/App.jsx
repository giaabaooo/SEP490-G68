import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import UserManagement from './pages/Admin/UserManagement';

// Import các trang Auth bổ sung
import ForgotPassword from './pages/Auth/ForgotPassword';
import ChangePassword from './pages/Auth/ChangePassword';

// === IMPORT TRANG BUSINESS ===
import BusinessDashboard from './pages/Bussiness/BusinessDashboard';
import BussinessProfile from './pages/Bussiness/BussinessProfile';
import PostJob from './pages/Bussiness/PostJob';
import Create from './pages/Bussiness/Create';
import CVList from './pages/Bussiness/CVList';

// === IMPORT TRANG CANDIDATE (MỚI THÊM) ===
import ManageCV from './pages/Candidate/ManageCV';
import TemplateCV from './pages/Candidate/TemplateCV';
import EditCV from './pages/Candidate/EditCV';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthGuard />} />

        {/* Nhóm các trang KHÔNG CÓ Navbar */}
        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        {/* Nhóm các trang CÓ Navbar & Footer (Chung & Candidate) */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />

          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<UserManagement />} />

          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          {/* Đã cập nhật URL chuẩn nhận diện Role */}
          <Route path="/candidate/manage-cv" element={<ManageCV />} />
          <Route path="/candidate/cv-templates" element={<TemplateCV />} />
          <Route path="/candidate/cv-builder" element={<EditCV />} />
          <Route path="/candidate/cv-builder/:id" element={<EditCV />} />

          <Route path="/candidate/jobs" element={<ComingSoon />} />
          <Route path="/candidate/practice" element={<ComingSoon />} />
          <Route path="/candidate/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÙNG CHUNG === */}
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Nhóm các trang BUSINESS với Navbar riêng */}
        <Route element={<BusinessLayout />}>
          <Route path="/bussiness/dashboard" element={<BusinessDashboard />} />
          <Route path="/bussiness/post-job" element={<PostJob />} />
          <Route path="/bussiness/create" element={<Create />} />
          <Route path="/bussiness/profile" element={<BussinessProfile />} />

          {/*  cập nhật đường dẫn thành /bussiness/cvlist */}
          <Route path="/bussiness/cvlist" element={<CVList />} />

          <Route path="/bussiness/job-postings" element={<ComingSoon />} />
          <Route path="/bussiness/skill-tests" element={<ComingSoon />} />
          <Route path="/bussiness/settings" element={<ComingSoon />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;