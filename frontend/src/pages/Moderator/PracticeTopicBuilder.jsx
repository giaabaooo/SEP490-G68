import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, PlusCircle, Trash2, Save, Clock, HelpCircle, 
  Sparkles, X, Loader2, CheckSquare, Plus, ChevronDown
} from 'lucide-react';

const AIGenerateModal = ({ isOpen, onClose, onGenerate, loading }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Intermediate');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[500px] rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-scale-in">
        <div className="bg-emerald-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" /> AI Question Generator
            </h3>
            <p className="text-emerald-100 text-xs mt-1 font-semibold">Tự động sinh câu hỏi trắc nghiệm luyện tập</p>
          </div>
          <button onClick={onClose} className="relative z-10 text-white hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Chủ đề (Topic)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium" 
              placeholder="VD: React Hooks, REST API, Basic Javascript..." 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Trình độ</label>
              <select 
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium bg-white" 
                value={difficulty} 
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value="Fresher">Cơ bản (Easy)</option>
                <option value="Intermediate">Trung bình (Medium)</option>
                <option value="Senior">Khó (Hard)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Số lượng</label>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">{count} câu</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="20" 
                step="1" 
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                value={count} 
                onChange={(e) => setCount(parseInt(e.target.value))} 
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3 border-t border-slate-100">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={() => topic.trim() ? onGenerate(topic, count, difficulty) : toast.error("Nhập chủ đề!")} 
            disabled={loading} 
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2 cursor-pointer"
          >
            {loading ? 'Đang tạo câu hỏi...' : <><Sparkles className="w-4 h-4" /> Tạo câu hỏi</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function PracticeTopicBuilder() {
  const navigate = useNavigate();
  const { topicId } = useParams();
  const isEditMode = !!topicId;

  const [loading, setLoading] = useState(isEditMode);
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [questions, setQuestions] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isEditMode) {
      const fetchTopic = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`${API_BASE}/api/practice-topics/${topicId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Failed to load topic');
          
          setTopicName(data.topicName);
          setDescription(data.description || '');
          setTimeLimit(data.timeLimit || 30);
          setQuestions(data.questions || []);
        } catch (err) {
          toast.error(err.message);
          navigate('/moderator/practice-topics');
        } finally {
          setLoading(false);
        }
      };
      fetchTopic();
    }
  }, [topicId, isEditMode, navigate]);

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        questionText: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        skill: topicName || 'General',
        difficulty: 'Medium'
      }
    ]);
  };

  const handleDeleteQuestion = (idx) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === idx) {
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i === qIdx) {
        const newOpts = [...q.options];
        newOpts[optIdx] = val;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleAIGenerate = async (topicPrompt, count, difficulty) => {
    setIsAILoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/assessments/generate-ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: topicPrompt,
          quantity: count,
          difficulty
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'AI Generation failed');

      const mapped = (data.questions || []).map(q => ({
        questionText: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        skill: topicPrompt,
        difficulty: difficulty === 'Fresher' ? 'Easy' : difficulty === 'Senior' ? 'Hard' : 'Medium'
      }));

      setQuestions(prev => [...prev, ...mapped]);
      setShowAIModal(false);
      toast.success(`Successfully generated ${mapped.length} questions!`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) return toast.error("Vui lòng nhập tên chủ đề!");
    if (questions.length === 0) return toast.error("Hãy thêm ít nhất một câu hỏi!");

    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) return toast.error(`Câu hỏi số ${i + 1} trống nội dung!`);
      if (q.options.some(opt => !opt.trim())) return toast.error(`Câu hỏi số ${i + 1} có đáp án trống!`);
      if (!q.skill.trim()) return toast.error(`Câu hỏi số ${i + 1} chưa điền phân loại (skill)!`);
    }

    setIsSaving(true);
    const token = localStorage.getItem('token');
    const url = isEditMode 
      ? `${API_BASE}/api/practice-topics/${topicId}`
      : `${API_BASE}/api/practice-topics`;
    const method = isEditMode ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          topicName,
          description,
          timeLimit: parseInt(timeLimit),
          questions
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');

      toast.success(isEditMode ? 'Cập nhật chủ đề thành công!' : 'Tạo mới chủ đề thành công!');
      navigate('/moderator/practice-topics');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mr-2" /> Đang tải thông tin chủ đề...
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto mt-6">
      {/* Top Controls */}
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => navigate('/moderator/practice-topics')}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại
        </button>

        <button
          onClick={() => setShowAIModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" /> Sinh câu hỏi bằng AI
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Topic Header Card */}
        <div className="bg-white rounded-[32px] p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-black text-slate-900">
              {isEditMode ? 'Chỉnh sửa chủ đề luyện tập' : 'Tạo mới chủ đề luyện tập'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 font-semibold">Thiết lập cấu hình chung cho bài trắc nghiệm luyện tập</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Tên chủ đề luyện tập</label>
              <input
                type="text"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-bold text-slate-800"
                placeholder="VD: Lập trình ReactJS cơ bản, Node.js & Express..."
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Thời gian (phút)</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="5"
                  max="180"
                  className="w-full pl-4 pr-12 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-bold text-slate-800"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                />
                <Clock className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Mô tả chủ đề</label>
            <textarea
              rows="3"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium text-slate-600 leading-relaxed"
              placeholder="Giới thiệu sơ lược về kiến thức của bài luyện tập này..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Danh sách câu hỏi
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                {questions.length} câu
              </span>
            </h3>
          </div>

          {questions.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-semibold border-2 border-dashed border-slate-200 rounded-[32px] bg-white/50">
              Chưa có câu hỏi nào. Hãy bấm "Thêm câu hỏi mới" hoặc dùng "AI" để tạo tự động.
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-white rounded-[28px] p-6 border border-slate-200 shadow-sm relative group hover:border-slate-300 transition-all">
                  
                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(idx)}
                    className="absolute top-5 right-5 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    title="Xóa câu hỏi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
                    <span className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-600 text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Trắc nghiệm (MCQ)</span>
                  </div>

                  <div className="space-y-5">
                    {/* Question Content */}
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Nội dung câu hỏi</label>
                      <textarea
                        required
                        rows="2"
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-bold text-slate-800"
                        placeholder="Nhập nội dung câu hỏi..."
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(idx, 'questionText', e.target.value)}
                      ></textarea>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {q.options.map((opt, optIdx) => {
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        const isCorrect = q.correctAnswer === optIdx;

                        return (
                          <div key={optIdx} className="space-y-1">
                            <label className="block text-xs font-bold text-slate-400">Đáp án {optionLabels[optIdx]}</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                className={`w-full pl-12 pr-4 py-3 border rounded-xl outline-none text-sm font-medium transition-all ${
                                  isCorrect 
                                    ? 'border-emerald-500 bg-emerald-50/10 focus:ring-4 focus:ring-emerald-500/10' 
                                    : 'border-slate-200 focus:border-emerald-500'
                                }`}
                                placeholder={`Lựa chọn ${optionLabels[optIdx]}...`}
                                value={opt}
                                onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              />
                              <div className={`w-7 h-7 rounded-lg absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs font-black border transition-all ${
                                isCorrect 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}>
                                {optionLabels[optIdx]}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Metadata: Correct Option, Skill, Difficulty */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Đáp án đúng</label>
                        <select
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 bg-white"
                          value={q.correctAnswer}
                          onChange={(e) => handleQuestionChange(idx, 'correctAnswer', parseInt(e.target.value))}
                        >
                          <option value={0}>Đáp án A</option>
                          <option value={1}>Đáp án B</option>
                          <option value={2}>Đáp án C</option>
                          <option value={3}>Đáp án D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Phân loại (Skill)</label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-slate-700"
                          placeholder="VD: Hooks, DB Schema..."
                          value={q.skill}
                          onChange={(e) => handleQuestionChange(idx, 'skill', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Độ khó</label>
                        <select
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-xs font-bold text-slate-700 bg-white"
                          value={q.difficulty}
                          onChange={(e) => handleQuestionChange(idx, 'difficulty', e.target.value)}
                        >
                          <option value="Easy">Dễ (Easy)</option>
                          <option value="Medium">Trung bình (Medium)</option>
                          <option value="Hard">Khó (Hard)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleAddQuestion}
              className="flex-1 py-4 border-2 border-dashed border-slate-300 rounded-[24px] hover:border-emerald-500 text-slate-500 hover:text-emerald-600 font-bold transition-all flex items-center justify-center gap-2 cursor-pointer bg-white/40 hover:bg-white"
            >
              <Plus className="w-5 h-5" /> Thêm câu hỏi thủ công
            </button>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={() => navigate('/moderator/practice-topics')}
            className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-sm font-bold transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/10 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? 'Đang lưu...' : 'Lưu chủ đề'}
          </button>
        </div>
      </form>

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        loading={isAILoading}
      />
    </div>
  );
}
