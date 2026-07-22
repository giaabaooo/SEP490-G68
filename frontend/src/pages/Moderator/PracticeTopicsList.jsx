import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, PlusCircle, Edit3, Trash2, Clock, HelpCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const PracticeTopicsList = () => {
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const fetchTopics = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/practice-topics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to retrieve topics');
      setTopics(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, [navigate]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the topic "${name}"?`)) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/practice-topics/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete topic');
      
      toast.success('Practice topic deleted successfully');
      setTopics(prev => prev.filter(t => t._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="animate-fade-in pb-12 max-w-6xl mx-auto mt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-emerald-600" />
            Chủ đề bài test <span className="text-emerald-600">luyện tập</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Quản lý các chủ đề và danh sách câu hỏi trắc nghiệm dùng để luyện tập cho ứng viên.
          </p>
        </div>

        <button
          onClick={() => navigate('/moderator/create-practice-topic')}
          className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Tạo chủ đề mới
        </button>
      </div>

      {/* Main Table Wrapper */}
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 font-medium">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="p-16 text-center text-red-500 font-medium flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <span>{error}</span>
          </div>
        ) : topics.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-medium">
            Chưa có chủ đề bài test luyện tập nào. Hãy bắt đầu bằng cách tạo mới!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400 font-black">
                  <th className="p-6">Tên chủ đề</th>
                  <th className="p-6">Mô tả</th>
                  <th className="p-6 text-center">Thời gian</th>
                  <th className="p-6 text-center">Số câu hỏi</th>
                  <th className="p-6 text-center">Người tạo</th>
                  <th className="p-6 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {topics.map((topic) => (
                  <tr key={topic._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-6">
                      <span className="font-extrabold text-slate-900 block">{topic.topicName}</span>
                    </td>
                    <td className="p-6 max-w-xs truncate text-slate-500">
                      {topic.description || '—'}
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-3 py-1 rounded-xl text-xs font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        {topic.timeLimit} phút
                      </div>
                    </td>
                    <td className="p-6 text-center">
                      <div className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-xl text-xs font-black">
                        <HelpCircle className="w-3.5 h-3.5" />
                        {topic.questions?.length || 0} câu
                      </div>
                    </td>
                    <td className="p-6 text-center text-xs text-slate-500">
                      {topic.createdBy?.fullName || 'Moderator'}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/moderator/edit-practice-topic/${topic._id}`)}
                          className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                          title="Chỉnh sửa chủ đề"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(topic._id, topic.topicName)}
                          className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                          title="Xóa chủ đề"
                        >
                          <Trash2 className="w-4 h-4" />
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

export default PracticeTopicsList;
