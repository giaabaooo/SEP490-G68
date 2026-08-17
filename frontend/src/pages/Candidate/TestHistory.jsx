import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, History, ChevronRight, FileText, Briefcase, Sparkles } from 'lucide-react';

export default function TestHistory() {
    const [jobHistory, setJobHistory] = useState([]);
    const [practiceHistory, setPracticeHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('JOB');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            try {
                const resJob = await fetch(`${API_BASE}/api/applications/my-test-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resJob.ok) setJobHistory(await resJob.json());

                const resPractice = await fetch(`${API_BASE}/api/practice-topics/my-history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (resPractice.ok) setPracticeHistory(await resPractice.json());

            } catch (error) {
                console.error("Lỗi tải lịch sử:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate, API_BASE]);

    const formatDuration = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}p ${s}s`;
    };

    if (loading) return <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50"><span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span><p className="text-black font-bold">Đang tải dữ liệu...</p></div>;

    const displayData = activeTab === 'JOB' ? jobHistory : practiceHistory;

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            <div className="bg-white border-b border-slate-200 pt-10 pb-8 px-4">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <History className="w-7 h-7 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-black tracking-tight mb-1">Lịch sử Bài kiểm tra</h1>
                            <p className="text-black font-medium text-sm">Quản lý điểm số các bài test chuyên môn và luyện tập.</p>
                        </div>
                    </div>
                    
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={() => setActiveTab('JOB')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'JOB' ? 'bg-white text-blue-600 shadow-sm' : 'text-black hover:text-black'}`}
                        >
                            <Briefcase className="w-4 h-4" /> Tuyển Dụng
                        </button>
                        <button 
                            onClick={() => setActiveTab('PRACTICE')}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'PRACTICE' ? 'bg-white text-amber-600 shadow-sm' : 'text-black hover:text-black'}`}
                        >
                            <Sparkles className="w-4 h-4" /> AI Luyện Tập
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 mt-8 space-y-4">
                {displayData.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
                        <FileText className="w-16 h-16 text-black mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-black mb-2">Chưa có dữ liệu</h3>
                        <p className="text-black text-sm">Bạn chưa hoàn thành bài {activeTab === 'JOB' ? 'kiểm tra ứng tuyển' : 'luyện tập'} nào.</p>
                    </div>
                ) : (
                    displayData.map((app, idx) => {
                        const testName = app.assessmentId?.assessmentName || app.assessmentId?.topicName || 'Bài kiểm tra năng lực';
                        const themeColor = activeTab === 'PRACTICE' ? 'amber' : 'indigo';
                        
                        return (
                            <div key={app._id || idx} onClick={() => navigate(`/candidate/test-result`, { state: { app } })} className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-${themeColor}-300 hover:shadow-md transition-all cursor-pointer group flex flex-col sm:flex-row justify-between sm:items-center gap-6`}>
                                
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        {activeTab === 'PRACTICE' ? (
                                            <span className="bg-amber-50 text-amber-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-amber-100 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Luyện tập</span>
                                        ) : (
                                            <span className="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blue-100 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Ứng tuyển</span>
                                        )}
                                        <span className="text-xs font-bold text-black">{new Date(app.testSubmittedAt).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <h3 className={`text-lg font-black text-black group-hover:text-${themeColor}-600 transition-colors mb-1`}>{testName}</h3>
                                    <p className="text-sm font-semibold text-black flex items-center gap-1.5"><CheckCircle2 className={`w-4 h-4 ${activeTab === 'PRACTICE' ? 'text-amber-500' : 'text-emerald-500'}`} /> {app.jobId?.title}</p>
                                </div>

                                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100">
                                    <div className="text-center sm:text-right">
                                        <p className="text-xs font-bold text-black uppercase tracking-widest mb-1">ĐIỂM SỐ</p>
                                        <p className={`text-2xl font-black ${app.testScore >= 50 ? 'text-emerald-600' : 'text-rose-500'}`}>{app.testScore}<span className="text-sm text-black">/100</span></p>
                                    </div>
                                    <div className="hidden sm:block w-px h-10 bg-slate-200"></div>
                                    <div className="text-center sm:text-left">
                                        <p className="text-xs font-bold text-black uppercase tracking-widest mb-1">THỜI GIAN</p>
                                        <p className="text-sm font-black text-black flex items-center gap-1"><Clock className="w-4 h-4 text-black" /> {formatDuration(app.testDuration)}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-black group-hover:bg-${themeColor}-600 group-hover:text-white transition-colors ml-auto`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}