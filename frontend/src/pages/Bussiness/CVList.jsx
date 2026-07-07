import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Download, Sparkles, Clock } from 'lucide-react';

const CVList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Applied', 'Testing', 'Interviewing', 'Offered', 'Rejected'];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Applied': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Testing': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'Interviewing': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Offered': return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Rejected': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getAiScoreStyle = (score) => {
    if (score >= 80) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (score >= 60) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    return 'text-slate-500 bg-slate-50 border-slate-100';
  };

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchApplications = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (activeFilter && activeFilter !== 'All') params.append('status', activeFilter);
      params.append('page', page);
      params.append('limit', limit);

      const token = localStorage.getItem('token');
      const url = `${API_BASE}/api/applications?${params.toString()}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal,
      });

      if (!res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const jsonErr = await res.json().catch(() => ({}));
          throw new Error(jsonErr.message || `Request failed ${res.status}`);
        }
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`Server returned non-JSON response: ${text.slice(0,200)}`);
      }

      const contentType = res.headers.get('content-type') || '';
      const json = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};
      setApplications(json.data || []);
      setTotal(json.total || 0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error');
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, activeFilter, page, limit]);

  useEffect(() => {
    const controller = new AbortController();
    fetchApplications(controller.signal);
    return () => controller.abort();
  }, [fetchApplications]);

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight">
            Quản lý <span className="text-blue-600">Hồ sơ ứng viên</span>
          </h1>
          <p className="text-slate-500 text-base">Xem xét và đánh giá các CV đã nộp vào hệ thống</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Tìm theo tên hoặc vị trí..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-4 hide-scrollbar">
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 mr-2 shadow-sm">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-bold text-slate-700">Lọc:</span>
        </div>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeFilter === filter 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            {filter === 'All' ? 'Tất cả' : filter}
          </button>
        ))}
      </div>

      {/* Bảng Danh sách CV */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ứng viên</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Vị trí ứng tuyển</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">AI Match</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Ngày nộp</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400">Trạng thái</th>
                <th className="p-6 text-[11px] font-black uppercase tracking-[2px] text-slate-400 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-slate-400">Đang tải...</div>
                  </td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-red-500">{error}</div>
                  </td>
                </tr>
              )}

              {!loading && !error && applications.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="text-slate-400 font-medium">Không tìm thấy hồ sơ nào phù hợp với bộ lọc.</div>
                  </td>
                </tr>
              )}

              {applications.filter(app => activeFilter === 'All' || app.status === activeFilter).map((app) => (
                <tr key={app._id || app.id} className="hover:bg-slate-50/60 transition-colors group">
                  
                  {/* Cột Ứng viên */}
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <img src={app.userId?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.userId?.fullName || 'U')}&background=eff6ff&color=3b82f6`} alt={app.userId?.fullName || 'Ứng viên'} className="w-10 h-10 rounded-full border border-slate-200" />
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{app.userId?.fullName || 'Unknown'}</p>
                        <p className="text-xs font-medium text-slate-400">ID: #{(app._id || app.id).toString().slice(-6).toUpperCase()}</p>
                      </div>
                    </div>
                  </td>

                  {/* Cột Vị trí */}
                  <td className="p-6">
                    <p className="font-bold text-slate-700 text-sm">{app.jobId?.title || '—'}</p>
                  </td>

                  {/* Cột AI Match */}
                  <td className="p-6">
                    <div className="flex justify-center">
                      <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${getAiScoreStyle(app.aiScore ?? 0)}`}>
                        {(app.aiScore ?? 0) >= 80 && <Sparkles className="w-3.5 h-3.5" />}
                        <span className="font-black text-sm">{(app.aiScore ?? 0)}%</span>
                      </div>
                    </div>
                  </td>

                  {/* Cột Ngày nộp */}
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">{new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="p-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(app.status)}`}>
                      {app.status}
                    </span>
                  </td>

                  {/* Cột Thao tác */}
                  <td className="p-6">
                    <div className="flex items-center justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const cv = app.userId?.cvUrl;
                          if (cv) window.open(cv, '_blank');
                        }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors tooltip" title="Xem CV"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors tooltip" title="Duyệt">
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors tooltip" title="Loại">
                        <XCircle className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors tooltip" title="Tải xuống">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100">
          <div className="text-sm text-slate-500">Tổng: {total} ứng viên</div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-white border disabled:opacity-40"
            >Trước</button>
            <div className="px-3 py-1 rounded-lg bg-slate-50 border">{page}</div>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 rounded-lg bg-white border disabled:opacity-40"
            >Sau</button>
          </div>
        </div>
        </div>
      </div>
  );
};

export default CVList;