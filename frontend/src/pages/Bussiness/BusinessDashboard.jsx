import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Users, FileCheck, Calendar, ArrowRight, Sparkles, TrendingUp, Clock, BarChart3 } from 'lucide-react';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    statusCounts: {
      Applied: 0,
      Testing: 0,
      Interviewing: 0,
      Offered: 0,
      Rejected: 0
    },
    avgAiScore: 0,
    trend: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/applications/stats/summary`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!res.ok) throw new Error('Không thể tải số liệu thống kê');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Lỗi tải thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="animate-fade-in pb-8">
      {/* Header & Greetings */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Bảng điều khiển <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-base flex items-center gap-2">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">{user.fullName || 'Nhà tuyển dụng'}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24 text-slate-400">Đang tải số liệu thống kê...</div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 mb-8">{error}</div>
      ) : (
        <>
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              { icon: Briefcase, title: 'Chiến dịch mở', value: `${stats.totalJobs} tin`, color: 'blue' },
              { icon: Users, title: 'CV nhận được', value: `${stats.totalApplications} CV`, color: 'emerald' },
              { icon: Sparkles, title: 'Khớp trung bình (AI)', value: `${stats.avgAiScore}%`, color: 'purple' },
              { icon: Calendar, title: 'Đề nghị (Offer)', value: `${stats.statusCounts.Offered} nhận`, color: 'amber' },
            ].map((stat, index) => {
              const Icon = stat.icon;
              const colors = {
                blue: 'text-blue-600 bg-blue-50 border-blue-100',
                emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                purple: 'text-purple-600 bg-purple-50 border-purple-100',
                amber: 'text-amber-600 bg-amber-50 border-amber-100',
              };
              return (
                <div key={index} className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-200 flex items-center gap-5 group hover:border-blue-300 hover:shadow-md transition-all cursor-default">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${colors[stat.color]} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                    <p className="text-2xl font-black text-slate-800">{stat.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Quick Actions & Recent Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Campaign / Job Summary Card */}
              <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col p-7">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-black text-slate-900">Tính năng Tuyển dụng</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Link 
                    to="/business/post-job" 
                    className="p-5 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group bg-slate-50/30"
                  >
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">Đăng tin tuyển dụng mới</h3>
                    <p className="text-slate-400 text-xs font-medium">Tạo chiến dịch và đăng tuyển dụng vị trí mới nhanh chóng.</p>
                  </Link>

                  <Link 
                    to="/bussiness/cvlist" 
                    className="p-5 border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group bg-slate-50/30"
                  >
                    <h3 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">Xem Đường ống Pipeline (Kanban)</h3>
                    <p className="text-slate-400 text-xs font-medium">Kéo thả và cập nhật trạng thái ứng tuyển của từng ứng viên.</p>
                  </Link>
                </div>
              </div>

              {/* Recruitment Trend / History */}
              <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  Lịch sử tiếp nhận hồ sơ
                </h2>

                {stats.trend.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-2xl">
                    Chưa có hoạt động nộp hồ sơ gần đây.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {stats.trend.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Clock className="w-5 h-5 text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">
                            {new Date(t._id).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <span className="px-3.5 py-1 bg-blue-100 text-blue-800 rounded-xl text-xs font-black">
                          +{t.count} CV mới
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Pipeline Distribution Sidebar */}
            <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-500" />
                    Đường ống Tuyển dụng
                  </h2>
                </div>

                <div className="space-y-6">
                  {[
                    { key: 'Applied', name: 'Hồ sơ mới nộp', color: 'bg-slate-400' },
                    { key: 'Testing', name: 'Làm bài kiểm tra', color: 'bg-amber-500' },
                    { key: 'Interviewing', name: 'Đang phỏng vấn', color: 'bg-blue-500' },
                    { key: 'Offered', name: 'Đề nghị nhận việc', color: 'bg-emerald-500' },
                    { key: 'Rejected', name: 'Đã từ chối', color: 'bg-red-500' },
                  ].map((stage) => {
                    const count = stats.statusCounts[stage.key] || 0;
                    const percent = stats.totalApplications > 0 
                      ? Math.round((count / stats.totalApplications) * 100) 
                      : 0;

                    return (
                      <div key={stage.key} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-bold text-slate-600">{stage.name}</span>
                          <span className="font-black text-slate-800">{count} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${stage.color}`}
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button 
                onClick={() => navigate('/bussiness/cvlist')}
                className="w-full mt-10 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
              >
                Quản lý Pipeline <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BusinessDashboard;