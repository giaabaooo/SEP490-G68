import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, Clock, Eye, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const ModeratorRequests = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/jobs/moderator-requests', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await res.json();
        
        if (!res.ok) throw new Error(data.message || 'Lỗi khi tải dữ liệu yêu cầu');
        
        setRequests(data);
      } catch (error) {
        console.error(error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [navigate]);

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto mt-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Yêu cầu Bài Test</h1>
        <p className="text-slate-500">Danh sách các vị trí đang chờ bạn xây dựng bài kiểm tra kỹ năng (SME).</p>
      </div>

      <div className="bg-white rounded-[24px] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500">Đang tải dữ liệu...</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-400 bg-slate-50 font-bold">
                <th className="p-5">Vị trí tuyển dụng</th>
                <th className="p-5">HR Yêu cầu</th>
                <th className="p-5">Hạn chót Job</th>
                <th className="p-5">Trạng thái Test</th>
                <th className="p-5 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-slate-500 font-medium">
                    Hiện tại chưa có yêu cầu tạo Test nào.
                  </td>
                </tr>
              )}

              {requests.map((req) => (
                <tr key={req.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{req.jobTitle}</td>
                  <td className="p-5 text-slate-600 font-medium">{req.hrName}</td>
                  <td className="p-5 text-slate-500">{req.deadline}</td>
                  <td className="p-5">
                    {req.status === 'pending' ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center w-fit">
                        <Clock className="w-3.5 h-3.5 mr-1.5" /> Chờ tạo Test
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center w-fit">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Đã duyệt
                      </span>
                    )}
                  </td>
                  <td className="p-5">
                    <div className="flex justify-center gap-2">
                      <button 
                        className="p-2 text-slate-400 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 rounded-lg transition-colors" 
                        title="Xem chi tiết Job"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {req.status === 'pending' && (
                        <button 
                          onClick={() => navigate(`/moderator/create-test/${req.id}`)}
                          className="px-3 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-transform hover:-translate-y-0.5 shadow-sm"
                        >
                          <PlusCircle className="w-4 h-4" /> Tạo Test
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ModeratorRequests;