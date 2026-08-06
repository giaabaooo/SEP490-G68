import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle, Clock, Map, Target, Calendar, Sparkles, BookOpen, Loader2, PlayCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TestResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const { app } = location.state || {};

    const [activeTab, setActiveTab] = useState('RESULT'); // 'RESULT' | 'ROADMAP'
    const [roadmap, setRoadmap] = useState(null);
    const [isFetchingRoadmap, setIsFetchingRoadmap] = useState(false);
    
    // States cho Roadmap Modal
    const [showRoadmapModal, setShowRoadmapModal] = useState(false);
    const [timeframe, setTimeframe] = useState('2 Tuần');
    const [goal, setGoal] = useState('Vượt qua phỏng vấn');
    const [isGenerating, setIsGenerating] = useState(false);

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!app) navigate('/candidate/test-history');
    }, [app, navigate]);

    // Lấy thông tin Roadmap từ DB nếu tab Roadmap được bật
    useEffect(() => {
        if (activeTab === 'ROADMAP' && !roadmap && app) {
            const fetchRoadmap = async () => {
                setIsFetchingRoadmap(true);
                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE}/api/roadmaps/${app._id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data && data.content) {
                        setRoadmap(data);
                    }
                } catch (error) {
                    console.error("Lỗi lấy roadmap:", error);
                } finally {
                    setIsFetchingRoadmap(false);
                }
            };
            fetchRoadmap();
        }
    }, [activeTab, app, API_BASE, roadmap]);

    if (!app) return null;

    const isPractice = app.isPractice;
    const test = app.assessmentId;
    const answers = app.testAnswers || {};
    const testTitle = test?.assessmentName || test?.topicName || 'Bài kiểm tra';

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    // Hàm gọi AI Generate Roadmap
    const handleGenerateRoadmap = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            
            // Trích xuất các skill bị trả lời sai để đưa vào prompt AI
            const weakSkills = [];
            test?.questions?.forEach((q, idx) => {
                if (answers[idx.toString()] !== q.correctAnswer) {
                    if (q.skill && !weakSkills.includes(q.skill)) {
                        weakSkills.push(q.skill);
                    }
                }
            });
            if (weakSkills.length === 0) weakSkills.push('Nâng cao kiến thức chuyên sâu');

            const payload = {
                sourceId: app._id,
                testType: isPractice ? 'PRACTICE' : 'JOB',
                timeframe: timeframe,
                goal: goal,
                testResult: {
                    topic: testTitle,
                    score: app.testScore,
                    totalQuestions: test?.questions?.length || 0,
                    weakSkills: weakSkills,
                    jd: app.jobId?.description || '' // Fallback nếu có
                }
            };

            const res = await fetch(`${API_BASE}/api/roadmaps/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Lỗi khi tạo Roadmap");
            const data = await res.json();
            
            setRoadmap(data);
            setShowRoadmapModal(false);
            toast.success("AI đã tạo lộ trình thành công!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            {/* Header Theme Tùy chỉnh (Test Job = Indigo, Practice = Amber) */}
            <div className={`${isPractice ? 'bg-amber-700' : 'bg-indigo-900'} pt-8 pb-24 px-4 transition-colors relative`}>
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate(-1)} className="flex items-center text-white/70 hover:text-white font-medium text-sm mb-6 transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại lịch sử
                    </button>
                    
                    <div className="text-center text-white">
                        <h1 className="text-3xl font-black mb-2">{testTitle}</h1>
                        <p className="text-white/80 font-medium">{app.jobId?.title}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-14 space-y-6 relative z-10">
                
                {/* TABS CONTROLLER */}
                <div className="flex justify-center mb-2">
                    <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex gap-2 border border-white/20 shadow-lg">
                        <button 
                            onClick={() => setActiveTab('RESULT')} 
                            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'RESULT' ? 'bg-white text-slate-800 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            <CheckCircle2 className="w-4 h-4" /> Chi tiết Điểm số
                        </button>
                        <button 
                            onClick={() => setActiveTab('ROADMAP')} 
                            className={`px-8 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${activeTab === 'ROADMAP' ? 'bg-white text-indigo-600 shadow-md' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        >
                            <Map className="w-4 h-4" /> Lộ trình học (AI)
                        </button>
                    </div>
                </div>

                {/* GIAO DIỆN TAB RESULT (CHI TIẾT ĐIỂM) */}
                {activeTab === 'RESULT' && (
                    <div className="animate-fade-in space-y-6">
                        {/* Score Card */}
                        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-around gap-8">
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">ĐIỂM SỐ ĐẠT ĐƯỢC</p>
                                <p className={`text-6xl font-black ${app.testScore >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>{app.testScore}<span className="text-2xl text-slate-300">/100</span></p>
                            </div>
                            <div className="hidden md:block w-px h-20 bg-slate-100"></div>
                            <div className="flex gap-12 text-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">THỜI GIAN LÀM</p>
                                    <p className="text-2xl font-black text-slate-800 flex items-center justify-center gap-2"><Clock className={`w-5 h-5 ${isPractice ? 'text-amber-500' : 'text-indigo-500'}`} /> {formatDuration(app.testDuration)}</p>
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
                                    const questionText = q.question || q.questionText;

                                    return (
                                        <div key={idx} className={`border-l-4 rounded-2xl p-6 bg-slate-50 border border-slate-200 ${isCorrect ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <h4 className="text-base font-bold text-slate-800 pr-4">Câu {idx + 1}: {questionText}</h4>
                                                <span className={`shrink-0 px-3 py-1 text-xs font-black uppercase rounded-lg border ${isCorrect ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                                                    {isCorrect ? 'Đúng' : 'Sai'}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                {q.options.map((opt, optIdx) => {
                                                    const isUserChoice = optIdx === userAnswer;
                                                    const isCorrectChoice = optIdx === q.correctAnswer;
                                                    let style = "bg-white border-slate-200 text-slate-600";
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
                )}

                {/* GIAO DIỆN TAB ROADMAP (AI GENERATED) */}
                {activeTab === 'ROADMAP' && (
                    <div className="animate-fade-in space-y-6">
                        {isFetchingRoadmap ? (
                            <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                                <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
                                <p className="text-slate-500 font-bold">Đang tải dữ liệu lộ trình...</p>
                            </div>
                        ) : !roadmap ? (
                            <div className="bg-white rounded-3xl p-16 shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                                    <Sparkles className="w-10 h-10 text-indigo-500" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-4">Lộ trình chưa được khởi tạo</h3>
                                <p className="text-slate-500 font-medium mb-8 max-w-md">Dựa trên kết quả bài làm (những phần làm sai), AI của hệ thống sẽ thiết kế riêng cho bạn một lộ trình cải thiện năng lực cá nhân hóa.</p>
                                <button 
                                    onClick={() => setShowRoadmapModal(true)}
                                    className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                                >
                                    Bắt đầu tạo AI Roadmap <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* HEADER ROADMAP */}
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-3xl p-8 shadow-lg border border-slate-800 text-white">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                        <div>
                                            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                                                <Sparkles className="w-6 h-6 text-yellow-400" /> AI Personal Roadmap
                                            </h2>
                                            <p className="text-indigo-200">{roadmap.content.overview}</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                                <p className="text-xs text-indigo-200 uppercase font-bold mb-1">THỜI GIAN</p>
                                                <p className="font-black flex items-center gap-1.5"><Calendar className="w-4 h-4 text-yellow-400" /> {roadmap.timeframe}</p>
                                            </div>
                                            <div className="bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                                                <p className="text-xs text-indigo-200 uppercase font-bold mb-1">MỤC TIÊU</p>
                                                <p className="font-black flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-400" /> {roadmap.goal}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* WEEKS / PHASES */}
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                        <Map className="w-6 h-6 text-indigo-500" /> Các Giai Đoạn Học Tập
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {roadmap.content.weeks?.map((w, idx) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
                                                <h4 className="text-indigo-600 font-black text-sm uppercase tracking-widest mb-2">{w.week}</h4>
                                                <h5 className="text-lg font-bold text-slate-800 mb-4 line-clamp-2">{w.focus}</h5>
                                                <ul className="space-y-2">
                                                    {w.tasks?.map((task, taskIdx) => (
                                                        <li key={taskIdx} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                                                            <span className="leading-relaxed">{task}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* COURSES */}
                                {roadmap.content.suggestedCourses?.length > 0 && (
                                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                            <BookOpen className="w-6 h-6 text-emerald-500" /> Đề xuất Khóa Học
                                        </h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {roadmap.content.suggestedCourses.map((course, idx) => (
                                                <div key={idx} className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col h-full bg-white">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-emerald-100">{course.platform}</span>
                                                        {course.isFree && <span className="text-xs font-bold text-slate-400">FREE</span>}
                                                    </div>
                                                    <h4 className="font-bold text-slate-900 mb-2 leading-snug line-clamp-2">{course.title}</h4>
                                                    <p className="text-xs font-medium text-slate-500 mb-5 flex-1 line-clamp-3 leading-relaxed">{course.reason}</p>
                                                    
                                                    <a href={course.link} target="_blank" rel="noreferrer" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                                        Truy cập ngay <PlayCircle className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL NHẬP CẤU HÌNH ROADMAP */}
            {showRoadmapModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[32px] w-full max-w-[450px] shadow-2xl overflow-hidden animate-scale-in">
                        <div className="bg-indigo-600 px-6 py-5 flex justify-between items-center text-white">
                            <div>
                                <h3 className="text-lg font-black flex items-center gap-2"><Sparkles className="w-5 h-5 text-yellow-300" /> AI Roadmap Builder</h3>
                                <p className="text-indigo-200 text-xs font-medium mt-1">Cá nhân hóa lộ trình của bạn</p>
                            </div>
                            <button onClick={() => setShowRoadmapModal(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Thời gian của Lộ Trình</label>
                                <select 
                                    value={timeframe} 
                                    onChange={e => setTimeframe(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-800 bg-slate-50 cursor-pointer"
                                >
                                    <option value="1 Tuần">1 Tuần (Cấp tốc)</option>
                                    <option value="2 Tuần">2 Tuần (Tiêu chuẩn)</option>
                                    <option value="3 Tuần">3 Tuần</option>
                                    <option value="1 Tháng">1 Tháng</option>
                                    <option value="2 Tháng">2 Tháng (Dài hạn)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Mục tiêu cốt lõi</label>
                                <select 
                                    value={goal} 
                                    onChange={e => setGoal(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 font-bold text-slate-800 bg-slate-50 cursor-pointer"
                                >
                                    <option value="Vượt qua phỏng vấn kỹ thuật">Vượt qua phỏng vấn kỹ thuật</option>
                                    <option value="Nâng cao năng lực làm việc thực tế">Nâng cao năng lực làm việc thực tế</option>
                                    <option value="Bổ sung các kiến thức nền tảng bị thiếu">Bổ sung kiến thức nền tảng bị thiếu</option>
                                </select>
                            </div>
                        </div>

                        <div className="p-6 pt-2 border-t border-slate-100 flex gap-3">
                            <button onClick={() => setShowRoadmapModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Hủy bỏ</button>
                            <button 
                                onClick={handleGenerateRoadmap}
                                disabled={isGenerating}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Đang tạo...</> : 'Bắt đầu tạo'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}