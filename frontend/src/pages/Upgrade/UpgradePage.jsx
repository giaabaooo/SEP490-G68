// pages/Upgrade/UpgradePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, ShieldCheck, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UpgradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.role || 'candidate';
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchUsageInfo();
  }, []);

  const fetchUsageInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/payment/my-usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsageInfo(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCheckout = async (planType, amount, tokens = 0) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/payment/create-payment-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ planType, amount, tokens })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi khởi tạo thanh toán');

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl; 
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-10 pb-20 px-4 font-inter">
      <div className="max-w-5xl mx-auto text-center mb-12">
        <span className="bg-emerald-100 text-emerald-700 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider">
          Gói Dịch Vụ AI Nâng Cấp
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-3">
          Tối ưu hóa hiệu suất công việc với AI
        </h1>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto text-sm sm:text-base">
          Mở khóa các tính năng phân tích CV, mô phỏng phỏng vấn bằng giọng nói và tạo bộ câu hỏi tự động.
        </p>
      </div>

      {/* GIAO DIỆN CANDIDATE */}
      {role === 'candidate' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gói Free */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800">CANDIDATE FREE</h3>
              <p className="text-xs text-slate-400 mt-1">Dành cho ứng viên trải nghiệm ban đầu</p>
              <div className="my-6">
                <span className="text-4xl font-black text-slate-900">0đ</span>
                <span className="text-slate-400 font-semibold text-sm"> / vĩnh viễn</span>
              </div>
              <ul className="space-y-3 text-sm font-medium text-slate-600 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Review CV: <strong>2 lượt/tháng</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Phỏng vấn AI: <strong>15 phút/tháng</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> AI Personal Roadmap: <strong>1 lượt/tháng</strong></li>
              </ul>
            </div>
            <button disabled className="w-full py-3.5 bg-slate-100 text-slate-400 font-bold rounded-xl cursor-not-allowed">
              Gói hiện tại
            </button>
          </div>

          {/* Gói Pro */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-8 border-2 border-indigo-500 shadow-2xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 bg-indigo-500 text-white text-[11px] font-black uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Khuyên Dùng
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                CANDIDATE PRO <Zap className="w-5 h-5 text-yellow-400 fill-current" />
              </h3>
              <p className="text-xs text-indigo-200 mt-1">Dành cho ứng viên ráo riết tìm việc</p>
              <div className="my-6">
                <span className="text-4xl font-black text-white">59.000đ</span>
                <span className="text-indigo-200 font-semibold text-sm"> / 30 ngày</span>
              </div>
              <ul className="space-y-3.5 text-sm font-medium text-indigo-100 mb-8">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> AI Review CV: <strong>50 lượt/tháng</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Phỏng vấn AI: <strong>180 phút/tháng</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> AI Personal Roadmap: <strong>20 lượt/tháng</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Đánh giá chi tiết mẫu CV & Lời khuyên</li>
              </ul>
            </div>

            <button
              onClick={() => handleCheckout('CANDIDATE_PRO', 59000)}
              disabled={loading || usageInfo?.subscription?.plan === 'pro'}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : usageInfo?.subscription?.plan === 'pro' ? 'Đã kích hoạt Pro' : 'Nâng cấp ngay sang Pro'}
            </button>
          </div>
        </div>
      )}

      {/* GIAO DIỆN BUSINESS */}
      {role === 'business' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase">Số dư Token AI hiện tại</p>
              <p className="text-3xl font-black text-indigo-600">{usageInfo?.businessCredits?.balance || 0} Tokens</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-medium">
              <p>• Phí tạo câu hỏi phỏng vấn bằng AI: <strong>50 Token/lượt</strong></p>
              <p>• Phí đánh giá CV ứng viên: <strong>30 Token/lượt</strong></p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Gói 100k */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-500 transition-all">
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">Gói Cơ Bản</h4>
                <p className="text-3xl font-black text-slate-900 my-4">100.000đ</p>
                <p className="text-sm font-bold text-indigo-600 mb-6">Nhận 1.000 Tokens</p>
              </div>
              <button
                onClick={() => handleCheckout('BUSINESS_TOPUP', 100000, 1000)}
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Nạp ngay
              </button>
            </div>

            {/* Gói 200k */}
            <div className="bg-white rounded-2xl p-6 border-2 border-indigo-500 shadow-md flex flex-col justify-between relative">
              <div className="absolute -top-3 right-4 bg-indigo-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                Thưởng +10%
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-lg">Gói Tiêu Chuẩn</h4>
                <p className="text-3xl font-black text-slate-900 my-4">200.000đ</p>
                <p className="text-sm font-bold text-indigo-600 mb-6">Nhận 2.200 Tokens</p>
              </div>
              <button
                onClick={() => handleCheckout('BUSINESS_TOPUP', 200000, 2200)}
                disabled={loading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Nạp ngay
              </button>
            </div>

            {/* Gói 500k */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between hover:border-indigo-500 transition-all">
              <div className="relative">
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full">Thưởng +20%</span>
                <h4 className="font-extrabold text-slate-800 text-lg mt-2">Gói Doanh Nghiệp</h4>
                <p className="text-3xl font-black text-slate-900 my-4">500.000đ</p>
                <p className="text-sm font-bold text-indigo-600 mb-6">Nhận 6.000 Tokens</p>
              </div>
              <button
                onClick={() => handleCheckout('BUSINESS_TOPUP', 500000, 6000)}
                disabled={loading}
                className="w-full py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                Nạp ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}