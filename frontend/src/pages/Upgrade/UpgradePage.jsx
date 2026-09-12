// pages/Upgrade/UpgradePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Zap, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UpgradePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [usageInfo, setUsageInfo] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const role = user.role || 'candidate';
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const isPro = usageInfo?.subscription?.plan === 'pro';
  const endDate = usageInfo?.subscription?.endDate;
  const daysLeft = endDate ? Math.max(0, Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))) : null;

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
      <div className="max-w-5xl mx-auto text-center mb-10">
        <span className="bg-emerald-100 text-emerald-800 text-xs font-black uppercase px-3 py-1 rounded-full tracking-wider border border-emerald-200">
          Gói Dịch Vụ AI Nâng Cấp
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 mt-3 mb-3">
          Tối ưu hóa hiệu suất công việc với AI
        </h1>
        <p className="text-slate-800 font-semibold max-w-2xl mx-auto text-sm sm:text-base">
          Mở khóa các tính năng phân tích CV, mô phỏng phỏng vấn bằng giọng nói và tạo bộ câu hỏi tự động.
        </p>
      </div>

      {/* GIAO DIỆN CANDIDATE */}
      {role === 'candidate' && (
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Gói Free */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-black text-slate-900">CANDIDATE FREE</h3>
                {!isPro ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Check className="w-3 h-3 text-emerald-600" /> Gói hiện tại
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                    Gói cơ bản
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500">Dành cho ứng viên trải nghiệm ban đầu</p>

              <div className="my-6">
                <span className="text-4xl font-black text-slate-950">0đ</span>
                <span className="text-slate-500 font-bold text-sm"> / vĩnh viễn</span>
              </div>

              <ul className="space-y-3.5 text-sm font-semibold text-slate-700 mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> AI Review CV: <strong className="font-black text-slate-900">2 lượt/tháng</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Phỏng vấn AI: <strong className="font-black text-slate-900">15 phút/tháng</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" /> AI Personal Roadmap: <strong className="font-black text-slate-900">1 lượt/tháng</strong>
                </li>
              </ul>
            </div>

            {!isPro ? (
              <button disabled className="w-full py-3.5 bg-slate-100 text-slate-800 font-bold rounded-xl border border-slate-200 cursor-default flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" /> Gói hiện tại của bạn
              </button>
            ) : (
              <button disabled className="w-full py-3.5 bg-slate-50 text-slate-400 font-medium rounded-xl border border-slate-100 cursor-not-allowed">
                Gói cơ bản mặc định
              </button>
            )}
          </div>

          {/* Gói Pro */}
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-3xl p-8 border-2 border-indigo-500 shadow-2xl relative flex flex-col justify-between">
            {isPro ? (
              <div className="absolute -top-3 right-6 bg-emerald-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm border border-emerald-400">
                <Check className="w-3 h-3 text-white" /> Đang sử dụng
              </div>
            ) : (
              <div className="absolute -top-3 right-6 bg-indigo-500 text-white text-[10px] font-black uppercase px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Khuyên Dùng
              </div>
            )}

            <div>
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                CANDIDATE PRO <Zap className="w-5 h-5 text-yellow-400 fill-current" />
              </h3>
              <p className="text-xs font-semibold text-indigo-200 mt-1">Dành cho ứng viên ráo riết tìm việc</p>

              <div className="my-6">
                <span className="text-4xl font-black text-white">59.000đ</span>
                <span className="text-indigo-200 font-bold text-sm"> / 30 ngày</span>
              </div>

              {isPro && (
                <div className="mb-5 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs text-indigo-100 flex items-center justify-between font-semibold">
                  <span>Hạn: {new Date(endDate).toLocaleDateString('vi-VN')}</span>
                  <span className="text-emerald-300 font-black">
                    {daysLeft !== null ? (daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Hết hạn hôm nay') : 'Active'}
                  </span>
                </div>
              )}

              <ul className="space-y-3.5 text-sm font-semibold text-indigo-100 mb-8">
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI Review CV: <strong className="font-black text-white">50 lượt/tháng</strong></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Phỏng vấn AI: <strong className="font-black text-white">180 phút/tháng</strong></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> AI Personal Roadmap: <strong className="font-black text-white">20 lượt/tháng</strong></li>
                <li className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> Đánh giá chi tiết mẫu CV & Lời khuyên</li>
              </ul>
            </div>

            {isPro ? (
              <button
                onClick={() => handleCheckout('CANDIDATE_PRO', 59000)}
                disabled={loading}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>Gia hạn thêm 30 ngày (59.000đ)</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => handleCheckout('CANDIDATE_PRO', 59000)}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>Nâng cấp ngay sang Pro (59.000đ)</span>
                    <Zap className="w-4 h-4 text-yellow-300 fill-current" />
                  </>
                )}
              </button>
            )}
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
