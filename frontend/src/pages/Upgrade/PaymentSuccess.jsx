// pages/Upgrade/PaymentSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderCode = searchParams.get('orderCode');

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (orderCode) {
      verifyStatus();
    }
  }, [orderCode]);

  const verifyStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/payment/check-status?orderCode=${orderCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.status === 'PAID') {
        setSuccess(true);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-slate-600 font-bold">Đang xác thực giao dịch qua PayOS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 shadow-xl text-center">
        {success ? (
          <>
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Thanh toán thành công!</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Gói dịch vụ AI đã được kích hoạt thành công vào tài khoản của bạn.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Về Trang chủ
            </button>
          </>
        ) : (
          <>
            <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-slate-900 mb-2">Chưa xác nhận thanh toán</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">
              Hệ thống chưa ghi nhận chuyển khoản cho đơn hàng #{orderCode}. Vui lòng kiểm tra lại.
            </p>
            <button
              onClick={() => navigate('/upgrade')}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors"
            >
              Thử lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}