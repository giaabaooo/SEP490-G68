import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { X, Sparkles } from 'lucide-react'; 

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
                <p className="text-gray-500 mb-6 text-sm">Hệ thống sẽ dừng ghi âm và tiến hành chấm điểm bài phỏng vấn của bạn ngay lập tức.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">Quay lại</button>
                    <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors">Kết thúc ngay</button>
                </div>
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
                        <span className="material-symbols-outlined text-3xl">close</span>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                    {reportData && (
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-700 text-2xl font-black flex items-center justify-center border-4 border-blue-100 shrink-0">
                                    {reportData.score}<span className="text-[10px] text-blue-400 mt-2">/100</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">Đánh giá chung</h3>
                                    <p className="text-gray-600 text-sm">{reportData.overview}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <h4 className="text-sm font-bold text-green-700 mb-2">Điểm mạnh</h4>
                                    <ul className="text-xs space-y-1.5 text-gray-700">
                                        {reportData.strengths?.length > 0 ? reportData.strengths.map((s, i) => <li key={i}>• {s}</li>) : <li>Chưa ghi nhận điểm mạnh.</li>}
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <h4 className="text-sm font-bold text-red-600 mb-2">Cần cải thiện</h4>
                                    <ul className="text-xs space-y-1.5 text-gray-700">
                                        {reportData.weaknesses?.length > 0 ? reportData.weaknesses.map((w, i) => <li key={i}>• {w}</li>) : <li>Chưa ghi nhận điểm yếu.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined">forum</span> Lịch sử hội thoại
                        </h3>
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200">
                            {messages?.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'}`}>
                                        <span className="font-bold text-xs opacity-70 block mb-1">
                                            {msg.role === 'user' ? 'Bạn' : 'AI Interviewer'}
                                        </span>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {(!messages || messages.length === 0) && <p className="text-center text-gray-400 text-sm">Không có dữ liệu hội thoại.</p>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function AIInterview() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [jobPosition, setJobPosition] = useState(""); 
    
    const [availablePositions, setAvailablePositions] = useState([]); 
    const [interviewHistory, setInterviewHistory] = useState([]);
    const [selectedHistory, setSelectedHistory] = useState(null);

    const [isStarted, setIsStarted] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); 
    const [usageInfo, setUsageInfo] = useState(null);

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
        fetchAvailablePositions(); 
        fetchHistoryData(); 
        fetchUsageData();
        return () => { stopWebcam(); };
    }, []);

    const fetchAvailablePositions = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/templates`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (res.ok) setAvailablePositions(await res.json());
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

    const isPro = usageInfo?.subscription?.plan === 'pro';
    const limitMinutes = isPro ? 180 : 15;
    const usedMinutes = usageInfo?.subscription?.usage?.mockInterviewMinutes || 0;
    const remainMinutes = Math.max(0, limitMinutes - usedMinutes);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, loading]);

    const startWebcam = async () => {
        try {
            // Đảm bảo xin quyền audio
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        } catch (err) { 
            toast.error("Không thể truy cập Camera và Micro. Vui lòng cấp quyền trên trình duyệt!"); 
        }
    };

    const stopWebcam = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startInterview = async () => {
        if (!jobPosition.trim()) return toast.warning("Vui lòng nhập vị trí ứng tuyển!");
        
        if (remainMinutes <= 0) return setShowUpgradeModal(true); 

        setIsStarted(true);
        setLoading(true);
        startWebcam(); 

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ history: [], jobPosition })
            });
            const data = await res.json();

            if (!res.ok) {
                if(res.status === 403) { setShowUpgradeModal(true); setIsStarted(false); stopWebcam(); return; }
                throw new Error("Lỗi Server");
            }
            
            const fullText = data.fullText || data.nextQuestion;
            setMessages([{ role: 'model', content: fullText }]);
            if (data.audioData) playAIVoice(data.audioData);

            fetchUsageData(); 
        } catch (err) { toast.error("Không thể kết nối với AI. Hãy thử lại!"); setIsStarted(false); stopWebcam(); } 
        finally { setLoading(false); }
    };

    const endInterview = async () => {
        stopWebcam();
        if (recognitionRef.current) recognitionRef.current.stop();
        audioRef.current.pause();
        setShowConfirmModal(false);
        
        setAnalyzing(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/evaluate-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ history: messages, jobPosition })
            });

            if (!res.ok) throw new Error("Lỗi Server đánh giá");
            const result = await res.json();
            
            setReportData({
                score: result.score || 0,
                overview: result.overview || "Chưa có đánh giá chi tiết.",
                strengths: Array.isArray(result.strengths) ? result.strengths : [],
                weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
                improvements: Array.isArray(result.improvements) ? result.improvements : []
            });

            fetchHistoryData();
        } catch (e) { toast.error("Hệ thống AI đang bận, vui lòng thử lại sau."); } 
        finally { setAnalyzing(false); setIsStarted(false); }
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
        
        const newHistory = [...messages, { role: 'user', content: text }];
        setMessages(newHistory);
        setInput("");
        setLoading(true); 

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ history: newHistory, jobPosition })
            });
            const data = await res.json();
            
            if (!res.ok) {
                if(res.status === 403) { setShowUpgradeModal(true); return; }
                throw new Error("Lỗi Server");
            }

            const fullContent = data.fullText || data.nextQuestion || "Có vẻ bạn đã hoàn thành bài phỏng vấn.";
            setMessages([...newHistory, { role: 'model', content: fullContent }]);
            
            if (data.audioData) playAIVoice(data.audioData);
            if (data.isFinished) toast.success("Bạn đã hoàn thành bộ câu hỏi! Hãy bấm Kết thúc.");

            fetchUsageData();
        } catch (err) { toast.error("Lỗi gửi tin nhắn tới máy chủ."); } 
        finally { setLoading(false); }
    };

    // FIX: Khôi phục cấu trúc nhận dạng giọng nói cũ để hiển thị Text ổn định
    const handleVoiceInput = () => {
        if (isListening.current) { 
            recognitionRef.current?.stop(); 
            return; 
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Trình duyệt không hỗ trợ Mic");
        
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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-800 animate-pulse">AI đang chấm điểm...</h2>
                <p className="text-gray-500 mt-2">Đang phân tích biểu cảm, giọng nói và nội dung trả lời.</p>
            </div>
        );
    }

    if (reportData) {
        return (
            <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative">
                        <h2 className="text-3xl font-bold mb-2">Kết quả Phỏng vấn AI</h2>
                        <p className="opacity-90 text-lg">Vị trí: {jobPosition}</p>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 -mt-14 relative z-10">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
                                <div className="w-28 h-28 rounded-full bg-blue-50 text-blue-700 text-4xl font-black flex items-center justify-center border-4 border-blue-100 shrink-0 shadow-lg">
                                    {reportData.score}<span className="text-xs text-blue-400 mt-3">/100</span>
                                </div>
                                <div className="text-center md:text-left">
                                    <h3 className="font-bold text-gray-800 text-xl mb-2">Đánh giá chung</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed">{reportData.overview}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                    <h4 className="text-sm font-bold text-green-700 mb-3">Điểm mạnh</h4>
                                    <ul className="text-xs space-y-2 text-gray-700">
                                        {reportData.strengths?.length > 0 ? reportData.strengths.map((s, i) => <li key={i}>• {s}</li>) : <li>Chưa ghi nhận điểm mạnh.</li>}
                                    </ul>
                                </div>
                                <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                    <h4 className="text-sm font-bold text-red-600 mb-3">Cần cải thiện</h4>
                                    <ul className="text-xs space-y-2 text-gray-700">
                                        {reportData.weaknesses?.length > 0 ? reportData.weaknesses.map((w, i) => <li key={i}>• {w}</li>) : <li>Chưa ghi nhận điểm yếu.</li>}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined">forum</span> Lịch sử hội thoại
                            </h3>
                            <div className="space-y-4 bg-gray-50 p-5 rounded-xl border border-gray-100 h-96 overflow-y-auto custom-scrollbar">
                                {messages?.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-4 rounded-xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'}`}>
                                            <span className="font-bold text-xs opacity-70 block mb-1.5 uppercase tracking-wider">
                                                {msg.role === 'user' ? 'Bạn' : 'AI Interviewer'}
                                            </span>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                {(!messages || messages.length === 0) && <p className="text-center text-gray-400 text-sm">Không có dữ liệu hội thoại.</p>}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100 text-center flex flex-col sm:flex-row justify-center gap-4">
                            <button onClick={() => navigate('/home')} className="px-8 py-3.5 rounded-xl font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-all">
                                Về trang chủ
                            </button>
                            <button onClick={() => { setReportData(null); setMessages([]); }} className="px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">refresh</span> Phỏng vấn lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pt-24 pb-10 px-4 font-sans">
            <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Đã hết thời gian mô phỏng" message="Bạn đã sử dụng hết số PHÚT mô phỏng phỏng vấn bằng giọng nói của tháng này. Hãy nâng cấp tài khoản để sử dụng công cụ mạnh mẽ này không giới hạn!" />
            <ConfirmEndModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={endInterview} />
            <HistoryDetailModal isOpen={!!selectedHistory} onClose={() => setSelectedHistory(null)} historyItem={selectedHistory} />

            {!isStarted ? (
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start animate-fadeIn">
                    
                    <div className="w-full md:w-1/2 bg-gray-50 border border-gray-200 rounded-2xl p-6 h-[70vh] flex flex-col shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">history</span> Lịch sử phỏng vấn
                            </h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{interviewHistory.length} bài</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {interviewHistory.length > 0 ? (
                                interviewHistory.map((item) => (
                                    <div key={item._id} onClick={() => setSelectedHistory(item)} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all flex justify-between items-center group">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors">{item.jobPosition}</h3>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="font-medium text-indigo-600">{item.questionCount || 0} câu hỏi</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center ml-4 pl-4 border-l border-gray-100">
                                            <span className="text-2xl font-black text-blue-600">{item.reportData?.score || 0}</span>
                                            <span className="text-[10px] uppercase text-gray-400 font-bold">/100 Điểm</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <span className="material-symbols-outlined text-6xl mb-3">folder_open</span>
                                    <p>Bạn chưa có lịch sử phỏng vấn nào.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                        <div className="flex items-center justify-between mb-2 mt-2">
                            <h1 className="text-2xl font-bold text-gray-900">Phòng Phỏng Vấn AI</h1>
                            {usageInfo && (
                                <div className="text-[11px] font-black uppercase tracking-wider px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
                                    Còn {remainMinutes}/{limitMinutes} phút
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 mb-8 text-sm">Chuẩn bị Camera & Micro. Hệ thống sẽ mô phỏng buổi phỏng vấn thực tế dựa trên vị trí bạn chọn.</p>
                         
                         <div className="mb-6">
                             <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Vị trí ứng tuyển tự do</label>
                             <input type="text" className="w-full border border-gray-300 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-semibold shadow-sm" placeholder="VD: Nhập vị trí bất kỳ (Ví dụ: Frontend Developer...)" value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} />
                             
                             <div className="relative mt-6 mb-2">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                                <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-gray-400 text-xs font-bold uppercase">Hoặc</span></div>
                             </div>

                             <label className="block text-xs font-bold text-blue-700 uppercase mb-2 flex items-center gap-1 mt-4"><span className="material-symbols-outlined text-sm">database</span> Bộ câu hỏi từ hệ thống</label>
                             <p className="text-xs text-gray-400 mb-2 italic">Dữ liệu được đúc kết từ các câu hỏi chuyên sâu do AI tạo ra cho các ứng viên trước đó.</p>
                             <div className="relative">
                                 <select className="w-full border border-gray-300 bg-blue-50/50 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700 appearance-none cursor-pointer" value={jobPosition} onChange={(e) => setJobPosition(e.target.value)}>
                                     <option value="" className="text-gray-500">-- Click để chọn vị trí có sẵn --</option>
                                     {availablePositions.map((pos, idx) => (
                                         <option key={idx} value={pos.jobPosition} className="font-medium text-gray-800">{pos.jobPosition} (Bộ {pos.questionCount} câu hỏi)</option>
                                     ))}
                                 </select>
                                 <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">expand_more</span>
                             </div>
                         </div>

                        <button onClick={startInterview} className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">play_circle</span> Bắt đầu phỏng vấn
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-7xl mx-auto h-[85vh] flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3 relative h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 group">
                        <video ref={aiVideoRef} src={VIDEO_AVATAR_URL} className="w-full h-full object-cover" loop muted playsInline poster={FALLBACK_IMAGE} />

                        {loading && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-fadeIn z-30">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">AI đang lấy câu hỏi...</span>
                            </div>
                        )}

                        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        </div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                            <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 shadow-lg ${isListeningState ? 'bg-red-500 border-red-300 animate-pulse text-white' : 'bg-gray-800/90 text-white border-white/20 hover:bg-gray-700'}`} onClick={handleVoiceInput}>
                                <span className="material-symbols-outlined text-2xl">{isListeningState ? 'mic' : 'mic_off'}</span>
                            </button>
                            <button onClick={() => setShowConfirmModal(true)} className="px-6 h-12 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                                <span className="material-symbols-outlined">call_end</span> Kết thúc
                            </button>
                        </div>
                    </div>

                    <div className="lg:w-1/3 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 h-full">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">Hội thoại</h3>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth custom-scrollbar">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[90%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm animate-fadeIn ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 border border-gray-200 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                            <input 
                                type="text" className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-gray-50"
                                placeholder="Nhập câu trả lời..." value={input}
                                onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSend()} disabled={loading}
                            />
                            <button onClick={() => handleSend()} disabled={loading} className="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md">
                                <span className="material-symbols-outlined text-xl">send</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            <style>{`
                .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}</style>
        </div>
    );
}