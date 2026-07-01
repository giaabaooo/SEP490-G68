import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthGuard = () => {
  // Đọc thông tin user từ localStorage
  const userStr = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  // Nếu chưa đăng nhập, đưa về trang Home (dành cho người qua đường)
  if (!token || !userStr) {
    return <Navigate to="/home" replace />;
  }

  try {
    const user = JSON.parse(userStr);
    
    // Điều hướng dựa trên role
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (user.role === 'business') {
      return <Navigate to="/business/dashboard" replace />;
    } else {
      // Candidate hoặc mặc định
      return <Navigate to="/home" replace />;
    }
  } catch (error) {
    // Nếu lỗi parse JSON, ép đăng nhập lại
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default AuthGuard;