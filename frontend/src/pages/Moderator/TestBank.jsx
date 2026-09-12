// File: src/pages/Moderator/TestBank.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Search, FileEdit, Loader2, AlertCircle, CheckCircle2, 
  Clock, ListChecks, Briefcase, Eye, RefreshCw, XCircle, Tag,
  ExternalLink, Plus, Sparkles, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const TestBank = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | PUBLISHED | DRAFT

  const fetchTests = async () => {
    const token = localStorage.getItem('token');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/assessments/my-tests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTests(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  // Thống kê số liệu nhanh
  const stats = useMemo(() => {
    const total = tests.length;
    const published = tests.filter(t => t.status === 'PUBLISHED').length;
    const draft = tests.filter(t => t.status === 'DRAFT').length;
    const totalQuestions = tests.reduce((acc, t) => acc + (t.questions?.length || 0), 0);
    return { total, published, draft, totalQuestions };
  }, [tests]);

  // Lọc dữ liệu theo từ khóa tìm kiếm và trạng thái
  const filteredTests = useMemo(() => {
    return tests.filter(test => {
      const query = searchTerm.toLowerCase().trim();
      const matchSearch = !query || 
        test.assessmentName?.toLowerCase().includes(query) ||
        test.jobId?.title?.toLowerCase().includes(query) ||
        test.tags?.some(tag => tag.toLowerCase().includes(query)) ||
        test.description?.toLowerCase().includes(query);

      let matchStatus = true;
      if (statusFilter === 'PUBLISHED') matchStatus = test.status === 'PUBLISHED';
      if (statusFilter === 'DRAFT') matchStatus = test.status === 'DRAFT';

      return matchSearch && matchStatus;
    });
  }, [tests, searchTerm, statusFilter]);

  // Định dạng ngày
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="animate-fade-in pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">Ngân hàng Bài Test</h1>
            <span className="px-3.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-950 text-xs font-black uppercase rounded-full tracking-wider">
              Assessment Repository
            </span>
          </div>
          <p className="text-slate-700 text-sm font-bold">
            Quản lý toàn bộ kho đề thi, số lượng câu hỏi chuyên môn và trạng thái phát hành bài kiểm tra.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 hover:border-emerald-500 text-slate-900 hover:text-emerald-800 font-black text-xs rounded-xl shadow-sm transition-all hover:bg-emerald-50 cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-700 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Card 1: Tổng số đề thi */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-slate-400 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Tổng số đề thi</span>
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center font-black">
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-950">{stats.total}</span>
            <span className="text-xs font-bold text-slate-800">đề thi</span>
          </div>
        </div>

        {/* Card 2: Đã phê duyệt / Phát hành */}
        <div 
          onClick={() => setStatusFilter('PUBLISHED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PUBLISHED' 
              ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30' 
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800">Đã phê duyệt</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">{stats.published}</span>
            <span className="text-xs font-black text-emerald-900">sẵn sàng thi</span>
          </div>
        </div>

        {/* Card 3: Bản nháp */}
        <div 
          onClick={() => setStatusFilter('DRAFT')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'DRAFT' 
              ? 'bg-white border-amber-500 shadow-md ring-2 ring-amber-500/30' 
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-amber-800">Bản nháp</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">{stats.draft}</span>
            <span className="text-xs font-black text-amber-900">đang biên soạn</span>
          </div>
        </div>

        {/* Card 4: Tổng số câu hỏi */}
        <div className="p-5 rounded-2xl border bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-800">Tổng câu hỏi</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-black">
              <ListChecks className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-indigo-800">{stats.totalQuestions}</span>
            <span className="text-xs font-black text-indigo-900">câu trong kho</span>
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
            placeholder="Tìm theo tên bài test, vị trí job, từ khóa..."
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
            { id: 'PUBLISHED', label: 'Đã duyệt', count: stats.published },
            { id: 'DRAFT', label: 'Bản nháp', count: stats.draft },
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

      {/* TESTS TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-300 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
            <p className="text-sm font-black text-slate-800">Đang tải kho đề thi...</p>
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-200 font-black">
              <Database className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">Không tìm thấy bài Test nào</h3>
            <p className="text-xs text-slate-700 font-bold max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Không có bài kiểm tra nào phù hợp với bộ lọc hoặc từ khóa tìm kiếm.'
                : 'Bạn chưa tạo bài kiểm tra năng lực nào trong hệ thống.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black rounded-xl border border-slate-300 transition-colors cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            ) : (
              <button
                onClick={() => navigate('/moderator/requests')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                Xem danh sách Yêu cầu tạo Test
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-slate-800 bg-slate-100 font-black border-b border-slate-300">
                  <th className="py-4 px-6 min-w-[280px]">Tên bài Test & Thông tin</th>
                  <th className="py-4 px-6 min-w-[220px]">Job liên kết</th>
                  <th className="py-4 px-6 text-center min-w-[140px]">Số câu hỏi</th>
                  <th className="py-4 px-6 text-center min-w-[140px]">Thời lượng</th>
                  <th className="py-4 px-6 min-w-[150px]">Trạng thái</th>
                  <th className="py-4 px-6 text-center min-w-[180px]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTests.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50 transition-colors group">
                    {/* Cột 1: Tên bài Test */}
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${
                          test.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <span 
                            onClick={() => navigate(`/moderator/edit-test/${test._id}`)}
                            className="font-black text-slate-950 text-[15px] hover:text-emerald-700 transition-colors cursor-pointer block"
                          >
                            {test.assessmentName}
                          </span>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-700 font-bold">
                            {test.createdAt && (
                              <span>Tạo ngày: {formatDate(test.createdAt)}</span>
                            )}
                            {test.tags && test.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {test.tags.slice(0, 2).map((t, idx) => (
                                  <span key={idx} className="px-2 py-0.5 bg-slate-200 text-slate-900 text-[10px] font-black rounded-md border border-slate-300">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Cột 2: Job liên kết */}
                    <td className="py-4 px-6">
                      {test.jobId ? (
                        <div className="space-y-1">
                          <button
                            onClick={() => navigate(`/moderator/job-detail/${test.jobId._id || test.jobId}`)}
                            className="text-xs font-black text-blue-800 hover:text-blue-900 hover:underline flex items-center gap-1.5 text-left cursor-pointer"
                          >
                            <Briefcase className="w-3.5 h-3.5 shrink-0 text-blue-700" />
                            <span className="truncate max-w-[200px]">{test.jobId.title || 'Chi tiết vị trí'}</span>
                          </button>
                          {(test.jobId.location || test.jobId.salary) && (
                            <p className="text-[11px] font-bold text-slate-700 truncate max-w-[200px]">
                              {[test.jobId.location, test.jobId.salary].filter(Boolean).join(' • ')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-black">
                          Chưa gắn Job
                        </span>
                      )}
                    </td>

                    {/* Cột 3: Số câu hỏi */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs rounded-xl shadow-xs">
                        <ListChecks className="w-3.5 h-3.5 text-slate-700" />
                        {test.questions?.length || 0} câu
                      </span>
                    </td>

                    {/* Cột 4: Thời lượng */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-950 font-black text-xs rounded-xl shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-700" />
                        {test.timeLimit || 0} phút
                      </span>
                    </td>

                    {/* Cột 5: Trạng thái */}
                    <td className="py-4 px-6">
                      {test.status === 'PUBLISHED' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-xl text-xs font-black shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-black shadow-xs">
                          <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                          Bản nháp
                        </span>
                      )}
                    </td>

                    {/* Cột 6: Thao tác */}
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Nút Xem Job (nếu có) */}
                        {test.jobId && (
                          <button
                            onClick={() => navigate(`/moderator/job-detail/${test.jobId._id || test.jobId}`)}
                            className="p-2 text-slate-800 hover:text-emerald-800 bg-slate-100 hover:bg-emerald-50 border border-slate-300 rounded-xl transition-colors cursor-pointer"
                            title="Xem chi tiết công việc liên kết"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Nút Sửa đề */}
                        <button
                          onClick={() => navigate(`/moderator/edit-test/${test._id}`)}
                          className="px-3.5 py-2 hover:bg-emerald-50 hover:text-emerald-900 bg-white border border-slate-300 hover:border-emerald-400 text-slate-950 font-black rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-sm hover:shadow cursor-pointer"
                          title="Chỉnh sửa nội dung đề thi"
                        >
                          <FileEdit className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Sửa Test</span>
                        </button>
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

export default TestBank;