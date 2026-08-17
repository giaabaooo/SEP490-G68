import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthGuard = () => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!token) {
    toast.info("Vui lòng đăng nhập để truy cập trang này!");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Bỏ qua các bước check phức tạp gây lỗi render, 
  // nếu token hết hạn/lỗi thì các lệnh fetch API bên trong trang sẽ tự trả về 401.
  return <Outlet />;
};

export default AuthGuard;