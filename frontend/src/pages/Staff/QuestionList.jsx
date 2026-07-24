import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const QuestionList = () => {
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/staff/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTopics(data.data); // Dữ liệu bây giờ là mảng các topic: [{ topic, questionCount }]
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách chủ đề');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (topicName) => {
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ câu hỏi của chủ đề "${topicName}" không?`)) return;

    try {
      const token = localStorage.getItem('token');
      // Gọi API xóa theo tên topic
      const res = await fetch(`http://localhost:5000/api/staff/questions/${encodeURIComponent(topicName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchTopics(); // Reload lại danh sách sau khi xóa
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Lỗi khi xóa chủ đề');
    }
  };

  // ĐÂY LÀ CHỖ SỬA LỖI: Chỉ tìm kiếm theo trường 'topic'
  const filteredTopics = topics.filter(t => {
    if (!t.topic) return false;
    return t.topic.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black text-slate-800">Ngân hàng Câu hỏi</h1>
        <Link 
          to="/staff/questions/create" 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
        >
          <Plus className="w-5 h-5" /> Thêm Bộ câu hỏi mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Thanh tìm kiếm */}
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên chủ đề (VD: ReactJS)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Bảng danh sách */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-5 font-bold uppercase text-xs tracking-wider">Tên Chủ đề (Topic)</th>
                <th className="p-5 font-bold uppercase text-xs tracking-wider text-center">Số lượng câu hỏi</th>
                <th className="p-5 font-bold uppercase text-xs tracking-wider text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500 animate-pulse">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500">
                    Không tìm thấy chủ đề nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredTopics.map((item, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-5 font-bold text-slate-800 text-lg">
                      {item.topic}
                    </td>
                    <td className="p-5 text-center">
                      <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full font-bold text-sm">
                        {item.questionCount} câu
                      </span>
                    </td>
                    <td className="p-5 text-center">
                      <div className="flex justify-center gap-3">
                        {/* Lưu ý link dẫn đến trang Edit bây giờ dùng item.topic thay vì ID */}
                        <Link
                          to={`/staff/questions/edit/${encodeURIComponent(item.topic)}`}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Chỉnh sửa và Thêm câu hỏi vào chủ đề này"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(item.topic)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Xóa toàn bộ chủ đề"
                        >
                          <Trash2 className="w-5 h-5" />
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