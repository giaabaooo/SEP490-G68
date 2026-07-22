import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit3, Trash2, Search, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

const QuestionList = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/staff/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/staff/questions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Đã xóa câu hỏi!');
        fetchQuestions(); // Load lại bảng
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Lỗi khi xóa câu hỏi');
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            Ngân hàng câu hỏi
          </h1>
          <p className="text-slate-500 mt-2">Quản lý câu hỏi luyện tập cho ứng viên</p>
        </div>
        <Link 
          to="/staff/questions/create" 
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Thêm câu hỏi mới
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm theo nội dung hoặc chủ đề..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold bg-white border-b border-slate-100">
                <th className="p-5">Chủ đề</th>
                <th className="p-5">Nội dung câu hỏi</th>
                <th className="p-5">Ngày tạo</th>
                <th className="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center p-10"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" /></td>
                </tr>
              ) : filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-10 text-slate-500">Không tìm thấy câu hỏi nào.</td>
                </tr>
              ) : (
                filteredQuestions.map((q) => (
                  <tr key={q._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg text-xs">
                        {q.topic}
                      </span>
                    </td>
                    <td className="p-5 text-slate-800 font-medium max-w-md truncate">{q.questionText}</td>
                    <td className="p-5 text-slate-500">{new Date(q.createdAt).toLocaleDateString('vi-VN')}</td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => navigate(`/staff/questions/edit/${q._id}`)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(q._id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default QuestionList;