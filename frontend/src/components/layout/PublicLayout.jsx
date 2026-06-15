import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="public-layout">
      {/* Outlet là nơi render ra trang Login hoặc Register */}
      <Outlet /> 
    </div>
  );
};

export default PublicLayout;