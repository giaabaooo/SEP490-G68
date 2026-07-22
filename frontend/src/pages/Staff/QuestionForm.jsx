import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const QuestionForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: '',
    questionText: '',
    explanation: '',
    options: [
      { text: '', isCorrect: true }, // Mặc định đáp án 1 là đúng
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
  });

  useEffect(() => {
    if (isEditMode) {
      fetchQuestionDetails();
    }
  }, [id]);

  const fetchQuestionDetails = async () => {
    // Nếu API có hàm GET detail, gọi ở đây. 
    // Tạm thời lọc từ list hoặc ông cần bổ sung 1 route GET /:id ở backend
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/staff/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const question = data.data.find(q => q._id === id);
      if (question) {
        setFormData({
          topic: question.topic,
          questionText: question.questionText,
          explanation: question.explanation || '',
          options: question.options
        });
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu câu hỏi');
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
  };

  const setCorrectOption = (index) => {
    const newOptions = formData.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    }));
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate cơ bản
    if (!formData.topic || !formData.questionText) {
      return toast.warning('Vui lòng nhập đủ chủ đề và nội dung câu hỏi');
    }
    const emptyOptions = formData.options.some(opt => !opt.text.trim());
    if (emptyOptions) {
      return toast.warning('Vui lòng nhập đầy đủ nội dung cho 4 đáp án');
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `http://localhost:5000/api/staff/questions/${id}` 
        : 'http://localhost:5000/api/staff/questions';
      
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (data.success) {
        toast.success(isEditMode ? 'Cập nhật thành công!' : 'Tạo câu hỏi thành công!');
        navigate('/staff/questions');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <Link to="/staff/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-medium mb-6 transition-colors">
        <ArrowLeft className="w-5 h-5" /> Quay lại danh sách
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <h1 className="text-2xl font-black text-slate-900 mb-8">
          {isEditMode ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi luyện tập mới'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề (VD: ReactJS, Node.js, Mạng máy tính)</label>
              <input 
                type="text" 
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập chủ đề..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung câu hỏi</label>
              <textarea 
                rows="3"
                value={formData.questionText}
                onChange={(e) => setFormData({...formData, questionText: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Nhập nội dung câu hỏi..."
              ></textarea>
            </div>

            {/* Render 4 Đáp án */}
            <div className="md:col-span-2 space-y-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Các đáp án (Chọn đáp án đúng)</label>
              {formData.options.map((option, index) => (
                <div key={index} className={`flex items-center gap-3 p-2 rounded-xl border-2 transition-all ${option.isCorrect ? 'border-emerald-500 bg-emerald-50' : 'border-transparent bg-slate-50'}`}>
                  <button 
                    type="button"
                    onClick={() => setCorrectOption(index)}
                    className={`w-6 h-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${option.isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}
                  >
                    {option.isCorrect && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <input 
                    type="text" 
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-slate-800 font-medium"
                    placeholder={`Nhập đáp án ${String.fromCharCode(65 + index)}...`}
                  />
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Giải thích (Hiển thị khi học viên trả lời sai - Không bắt buộc)</label>
              <textarea 
                rows="2"
                value={formData.explanation}
                onChange={(e) => setFormData({...formData, explanation: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Nhập giải thích..."
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {isEditMode ? 'Cập nhật câu hỏi' : 'Lưu câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuestionForm;