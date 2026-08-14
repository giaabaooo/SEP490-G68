import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, CheckCircle2, Sparkles, X, PlusCircle, Trash2, Copy, 
  Settings, CheckCircle, Clock, CheckSquare, Loader2
} from 'lucide-react';

// ================= MODAL BÁO HẾT TOKEN =================
const TokenTopupModal = ({ isOpen, onClose, isModerator }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Không đủ Hạn mức</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">
                    {isModerator 
                        ? "Hạn mức Token nội bộ của Job này không đủ để tạo bộ câu hỏi theo số lượng yêu cầu. Vui lòng liên hệ HR/Business để nạp thêm hoặc phân bổ lại hạn mức!" 
                        : "Số dư Token AI của bạn không đủ để tạo bộ câu hỏi. Vui lòng nạp thêm để tiếp tục!"}
                </p>
                {!isModerator && (
                    <button onClick={() => navigate('/upgrade')} className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-colors">
                        Nạp Token Ngay
                    </button>
                )}
            </div>
        </div>
    )
};
// =======================================================

const AIGenerateModal = ({ isOpen, onClose, onGenerate, loading }) => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Intermediate');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-[500px] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-emerald-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-black flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300" /> AI Generator (MCQ)</h3>
            <p className="text-emerald-100 text-sm mt-1 font-medium">Tạo câu hỏi trắc nghiệm chuyên sâu tức thì</p>
          </div>
          <button onClick={onClose} className="relative z-10 text-white hover:bg-white/20 p-2 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Chủ đề cần kiểm tra</label>
            <input type="text" className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium" placeholder="VD: ReactJS Hooks..." value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Trình độ</label>
              <select className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none text-sm font-medium" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="Fresher">Cơ bản</option><option value="Intermediate">Trung bình</option><option value="Senior">Khó (Senior)</option>
              </select>
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-slate-700">Số lượng</label>
                <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-md">{count} câu</span>
              </div>
              <input type="range" min="1" max="20" step="1" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" value={count} onChange={(e) => setCount(parseInt(e.target.value))} />
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
             <span className="text-xs font-bold text-slate-500 uppercase">Chi phí dự kiến</span>
             <span className="text-sm font-black text-emerald-600">{count * 5} Token</span>
          </div>
        </div>
        <div className="p-6 pt-2 flex gap-3 border-t border-slate-100">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Hủy bỏ</button>
          <button onClick={() => topic.trim() ? onGenerate(topic, count, difficulty) : toast.error("Nhập chủ đề!")} disabled={loading} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-70 flex justify-center items-center gap-2">
            {loading ? 'Đang phân tích...' : <><Sparkles className="w-5 h-5" /> Tạo ngay</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function TestBuilder() {
  const navigate = useNavigate();
  const { jobId, testId } = useParams(); 
  const isEditMode = !!testId;

  const [loading, setLoading] = useState(isEditMode);
  const [assessmentName, setAssessmentName] = useState('Đánh giá năng lực chuyên môn');
  const [description, setDescription] = useState('');
  const [timeLimit, setTimeLimit] = useState(45);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  
  const [jobQuota, setJobQuota] = useState(0);
  const [showTokenModal, setShowTokenModal] = useState(false);

  const totalQuestions = parsedQuestions.length;
  const checkedQuestions = parsedQuestions.filter(q => q.isChecked).length;

  useEffect(() => {
    if (jobId) {
      const fetchJob = async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/jobs/${jobId}`);
          if(res.ok) {
            const data = await res.json();
            setJobQuota(data.aiTokensQuota || 0);
          }
        } catch (error) {}
      };
      fetchJob();
    }

    if (isEditMode) {
      const fetchTest = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch(`http://localhost:5000/api/assessments/${testId}`, { headers: { 'Authorization': `Bearer ${token}` } });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message);
          
          setAssessmentName(data.assessmentName);
          setDescription(data.description || '');
          setTimeLimit(data.timeLimit);
          setParsedQuestions(data.questions || []);
        } catch (error) { toast.error(error.message); navigate('/moderator/test-bank'); } 
        finally { setLoading(false); }
      };
      fetchTest();
    }
  }, [testId, isEditMode, jobId, navigate]);

  const addManualQuestion = () => setParsedQuestions(prev => [...prev, { type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, skill: '', isChecked: false }]);
  const updateQuestion = (idx, field, val) => { const arr = [...parsedQuestions]; arr[idx][field] = val; setParsedQuestions(arr); };
  const handleOptionChange = (qIdx, oIdx, val) => { const arr = [...parsedQuestions]; arr[qIdx].options[oIdx] = val; setParsedQuestions(arr); };
  const duplicateQuestion = (idx) => { const arr = [...parsedQuestions]; arr.splice(idx + 1, 0, JSON.parse(JSON.stringify(arr[idx]))); setParsedQuestions(arr); };
  const removeQuestion = (idx) => setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx));

  const handleAIGenerate = async (topic, count, difficulty) => {
    setIsAILoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/assessments/generate-ai`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ topic, quantity: count, difficulty, jobId })
      });
      const data = await res.json();
      
      // BẮT LỖI 402/403 THIẾU TOKEN
      if (!res.ok) {
          if (res.status === 402 || res.status === 403) {
              setShowAIModal(false);
              setShowTokenModal(true);
              return;
          }
          throw new Error(data.message);
      }

      const aiQuestions = data.questions.map(q => ({...q, isChecked: false}));
      setParsedQuestions(prev => [...prev, ...aiQuestions]);
      setShowAIModal(false);
      setJobQuota(prev => Math.max(0, prev - (count * 5))); // Trừ token trên UI
      toast.success(`Đã tạo ${data.questions.length} câu hỏi thành công!`);
    } catch (error) { toast.error(error.message); } 
    finally { setIsAILoading(false); }
  };

  const handleSave = async (status) => {
    if (!assessmentName || parsedQuestions.length === 0) return toast.error('Vui lòng nhập tên bài thi và thêm câu hỏi!');
    
    if (status === 'PUBLISHED' && checkedQuestions < totalQuestions) {
        if (!window.confirm(`Bạn mới duyệt ${checkedQuestions}/${totalQuestions} câu. Bạn có chắc chắn muốn Xuất bản bài test này không?`)) return;
    }

    setIsSaving(true);
    const payload = { assessmentName, description, timeLimit, questions: parsedQuestions, status };
    if (!isEditMode && jobId) payload.jobId = jobId;

    try {
      const url = isEditMode ? `http://localhost:5000/api/assessments/${testId}` : `http://localhost:5000/api/assessments/create`;
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(status === 'PUBLISHED' ? 'Đã duyệt & Gửi HR thành công!' : 'Đã lưu bản nháp!');
      navigate('/moderator/test-bank');
    } catch (error) { toast.error(error.message); } 
    finally { setIsSaving(false); }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-emerald-600" /></div>;

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col font-sans">
      <AIGenerateModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} onGenerate={handleAIGenerate} loading={isAILoading} />
      <TokenTopupModal isOpen={showTokenModal} onClose={() => setShowTokenModal(false)} isModerator={true} />

      <header className="h-[76px] bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <input type="text" value={assessmentName} onChange={(e) => setAssessmentName(e.target.value)} className="border-none text-xl font-extrabold text-slate-800 outline-none w-[350px] bg-transparent focus:bg-slate-50 px-3 py-1.5 rounded-lg" placeholder="Tên bài kiểm tra..." />
          
          {totalQuestions > 0 && (
            <div className={`px-4 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-sm transition-colors ${checkedQuestions === totalQuestions ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
               <CheckCircle2 className="w-4 h-4" /> Đã duyệt: {checkedQuestions}/{totalQuestions}
            </div>
          )}

          {/* HIỂN THỊ HẠN MỨC CHO MODERATOR */}
          <div className="px-4 py-1.5 rounded-xl border flex items-center gap-2 font-bold text-sm bg-indigo-50 text-indigo-700 border-indigo-200">
             <Sparkles className="w-4 h-4" /> Hạn mức Job: {jobQuota} Token
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={() => handleSave('DRAFT')} disabled={isSaving} className="px-6 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors">
            Lưu nháp
          </button>
          <button onClick={() => handleSave('PUBLISHED')} disabled={isSaving} className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Xuất bản (Duyệt)
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-[800px] mx-auto">

            <div className="mb-8">
              <div onClick={() => setShowAIModal(true)} className="bg-gradient-to-r from-emerald-50 to-teal-50/50 border-2 border-dashed border-emerald-300 rounded-[24px] p-8 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500 hover:bg-emerald-50 group">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-[19px] font-black text-emerald-800 tracking-tight">Khởi tạo nhanh với AI</h3>
                <p className="text-[13px] text-emerald-600/80 font-bold mt-1.5">Sinh bộ đề trắc nghiệm tự động theo công nghệ AI.</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-[20px] p-6 mb-8 shadow-sm">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Lời dặn ứng viên</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập lời chào hoặc dặn dò ứng viên..." className="w-full min-h-[50px] border-none outline-none text-[14px] font-medium text-slate-700 resize-none" />
            </div>

            {parsedQuestions.map((q, idx) => (
              <div key={idx} className={`border-2 rounded-[20px] mb-6 overflow-hidden transition-all hover:shadow-md ${q.isChecked ? 'bg-emerald-50/20 border-emerald-300' : 'bg-white border-slate-200'}`}>
                
                <div className={`px-5 py-3.5 flex justify-between items-center border-b ${q.isChecked ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-black uppercase tracking-wide"><CheckSquare className="w-3.5 h-3.5" /> MCQ</div>
                    
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer" checked={!!q.isChecked} onChange={(e) => updateQuestion(idx, 'isChecked', e.target.checked)} />
                        <span className="text-xs font-bold text-slate-600">Đã duyệt</span>
                    </label>

                    <div className="flex items-center gap-2 ml-2"><span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tag:</span>
                      <input type="text" value={q.skill || ''} onChange={(e) => updateQuestion(idx, 'skill', e.target.value)} placeholder="Nhập skill..." className="border-none bg-white focus:ring-1 focus:ring-emerald-500 rounded px-2.5 py-1.5 text-xs font-bold text-emerald-700 w-32 outline-none shadow-sm" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => duplicateQuestion(idx)} className="text-slate-400 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors"><Copy className="w-4 h-4" /></button>
                    <button onClick={() => removeQuestion(idx)} className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="p-5">
                  <textarea className="w-full border-none p-0 text-[15px] leading-relaxed font-bold text-slate-800 focus:ring-0 resize-none outline-none mb-4 bg-transparent" rows={2} value={q.question} onChange={(e) => updateQuestion(idx, 'question', e.target.value)} placeholder="Nội dung câu hỏi..." />
                  <div className="space-y-3">
                    {(q.options || []).map((opt, optIdx) => (
                      <div key={optIdx} onClick={() => updateQuestion(idx, 'correctAnswer', optIdx)} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${optIdx === q.correctAnswer ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${optIdx === q.correctAnswer ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'}`}>
                          {optIdx === q.correctAnswer && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <input type="text" className={`flex-1 bg-transparent border-none text-sm focus:ring-0 outline-none ${optIdx === q.correctAnswer ? 'font-bold text-emerald-900' : 'font-medium text-slate-700'}`} value={opt} onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)} placeholder={`Nhập đáp án ${optIdx + 1}...`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            <button onClick={addManualQuestion} className="w-full py-5 rounded-[20px] border-2 border-dashed border-slate-300 text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors bg-white">
              <PlusCircle className="w-5 h-5" /> Thêm câu hỏi thủ công
            </button>
          </div>
        </main>

        <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2 text-slate-800 font-black text-[15px] uppercase tracking-wide">
            <Settings className="w-5 h-5 text-emerald-600" /> Cài đặt chung
          </div>
          <div className="p-6 overflow-y-auto space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Thời lượng thi</p>
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500" /><span className="text-sm font-bold text-slate-700">Thời gian làm bài</span></div>
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1 rounded-lg shadow-sm">
                  <input type="number" value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} className="w-12 text-center outline-none font-bold text-emerald-600 bg-transparent" />
                  <span className="text-xs font-bold text-slate-400">phút</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}