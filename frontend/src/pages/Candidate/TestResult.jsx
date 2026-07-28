import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function TestResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const { app } = location.state || {}; // Nhận data từ History truyền sang

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!app) navigate('/candidate/test-history');
    }, [app, navigate]);

    if (!app) return null;

    const test = app.assessmentId; // Chứa questions
    const answers = app.testAnswers || {};

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            {/* Header */}
            <div className="bg-indigo-900 pt-8 pb-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center text-indigo-200 hover:text-white font-medium text-sm mb-6 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại lịch sử
                    </button>
                    
                    <div className="text-center text-white">
                        <h1 className="text-3xl font-black mb-2">{test?.assessmentName || 'Bài kiểm tra năng lực'}</h1>
                        <p className="text-indigo-200 font-medium">Vị trí: {app.jobId?.title}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-10 space-y-6">
                {/* Score Card */}
                <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex flex-col md:flex-row items-center justify-around gap-8">
                    <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ĐIỂM SỐ ĐẠT ĐƯỢC</p>
                        <p className={`text-6xl font-black ${app.testScore >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{app.testScore}<span className="text-2xl text-slate-300">/100</span></p>
                    </div>
                    <div className="hidden md:block w-px h-20 bg-slate-100"></div>
                    <div className="flex gap-12 text-center">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">THỜI GIAN LÀM</p>
                            <p className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2"><Clock className="w-5 h-5 text-indigo-500" /> {formatDuration(app.testDuration)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">SỐ CÂU ĐÚNG</p>
                            <p className="text-2xl font-black text-slate-800">
                                {Object.keys(answers).filter(key => test?.questions[key] && answers[key] === test.questions[key].correctAnswer).length} / {test?.questions?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Question Details */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                    <h3 className="text-xl font-black text-slate-900 mb-8 border-b border-slate-100 pb-4">Chi tiết đáp án</h3>
                    
                    <div className="space-y-6">
                        {test?.questions?.map((q, idx) => {
                            const userAnswer = answers[idx.toString()];
                            const isCorrect = userAnswer === q.correctAnswer;

                            return (
                                <div key={idx} className={`border-l-4 rounded-2xl p-6 bg-slate-50 border border-slate-200 ${isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="text-base font-bold text-slate-800 pr-4">Câu {idx + 1}: {q.question}</h4>
                                        <span className={`shrink-0 px-3 py-1 text-xs font-black uppercase rounded-lg border ${isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                            {isCorrect ? 'Đúng' : 'Sai'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            const isUserChoice = optIdx === userAnswer;
                                            const isCorrectChoice = optIdx === q.correctAnswer;

                                            let style = "bg-white border-slate-200 text-slate-600"; // Default
                                            let Icon = null;

                                            if (isCorrectChoice && isUserChoice) {
                                                style = "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold";
                                                Icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
                                            } else if (isUserChoice && !isCorrectChoice) {
                                                style = "bg-rose-50 border-rose-500 text-rose-800 font-bold";
                                                Icon = <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
                                            } else if (isCorrectChoice && !isUserChoice) {
                                                style = "bg-emerald-50/50 border-emerald-300 text-emerald-700 font-bold border-dashed";
                                                Icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
                                            }

                                            return (
                                                <div key={optIdx} className={`p-3 rounded-xl border flex items-center gap-3 ${style}`}>
                                                    <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                                        {Icon ? Icon : <div className="w-3 h-3 rounded-full border-2 border-slate-300"></div>}
                                                    </div>
                                                    <span>{opt}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}