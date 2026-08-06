import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TakeTest() {
    const { id } = useParams();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    
    // Kiểm tra loại bài Test
    const isPracticeTest = pathname.includes('/practice-test/');
    
    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const timerRef = useRef(null);
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchTest = async () => {
            try {
                const token = localStorage.getItem('token');
                const endpoint = isPracticeTest 
                    ? `${API_BASE}/api/practice-topics/${id}` 
                    : `${API_BASE}/api/assessments/${id}/take`;

                const res = await fetch(endpoint, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!res.ok) throw new Error('Không thể tải đề thi');
                const data = await res.json();
                
                setTest(data);
                setTimeLeft(data.timeLimit * 60);
            } catch (error) {
                toast.error(error.message);
                navigate(isPracticeTest ? '/candidate/tests' : '/candidate/applications');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [id, pathname, isPracticeTest, navigate, API_BASE]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && test && !isSubmitting) {
            handleSubmitTest();
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitting, test]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (qIndex, optionIndex) => {
        setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const handleSubmitTest = async () => {
        setIsSubmitting(true);
        clearInterval(timerRef.current);
        const durationTaken = (test.timeLimit * 60) - timeLeft;

        try {
            const token = localStorage.getItem('token');
            
            if (isPracticeTest) {
                // XỬ LÝ LƯU DATABASE CHO TEST LUYỆN TẬP
                const res = await fetch(`${API_BASE}/api/practice-topics/${id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ answers, duration: durationTaken })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                toast.success('Nộp bài luyện tập thành công!');
                // Đi thẳng tới trang Kết Quả, truyền data vừa lưu
                navigate('/candidate/test-result', { state: { app: data.result } });
                
            } else {
                // XỬ LÝ LƯU DATABASE CHO TEST ỨNG TUYỂN JOB
                const res = await fetch(`${API_BASE}/api/assessments/${id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ answers, duration: durationTaken })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                toast.success('Nộp bài ứng tuyển thành công!');
                navigate('/candidate/test-history');
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi nộp bài');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    if (!test) return null;

    const question = test.questions[currentQuestion];
    const totalQ = test.questions.length;
    const testTitle = test.assessmentName || test.topicName;
    const testLabel = isPracticeTest ? 'AI Luyện Tập' : (test.jobId?.title || 'Bài thi Tuyển dụng');

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-inter selection:bg-blue-100">
            <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-50 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="font-black text-slate-800 text-lg hidden sm:block">{testTitle}</h1>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${isPracticeTest ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {isPracticeTest && <Sparkles className="w-3 h-3 text-amber-500" />} {testLabel}
                    </span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex-1">
                    <div className="mb-6 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Câu hỏi {currentQuestion + 1} / {totalQ}</span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                        {question.question || question.questionText}
                    </h2>

                    <div className="space-y-4">
                        {question.options.map((opt, idx) => (
                            <label 
                                key={idx} 
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestion] === idx ? (isPracticeTest ? 'border-amber-400 bg-amber-50/50' : 'border-blue-500 bg-blue-50/50') : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                                onClick={() => handleSelectOption(currentQuestion, idx)}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${answers[currentQuestion] === idx ? (isPracticeTest ? 'border-amber-500 bg-amber-500' : 'border-blue-500 bg-blue-500') : 'border-slate-300 bg-white'}`}>
                                    {answers[currentQuestion] === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className={`text-base font-medium leading-relaxed ${answers[currentQuestion] === idx ? (isPracticeTest ? 'text-amber-900 font-bold' : 'text-blue-900 font-bold') : 'text-slate-700'}`}>
                                    {opt}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button 
                        onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                        disabled={currentQuestion === 0}
                        className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                        <ChevronLeft className="w-5 h-5" /> Câu trước
                    </button>

                    {currentQuestion === totalQ - 1 ? (
                        <button 
                            onClick={handleSubmitTest}
                            disabled={isSubmitting}
                            className="px-8 py-3 rounded-xl font-black flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                            Nộp Bài
                        </button>
                    ) : (
                        <button 
                            onClick={() => setCurrentQuestion(prev => Math.min(totalQ - 1, prev + 1))}
                            className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors text-white shadow-md ${isPracticeTest ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'}`}
                        >
                            Câu tiếp <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}