import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthGuard from './components/AuthGuard';

// Import Layouts
import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';

// Import Pages (Auth & Chung)
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

// Import trang Business
import BusinessDashboard from './pages/Bussiness/BusinessDashboard';
import BussinessProfile from './pages/Bussiness/BussinessProfile';
import PostJob from './pages/Bussiness/PostJob';
import Create from './pages/Bussiness/Create';
import CVList from './pages/Bussiness/CVList';
import EditJob from './pages/Bussiness/EditJob';

// Import trang Candidate
import ManageCV from './pages/Candidate/ManageCV';
import TemplateCV from './pages/Candidate/TemplateCV';
import EditCV from './pages/Candidate/EditCV';
import Applications from './pages/Candidate/Applications';
import SavedJobs from './pages/Candidate/SavedJobs';
import Jobs from './pages/Jobs/Jobs';
import JobDetail from './pages/Jobs/JobDetail';
import AIInterview from './pages/Candidate/AIInterview';
import Notifications from './pages/Candidate/Notifications';
function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
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

        {/* GỘP TẤT CẢ VÀO MAIN LAYOUT (DÙNG CHUNG NAVBAR) */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<UserManagement />} />
          <Route path="/admin/jobs" element={<ComingSoon />} />
          <Route path="/admin/reports" element={<ComingSoon />} />
          <Route path="/admin/settings" element={<ComingSoon />} />

          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} /> 
          
          <Route path="/candidate/manage-cv" element={<ManageCV />} />
          <Route path="/candidate/applications" element={<Applications />} />
          <Route path="/candidate/save" element={<SavedJobs />} />
          <Route path="/candidate/cv-templates" element={<TemplateCV />} />
          <Route path="/candidate/cv-builder" element={<EditCV />} />
          <Route path="/candidate/cv-builder/:id" element={<EditCV />} />
          <Route path="/candidate/ai-interview" element={<AIInterview />} />
          <Route path="/candidate/notifications" element={<Notifications />} />

          <Route path="/candidate/practice" element={<ComingSoon />} />
          <Route path="/candidate/courses" element={<ComingSoon />} />

          {/* === CÁC TRANG DÀNH CHO BUSINESS === */}
          <Route path="/bussiness/dashboard" element={<BusinessDashboard />} />
          <Route path="/bussiness/post-job" element={<PostJob />} />
          <Route path="/bussiness/create" element={<Create />} />
          <Route path="/bussiness/profile" element={<BussinessProfile />} />
          <Route path="/bussiness/cvlist" element={<CVList />} />
          <Route path="/bussiness/edit-job/:id" element={<EditJob />} />

          <Route path="/bussiness/job-postings" element={<ComingSoon />} />
          <Route path="/bussiness/skill-tests" element={<ComingSoon />} />
          <Route path="/bussiness/settings" element={<ComingSoon />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;