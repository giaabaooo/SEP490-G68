import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
    Clock, 
    AlertCircle, 
    AlertTriangle,
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Loader2, 
    Sparkles, 
    LayoutGrid, 
    Check, 
    HelpCircle,
    LogOut
} from 'lucide-react';
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
    
    // Quản lý cảnh báo rời màn hình & thoát trang
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [showTabWarningModal, setShowTabWarningModal] = useState(false);
    const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
    const isTabHiddenRef = useRef(false);

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
            handleSubmitTest(true);
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, isSubmitting, test]);

    // 1. Cảnh báo khi đóng tab hoặc tải lại trang (F5 / Reload / Close)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (!isSubmitting) {
                e.preventDefault();
                e.returnValue = 'Bạn có chắc chắn muốn rời khỏi bài thi? Mọi câu trả lời chưa nộp sẽ bị mất.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isSubmitting]);

    // 2. Chặn nút Back/Forward của trình duyệt để không vô tình thoát bài thi
    useEffect(() => {
        window.history.pushState({ inTest: true }, '');

        const handlePopState = () => {
            if (!isSubmitting) {
                window.history.pushState({ inTest: true }, '');
                setShowExitConfirmModal(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isSubmitting]);

    // 3. Phát hiện rời khỏi màn hình bài thi (chuyển tab hoặc chuyển ứng dụng)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (isSubmitting) return;

            if (document.hidden) {
                isTabHiddenRef.current = true;
            } else {
                if (isTabHiddenRef.current) {
                    isTabHiddenRef.current = false;
                    setTabSwitchCount(prev => {
                        const newCount = prev + 1;
                        toast.warn(`Cảnh báo: Bạn vừa rời khỏi màn hình bài thi (Lần ${newCount})`, {
                            autoClose: 4000
                        });
                        return newCount;
                    });
                    setShowTabWarningModal(true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isSubmitting]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleSelectOption = (qIndex, optionIndex) => {
        setAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const handleConfirmExit = () => {
        setIsSubmitting(true);
        setShowExitConfirmModal(false);
        navigate(isPracticeTest ? '/candidate/tests' : '/candidate/applications');
    };

    const handleSubmitTest = async (isAuto = false) => {
        if (!isAuto && test?.questions) {
            const answeredCount = test.questions.reduce((acc, _, idx) => (answers[idx] !== undefined && answers[idx] !== null) ? acc + 1 : acc, 0);
            const totalQ = test.questions.length;
            if (answeredCount < totalQ) {
                const unAnswered = totalQ - answeredCount;
                if (!window.confirm(`Bạn còn ${unAnswered} câu chưa trả lời (đã làm ${answeredCount}/${totalQ}). Bạn có chắc chắn muốn nộp bài ngay không?`)) {
                    return;
                }
            } else {
                if (!window.confirm(`Bạn đã hoàn thành toàn bộ ${totalQ}/${totalQ} câu hỏi. Bạn có chắc chắn muốn nộp bài thi?`)) {
                    return;
                }
            }
        }

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
                    body: JSON.stringify({ answers, duration: durationTaken, tabSwitches: tabSwitchCount })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                toast.success('Nộp bài luyện tập thành công!');
                navigate('/candidate/test-result', { state: { app: data.result } });
                
            } else {
                // XỬ LÝ LƯU DATABASE CHO TEST ỨNG TUYỂN JOB
                const res = await fetch(`${API_BASE}/api/assessments/${id}/submit`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ answers, duration: durationTaken, tabSwitches: tabSwitchCount })
                });

                const data = await res.json();
                if (!res.ok) throw new Error(data.message);

                toast.success('Nộp bài ứng tuyển thành công!');
                if (data.application) {
                    navigate('/candidate/test-result', { state: { app: data.application } });
                } else {
                    navigate('/candidate/test-history');
                }
            }
        } catch (error) {
            toast.error(error.message || 'Lỗi khi nộp bài');
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>;
    if (!test || !test.questions || test.questions.length === 0) return null;

    const question = test.questions[currentQuestion];
    const totalQ = test.questions.length;
    const answeredCount = test.questions.reduce((acc, _, idx) => (answers[idx] !== undefined && answers[idx] !== null) ? acc + 1 : acc, 0);
    const progressPercent = Math.round((answeredCount / totalQ) * 100);
    const testTitle = test.assessmentName || test.topicName;
    const testLabel = isPracticeTest ? 'AI Luyện Tập' : (test.jobId?.title || 'Bài thi Tuyển dụng');
    const isCurrentAnswered = answers[currentQuestion] !== undefined && answers[currentQuestion] !== null;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-inter selection:bg-blue-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 h-16 sticky top-0 z-50 flex items-center justify-between px-4 sm:px-8 shadow-sm">
                <div className="flex items-center gap-3 sm:gap-4 truncate">
                    {/* Nút Thoát bài thi an toàn */}
                    <button
                        onClick={() => setShowExitConfirmModal(true)}
                        className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                        title="Rời khỏi bài thi"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Thoát</span>
                    </button>

                    <h1 className="font-black text-slate-800 text-base sm:text-lg truncate max-w-xs sm:max-w-md">{testTitle}</h1>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border shrink-0 flex items-center gap-1 ${isPracticeTest ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {isPracticeTest && <Sparkles className="w-3 h-3 text-amber-500" />} {testLabel}
                    </span>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Badge cảnh báo số lần rời màn hình nếu có */}
                    {tabSwitchCount > 0 && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs bg-red-50 text-red-700 border border-red-200 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                            <span className="hidden sm:inline">Rời màn hình:</span>
                            <span className="font-black">{tabSwitchCount} lần</span>
                        </div>
                    )}

                    {/* Badge tiến độ */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 text-slate-700 border border-slate-200">
                        <span>Đã làm:</span>
                        <span className="text-blue-600 font-black">{answeredCount}/{totalQ}</span>
                    </div>

                    {/* Đồng hồ đếm ngược */}
                    <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold text-sm border ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        <Clock className="w-4 h-4 shrink-0" /> 
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            {/* Nội dung chính: 2 cột trên Desktop */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    
                    {/* Cột trái: Vùng câu hỏi chính (8/12 cột) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                            {/* Tiêu đề thanh trạng thái câu */}
                            <div className="mb-6 flex flex-wrap justify-between items-center gap-2 pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <span className="text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                        Câu {currentQuestion + 1} / {totalQ}
                                    </span>
                                    {isCurrentAnswered ? (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã chọn đáp án
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                            <HelpCircle className="w-3.5 h-3.5 text-amber-600" /> Chưa trả lời
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                                    Chọn 1 trong các đáp án bên dưới
                                </span>
                            </div>
                            
                            {/* Nội dung câu hỏi */}
                            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-8 leading-relaxed">
                                {question.question || question.questionText}
                            </h2>

                            {/* Danh sách lựa chọn đáp án */}
                            <div className="space-y-3.5">
                                {question.options.map((opt, idx) => {
                                    const isSelected = answers[currentQuestion] === idx;
                                    const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D...

                                    return (
                                        <label 
                                            key={idx} 
                                            className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                isSelected 
                                                    ? (isPracticeTest 
                                                        ? 'border-amber-500 bg-amber-50/70 shadow-sm' 
                                                        : 'border-blue-500 bg-blue-50/70 shadow-sm') 
                                                    : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                                            }`}
                                            onClick={() => handleSelectOption(currentQuestion, idx)}
                                        >
                                            {/* Huy hiệu chữ A, B, C, D */}
                                            <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-all ${
                                                isSelected 
                                                    ? (isPracticeTest 
                                                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                                                        : 'bg-blue-600 text-white shadow-md shadow-blue-600/30') 
                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                            }`}>
                                                {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : optionLetter}
                                            </div>

                                            {/* Nội dung văn bản đáp án */}
                                            <span className={`text-base font-medium leading-relaxed pt-0.5 ${
                                                isSelected 
                                                    ? (isPracticeTest ? 'text-amber-950 font-bold' : 'text-blue-950 font-bold') 
                                                    : 'text-slate-700'
                                            }`}>
                                                {opt}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Nút điều hướng Trước / Sau / Nộp */}
                        <div className="flex items-center justify-between gap-4">
                            <button 
                                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                                disabled={currentQuestion === 0}
                                className="px-5 sm:px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                            >
                                <ChevronLeft className="w-5 h-5" /> Câu trước
                            </button>

                            <div className="flex items-center gap-3">
                                {currentQuestion < totalQ - 1 && (
                                    <button 
                                        onClick={() => setCurrentQuestion(prev => Math.min(totalQ - 1, prev + 1))}
                                        className={`px-5 sm:px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all text-white shadow-md ${
                                            isPracticeTest 
                                                ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                                                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                                        }`}
                                    >
                                        Câu tiếp <ChevronRight className="w-5 h-5" />
                                    </button>
                                )}

                                {currentQuestion === totalQ - 1 && (
                                    <button 
                                        onClick={() => handleSubmitTest(false)}
                                        disabled={isSubmitting}
                                        className="px-6 sm:px-8 py-3 rounded-xl font-black flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        Nộp Bài Thi
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Bảng danh sách số câu hỏi (Question Palette Grid) (4/12 cột) */}
                    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-5">
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                            {/* Header của Bảng */}
                            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-xl ${isPracticeTest ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                        <LayoutGrid className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base">Danh sách câu hỏi</h3>
                                        <p className="text-xs text-slate-500 font-medium">Bấm vào số để chuyển nhanh</p>
                                    </div>
                                </div>
                                <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                                    {answeredCount}/{totalQ}
                                </span>
                            </div>

                            {/* Tiến độ bài làm */}
                            <div className="mt-4 space-y-2">
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-slate-600">Tiến độ làm bài</span>
                                    <span className="text-slate-900">{progressPercent}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            progressPercent === 100 
                                                ? 'bg-emerald-500' 
                                                : isPracticeTest ? 'bg-amber-500' : 'bg-blue-600'
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Chú giải trạng thái (Legend) */}
                            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs font-medium text-slate-600">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-lg bg-emerald-500 shrink-0 inline-block shadow-xs"></span>
                                    <span>Đã làm ({answeredCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-lg bg-slate-100 border border-slate-300 shrink-0 inline-block"></span>
                                    <span>Chưa làm ({totalQ - answeredCount})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-3.5 h-3.5 rounded-lg ring-2 ring-blue-600 bg-white border border-slate-300 shrink-0 inline-block"></span>
                                    <span>Đang xem</span>
                                </div>
                            </div>

                            {/* Bảng số câu hỏi (Grid) */}
                            <div className="mt-5">
                                <div className="grid grid-cols-5 gap-2 max-h-[380px] overflow-y-auto p-1.5 rounded-2xl bg-slate-50/50 border border-slate-100">
                                    {test.questions.map((_, idx) => {
                                        const isAnswered = answers[idx] !== undefined && answers[idx] !== null;
                                        const isCurrent = currentQuestion === idx;

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentQuestion(idx)}
                                                className={`h-11 rounded-xl text-sm transition-all flex items-center justify-center relative ${
                                                    isCurrent 
                                                        ? 'ring-2 ring-offset-2 ring-blue-600 font-black scale-105 z-10 shadow-md' 
                                                        : 'font-bold'
                                                } ${
                                                    isAnswered 
                                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-500/20' 
                                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}
                                                title={`Câu ${idx + 1}: ${isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}`}
                                            >
                                                {idx + 1}
                                                {/* Dấu chấm nhỏ đánh dấu đã làm */}
                                                {isAnswered && (
                                                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full"></span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Nút nộp bài trực tiếp trong Palette */}
                            <div className="mt-5 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => handleSubmitTest(false)}
                                    disabled={isSubmitting}
                                    className="w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <CheckCircle2 className="w-5 h-5" />
                                    )}
                                    <span>Nộp bài ({answeredCount}/{totalQ})</span>
                                </button>
                                {totalQ - answeredCount > 0 && (
                                    <p className="text-center text-xs text-amber-600 font-medium mt-2">
                                        Còn {totalQ - answeredCount} câu hỏi chưa trả lời
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Modal cảnh báo rời màn hình / chuyển tab */}
            {showTabWarningModal && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border-2 border-red-500 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shadow-inner">
                            <AlertTriangle className="w-8 h-8 animate-bounce" />
                        </div>
                        
                        <span className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-100 text-red-700 border border-red-200">
                            Cảnh báo quy chế thi
                        </span>

                        <h3 className="text-xl font-black text-slate-900 mt-3 mb-2">
                            Bạn vừa rời khỏi màn hình thi!
                        </h3>

                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            Hệ thống phát hiện bạn vừa <strong>chuyển tab hoặc chuyển sang màn hình ứng dụng khác</strong>.
                        </p>

                        <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 mb-5 text-left">
                            <div className="flex justify-between items-center text-sm font-bold text-red-900 mb-1">
                                <span>Số lần phát hiện rời màn hình:</span>
                                <span className="text-sm font-black px-2.5 py-0.5 rounded-lg bg-red-600 text-white">
                                    {tabSwitchCount} lần
                                </span>
                            </div>
                            <p className="text-xs text-red-700 leading-normal mt-1">
                                Vui lòng giữ màn hình bài thi trong suốt thời gian làm bài. Việc chuyển màn hình nhiều lần có thể bị coi là gian lận và ảnh hưởng đến kết quả bài thi.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowTabWarningModal(false)}
                            className="w-full py-3.5 px-6 rounded-xl font-black bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                        >
                            Tôi đã hiểu & Tiếp tục làm bài
                        </button>
                    </div>
                </div>
            )}

            {/* Modal xác nhận rời khỏi bài thi (Thoát hoặc Back) */}
            {showExitConfirmModal && (
                <div className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                            <AlertCircle className="w-8 h-8" />
                        </div>

                        <h3 className="text-xl font-black text-slate-900 mb-2">
                            Rời khỏi màn hình làm bài?
                        </h3>

                        <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                            Tiến trình bài làm hiện tại sẽ không được lưu nếu bạn thoát ra lúc này. Đồng hồ thời gian vẫn sẽ tiếp tục tính.
                        </p>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-6 text-xs text-slate-600 flex justify-between items-center">
                            <span>Tiến độ hiện tại:</span>
                            <span className="font-bold text-slate-900">{answeredCount}/{totalQ} câu ({progressPercent}%)</span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowExitConfirmModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
                            >
                                Ở lại làm bài
                            </button>
                            <button
                                onClick={handleConfirmExit}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition-all cursor-pointer"
                            >
                                Xác nhận rời đi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}