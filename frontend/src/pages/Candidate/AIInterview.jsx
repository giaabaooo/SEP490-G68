import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    X, Sparkles, BrainCircuit, CheckCircle2, Lightbulb, 
    Briefcase, Building2, Target, Mic, MicOff, Send, 
    RefreshCw, ArrowLeft, Award, FileText, ChevronDown, 
    ChevronUp, HelpCircle, Layers, Check, Clock
} from 'lucide-react'; 

const UpgradeModal = ({ isOpen, onClose, title, message }) => {
    const navigate = useNavigate();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500"></div>
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"><X className="w-5 h-5"/></button>
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-500">
                    <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
                <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed">{message}</p>
                <button onClick={() => navigate('/upgrade')} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors cursor-pointer">
                    Nâng cấp gói ngay
                </button>
            </div>
        </div>
    );
};

const ConfirmEndModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 animate-fadeIn">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl transform scale-100 transition-all">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Kết thúc phỏng vấn?</h3>
                <p className="text-gray-500 mb-6 text-sm">Hệ thống sẽ dừng ghi âm và tiến hành đối chiếu câu trả lời với JD để chấm điểm ngay lập tức.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Quay lại</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">Kết thúc ngay</button>
                </div>
            </div>
        </div>
    );
};

// Modal hướng dẫn phương pháp STAR
const StarGuideModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full relative shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <div className="flex items-center gap-2.5 mb-4 text-indigo-600 font-black text-lg">
                    <Lightbulb className="w-6 h-6" /> Phương pháp trả lời STAR
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">Bí quyết trả lời câu hỏi tình huống được các nhà tuyển dụng hàng đầu ưa chuộng:</p>
                
                <div className="space-y-3 text-xs">
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl">
                        <strong className="text-blue-800 text-sm block">S - Situation (Tình huống):</strong>
                        Mô tả ngắn gọn bối cảnh dự án, vấn đề hoặc thách thức bạn từng đối mặt.
                    </div>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                        <strong className="text-emerald-800 text-sm block">T - Task (Nhiệm vụ):</strong>
                        Mục tiêu hoặc trách nhiệm cụ thể của bạn trong tình huống đó là gì.
                    </div>
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                        <strong className="text-amber-800 text-sm block">A - Action (Hành động):</strong>
                        Bạn đã làm gì? Sử dụng công nghệ gì, giải pháp kiến trúc nào để xử lý.
                    </div>
                    <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl">
                        <strong className="text-purple-800 text-sm block">R - Result (Kết quả):</strong>
                        Kết quả đạt được (nếu có số liệu phần trăm, tốc độ tải, số người dùng càng tốt).
                    </div>
                </div>

                <button onClick={onClose} className="w-full mt-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-colors">
                    Đã hiểu, tiếp tục phỏng vấn
                </button>
            </div>
        </div>
    );
};

