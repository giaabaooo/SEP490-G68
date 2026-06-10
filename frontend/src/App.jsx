import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Đã sửa lại đường dẫn: bỏ chữ /components/ đi vì các file này đứng ngay cạnh App.jsx
import Login from './Login';
import Register from './Register';
import Home from './Home';

function App() {
  return (
    <Router>
      <Routes>
        {/* Khi vào trang mặc định, tự động chuyển hướng sang trang Login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Khai báo đường dẫn cho từng trang */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Router>
  );
}

export default App;