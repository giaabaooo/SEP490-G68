import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const RoleGuard = ({ allowedRoles, allowedSubRoles }) => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Nếu chưa đăng nhập, bắt buộc quay về trang Login
  if (!token || !userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Kiểm tra Role chính
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/home" replace />;
    }

    // Kiểm tra SubRole nếu được chỉ định
    if (allowedSubRoles && !allowedSubRoles.includes(user.subRole)) {
      return <Navigate to="/home" replace />;
    }

    // Nếu thỏa mãn toàn bộ điều kiện, cho phép đi tiếp vào layout/page con
    return <Outlet />;
  } catch (error) {
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }
};

export default RoleGuard;