const HistoryDetailModal = ({ isOpen, onClose, historyItem }) => {
    if (!isOpen || !historyItem) return null;
    const { jobPosition, reportData, messages, createdAt } = historyItem;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 animate-fadeIn p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold">Chi tiết phỏng vấn: {jobPosition}</h2>
                        <p className="text-sm opacity-80">{new Date(createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-800 text-lg border-b pb-2">Báo cáo đánh giá bám sát JD</h3>
                        {reportData ? (
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
                                    <div>
                                        <span className="text-gray-500 font-medium text-xs block">Điểm phỏng vấn:</span>
                                        <span className={`text-3xl font-black ${reportData.score >= 75 ? 'text-emerald-600' : reportData.score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                            {reportData.score}<span className="text-sm text-slate-400 font-normal">/100</span>
                                        </span>
                                    </div>
                                    {reportData.matchRating && (
                                        <div className="border-l border-slate-200 pl-4">
                                            <span className="text-gray-500 font-medium text-xs block">Độ phù hợp JD:</span>
                                            <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 inline-block mt-0.5">
                                                {reportData.matchRating}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-semibold text-blue-900 mb-1 text-sm">Tổng quan đánh giá</h4>
                                    <p className="text-blue-800 text-xs md:text-sm leading-relaxed">{reportData.overview}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                        <h4 className="font-semibold text-green-700 mb-2 text-sm">Điểm mạnh</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                                            {reportData.strengths?.map((s, idx) => <li key={idx}>{s}</li>)}
                                        </ul>
                                    </div>
                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                        <h4 className="font-semibold text-red-700 mb-2 text-sm">Điểm cần cải thiện</h4>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                                            {reportData.weaknesses?.map((w, idx) => <li key={idx}>{w}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <h4 className="font-semibold text-indigo-700 mb-2 text-sm">Lời khuyên cho vòng phỏng vấn thật</h4>
                                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
                                        {reportData.improvements?.map((i, idx) => <li key={idx}>{i}</li>)}
                                    </ul>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Không có dữ liệu báo cáo chi tiết.</p>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-bold text-gray-800 text-lg">Biên bản đối thoại</h3>
                        <div className="space-y-3">
                            {messages?.map((msg, index) => (
                                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-gray-800 shadow-xs rounded-bl-none'}`}>
                                        <span className="text-[10px] font-bold block opacity-70 mb-1 uppercase tracking-wider">
                                            {msg.role === 'user' ? 'Ứng viên' : 'AI Interviewer'}
                                        </span>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AIInterview() {
    const navigate = useNavigate();
    const location = useLocation();
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    
    // Ngữ cảnh phỏng vấn bám sát JD
    const [jobPosition, setJobPosition] = useState(location.state?.jobPosition || location.state?.jobTitle || ""); 
    const [selectedJobId, setSelectedJobId] = useState(location.state?.jobId || location.state?.job?._id || "");
    const [selectedJobData, setSelectedJobData] = useState(location.state?.job || null);
    const [customJd, setCustomJd] = useState("");
    const [jobTab, setJobTab] = useState("real"); // 'real' | 'custom'

    // Hồ sơ ứng viên liên kết (cá nhân hóa)
    const [candidateCv, setCandidateCv] = useState(null);

    // Gợi ý câu trả lời & phương pháp STAR
    const [openHints, setOpenHints] = useState({});
    const [showStarModal, setShowStarModal] = useState(false);

    const [availablePositions, setAvailablePositions] = useState([]); 
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);

    const [isStarted, setIsStarted] = useState(false);
    const [interviewTime, setInterviewTime] = useState(0); // Tính bằng giây
    const [finalInterviewTime, setFinalInterviewTime] = useState(0);
    const [reportData, setReportData] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); 
    const [usageInfo, setUsageInfo] = useState(null);

    // Đồng hồ đếm thời gian phỏng vấn trực tiếp
    useEffect(() => {
        let timer;
        if (isStarted && !analyzing && !reportData) {
            timer = setInterval(() => {
                setInterviewTime(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isStarted, analyzing, reportData]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const isListening = useRef(false); 
    const [isListeningState, setIsListeningState] = useState(false);
    const recognitionRef = useRef(null); 
    const audioRef = useRef(new Audio());
    const aiVideoRef = useRef(null);
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);
    const chatContainerRef = useRef(null);

    const VIDEO_AVATAR_URL = "/video/ai-interviewer.mp4"; 
    const FALLBACK_IMAGE = "https://img.freepik.com/free-photo/view-robot-working-laptop_23-2150880153.jpg";

    useEffect(() => {
        if (location.state?.jobPosition || location.state?.jobTitle) {
            setJobPosition(location.state.jobPosition || location.state.jobTitle);
        }
        if (location.state?.jobId || location.state?.job?._id) {
            setSelectedJobId(location.state.jobId || location.state.job?._id);
        }
        if (location.state?.job) {
            setSelectedJobData(location.state.job);
        }
    }, [location.state]);

    useEffect(() => {
        fetchAvailablePositions(); 
        fetchHistoryData(); 
        fetchUsageData();
        fetchCandidateCV();
        return () => { stopWebcam(); };
    }, []);

    const fetchAvailablePositions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setAvailablePositions(data);
                // Nếu chưa chọn job và có danh sách việc làm thực tế, tự động chọn job đầu tiên
                if (!jobPosition && data.length > 0) {
                    setJobPosition(data[0].jobPosition);
                    setSelectedJobId(data[0]._id || data[0].id);
                    setSelectedJobData(data[0]);
                }
            }
        } catch (error) { console.error("Lỗi lấy template:", error); }
    };

    const fetchHistoryData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/history`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setInterviewHistory(await res.json());
        } catch (error) { console.error("Lỗi lấy lịch sử:", error); }
    };

    const fetchUsageData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/payment/my-usage`, { headers: { 'Authorization': `Bearer ${token}` } });
            if(res.ok) setUsageInfo(await res.json());
        } catch(e){}
    };

    const fetchCandidateCV = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/cv/my-cvs`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) {
                const cvs = await res.json();
                if (Array.isArray(cvs) && cvs.length > 0) {
                    setCandidateCv(cvs[0]);
                }
            }
        } catch (e) {}
    };

    const isPro = usageInfo?.subscription?.plan === 'pro';
    const limitMinutes = isPro ? 180 : 15;
    const usedMinutes = usageInfo?.subscription?.usage?.mockInterviewMinutes || 0;
    const remainMinutes = Math.max(0, limitMinutes - usedMinutes);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, loading]);

    const toggleHint = (idx) => {
        setOpenHints(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        } catch (err) { 
            toast.error("Không thể truy cập Camera và Micro. Vui lòng cấp quyền trên trình duyệt để buổi phỏng vấn chân thực nhất!"); 
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleSelectRealJob = (job) => {
        setJobPosition(job.jobPosition);
        setSelectedJobId(job._id || job.id);
        setSelectedJobData(job);
    };

    const startInterview = async () => {
        if (!jobPosition.trim()) return toast.warning("Vui lòng chọn hoặc nhập vị trí ứng tuyển!");
        if (remainMinutes <= 0) return setShowUpgradeModal(true); 

        setInterviewTime(0);
        setFinalInterviewTime(0);
        setIsStarted(true);
        setLoading(true);
        startWebcam(); 

        try {
            const token = localStorage.getItem('token');
            const payload = {
                history: [],
                jobPosition: jobPosition.trim(),
                jobId: selectedJobId || null,
                customJd: customJd.trim() || null
            };

            const res = await fetch(`${API_URL}/api/interview/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (!res.ok) {
                if(res.status === 403) { setShowUpgradeModal(true); setIsStarted(false); stopWebcam(); return; }
                throw new Error("Lỗi kết nối máy chủ AI");
            }
            
            const fullText = data.fullText || data.nextQuestion;
            setMessages([{ 
                role: 'model', 
                content: fullText,
                feedback: data.feedback || '',
                nextQuestion: data.nextQuestion || fullText,
                hint: data.hint || ''
            }]);

            if (data.audioData) playAIVoice(data.audioData);
            fetchUsageData(); 
        } catch (err) { 
            toast.error("Không thể kết nối với AI. Hãy thử lại!"); 
            setIsStarted(false); 
            stopWebcam(); 
        } finally { 
            setLoading(false); 
        }
    };

    const endInterview = async () => {
        stopWebcam();
        if (recognitionRef.current) recognitionRef.current.stop();
        audioRef.current.pause();
        setShowConfirmModal(false);
        setFinalInterviewTime(interviewTime);
        
        setAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/evaluate-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    history: messages, 
                    jobPosition,
                    jobId: selectedJobId || null,
                    customJd: customJd || null
                })
            });

            if (!res.ok) throw new Error("Lỗi Server đánh giá");
            const result = await res.json();
            
            setReportData({
                score: result.score || 0,
                matchRating: result.matchRating || "Chưa có đánh giá phù hợp",
                overview: result.overview || "Chưa có đánh giá chi tiết.",
                strengths: Array.isArray(result.strengths) ? result.strengths : [],
                weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
                improvements: Array.isArray(result.improvements) ? result.improvements : []
            });

            fetchHistoryData();
        } catch (e) { 
            toast.error("Hệ thống AI đang bận, vui lòng thử lại sau."); 
        } finally { 
            setAnalyzing(false); 
            setIsStarted(false); 
        }
    };

    const playAIVoice = (base64) => {
        if (!base64) return;
        audioRef.current.src = `data:audio/mp3;base64,${base64}`;
        audioRef.current.play().catch(e => console.log(e));
        
        if (aiVideoRef.current) {
            aiVideoRef.current.currentTime = 0;
            aiVideoRef.current.play().catch(e => console.log(e));
        }
        
        audioRef.current.onended = () => { 
            if (aiVideoRef.current) aiVideoRef.current.pause(); 
        };
    };

    const handleSend = async (manualInput) => {
        const text = manualInput || input;
        if (!text.trim()) return;
        
        const newHistory = [...messages, { role: 'user', content: text.trim() }];
        setMessages(newHistory);
        setInput("");
        setLoading(true); 

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ 
                    history: newHistory, 
                    jobPosition,
                    jobId: selectedJobId || null,
                    customJd: customJd || null
                })
            });
            const data = await res.json();
            
            if (!res.ok) {
                if(res.status === 403) { setShowUpgradeModal(true); return; }
                throw new Error("Lỗi Server");
            }

            const fullContent = data.fullText || data.nextQuestion || "Cảm ơn bạn đã tham gia buổi phỏng vấn.";
            
            setMessages([...newHistory, { 
                role: 'model', 
                content: fullContent,
                feedback: data.feedback || '',
                nextQuestion: data.nextQuestion || fullContent,
                hint: data.hint || ''
            }]);
            
            if (data.audioData) playAIVoice(data.audioData);
            if (data.isFinished) toast.success("🎉 Bạn đã hoàn thành các câu hỏi của buổi phỏng vấn! Hãy bấm Kết thúc để xem báo cáo.");

            fetchUsageData();
        } catch (err) { 
            toast.error("Lỗi gửi tin nhắn tới máy chủ."); 
        } finally { 
            setLoading(false); 
        }
    };

    const handleVoiceInput = () => {
        if (isListening.current) { 
            recognitionRef.current?.stop(); 
            return; 
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Trình duyệt không hỗ trợ nhận dạng giọng nói");
        
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = () => {
            isListening.current = true;
            setIsListeningState(true);
        };
        recognition.onend = () => {
            isListening.current = false;
            setIsListeningState(false);
        };
        
        let silenceTimer;
        recognition.onresult = (e) => {
            let finalTranscript = '';
            for (let i = e.resultIndex; i < e.results.length; ++i) {
                if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
                else setInput(e.results[i][0].transcript); 
            }
            if (finalTranscript) {
                setInput(finalTranscript);
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                    handleSend(finalTranscript);
                    recognition.stop();
                }, 2000); 
            }
        };
        recognition.start();
    };

    if (analyzing) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans px-4">
                <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6 shadow-md"></div>
                <h2 className="text-2xl font-black text-slate-900 animate-pulse">AI đang phân tích & đối chiếu với JD...</h2>
                <p className="text-slate-500 mt-2 text-sm max-w-md text-center">
                    Đang đánh giá câu trả lời của bạn theo từng yêu cầu kỹ thuật, tính ứng dụng thực tế và kỹ năng giải quyết vấn đề.
                </p>
            </div>
        );
    }

    if (reportData) {
        return (
            <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn border border-slate-200">
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 p-8 text-white text-center relative">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <Award className="w-4 h-4" /> Báo cáo đánh giá Phỏng vấn AI
                        </span>
                        <h2 className="text-3xl font-black mb-1">Kết quả Phỏng vấn</h2>
                        <p className="opacity-90 text-base font-medium">Vị trí: {jobPosition}</p>
                    </div>
                    
                    <div className="p-6 md:p-8 space-y-6">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 -mt-14 relative z-10">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                                <div className="w-28 h-28 rounded-3xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center border-2 border-blue-200 shrink-0 shadow-sm">
                                    <span className="text-4xl font-black">{reportData.score}</span>
                                    <span className="text-[10px] text-blue-400 font-bold uppercase">Thang điểm 100</span>
                                </div>
                                <div className="text-center md:text-left flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start">
                                        <h3 className="font-bold text-slate-900 text-xl">Đánh giá chung</h3>
                                        {reportData.matchRating && (
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                                                {reportData.matchRating}
                                            </span>
                                        )}
                                        <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-indigo-600" /> Thời gian: {formatTime(finalInterviewTime || interviewTime)}
                                        </span>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed">{reportData.overview}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200">
                                    <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-1.5">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Điểm mạnh nổi bật
                                    </h4>
                                    <ul className="text-xs space-y-2 text-slate-700">
                                        {reportData.strengths?.length > 0 ? reportData.strengths.map((s, i) => <li key={i}>• {s}</li>) : <li>Chưa ghi nhận điểm mạnh.</li>}
                                    </ul>
                                </div>
                                <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200">
                                    <h4 className="text-sm font-bold text-rose-800 mb-3 flex items-center gap-1.5">
                                        <Target className="w-4 h-4 text-rose-600" /> Điểm cần khắc phục so với JD
                                    </h4>
                                    <ul className="text-xs space-y-2 text-slate-700">
                                        {reportData.weaknesses?.length > 0 ? reportData.weaknesses.map((w, i) => <li key={i}>• {w}</li>) : <li>Chưa ghi nhận điểm yếu.</li>}
                                    </ul>
                                </div>
                            </div>

                            {reportData.improvements?.length > 0 && (
                                <div className="mt-4 bg-indigo-50/60 p-5 rounded-2xl border border-indigo-100">
                                    <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-1.5">
                                        <Lightbulb className="w-4 h-4 text-indigo-600" /> Lời khuyên cho buổi phỏng vấn thực tế
                                    </h4>
                                    <ul className="text-xs space-y-2 text-slate-700">
                                        {reportData.improvements.map((imp, idx) => <li key={idx}>• {imp}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>

                        {/* Biên bản câu hỏi & câu trả lời */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-base">
                                <FileText className="w-4 h-4 text-blue-600" /> Lịch sử đối thoại
                            </h3>
                            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 max-h-96 overflow-y-auto custom-scrollbar">
                                {messages?.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-xs ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-200'}`}>
                                            <span className="font-bold text-[10px] opacity-70 block mb-1.5 uppercase tracking-wider">
                                                {msg.role === 'user' ? 'Bạn' : 'AI Interviewer'}
                                            </span>
                                            <p className="whitespace-pre-wrap">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 text-center flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/home')} className="px-8 py-3 rounded-xl font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-all text-sm">
                                Về trang chủ
                            </button>
                            <button onClick={() => { setReportData(null); setMessages([]); }} className="px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 text-sm">
                                <RefreshCw className="w-4 h-4" /> Phỏng vấn lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen pt-20 pb-12 px-4 font-sans">
            <UpgradeModal 
                isOpen={showUpgradeModal} 
                onClose={() => setShowUpgradeModal(false)} 
                title="Đã hết thời gian mô phỏng" 
                message={`Tài khoản ${isPro ? 'Pro' : 'miễn phí'} của bạn đã sử dụng hết ${limitMinutes} phút mô phỏng phỏng vấn bằng giọng nói của tháng này. Hãy nâng cấp tài khoản Pro để nhận 180 phút luyện tập chuyên sâu không giới hạn!`} 
            />
            <ConfirmEndModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={endInterview} />
            <HistoryDetailModal isOpen={!!selectedHistory} onClose={() => setSelectedHistory(null)} historyItem={selectedHistory} />
            <StarGuideModal isOpen={showStarModal} onClose={() => setShowStarModal(false)} />

            {!isStarted ? (
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start animate-fadeIn">
                    
                    {/* CỘT TRÁI: LỊCH SỬ PHỎNG VẤN */}
                    <div className="w-full lg:w-5/12 bg-white border border-slate-200 rounded-3xl p-6 h-[72vh] flex flex-col shadow-sm">
                        <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" /> Lịch sử luyện phỏng vấn
                            </h2>
                            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                                {interviewHistory.length} bài
                            </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                            {interviewHistory.length > 0 ? (
                                interviewHistory.map((item) => (
                                    <div key={item._id} onClick={() => setSelectedHistory(item)} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 hover:bg-white hover:shadow-md hover:border-blue-300 cursor-pointer transition-all flex justify-between items-center group">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">{item.jobPosition}</h3>
                                            <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                                                <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span className="font-medium text-indigo-600">{item.questionCount || 0} câu hỏi</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center ml-3 pl-3 border-l border-slate-200">
                                            <span className={`text-xl font-black ${item.reportData?.score >= 75 ? 'text-emerald-600' : 'text-blue-600'}`}>{item.reportData?.score || 0}</span>
                                            <span className="text-[9px] uppercase text-slate-400 font-bold">/100</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-70">
                                    <BrainCircuit className="w-12 h-12 mb-3 text-slate-300" />
                                    <p className="text-sm font-medium">Chưa có lịch sử phỏng vấn nào.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CỘT PHẢI: THIẾT LẬP PHÒNG PHỎNG VẤN BÁM SÁT JD */}
                    <div className="w-full lg:w-7/12 bg-white rounded-3xl shadow-xl border border-slate-200/90 p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500"></div>
                        
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-2xl font-black text-slate-900">Phòng Phỏng Vấn AI 1:1</h1>
                            {usageInfo && (
                                <div className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                    Còn {remainMinutes}/{limitMinutes} phút
                                </div>
                            )}
                        </div>
                        <p className="text-slate-500 mb-6 text-xs md:text-sm">
                            Trợ lý AI đóng vai trò là Trưởng bộ phận tuyển dụng, hỏi - đáp 2 chiều, phản hồi câu trả lời và đào sâu bám sát JD thực tế.
                        </p>

                        {/* Banner thông tin cá nhân hóa từ CV */}
                        {candidateCv && (
                            <div className="mb-6 p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between shadow-2xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                        <Check className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">Hồ sơ đã liên kết</p>
                                        <p className="text-xs font-bold text-emerald-950">
                                            {candidateCv.data?.personal?.fullName || 'Ứng viên'} ({candidateCv.title || 'CV Cá nhân'})
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                                    Cá nhân hóa theo CV
                                </span>
                            </div>
                        )}

                        {/* TABS CHỌN CÔNG VIỆC: Việc làm thực tế vs Vị trí tự do */}
                        <div className="flex gap-2 mb-5 p-1 bg-slate-100 rounded-2xl w-fit">
                            <button
                                type="button"
                                onClick={() => setJobTab('real')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${jobTab === 'real' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Việc làm thực tế trên hệ thống
                            </button>
                            <button
                                type="button"
                                onClick={() => setJobTab('custom')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${jobTab === 'custom' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                            >
                                Vị trí tùy chỉnh / Paste JD
                            </button>
                        </div>

                        {jobTab === 'real' ? (
                            <div className="space-y-4 mb-6">
                                <label className="block text-xs font-bold text-slate-700 uppercase">
                                    Chọn công việc tuyển dụng để phỏng vấn bám sát JD:
                                </label>
                                
                                <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {availablePositions.map((job) => {
                                        const isSelected = selectedJobId === (job._id || job.id) || jobPosition === job.jobPosition;
                                        return (
                                            <div 
                                                key={job._id || job.id} 
                                                onClick={() => handleSelectRealJob(job)}
                                                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                                                    isSelected 
                                                        ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500' 
                                                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100/70 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex-1 pr-3">
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-bold text-slate-900 text-sm">{job.jobPosition}</h4>
                                                        {isSelected && <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Đang chọn</span>}
                                                    </div>
                                                    <p className="text-xs text-slate-500 mt-0.5 font-medium">{job.company} • {job.location || 'Hà Nội'}</p>
                                                    {Array.isArray(job.tags) && job.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {job.tags.slice(0, 3).map((t, idx) => (
                                                                <span key={idx} className="text-[10px] font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                                                                    {t}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Vị trí ứng tuyển mục tiêu:
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm shadow-2xs" 
                                        placeholder="Ví dụ: Senior React Native Developer, AI Engineer..." 
                                        value={jobPosition} 
                                        onChange={(e) => { setJobPosition(e.target.value); setSelectedJobId(null); }} 
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Mô tả công việc (JD) hoặc yêu cầu bổ sung (Tùy chọn):
                                    </label>
                                    <textarea 
                                        rows={3}
                                        className="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs text-slate-700 shadow-2xs placeholder:text-slate-400" 
                                        placeholder="Dán nội dung JD hoặc các công nghệ trọng tâm (VD: Yêu cầu 3 năm React, tối ưu Redux, am hiểu Micro-frontend...)" 
                                        value={customJd} 
                                        onChange={(e) => setCustomJd(e.target.value)} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Nút xem bí quyết STAR */}
                        <div className="mb-6 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                <BrainCircuit className="w-4 h-4 text-indigo-500" /> Phỏng vấn hỏi đáp linh hoạt theo JD
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowStarModal(true)}
                                className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
                            >
                                <Lightbulb className="w-3.5 h-3.5" /> Bí quyết trả lời STAR
                            </button>
                        </div>

                        <button 
                            onClick={startInterview} 
                            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <BrainCircuit className="w-5 h-5" /> Bắt đầu phỏng vấn bám sát JD
                        </button>
                    </div>
                </div>
            ) : (
                /* PHÒNG PHỎNG VẤN ĐANG DIỄN RA */
                <div className="max-w-7xl mx-auto h-[86vh] flex flex-col lg:flex-row gap-6">
                    {/* VIDEO & CAMERA AVATAR */}
                    <div className="lg:w-2/3 relative h-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group flex flex-col justify-between">
                        
                        {/* Header phòng phỏng vấn */}
                        <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 text-white">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                <span className="text-xs font-black uppercase tracking-wider truncate max-w-xs md:max-w-md">
                                    Vị trí: {jobPosition} {selectedJobData?.company ? `(${selectedJobData.company})` : ''}
                                </span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                {/* Đồng hồ thời gian phỏng vấn trực tiếp */}
                                <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider text-emerald-400 border border-white/10 shadow-inner">
                                    <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                                    <span>{formatTime(interviewTime)}</span>
                                </div>
                                <button 
                                    onClick={() => setShowStarModal(true)}
                                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 px-3 py-1 rounded-xl border border-amber-400/30 flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Lightbulb className="w-3.5 h-3.5" /> Mẹo STAR
                                </button>
                            </div>
                        </div>

                        {/* Video Avatar */}
                        <video 
                            ref={aiVideoRef} 
                            src={VIDEO_AVATAR_URL} 
                            className="w-full h-full object-cover" 
                            loop 
                            muted 
                            playsInline 
                            poster={FALLBACK_IMAGE} 
                        />

                        {loading && (
                            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/75 text-white px-5 py-2.5 rounded-full flex items-center gap-2.5 animate-fadeIn z-30 border border-white/10 shadow-xl">
                                <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold">AI đang lắng nghe và suy nghĩ câu hỏi tiếp nối...</span>
                            </div>
                        )}

                        {/* Camera ứng viên góc phải */}
                        <div className="absolute bottom-4 right-4 w-44 h-32 md:w-52 md:h-36 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            <div className="absolute bottom-1.5 left-2 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded-md">
                                Bạn
                            </div>
                        </div>

                        {/* Thanh điều khiển Micro & Kết thúc */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                            <button 
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-xl cursor-pointer ${
                                    isListeningState 
                                        ? 'bg-rose-500 border-rose-300 animate-pulse text-white scale-105' 
                                        : 'bg-slate-800/90 text-white border-white/20 hover:bg-slate-700'
                                }`} 
                                onClick={handleVoiceInput}
                                title={isListeningState ? 'Đang lắng nghe (Bấm để dừng)' : 'Bật Micro trả lời bằng giọng nói'}
                            >
                                {isListeningState ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </button>
                            <button 
                                onClick={() => setShowConfirmModal(true)} 
                                className="px-6 h-12 rounded-full bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-xl flex items-center gap-2 transition-transform hover:scale-105 text-sm cursor-pointer"
                            >
                                <X className="w-4 h-4" /> Kết thúc phỏng vấn
                            </button>
                        </div>
                    </div>

                    {/* KHUNG ĐỐI THOẠI & GỢI Ý HỖ TRỢ */}
                    <div className="lg:w-1/3 bg-white rounded-3xl shadow-xl flex flex-col overflow-hidden border border-slate-200 h-full">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <BrainCircuit className="w-4 h-4 text-blue-600" />
                                <h3 className="font-bold text-slate-800 text-sm">Hội thoại tương tác</h3>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold font-mono text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                                <span>Thời gian: {formatTime(interviewTime)}</span>
                            </div>
                        </div>

                        {/* Danh sách tin nhắn */}
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[92%] p-4 rounded-2xl text-sm leading-relaxed shadow-2xs animate-fadeIn ${
                                        msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-tr-none' 
                                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-none shadow-xs'
                                    }`}>
                                        {msg.role === 'user' ? (
                                            <div>
                                                <span className="font-bold text-[10px] text-blue-200 block mb-1 uppercase tracking-wider">Ứng viên</span>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-slate-100">
                                                    <span className="font-black text-[11px] text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3 text-indigo-500" /> AI Interviewer
                                                    </span>
                                                    {msg.hint && (
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleHint(idx)}
                                                            className="text-[10px] font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 transition-colors cursor-pointer"
                                                        >
                                                            <Lightbulb className="w-3 h-3" /> {openHints[idx] ? 'Ẩn gợi ý' : 'Xem gợi ý'}
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Nhận xét phản hồi trực tiếp câu trả lời của ứng viên */}
                                                {msg.feedback && (
                                                    <div className="mb-2.5 p-2.5 bg-slate-50 border-l-2 border-indigo-500 rounded-r-xl text-xs text-slate-700 leading-relaxed font-medium">
                                                        <span className="font-bold text-indigo-700 block mb-0.5">Nhận xét tương tác:</span>
                                                        {msg.feedback}
                                                    </div>
                                                )}

                                                {/* Câu hỏi tiếp nối chuyên sâu bám sát JD */}
                                                <div className="font-semibold text-slate-900 leading-relaxed text-xs md:text-sm">
                                                    {msg.nextQuestion || msg.content}
                                                </div>

                                                {/* Gợi ý định hướng trả lời */}
                                                {msg.hint && openHints[idx] && (
                                                    <div className="mt-2.5 p-2.5 bg-amber-50/90 rounded-xl border border-amber-200/80 text-xs text-amber-950 leading-relaxed font-medium animate-fadeIn">
                                                        <strong className="text-amber-800 block mb-0.5">💡 Gợi ý trả lời:</strong>
                                                        {msg.hint}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Thanh nhập câu trả lời */}
                        <div className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
                            <input 
                                type="text" 
                                className="flex-1 border border-slate-200 rounded-full px-4 py-2.5 text-xs md:text-sm outline-none focus:border-blue-500 bg-slate-50 font-medium"
                                placeholder="Nhập câu trả lời hoặc bấm Mic để nói..." 
                                value={input}
                                onChange={(e) => setInput(e.target.value)} 
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                                disabled={loading}
                            />
                            <button 
                                onClick={() => handleSend()} 
                                disabled={loading || !input.trim()} 
                                className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}