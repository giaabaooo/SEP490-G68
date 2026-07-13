import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import UpgradeRequestModal from '../../components/UpgradeRequestModal';

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

export default function AIInterview() {
    const navigate = useNavigate();
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [jobPosition, setJobPosition] = useState(""); 
    const [isStarted, setIsStarted] = useState(false);
    const [reportData, setReportData] = useState(null);

    const [userPlan, setUserPlan] = useState('free');
    const [remainingTime, setRemainingTime] = useState(0); 
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false); 

    const isListening = useRef(false); 
    const [isListeningState, setIsListeningState] = useState(false);
    const recognitionRef = useRef(null); 
    const audioRef = useRef(new Audio());
    const aiVideoRef = useRef(null);
    const userVideoRef = useRef(null);
    const streamRef = useRef(null);
    const chatContainerRef = useRef(null);
    
    const unsavedTimeRef = useRef(0);
    const timerIntervalRef = useRef(null);

    const VIDEO_AVATAR_URL = "/video/ai-interviewer.mp4"; 
    const FALLBACK_IMAGE = "https://img.freepik.com/free-photo/view-robot-working-laptop_23-2150880153.jpg";

    useEffect(() => {
        setRemainingTime(3600); // Tạm cấp 60 phút để test
        setUserPlan('premium'); // Hiển thị giao diện gói premium
        return () => {
            stopWebcam();
            clearInterval(timerIntervalRef.current);
        };
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [messages, loading]);

    const syncUsage = async (seconds) => {
        // if (seconds <= 0) return;
        // const token = localStorage.getItem('token');
        // try {
        //     await fetch(`${API_URL}/api/interview/usage`, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        //         body: JSON.stringify({ secondsUsed: seconds })
        //     });
        //     unsavedTimeRef.current = 0; 
        // } catch (e) { console.error("Lỗi sync time:", e); }
        return;
    };

    const startTimer = () => {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) { handleTimeOver(); return 0; }
                return prev - 1;
            });
            unsavedTimeRef.current += 1;
            if (unsavedTimeRef.current >= 5) {
                syncUsage(unsavedTimeRef.current);
                unsavedTimeRef.current = 0;
            }
        }, 1000);
    };

    const handleTimeOver = () => {
        clearInterval(timerIntervalRef.current);
        syncUsage(unsavedTimeRef.current);
        stopWebcam();
        setIsStarted(false);
        setShowUpgradeModal(true);
    };

    const startWebcam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            streamRef.current = stream;
            if (userVideoRef.current) userVideoRef.current.srcObject = stream;
        } catch (err) {
            toast.error("Không thể truy cập Camera. Vui lòng kiểm tra quyền hệ thống.");
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
        if (remainingTime <= 0) return setShowUpgradeModal(true);

        setIsStarted(true);
        setLoading(true);
        startWebcam(); 
        startTimer();

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/interview/mock-interview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ history: [], jobPosition })
            });
            const data = await res.json();
            const fullText = data.fullText || data.nextQuestion;
            setMessages([{ role: 'model', content: fullText }]);
            if (data.audioData) playAIVoice(data.audioData);
        } catch (err) { 
            toast.error("Không thể kết nối với AI. Hãy thử lại!"); 
        } finally { 
            setLoading(false); 
        }
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

        } catch (e) {
            toast.error("Hệ thống AI đang bận, vui lòng thử lại sau.");
            setReportData({
                score: 50, overview: "Hệ thống gặp sự cố khi phân tích.",
                strengths: ["Cần thử lại"], weaknesses: ["Lỗi mạng hoặc AI"],
                improvements: ["Vui lòng thực hiện lại bài phỏng vấn"]
            });
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
            const fullContent = data.fullText || `${data.feedback} ${data.nextQuestion}`;
            setMessages([...newHistory, { role: 'model', content: fullContent }]);
            if (data.audioData) playAIVoice(data.audioData);
        } catch (err) { toast.error("Lỗi gửi tin nhắn tới máy chủ."); } finally { setLoading(false); }
    };

    const handleVoiceInput = () => {
        if (isListening.current) { 
            recognitionRef.current?.stop(); 
            return; 
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return toast.error("Trình duyệt hiện tại không hỗ trợ thu âm.");
        
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

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Render Logic Giống Trang Cũ...
    if (reportData) {
        return (
            <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 font-sans">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
                        <h2 className="text-3xl font-bold mb-2">Kết quả Phỏng vấn AI</h2>
                        <p className="opacity-90 text-lg">Vị trí: {jobPosition}</p>
                        
                        {/* Score Circle */}
                        <div className="mt-6 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white text-blue-700 text-4xl font-extrabold border-4 border-blue-200 shadow-lg">
                            {reportData.score}
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Tổng quan */}
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-blue-600">overview</span> Tổng quan
                            </h3>
                            <p className="text-gray-600 leading-relaxed bg-blue-50 p-4 rounded-xl border border-blue-100">
                                {reportData.overview}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Điểm mạnh */}
                            <div className="bg-green-50 p-5 rounded-xl border border-green-100">
                                <h3 className="text-lg font-bold text-green-700 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined">thumb_up</span> Điểm mạnh
                                </h3>
                                <ul className="space-y-2">
                                    {(reportData.strengths || []).length > 0 ? (
                                        reportData.strengths.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                <span className="material-symbols-outlined text-green-500 text-base mt-0.5">check_circle</span> 
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-400 italic text-sm">Chưa phát hiện điểm mạnh rõ ràng.</li>
                                    )}
                                </ul>
                            </div>

                            {/* Điểm yếu */}
                            <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined">warning</span> Điểm cần cải thiện
                                </h3>
                                <ul className="space-y-2">
                                    {(reportData.weaknesses || []).length > 0 ? (
                                        reportData.weaknesses.map((item, i) => (
                                            <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                                <span className="material-symbols-outlined text-red-500 text-base mt-0.5">error</span> 
                                                <span>{item}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="text-gray-400 italic text-sm">Không có điểm yếu đáng kể.</li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {/* Gợi ý */}
                        <div>
                            <h3 className="text-lg font-bold text-purple-700 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined">tips_and_updates</span> Gợi ý phát triển
                            </h3>
                            <div className="grid gap-3">
                                {(reportData.improvements || []).length > 0 ? (
                                    reportData.improvements.map((item, i) => (
                                        <div key={i} className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-sm text-gray-700 flex gap-3 shadow-sm">
                                            <span className="font-bold text-purple-600 min-w-[20px]">{i+1}.</span> 
                                            <span>{item}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 italic text-sm">Hãy tiếp tục luyện tập để cải thiện kỹ năng.</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-10 text-center flex justify-center gap-4">
                        <button onClick={() => navigate('/home')} className="px-8 py-3.5 rounded-full font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-all">
                            Về trang chủ
                        </button>
                        <button onClick={() => { setReportData(null); setMessages([]); }} className="px-8 py-3.5 rounded-full font-bold text-white bg-gray-900 hover:bg-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2">
                            <span className="material-symbols-outlined">refresh</span> Phỏng vấn lại
                        </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (analyzing) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center font-sans">
                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-800 animate-pulse">AI đang chấm điểm...</h2>
                <p className="text-gray-500 mt-2">Đang phân tích biểu cảm, giọng nói và nội dung trả lời.</p>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen pt-20 pb-10 px-4 font-sans flex flex-col items-center justify-center">
            
            <ConfirmEndModal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} onConfirm={endInterview} />
            <UpgradeRequestModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Hết thời gian" message="Bạn đã hết thời gian luyện tập hôm nay." targetPlan="Premium" />

            {!isStarted ? (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-10 max-w-md w-full text-center mt-10 animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Phòng Phỏng Vấn AI</h1>
                    <p className="text-gray-500 mb-6 text-sm">Chuẩn bị Camera & Micro. Hệ thống sẽ mô phỏng buổi phỏng vấn thực tế.</p>
                     
                     <div className="mb-6 text-left">
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Vị trí ứng tuyển</label>
                         <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none font-semibold" placeholder="VD: Nhập vị trí ứng tuyển..." value={jobPosition} onChange={(e) => setJobPosition(e.target.value)} />
                     </div>

                    <button onClick={startInterview} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined">play_circle</span> Bắt đầu ngay
                    </button>
                </div>
            ) : (
                <div className="w-full max-w-7xl h-[85vh] flex flex-col lg:flex-row gap-6">
                    <div className="lg:w-2/3 relative h-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-200 group">
                        
                        <video ref={aiVideoRef} src={VIDEO_AVATAR_URL} className="w-full h-full object-cover" loop muted playsInline poster={FALLBACK_IMAGE} />

                        {loading && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-fadeIn">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium">AI đang suy nghĩ...</span>
                            </div>
                        )}

                        {/* Overlays... */}
                        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
                            <video ref={userVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        </div>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-10">
                            <button className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-2 ${isListeningState ? 'bg-red-500 border-red-300 animate-pulse text-white' : 'bg-gray-800/90 text-white border-white/20 hover:bg-gray-700'}`} onClick={handleVoiceInput}>
                                <span className="material-symbols-outlined text-2xl">{isListeningState ? 'mic' : 'mic_off'}</span>
                            </button>
                            <button onClick={() => setShowConfirmModal(true)} className="px-6 h-12 rounded-full bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg flex items-center gap-2 transition-transform hover:scale-105">
                                <span className="material-symbols-outlined">call_end</span> Kết thúc
                            </button>
                        </div>
                    </div>

                    {/* Hộp Chat (Bên Phải) */}
                    <div className="lg:w-1/3 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-200 h-full">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 flex items-center gap-2">Hội thoại</h3>
                        </div>
                        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-white scroll-smooth">
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
                                type="text" className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-blue-500"
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
            `}</style>
        </div>
    );
}