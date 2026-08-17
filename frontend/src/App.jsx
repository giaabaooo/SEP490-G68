import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AuthGuard from './components/AuthGuard';

import PublicLayout from './components/layout/PublicLayout';
import MainLayout from './components/layout/MainLayout';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Home from './pages/Home/Home';
import ComingSoon from './pages/ComingSoon/ComingSoon';
import Onboarding from './pages/Auth/Onboarding';
import Profile from './pages/Profile/Profile';
import UserManagement from './pages/Admin/UserManagement';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ChangePassword from './pages/Auth/ChangePassword';

// Import PaymentManagement
import PaymentManagement from './pages/Admin/PaymentManagement';

import BusinessDashboard from './pages/Bussiness/BusinessDashboard';
import BussinessProfile from './pages/Bussiness/BussinessProfile';
import PostJob from './pages/Bussiness/PostJob';
import Create from './pages/Bussiness/Create';
import CVList from './pages/Bussiness/CVList';
import EditJob from './pages/Bussiness/EditJob';
import CandidateDetail from './pages/Bussiness/CandidateDetail';

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

import ModeratorRequests from './pages/Moderator/ModeratorRequests';
import TestBuilder from './pages/Moderator/TestBuilder';
import TestBank from './pages/Moderator/TestBank';
import ModeratorJobDetail from './pages/Moderator/ModeratorJobDetail';
import PracticeTopicsList from './pages/Moderator/PracticeTopicsList';
import PracticeTopicBuilder from './pages/Moderator/PracticeTopicBuilder';

import UpgradePage from './pages/Upgrade/UpgradePage';
import PaymentSuccess from './pages/Upgrade/PaymentSuccess';
import InviteAccept from './pages/Auth/InviteAccept';

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route element={<PublicLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/invite-accept" element={<InviteAccept />} />
        </Route>

        <Route element={<MainLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/candidate/tests" element={<TestListPage />} />
          <Route path="/candidate/cv-templates" element={<TemplateCV />} /> 

          <Route element={<AuthGuard />}>
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/upgrade" element={<UpgradePage />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />

            {/* CÁC ROUTE CỦA ADMIN */}
            <Route path="/admin" element={<UserManagement />} />
            <Route path="/admin/jobs" element={<ComingSoon />} />
            <Route path="/admin/reports" element={<ComingSoon />} />
            <Route path="/admin/practice-topics" element={<PracticeTopicsList />} />
            <Route path="/admin/create-practice-topic" element={<PracticeTopicBuilder />} />
            <Route path="/admin/edit-practice-topic/:topicId" element={<PracticeTopicBuilder />} />
            <Route path="/admin/settings" element={<ComingSoon />} />
            <Route path="/admin/payments" element={<PaymentManagement />} />
            
            {/* Moderator */}
            <Route path="/moderator/requests" element={<ModeratorRequests />} />
            <Route path="/moderator/create-test/:jobId" element={<TestBuilder />} />
            <Route path="/moderator/edit-test/:testId" element={<TestBuilder />} />
            <Route path="/moderator/test-bank" element={<TestBank />} />
            <Route path="/moderator/job-detail/:jobId" element={<ModeratorJobDetail />} />

            {/* Candidate */}
            <Route path="/candidate/applications" element={<Applications />} />
            <Route path="/candidate/save" element={<SavedJobs />} />
            <Route path="/candidate/cv-builder" element={<EditCV />} />
            <Route path="/candidate/cv-builder/:id" element={<EditCV />} />
            <Route path="/candidate/ai-interview" element={<AIInterview />} />
            <Route path="/candidate/notifications" element={<Notifications />} />
            <Route path="/candidate/test-history" element={<TestHistory />} />
            <Route path="/candidate/test-result" element={<TestResult />} />
            <Route path="/assessments/:id/take" element={<TakeTest />} />
            <Route path="/practice-test/:id/take" element={<TakeTest />} />
            <Route path="/candidate/manage-cv" element={<ManageCV />} />

            {/* Business / HR */}
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