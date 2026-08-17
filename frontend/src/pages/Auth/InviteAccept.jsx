import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ShieldCheck, Loader2, ArrowRight, Lock } from 'lucide-react';

export default function InviteAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      return toast.error("Không tìm thấy mã xác thực. Vui lòng kiểm tra lại đường link trong email!");
    }
    if (password !== confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp!");
    }
    if (password.length < 6) {
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
      }

      // Đăng nhập thành công -> Lưu dữ liệu vào LocalStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success("Thiết lập tài khoản thành công! Đang chuyển hướng...");
      
      // Đẩy về Dashboard của Business/Moderator
      setTimeout(() => {
        navigate('/bussiness/dashboard'); 
      }, 1500);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center max-w-md w-full">
          <ShieldCheck className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-800 mb-2">Đường link không hợp lệ</h2>
          <p className="text-sm text-slate-500 font-medium mb-6">Không tìm thấy mã xác thực. Vui lòng click đúng đường link chúng tôi đã gửi vào Email của bạn.</p>
          <button onClick={() => navigate('/login')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold w-full">Về trang Đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-inter">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 border border-blue-100">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
        </div>

        <h1 className="text-2xl font-black text-slate-900 mb-2">Thiết lập Mật khẩu</h1>
        <p className="text-slate-500 text-sm font-medium mb-8">
          Chào mừng bạn đến với Careerio! Vui lòng tạo mật khẩu để hoàn tất quá trình thiết lập tài khoản Chuyên gia (Moderator).
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Mật khẩu mới</label>
            <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3.5 pl-11 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium transition-all" 
                    placeholder="Ít nhất 6 ký tự..." 
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Xác nhận mật khẩu</label>
            <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3.5 pl-11 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-medium transition-all" 
                    placeholder="Nhập lại mật khẩu..." 
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>Hoàn tất & Đăng nhập <ArrowRight className="w-5 h-5" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}