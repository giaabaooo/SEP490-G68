import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, FileText, Lock, ArrowRight, BrainCircuit } from 'lucide-react';

export default function TestListPage() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States cho Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('ALL');

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchTests = async () => {
            try {
                // Gọi API lấy bài test Public (Luyện tập)
                const res = await fetch(`${API_BASE}/api/assessments/public`);
                if (res.ok) {
                    const data = await res.json();
                    setTests(data);
                }
            } catch (error) {
                console.error("Lỗi tải bài test:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, [API_BASE]);

    // Helper: Xác định trạng thái của bài Test dựa vào thời gian
    const getTestStatus = (test) => {
        const now = new Date();
        const start = test.startDate ? new Date(test.startDate) : null;
        const end = test.endDate ? new Date(test.endDate) : null;

        if (start && now < start) return 'PENDING'; 
        if (end && now > end) return 'CLOSED';     
        return 'OPEN';                             
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
        });
    };

    // LOGIC LỌC
    const filteredTests = tests.filter(test => {
        const status = getTestStatus(test);
        
        // 1. Lọc theo tên Test hoặc Tên người tạo
        const matchName = test.assessmentName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (test.createdBy?.companyName || test.createdBy?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());

        // 2. Lọc theo trạng thái
        let matchStatus = true;
        if (selectedStatus === 'OPEN') matchStatus = status === 'OPEN';
        if (selectedStatus === 'CLOSED') matchStatus = status === 'CLOSED';
        if (selectedStatus === 'PENDING') matchStatus = status === 'PENDING';

        return matchName && matchStatus;
    });

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            
            {/* HERO SECTION */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 pt-20 pb-28 px-4 relative overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

                <div className="max-w-6xl mx-auto relative z-10 text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                        <BrainCircuit className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                        Kho bài kiểm tra năng lực
                    </h1>
                    <p className="text-blue-100/80 mb-10 text-lg font-medium max-w-2xl mx-auto">
                        Đánh giá kỹ năng, làm quen cấu trúc đề thi thực tế và nâng cao tỷ lệ trúng tuyển của bạn thông qua các bài trắc nghiệm chuẩn hóa.
                    </p>

                    {/* THANH TÌM KIẾM & LỌC */}
                    <div className="bg-white p-2 rounded-2xl md:rounded-full shadow-2xl flex flex-col md:flex-row gap-2 max-w-3xl mx-auto">
                        <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none">
                            <Search className="w-5 h-5 text-slate-400 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Tìm bài test, kỹ năng..." 
                                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-bold placeholder:font-medium placeholder:text-slate-400" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:block w-px h-10 bg-slate-200 self-center"></div>
                        <div className="flex-[0.6] flex items-center px-4 py-3 bg-slate-50 md:bg-transparent rounded-xl md:rounded-none mt-2 md:mt-0">
                            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                            <select 
                                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-bold cursor-pointer" 
                                value={selectedStatus} 
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                <option value="ALL">Tất cả trạng thái</option>
                                <option value="OPEN">Đang mở</option>
                                <option value="PENDING">Sắp diễn ra</option>
                                <option value="CLOSED">Đã kết thúc</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KẾT QUẢ DANH SÁCH BÀI TEST */}
            <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
                <div className="flex justify-between items-center mb-6 px-2">
                    <p className="font-medium text-slate-600">
                        Tìm thấy <span className="font-black text-blue-600 bg-white px-2 py-0.5 rounded-md shadow-sm">{filteredTests.length}</span> bài kiểm tra
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
                        <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
                        <p className="text-slate-500 font-bold">Đang tải danh sách bài test...</p>
                    </div>
                ) : filteredTests.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTests.map((test) => {
                            const status = getTestStatus(test);
                            
                            return (
                                <div key={test._id} className={`bg-white rounded-3xl p-6 border border-slate-200 flex flex-col hover:-translate-y-1 hover:shadow-xl hover:border-blue-300 transition-all duration-300 ${status === 'CLOSED' ? 'opacity-70 grayscale-[30%]' : ''}`}>
                                    
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-slate-200">
                                                Trắc nghiệm
                                            </span>
                                            {status === 'PENDING' && <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-amber-200">Sắp diễn ra</span>}
                                            {status === 'CLOSED' && <span className="bg-rose-100 text-rose-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-rose-200">Đã đóng</span>}
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-[17px] font-black text-slate-900 leading-snug mb-2 line-clamp-2">
                                            {test.assessmentName}
                                        </h3>
                                        <p className="text-sm font-semibold text-slate-500 mb-4 truncate">
                                            Tạo bởi: <span className="text-blue-600">{test.createdBy?.companyName || test.createdBy?.fullName || 'Hệ thống'}</span>
                                        </p>
                                        
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-5">
                                            {test.tags && test.tags.length > 0 ? (
                                                test.tags.slice(0, 3).map((tag, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-[11px] font-bold rounded-md border border-slate-100">{tag}</span>
                                                ))
                                            ) : (
                                                <span className="px-2.5 py-1 bg-slate-50 text-slate-500 text-[11px] font-bold rounded-md border border-slate-100 italic">Kiến thức chung</span>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-sm font-bold text-slate-600 mb-2">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                <Clock className="w-4 h-4 text-blue-500" /> {test.timeLimit} phút
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                <BrainCircuit className="w-4 h-4 text-emerald-500" /> {test.questions ? test.questions.length : 0} câu
                                            </div>
                                        </div>

                                        {(test.startDate || test.endDate) && (
                                            <div className="text-xs font-semibold mt-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                                                {status === 'PENDING' && <span className="text-amber-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Mở lúc: {formatDateTime(test.startDate)}</span>}
                                                {status === 'OPEN' && test.endDate && <span className="text-emerald-600 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Đóng lúc: {formatDateTime(test.endDate)}</span>}
                                                {status === 'CLOSED' && <span className="text-rose-600 flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Đã đóng lúc: {formatDateTime(test.endDate)}</span>}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Button */}
                                    <div className="pt-5 mt-5 border-t border-slate-100">
                                        {status === 'OPEN' ? (
                                            // ĐIỀU HƯỚNG VÀO ĐÚNG TRANG TakeTest
                                            <button
                                                onClick={() => navigate(`/assessments/${test._id}/take`)}
                                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
                                            >
                                                Làm bài ngay <ArrowRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="w-full py-3.5 bg-slate-100 text-slate-400 rounded-xl font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-slate-200"
                                            >
                                                <Lock className="w-4 h-4" /> 
                                                {status === 'PENDING' ? 'Chưa đến giờ' : 'Đã kết thúc'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Không tìm thấy bài test nào</h3>
                        <p className="text-slate-500 font-medium mb-6">Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả khác.</p>
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedStatus('ALL');}}
                            className="px-6 py-2.5 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}