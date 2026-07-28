import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TakeTest() {
    const { id } = useParams();
    const navigate = useNavigate();
    
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
                const res = await fetch(`${API_BASE}/api/assessments/${id}/take`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Không thể tải đề thi');
                const data = await res.json();
                setTest(data);
                setTimeLeft(data.timeLimit * 60); // Đổi ra giây
            } catch (error) {
                toast.error(error.message);
                navigate('/candidate/applications');
            } finally {
                setLoading(false);
            }
        };
        fetchTest();
    }, [id, navigate, API_BASE]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitting) {
            timerRef.current = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        } else if (timeLeft === 0 && test && !isSubmitting) {
            handleSubmitTest(); // Hết giờ tự động nộp
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
            const res = await fetch(`${API_BASE}/api/assessments/${id}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ answers, duration: durationTaken })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            toast.success('Nộp bài thành công!');
            // Điều hướng sang trang Lịch sử làm bài
            navigate('/candidate/test-history');
        } catch (error) {
            toast.error(error.message || 'Lỗi khi nộp bài');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    if (!test) return null;

    const question = test.questions[currentQuestion];
    const totalQ = test.questions.length;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-inter selection:bg-blue-100">
            {/* Header Cố định */}
            <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-50 flex items-center justify-between px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <h1 className="font-black text-slate-800 text-lg hidden sm:block">{test.assessmentName}</h1>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">{test.jobId?.title || 'Bài thi'}</span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                    <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
                
                {/* Câu hỏi */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex-1">
                    <div className="mb-6 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Câu hỏi {currentQuestion + 1} / {totalQ}</span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                        {question.question}
                    </h2>

                    <div className="space-y-4">
                        {question.options.map((opt, idx) => (
                            <label 
                                key={idx} 
                                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${answers[currentQuestion] === idx ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}
                            >
                                <div className={`w-6 h-6 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-colors ${answers[currentQuestion] === idx ? 'border-blue-500 bg-blue-500' : 'border-slate-300 bg-white'}`}>
                                    {answers[currentQuestion] === idx && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                </div>
                                <span className={`text-base font-medium leading-relaxed ${answers[currentQuestion] === idx ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                                    {opt}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Điều hướng */}
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
                            className="px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                        >
                            Câu tiếp <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}