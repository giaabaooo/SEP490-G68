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

// Import trang Moderator
import ModeratorRequests from './pages/Moderator/ModeratorRequests';
import TestBuilder from './pages/Moderator/TestBuilder';
import TestBank from './pages/Moderator/TestBank';
import ModeratorJobDetail from './pages/Moderator/ModeratorJobDetail';

import QuestionList from './pages/Staff/QuestionList';
import QuestionForm from './pages/Staff/QuestionForm';

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

        {/* TẤT CẢ GỘP VÀO MAIN LAYOUT (Dùng Navbar.jsx đã được chỉnh sửa) */}
        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route path="/admin" element={<UserManagement />} />
          <Route path="/admin/jobs" element={<ComingSoon />} />
          <Route path="/admin/reports" element={<ComingSoon />} />
          <Route path="/admin/settings" element={<ComingSoon />} />
          <Route path="/staff/questions" element={<QuestionList />} />
<Route path="/staff/questions/create" element={<QuestionForm />} />
<Route path="/staff/questions/edit/:id" element={<QuestionForm />} />

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

          {/* === CÁC TRANG DÀNH CHO MODERATOR (CHUYỂN VÀO ĐÂY) === */}
          <Route path="/moderator/requests" element={<ModeratorRequests />} />
          <Route path="/moderator/create-test/:jobId" element={<TestBuilder />} />
          <Route path="/moderator/edit-test/:testId" element={<TestBuilder />} />
          <Route path="/moderator/test-bank" element={<TestBank />} />
          <Route path="/moderator/job-detail/:jobId" element={<ModeratorJobDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;