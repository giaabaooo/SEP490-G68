import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthGuard from './components/AuthGuard';
import RoleGuard from './components/RoleGuard';

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
import CandidateDetail from './pages/Bussiness/CandidateDetail';

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
import TakeTest from './pages/Candidate/TakeTest';
import TestHistory from './pages/Candidate/TestHistory';
import TestResult from './pages/Candidate/TestResult';
import TestListPage from './pages/Candidate/TestListPage';

// Import trang Moderator / Admin
import ModeratorRequests from './pages/Moderator/ModeratorRequests';
import TestBuilder from './pages/Moderator/TestBuilder';
import TestBank from './pages/Moderator/TestBank';
import ModeratorJobDetail from './pages/Moderator/ModeratorJobDetail';
import PracticeTopicsList from './pages/Moderator/PracticeTopicsList';
import PracticeTopicBuilder from './pages/Moderator/PracticeTopicBuilder';
import QuestionList from './pages/Staff/QuestionList';
import QuestionForm from './pages/Staff/QuestionForm';
import AdminCategories from './pages/Admin/AdminCategories';
import UpgradePage from './pages/Upgrade/UpgradePage';
import PaymentSuccess from './pages/Upgrade/PaymentSuccess';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<AuthGuard />} />

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />

          {/* Dùng chung cho các tính năng nâng cấp/thanh toán */}
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />

          {/* Việc làm công khai */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />

          {/* === CÁC TRANG DÀNH CHO ADMIN === */}
          <Route element={<RoleGuard allowedRoles={['admin']} />}>
            <Route path="/admin" element={<UserManagement />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/jobs" element={<ComingSoon />} />
            <Route path="/admin/reports" element={<ComingSoon />} />
            <Route path="/admin/practice-topics" element={<PracticeTopicsList />} />
            <Route path="/admin/create-practice-topic" element={<PracticeTopicBuilder />} />
            <Route path="/admin/edit-practice-topic/:topicId" element={<PracticeTopicBuilder />} />
            <Route path="/admin/settings" element={<ComingSoon />} />
          </Route>
          
          {/* === CÁC TRANG DÀNH CHO STAFF / MODERATOR === */}
          <Route element={<RoleGuard allowedRoles={['business', 'admin']} allowedSubRoles={['moderator', 'admin']} />}>
            <Route path="/staff/questions" element={<QuestionList />} />
            <Route path="/staff/questions/create" element={<QuestionForm />} />
            <Route path="/staff/questions/edit/:id" element={<QuestionForm />} />
            
            <Route path="/moderator/requests" element={<ModeratorRequests />} />
            <Route path="/moderator/create-test/:jobId" element={<TestBuilder />} />
            <Route path="/moderator/edit-test/:testId" element={<TestBuilder />} />
            <Route path="/moderator/test-bank" element={<TestBank />} />
            <Route path="/moderator/job-detail/:jobId" element={<ModeratorJobDetail />} />
          </Route>

          {/* === CÁC TRANG DÀNH CHO CANDIDATE === */}
          <Route element={<RoleGuard allowedRoles={['candidate', 'admin']} />}>
            <Route path="/candidate/manage-cv" element={<ManageCV />} />
            <Route path="/candidate/applications" element={<Applications />} />
            <Route path="/candidate/save" element={<SavedJobs />} />
            <Route path="/candidate/cv-templates" element={<TemplateCV />} />
            <Route path="/candidate/cv-builder" element={<EditCV />} />
            <Route path="/candidate/cv-builder/:id" element={<EditCV />} />
            <Route path="/candidate/ai-interview" element={<AIInterview />} />
            <Route path="/candidate/notifications" element={<Notifications />} />
            <Route path="/candidate/tests" element={<TestListPage />} />
            <Route path="/candidate/test-history" element={<TestHistory />} />
            <Route path="/candidate/test-result" element={<TestResult />} />
            <Route path="/assessments/:id/take" element={<TakeTest />} />
            <Route path="/practice-test/:id/take" element={<TakeTest />} />
          </Route>

          {/* === CÁC TRANG DÀNH CHO BUSINESS / HR === */}
          <Route element={<RoleGuard allowedRoles={['business', 'admin']} allowedSubRoles={['hr', 'admin']} />}>
            <Route path="/bussiness/dashboard" element={<BusinessDashboard />} />
            <Route path="/bussiness/post-job" element={<PostJob />} />
            <Route path="/bussiness/create" element={<Create />} />
            <Route path="/bussiness/profile" element={<BussinessProfile />} />
            <Route path="/bussiness/cvlist" element={<CVList />} />
            <Route path="/bussiness/edit-job/:id" element={<EditJob />} />
            <Route path="/bussiness/candidate/:id" element={<CandidateDetail />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;