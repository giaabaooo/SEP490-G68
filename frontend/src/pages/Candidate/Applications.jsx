import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, FileText, ArrowRight, Eye } from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getPublicCvUrl = (cv) => cv ? (cv.startsWith('http') ? cv : `${API_BASE}${cv}`) : null;

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Không thể tải hồ sơ ứng tuyển');
        }
        setApplications(data.data || []);
      } catch (err) {
        setError(err.message || 'Lỗi');
        toast.error(err.message || 'Lỗi khi tải hồ sơ ứng tuyển');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Việc làm đã ứng tuyển</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">Theo dõi các hồ sơ bạn đã gửi, trạng thái hiện tại và xem lại CV ứng tuyển.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
              <span>Tổng ứng tuyển:</span>
              <span className="rounded-full bg-white px-3 py-1 text-slate-900 shadow-sm">{applications.length}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Vị trí</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Nhà tuyển dụng</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Ngày ứng tuyển</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Hạn ứng tuyển</th>
                <th className="px-6 py-4 text-left text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Trạng thái</th>
                <th className="px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Đang tải...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-600">{error}</td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">Bạn chưa ứng tuyển công việc nào.</td>
                </tr>
              ) : (
                applications.map((app) => {
                  const employer = app.jobId?.recruiterId?.companyName || app.jobId?.recruiterId?.fullName || 'Chưa rõ';
                  const deadline = app.jobId?.recruitmentDeadline ? new Date(app.jobId.recruitmentDeadline).toLocaleDateString('vi-VN') : 'Đang cập nhật';
                  const appliedDate = new Date(app.appliedAt || app.createdAt || Date.now()).toLocaleDateString('vi-VN');
                  const cvUrl = getPublicCvUrl(app.appliedCvFileUrl || app.userId?.cvUrl);

                  return (
                    <tr key={app._id || app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-black text-slate-900">{app.jobId?.title || 'Không rõ vị trí'}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-semibold text-slate-800">{employer}</div>
                      </td>
                      <td className="px-6 py-5 align-top text-sm text-slate-700">{appliedDate}</td>
                      <td className="px-6 py-5 align-top text-sm text-slate-700">{deadline}</td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${
                          app.status === 'Offered' ? 'bg-emerald-50 text-emerald-700' :
                          app.status === 'Rejected' ? 'bg-red-50 text-red-700' :
                          app.status === 'Testing' ? 'bg-amber-50 text-amber-700' :
                          app.status === 'Interviewing' ? 'bg-blue-50 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button
                          onClick={() => { if (cvUrl) window.open(cvUrl, '_blank'); }}
                          className={`p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors ${!cvUrl ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-100 hover:text-slate-400' : ''}`}
                          title={cvUrl ? 'Xem CV' : 'Không có CV'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Applications;
