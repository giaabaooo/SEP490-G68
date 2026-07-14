import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, Users, FileCheck, Calendar, ArrowRight, Sparkles, TrendingUp, Edit3, Power, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const BusinessDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || {};

  // ==========================================
  // PHẦN MỚI THÊM: STATE & API LOGIC
  // ==========================================
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Hàm lấy danh sách công việc của HR này
  const fetchMyJobs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Gọi API lấy danh sách việc làm (Backend đã tự động lọc theo recruiterId dựa vào token)
      const res = await fetch('http://localhost:5000/api/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Không thể tải danh sách chiến dịch');
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error(error);
      toast.error('Có lỗi xảy ra khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  // 2. Hàm xử lý nút Đóng / Mở tin tuyển dụng nhanh
  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'closed' : 'active';
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Cập nhật trạng thái thất bại');

      toast.success(`Đã ${newStatus === 'active' ? 'MỞ' : 'ĐÓNG'} tin tuyển dụng thành công!`);
      // Gọi lại API để load lại bảng dữ liệu mới nhất
      fetchMyJobs(); 
    } catch (error) {
      toast.error(error.message);
    }
  };
  // ==========================================

  return (
    <div className="animate-fade-in pb-8">
      {/* Header & Lời chào */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Bảng điều khiển <span className="text-blue-600">Tuyển dụng</span>
          </h1>
          <p className="text-slate-500 text-base flex items-center gap-2">
            Chào mừng bạn quay lại, <span className="font-bold text-slate-800">{user.fullName || user.companyName || 'Nhà tuyển dụng'}</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </p>
        </div>
      </div>

      {/* 4 Stats Cards (Giữ nguyên) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { icon: Briefcase, title: 'Chiến dịch mở', value: jobs.filter(j => j.status === 'Active').length + ' Jobs', color: 'blue' },
          { icon: Users, title: 'CV nhận được', value: '0 CV', color: 'emerald' },
          { icon: FileCheck, title: 'Pass vòng AI', value: '0 CV', color: 'purple' },
          { icon: Calendar, title: 'Lịch phỏng vấn', value: '0 Lịch', color: 'amber' },
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
        
        {/* ==========================================
            BẢNG CHIẾN DỊCH GẦN ĐÂY (ĐÃ THAY ĐỔI)
        ========================================== */}
        <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900">Chiến dịch gần đây</h2>
            <Link to="/bussiness/post-job" className="text-blue-600 font-bold text-sm hover:underline flex items-center">
              Xem tất cả <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-[2px] text-slate-400 font-black border-b border-slate-100">
                  <th className="p-5">Vị trí tuyển dụng</th>
                  <th className="p-5">Lượng ứng tuyển</th>
                  <th className="p-5">Trạng thái</th>
                  <th className="p-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-10">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-2" />
                      <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-10 text-slate-500 font-medium">
                      Bạn chưa có chiến dịch tuyển dụng nào.
                    </td>
                  </tr>
                ) : (
                  jobs.slice(0, 5).map((job) => (
                    <tr key={job.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition-colors group">
                      <td className="p-5 font-bold text-slate-800">{job.title}</td>
                      <td className="p-5 font-bold text-slate-500">0 CV</td> {/* Đang để số 0 tạm thời */}
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center ${
                          job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 
                          job.status === 'Closed' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            job.status === 'Active' ? 'bg-emerald-500' : 
                            job.status === 'Closed' ? 'bg-red-500' : 'bg-slate-400'
                          }`}></span>
                          {job.status === 'Active' ? 'Hoạt động' : job.status === 'Closed' ? 'Đã đóng' : 'Bản nháp'}
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Nút Đóng / Mở */}
                          <button 
                            onClick={() => toggleJobStatus(job.id, job.status)}
                            title={job.status === 'Active' ? 'Đóng tin này' : 'Mở lại tin'}
                            className={`p-2 rounded-xl transition-colors ${
                              job.status === 'Active' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          
                          {/* Nút Sửa */}
                          <button 
                            onClick={() => navigate(`/bussiness/edit-job/${job.id}`)}
                            title="Chỉnh sửa tin"
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Screening Sidebar - Phải (Giữ nguyên) */}
        <div className="bg-white rounded-[32px] p-7 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-indigo-500" />
              Sàng lọc AI
            </h2>
            <div className="flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Live</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Vũ Thành Trung', match: '92%', pos: 'React Dev' },
              { name: 'Trần Văn A', match: '85%', pos: 'Node.js' },
            ].map((cv, idx) => (
              <div key={idx} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{cv.name}</h3>
                  <span className="text-emerald-600 font-black text-sm bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">{cv.match}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{cv.pos}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group">
            Phòng lọc CV <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessDashboard;