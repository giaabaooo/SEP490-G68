import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, History, ChevronRight, FileText } from 'lucide-react';

export default function TestHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const res = await fetch(`${API_BASE}/api/applications/my-test-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) setHistory(await res.json());
            } catch (error) {
                console.error("Lỗi tải lịch sử:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [navigate, API_BASE]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    if (loading) return <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50"><span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span><p className="text-slate-500 font-bold">Đang tải lịch sử...</p></div>;

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            <div className="bg-white border-b border-slate-200 pt-10 pb-10 px-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <History className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Lịch sử Bài kiểm tra</h1>
                        <p className="text-slate-500 font-medium text-sm">Xem lại điểm số các bài test chuyên môn bạn đã thực hiện.</p>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
                {history.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có dữ liệu</h3>
                        <p className="text-slate-500 text-sm">Bạn chưa hoàn thành bài kiểm tra nào.</p>
                    </div>
                ) : (
                    history.map((app) => (
                        <div key={app._id} onClick={() => navigate(`/candidate/test-result`, { state: { app } })} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row justify-between sm:items-center gap-6">
                            
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-indigo-100">Test Tuyển Dụng</span>
                                    <span className="text-xs font-bold text-slate-400">{new Date(app.testSubmittedAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">{app.assessmentId?.assessmentName || 'Bài kiểm tra năng lực'}</h3>
                                <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ứng tuyển: {app.jobId?.title}</p>
                            </div>

                            <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                                <div className="text-center sm:text-right">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">ĐIỂM SỐ</p>
                                    <p className={`text-2xl font-black ${app.testScore >= 50 ? 'text-emerald-600' : 'text-rose-500'}`}>{app.testScore}<span className="text-sm text-slate-400">/100</span></p>
                                </div>
                                <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                <div className="text-center sm:text-left">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">THỜI GIAN</p>
                                    <p className="text-sm font-black text-slate-700 flex items-center gap-1"><Clock className="w-4 h-4 text-slate-400" /> {formatDuration(app.testDuration)}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors ml-auto">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                            </div>

                        </div>
                    ))
                )}
            </div>
        </div>
    );
}