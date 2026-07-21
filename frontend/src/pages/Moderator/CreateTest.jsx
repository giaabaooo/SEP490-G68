import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const CreateTest = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();

  const [testConfig, setTestConfig] = useState({
    title: 'Bài Test Kỹ năng Frontend',
    duration: 30, // Phút
    passScore: 70, // Điểm qua bài
  });

  const [questions, setQuestions] = useState([
    {
      id: 1,
      questionText: '',
      options: ['', '', '', ''],
      correctIndex: null
    }
  ]);

  const handleAddQuestion = () => {
    setQuestions([...questions, { id: Date.now(), questionText: '', options: ['', '', '', ''], correctIndex: null }]);
  };

  const handleRemoveQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQs = [...questions];
    newQs[qIndex].options[optIndex] = value;
    setQuestions(newQs);
  };

  const setCorrectOption = (qIndex, optIndex) => {
    const newQs = [...questions];
    newQs[qIndex].correctIndex = optIndex;
    setQuestions(newQs);
  };

  const handleApproveTest = () => {
    // Validate
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].questionText || questions[i].correctIndex === null) {
        toast.error(`Vui lòng hoàn thiện câu hỏi số ${i + 1} và chọn đáp án đúng!`);
        return;
      }
    }
    toast.success('Đã duyệt và gửi bài Test cho HR!');
    navigate('/moderator/test-bank');
  };

  return (
    <div className="animate-fade-in pb-12 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-slate-500 hover:text-emerald-600 font-bold text-sm mb-6 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200 w-fit"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
      </button>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h1 className="text-2xl font-black text-slate-900 mb-6">Cấu hình Bài Test (Gắn cho Job ID: {jobId})</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-800 mb-2">Tên bài kiểm tra</label>
            <input type="text" value={testConfig.title} onChange={e => setTestConfig({...testConfig, title: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-medium" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">Thời gian (Phút)</label>
            <input type="number" value={testConfig.duration} onChange={e => setTestConfig({...testConfig, duration: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-medium" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((q, qIndex) => (
          <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative group">
            <button onClick={() => handleRemoveQuestion(q.id)} className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
              <Trash2 className="w-5 h-5" />
            </button>
            
            <h3 className="text-sm font-black text-emerald-600 mb-4 uppercase tracking-wider">Câu hỏi {qIndex + 1}</h3>
            <textarea
              placeholder="Nhập nội dung câu hỏi..."
              value={q.questionText}
              onChange={(e) => {
                const newQs = [...questions];
                newQs[qIndex].questionText = e.target.value;
                setQuestions(newQs);
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-sm font-medium mb-4 resize-none"
              rows="2"
            ></textarea>

            <div className="space-y-3">
              {q.options.map((opt, optIndex) => (
                <div key={optIndex} className="flex items-center gap-3">
                  <button
                    onClick={() => setCorrectOption(qIndex, optIndex)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      q.correctIndex === optIndex ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 text-transparent hover:border-emerald-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder={`Đáp án ${optIndex + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition-all ${
                      q.correctIndex === optIndex ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 focus:border-emerald-500'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleAddQuestion} className="w-full mt-6 py-4 rounded-2xl border-2 border-dashed border-slate-300 text-slate-500 font-bold flex items-center justify-center gap-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
        <Plus className="w-5 h-5" /> Thêm câu hỏi
      </button>

      <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-slate-200">
        <button className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center">
          <Save className="w-4 h-4 mr-2"/> Lưu Nháp
        </button>
        <button onClick={handleApproveTest} className="px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center shadow-lg shadow-emerald-500/30 transition-transform hover:-translate-y-0.5">
          <CheckCircle2 className="w-4 h-4 mr-2"/> Duyệt & Chuyển cho HR
        </button>
      </div>
    </div>
  );
};

export default CreateTest;