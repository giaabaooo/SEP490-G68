import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, CheckCircle2, Clock, Eye, PlusCircle, Search, 
  Filter, AlertTriangle, Building2, MapPin, DollarSign, Calendar,
  FileEdit, RefreshCw, XCircle, CheckSquare, Sparkles, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ModeratorRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | pending | approved | expired

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/jobs/moderator-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRequests(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [navigate]);

  // Thống kê số liệu nhanh
  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(r => r.status === 'pending' && !r.isExpired).length;
    const approved = requests.filter(r => r.status === 'approved').length;
    const expired = requests.filter(r => r.isExpired && r.status === 'pending').length;
    return { total, pending, approved, expired };
  }, [requests]);

  // Bộ lọc dữ liệu theo tìm kiếm và tab
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        req.jobTitle?.toLowerCase().includes(query) ||
        req.hrName?.toLowerCase().includes(query) ||
        req.companyName?.toLowerCase().includes(query) ||
        req.location?.toLowerCase().includes(query);

      let matchStatus = true;
      if (statusFilter === 'pending') {
        matchStatus = req.status === 'pending' && !req.isExpired;
      } else if (statusFilter === 'approved') {
        matchStatus = req.status === 'approved';
      } else if (statusFilter === 'expired') {
        matchStatus = req.isExpired && req.status === 'pending';
      }

      return matchSearch && matchStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Định dạng ngày
  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Không có' || dateStr === 'Không giới hạn') return 'Không giới hạn';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="animate-fade-in pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Yêu cầu Xây dựng Bài Test</h1>
            <span className="px-3.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-black uppercase rounded-full tracking-wider">
              SME Portal
            </span>
          </div>
          <p className="text-slate-700 text-sm font-bold">
            Danh sách các vị trí tuyển dụng đang chờ bạn biên soạn và phê duyệt bài kiểm tra kỹ năng chuyên môn.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-900 hover:text-emerald-800 font-black text-xs rounded-xl shadow-sm transition-all hover:bg-emerald-50 w-fit self-start md:self-auto cursor-pointer"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-700 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Tổng yêu cầu */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Tổng yêu cầu</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-black">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{stats.total}</span>
            <span className="text-xs font-bold text-slate-800">vị trí</span>
          </div>
        </div>

        {/* Card 2: Chờ tạo Test */}
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'pending' 
              ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/30' 
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">Cần tạo Test</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center relative font-black">
              <Clock className="w-5 h-5" />
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-600 rounded-full animate-ping"></span>
              )}
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{stats.pending}</span>
            <span className="text-xs font-black text-amber-900">đang chờ bạn</span>
          </div>
        </div>

        {/* Card 3: Đã hoàn thành */}
        <div 
          onClick={() => setStatusFilter('approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'approved' 
              ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Đã hoàn tất</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{stats.approved}</span>
            <span className="text-xs font-black text-emerald-900">bài test sẵn sàng</span>
          </div>
        </div>

        {/* Card 4: Đã quá hạn */}
        <div 
          onClick={() => setStatusFilter('expired')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'expired' 
              ? 'bg-white border-rose-500 shadow-md ring-2 ring-rose-500/30' 
              : 'bg-white border-slate-200 hover:border-rose-300 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-rose-800">Đã quá hạn</span>
            <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-black">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-700">{stats.expired}</span>
            <span className="text-xs font-black text-rose-900">hết hạn tuyển dụng</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-300 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Tìm theo vị trí, HR, công ty, địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs font-black text-slate-950 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-600 transition-all placeholder:text-slate-500 placeholder:font-bold"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-3 text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'all', label: 'Tất cả', count: stats.total },
            { id: 'pending', label: 'Chờ tạo Test', count: stats.pending },
            { id: 'approved', label: 'Đã duyệt', count: stats.approved },
            { id: 'expired', label: 'Quá hạn', count: stats.expired },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-black ${
                statusFilter === tab.id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-950'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* REQUESTS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-black text-slate-800">Đang tải danh sách yêu cầu...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 font-black">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Không tìm thấy yêu cầu nào</h3>
            <p className="text-xs text-slate-700 font-bold max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Không có kết quả nào phù hợp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
                : 'Hiện tại bạn chưa được phân công xây dựng bài Test cho vị trí tuyển dụng nào.'}
            </p>
            {(searchTerm || statusFilter !== 'all') && (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-800 bg-slate-100 font-black border-b border-slate-300">
                  <th className="py-4 px-6 min-w-[280px]">Vị trí tuyển dụng</th>
                  <th className="py-4 px-6 min-w-[200px]">HR Yêu cầu</th>
                  <th className="py-4 px-6 min-w-[160px]">Hạn chót Job</th>
                  <th className="py-4 px-6 min-w-[160px]">Trạng thái Test</th>
                  <th className="py-4 px-6 text-center min-w-[200px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    {/* Cột 1: Vị trí tuyển dụng & Meta tags */}
                    <td className="py-4 px-6">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => navigate(`/moderator/job-detail/${req.id}`)}
                            className="font-black text-slate-950 text-[15px] hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            {req.jobTitle}
                          </span>
                          {req.isExpired && (
                            <span className="px-2 py-0.5 bg-rose-100 border border-rose-300 text-rose-800 rounded text-[10px] font-black uppercase">
                              Hết hạn
                            </span>
                          )}
                        </div>

                        {/* Company & Details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-800">
                          <span className="flex items-center gap-1.5 text-slate-850">
                            <Building2 className="w-3.5 h-3.5 text-slate-700" />
                            {req.companyName}
                          </span>
                          {req.location && (
                            <span className="flex items-center gap-1.5 text-slate-700">
                              • <MapPin className="w-3.5 h-3.5 text-slate-700" />
                              {req.location}
                            </span>
                          )}
                          {req.salary && (
                            <span className="flex items-center gap-1.5 text-emerald-800 font-black">
                              • <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
                              {req.salary}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: HR Yêu cầu */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0 border-2 border-emerald-300">
                          {req.hrName?.charAt(0)?.toUpperCase() || 'H'}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-black text-slate-950 truncate">{req.hrName}</p>
                          {req.hrEmail && (
                            <p className="text-[11px] font-bold text-slate-700 truncate">{req.hrEmail}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Cột 3: Hạn chót Job */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                          <Calendar className="w-3.5 h-3.5 text-slate-700" />
                          <span>{formatDate(req.deadline)}</span>
                        </div>
                        {req.isExpired ? (
                          <span className="inline-block text-[11px] font-black text-rose-800">
                            Đã đóng tuyển dụng
                          </span>
                        ) : req.deadline !== 'Không giới hạn' ? (
                          <span className="inline-block text-[11px] font-black text-emerald-800">
                            Đang nhận hồ sơ
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Cột 4: Trạng thái Test */}
                    <td className="py-4 px-6">
                      {req.isExpired && req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-950 border border-rose-300 rounded-xl text-xs font-black">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-700" /> Quá hạn tạo Test
                        </span>
                      ) : req.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-black">
                          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                          Chờ tạo Test
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Đã duyệt & Sẵn sàng
                        </span>
                      )}
                    </td>

                    {/* Cột 5: Thao tác */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút Xem JD */}
                        <button
                          onClick={() => navigate(`/moderator/job-detail/${req.id}`)}
                          className="px-3 py-2 text-slate-900 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-300 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Xem bản mô tả công việc (JD)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi tiết</span>
                        </button>

                        {/* Nút Tạo Test hoặc Sửa Test */}
                        {req.status === 'pending' ? (
                          req.isExpired ? (
                            <button
                              disabled
                              className="px-3 py-2 text-slate-500 bg-slate-200 border border-slate-300 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-not-allowed opacity-75"
                              title="Không thể tạo test cho công việc đã quá hạn tuyển dụng"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Hết hạn</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/moderator/create-test/${req.id}`)}
                              className="px-3.5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer"
                              title="Bắt đầu tạo bộ đề kiểm tra"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Tạo Test</span>
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              if (req.assessmentId) {
                                navigate(`/moderator/edit-test/${req.assessmentId}`);
                              } else {
                                navigate(`/moderator/test-bank`);
                              }
                            }}
                            className="px-3 py-2 text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            title="Chỉnh sửa bộ đề đã tạo"
                          >
                            <FileEdit className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Sửa đề</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModeratorRequests;