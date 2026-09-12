import React from 'react';
import { Sparkles, RefreshCw, X, Layers, ThumbsUp, AlertTriangle } from 'lucide-react';

const AiDetailModal = ({ isOpen, onClose, data, candidateName, onReEvaluate, isReEvaluating }) => {
    if (!isOpen || !data) return null;
    
    const details = data.aiMatchDetails || {};
    const categoryScores = details.categoryScores || [];

    const sortedCategories = [...categoryScores].sort((a, b) => (b.weight || 0) - (a.weight || 0));

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-in border border-slate-200" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50/50 rounded-t-3xl">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-600" /> Báo cáo phân tích AI theo Bands
                        </h3>
                        <p className="text-sm text-slate-600 font-medium">Ứng viên: <strong className="text-slate-900">{candidateName}</strong></p>
                    </div>
                    <div className="flex items-center gap-3">
                        {onReEvaluate && (
                            <button
                                type="button"
                                onClick={() => onReEvaluate(data._id || data.id)}
                                disabled={isReEvaluating}
                                title="Yêu cầu AI chấm lại CV theo các Bands mới nhất của Job này"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs border border-blue-200 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isReEvaluating ? 'animate-spin' : ''}`} />
                                <span>{isReEvaluating ? 'Đang chấm lại...' : 'Chấm lại theo Bands mới'}</span>
                            </button>
                        )}
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"><X className="w-4 h-4 text-slate-600" /></button>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    
                    <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2.5 flex justify-between items-end">
                            <span className="flex items-center gap-2"><Layers className="w-4 h-4 text-indigo-600" /> Đánh giá chi tiết từng đầu mục (Bands)</span>
                            <span className="text-xs text-slate-500 font-semibold normal-case">Thang điểm 100 cho mỗi tiêu chí</span>
                        </h4>
                        
                        <div className="space-y-3.5">
                            {sortedCategories.length > 0 ? sortedCategories.map((cat, idx) => {
                                const rawScore = cat.rawScore !== undefined ? cat.rawScore : (cat.score ?? 0);
                                const weight = cat.weight ?? 0;
                                const weightedScore = cat.weightedScore !== undefined ? Number(cat.weightedScore).toFixed(1) : ((rawScore * weight) / 100).toFixed(1);
                                return (
                                <div key={idx} className="p-4 sm:p-5 border border-slate-200 rounded-2xl bg-white hover:border-blue-300 hover:shadow-xs transition-all">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                                            {cat.isKey && (
                                                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase border border-amber-200 shadow-2xs">
                                                    Trọng điểm
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 text-xs font-semibold shrink-0">
                                            <span>Điểm đạt: <strong className={`font-black text-sm ${rawScore >= 80 ? 'text-blue-600' : rawScore >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>{rawScore}/100</strong></span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-slate-600">Trọng số: <strong className="text-slate-800">{weight}%</strong></span>
                                            <span className="text-slate-300">|</span>
                                            <span className="text-indigo-700 font-bold">Quy đổi: +{weightedScore} đ</span>
                                        </div>
                                    </div>

                                    {/* Thanh tiến trình điểm của đầu mục */}
                                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${rawScore >= 80 ? 'bg-blue-600' : rawScore >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                            style={{ width: `${Math.min(100, Math.max(0, rawScore))}%` }}
                                        ></div>
                                    </div>

                                    <p className="text-xs md:text-sm text-slate-700 font-medium leading-relaxed bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                        "{cat.feedback || 'Chưa có nhận xét.'}"
                                    </p>
                                </div>
                                );
                            }) : (
                                <p className="py-4 text-sm text-slate-500 italic text-center">Chưa có dữ liệu phân tích từng đầu mục.</p>
                            )}
                        </div>

                        {/* Tổng điểm Matching / 100 ở ngay bên dưới */}
                        <div className="mt-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50/40 border border-blue-200 rounded-2xl p-6 flex justify-between items-center shadow-xs">
                            <div>
                                <h4 className="text-xl font-black text-blue-950 mb-1 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-blue-600" /> Tổng điểm Matching
                                </h4>
                                <p className="text-xs md:text-sm text-blue-800 font-medium">
                                    Tính dựa trên tổng điểm quy đổi theo trọng số của các đầu mục Bands trên thang điểm 100
                                </p>
                            </div>
                            <div className="text-4xl md:text-5xl font-black text-blue-700 tracking-tighter shrink-0 pl-4">
                                {data.aiScore || 0}<span className="text-xl md:text-2xl text-blue-500 font-bold ml-1">/ 100</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                        <div className="bg-emerald-50/80 p-6 rounded-2xl border border-emerald-200/90 shadow-2xs">
                            <h4 className="font-black text-emerald-800 text-base mb-2 flex items-center gap-2"><ThumbsUp className="w-5 h-5 text-emerald-600"/> Nên gọi phỏng vấn</h4>
                            <p className="text-xs md:text-sm text-emerald-900 font-medium leading-relaxed">{details.reasonToHire || 'Chưa có nhận xét.'}</p>
                        </div>
                        <div className="bg-rose-50/80 p-6 rounded-2xl border border-rose-200/90 shadow-2xs">
                            <h4 className="font-black text-rose-800 text-base mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-rose-600"/> Rủi ro / Điểm yếu</h4>
                            <p className="text-xs md:text-sm text-rose-900 font-medium leading-relaxed">{details.reasonToReject || 'Chưa có nhận xét.'}</p>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AiDetailModal;
