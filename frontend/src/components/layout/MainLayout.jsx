import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ flex: 1 }}>
        {/* Outlet là nơi render ra trang Home, Profile, v.v... */}
        <Outlet /> 
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;