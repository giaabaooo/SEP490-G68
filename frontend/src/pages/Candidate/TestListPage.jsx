import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Clock, FileText, Lock, ArrowRight, BrainCircuit, Sparkles, CreditCard, Unlock } from 'lucide-react';

export default function TestListPage() {
    const navigate = useNavigate();
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // States cho Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLevel, setSelectedLevel] = useState('ALL');

    // State Phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const testsPerPage = 6;

    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

    useEffect(() => {
        const fetchTests = async () => {
            try {
                // ĐÃ GÁN LẠI API lấy danh sách bài test từ Admin (Practice Topics)
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await fetch(`${API_BASE}/api/practice-topics`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    // Lọc chỉ hiển thị bài test đã PUBLISHED
                    const publishedTests = data.filter(t => t.status === 'PUBLISHED');
                    setTests(publishedTests);
                }
            } catch (error) {
                console.error("Lỗi tải bài test:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTests();
    }, [API_BASE]);

    // Reset trang khi lọc thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedLevel]);

    // LOGIC LỌC
    const filteredTests = tests.filter(test => {
        const matchName = test.topicName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (test.createdBy?.companyName || test.createdBy?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());

        let matchLevel = true;
        if (selectedLevel === 'FREE') matchLevel = test.level === 'free';
        if (selectedLevel === 'PAID') matchLevel = test.level === 'paid';

        return matchName && matchLevel;
    });

    // Tính toán cắt trang
    const totalPages = Math.ceil(filteredTests.length / testsPerPage);
    const currentTests = filteredTests.slice((currentPage - 1) * testsPerPage, currentPage * testsPerPage);

    return (
        <div className="bg-slate-50 min-h-screen pb-16 font-inter">
            
            {/* HEADER SECTION TỐI GIẢN CHUẨN ENTERPRISE */}
            <div className="bg-white border-b border-slate-200 pt-16 pb-16 px-4">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">
                        Kho bài <span className="text-blue-600">Luyện Tập</span>
                    </h1>
                    <p className="text-slate-500 mb-10 text-base font-medium max-w-2xl mx-auto">
                        Đánh giá kỹ năng, làm quen cấu trúc đề thi qua hệ thống sinh câu hỏi tự động. Phân loại chuẩn xác năng lực của bạn.
                    </p>

                    {/* THANH TÌM KIẾM & LỌC */}
                    <div className="bg-white border border-slate-200 p-2 rounded-2xl shadow-sm flex flex-col md:flex-row gap-2 max-w-3xl mx-auto hover:border-blue-300 transition-colors">
                        <div className="flex-1 flex items-center px-4 py-2.5 bg-slate-50 md:bg-transparent rounded-xl">
                            <Search className="w-5 h-5 text-slate-400 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Tìm chủ đề luyện tập..." 
                                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-semibold placeholder:font-medium placeholder:text-slate-400" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="hidden md:block w-px h-8 bg-slate-200 self-center"></div>
                        <div className="flex-[0.6] flex items-center px-4 py-2.5 bg-slate-50 md:bg-transparent rounded-xl mt-2 md:mt-0">
                            <Filter className="w-5 h-5 text-slate-400 shrink-0" />
                            <select 
                                className="w-full bg-transparent border-none outline-none pl-3 text-slate-800 font-semibold cursor-pointer" 
                                value={selectedLevel} 
                                onChange={(e) => setSelectedLevel(e.target.value)}
                            >
                                <option value="ALL">Tất cả loại hình</option>
                                <option value="FREE">Miễn phí</option>
                                <option value="PAID">Trả phí (Premium)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* KẾT QUẢ DANH SÁCH BÀI TEST */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="flex justify-between items-center mb-6 px-2">
                    <p className="font-medium text-slate-600">
                        Tìm thấy <span className="font-black text-blue-600 bg-white px-2 py-0.5 rounded-md shadow-sm border border-slate-200">{filteredTests.length}</span> chủ đề
                    </p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border border-slate-200">
                        <span className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></span>
                        <p className="text-slate-500 font-bold">Đang tải danh sách bài test...</p>
                    </div>
                ) : currentTests.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentTests.map((test) => {
                                const isPaid = test.level === 'paid';

                                return (
                                    <div key={test._id} className={`bg-white rounded-3xl p-6 border flex flex-col hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ${isPaid ? 'border-amber-200 hover:border-amber-400 shadow-amber-500/5' : 'border-slate-200 hover:border-blue-300'}`}>
                                        
                                        <div className="flex justify-between items-start mb-5">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-600'}`}>
                                                <BrainCircuit className="w-6 h-6" />
                                            </div>
                                            <div className="flex flex-wrap gap-2 justify-end">
                                                {/* Tag AI */}
                                                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-indigo-200 flex items-center gap-1">
                                                    AI Sinh <Sparkles className="w-3 h-3" />
                                                </span>
                                                {/* Tag Free/Paid */}
                                                {isPaid ? (
                                                    <span className="bg-gradient-to-r from-amber-200 to-amber-300 text-amber-900 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                                        <CreditCard className="w-3 h-3" /> Trả phí
                                                    </span>
                                                ) : (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
                                                        <Unlock className="w-3 h-3" /> Miễn phí
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-[17px] font-black text-slate-900 leading-snug mb-2 line-clamp-2">
                                                {test.topicName}
                                            </h3>
                                            <p className="text-sm font-semibold text-slate-500 mb-4 line-clamp-2">
                                                {test.description || 'Chưa có mô tả cho chủ đề này.'}
                                            </p>
                                            
                                            <div className="flex items-center gap-4 text-sm font-bold text-slate-600 mb-2">
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <Clock className="w-4 h-4 text-blue-500" /> {test.timeLimit} phút
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                                    <FileText className="w-4 h-4 text-emerald-500" /> {test.questions ? test.questions.length : 0} câu
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <div className="pt-5 mt-5 border-t border-slate-100">
                                            <button
                                                onClick={() => {
                                                    if(isPaid) {
                                                        alert('Chức năng thanh toán sẽ được tích hợp sau!');
                                                    } else {
                                                        navigate(`/practice-test/${test._id}/take`);
                                                    }
                                                }}
                                                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md ${isPaid ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20'}`}
                                            >
                                                {isPaid ? (
                                                    <>Mua gói truy cập <ArrowRight className="w-4 h-4" /></>
                                                ) : (
                                                    <>Bắt đầu luyện tập <ArrowRight className="w-4 h-4" /></>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* THANG ĐIỀU HƯỚNG PHÂN TRANG */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-12 mb-4">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white font-bold text-sm transition-colors shadow-sm"
                                >
                                    Trước
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all shadow-sm ${
                                            currentPage === page 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        } border`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white bg-white font-bold text-sm transition-colors shadow-sm"
                                >
                                    Sau
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-slate-200">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Không tìm thấy bài test nào</h3>
                        <p className="text-slate-500 font-medium mb-6">Thử thay đổi từ khóa hoặc bộ lọc để xem kết quả khác.</p>
                        <button 
                            onClick={() => {setSearchTerm(''); setSelectedLevel('ALL');}}
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