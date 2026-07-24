import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const emptyOption = [
  { text: '', isCorrect: true },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false }
];

const emptyQuestionBlock = { questionText: '', explanation: '', options: [...emptyOption] };

const QuestionForm = () => {
  const params = useParams();
  // Mẹo: Lấy cả 'topic' hoặc 'id' để phòng trường hợp file Route chưa đổi tên biến
  const urlTopic = params.topic || params.id; 
  const navigate = useNavigate();
  const isEditMode = !!urlTopic;

  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState([{ ...emptyQuestionBlock, options: JSON.parse(JSON.stringify(emptyOption)) }]);

  useEffect(() => {
    if (isEditMode) {
      fetchTopicDetails();
    }
  }, [urlTopic]);

  const fetchTopicDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/staff/questions/${encodeURIComponent(urlTopic)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        setTopic(data.data[0].topic);
        
        // Format lại dữ liệu cho chuẩn với form, giữ lại _id để Backend phân biệt câu cũ/mới
        const loadedQuestions = data.data.map(q => ({
          _id: q._id, 
          questionText: q.questionText || '',
          explanation: q.explanation || '',
          options: q.options && q.options.length === 4 ? q.options : JSON.parse(JSON.stringify(emptyOption))
        }));
        
        setQuestions(loadedQuestions);
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu chủ đề');
    }
  };

  const handleAddQuestionBlock = () => {
    setQuestions([...questions, { ...emptyQuestionBlock, options: JSON.parse(JSON.stringify(emptyOption)) }]);
  };

  const handleRemoveQuestionBlock = (indexToRemove) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, index) => index !== indexToRemove));
  };

  const handleQuestionChange = (qIndex, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optIndex].text = value;
    setQuestions(updatedQuestions);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options = updatedQuestions[qIndex].options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex
    }));
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return toast.warning('Vui lòng nhập chủ đề');

    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText.trim()) return toast.warning(`Vui lòng nhập nội dung câu số ${i + 1}`);
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = isEditMode 
        ? `http://localhost:5000/api/staff/questions/${encodeURIComponent(urlTopic)}` 
        : 'http://localhost:5000/api/staff/questions';
      
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ topic, questions })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
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
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/staff/questions" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-6 font-medium">
        <ArrowLeft className="w-5 h-5" /> Quay lại
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-8">
          <h1 className="text-2xl font-black mb-4">{isEditMode ? `Quản lý chủ đề: ${topic}` : 'Tạo bộ câu hỏi mới'}</h1>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={isEditMode} 
            className={`w-full px-5 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 ${isEditMode ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`}
            placeholder="Tên chủ đề..."
          />
          {isEditMode && <p className="text-sm text-red-500 mt-2 font-medium">* Lưu ý: Không thể đổi tên chủ đề khi đang chỉnh sửa.</p>}
        </div>

        {questions.map((q, qIndex) => (
          <div key={qIndex} className="bg-white rounded-xl shadow border border-slate-200 p-8 relative">
            {/* Nút xóa hiện lên nếu có nhiều hơn 1 câu hỏi */}
            {questions.length > 1 && (
              <button 
                type="button" 
                onClick={() => handleRemoveQuestionBlock(qIndex)}
                className="absolute top-6 right-6 text-red-500 hover:bg-red-50 p-2 rounded-lg"
                title="Xóa câu hỏi này khỏi chủ đề"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            
            <h2 className="text-lg font-bold text-blue-600 mb-4 flex items-center gap-2">
              Câu hỏi {qIndex + 1} 
              {q._id ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">(Câu cũ)</span> : <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">(Mới thêm)</span>}
            </h2>
            
            <div className="space-y-4">
              <textarea 
                rows="2" value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg" placeholder="Nội dung câu hỏi..."
              />
              <div className="grid grid-cols-2 gap-4">
                {q.options.map((option, optIndex) => (
                  <div key={optIndex} className={`flex items-center gap-2 p-2 border rounded-lg ${option.isCorrect ? 'border-green-400 bg-green-50' : 'border-slate-200'}`}>
                    <input 
                      type="radio" name={`correct-${qIndex}`} checked={option.isCorrect}
                      onChange={() => setCorrectOption(qIndex, optIndex)} className="w-5 h-5 cursor-pointer"
                    />
                    <input 
                      type="text" value={option.text} onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                      className="w-full px-2 py-1 bg-transparent border-none focus:outline-none" placeholder={`Đáp án ${optIndex + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <button type="button" onClick={handleAddQuestionBlock} className="px-6 py-3 border-2 border-blue-300 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors">
            <Plus className="w-5 h-5" /> Thêm câu hỏi vào chủ đề này
          </button>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {isEditMode ? 'Lưu cập nhật chủ đề' : 'Tạo bộ câu hỏi'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuestionForm;