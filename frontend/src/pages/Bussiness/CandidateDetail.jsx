import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function CandidateDetail() {
  const { id } = useParams(); // id của Application
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testDetails, setTestDetails] = useState(null);
  const [error, setError] = useState(null);
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // 1. LẤY THÔNG TIN HỒ SƠ ỨNG VIÊN (APPLICATION)
        const appRes = await fetch(`${API_URL}/api/applications/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!appRes.ok) throw new Error('Không tìm thấy dữ liệu ứng viên');
        const appData = await appRes.json();
        
        setCandidate({
          ...appData,
          name: appData.userId?.fullName || 'N/A',
          email: appData.userId?.email || 'N/A',
          position: appData.jobId?.title || 'N/A',
          // Sử dụng field lưu kết quả từ Backend (đổi tên biến nếu BE của bạn dùng tên khác)
          score: appData.testScore || 0, 
          answers: appData.testAnswers || [], // Ví dụ: [0, 2, 1, 3] (index đáp án ứng viên chọn)
          status: appData.status,
          startedAt: appData.testStartedAt || appData.appliedAt,
          submittedAt: appData.testSubmittedAt || appData.appliedAt,
          duration: appData.testDuration || 0 // Tính bằng giây
        });

        // 2. LẤY DỮ LIỆU BÀI TEST TỪ API ASSESSMENTS THẬT
        // Giả định Application lưu assessmentId, nếu không có lấy qua Job
        const testIdToFetch = appData.assessmentId || appData.jobId?.assessmentId; 

        if (testIdToFetch) {
          const testRes = await fetch(`${API_URL}/api/assessments/${testIdToFetch}`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
          });
          
          if (testRes.ok) {
              const testData = await testRes.json();
              setTestDetails(testData);
          } else {
              console.warn("Không tải được đề thi gốc.");
          }
        } else {
            // Nếu chưa có testId, thử tìm kiếm assessment theo JobId qua API list (Fallback)
            const fallbackRes = await fetch(`${API_URL}/api/assessments/my-tests`, {
                 headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (fallbackRes.ok) {
                const allTests = await fallbackRes.json();
                const matchedTest = allTests.find(t => t.jobId?._id === appData.jobId?._id || t.jobId === appData.jobId?._id);
                if (matchedTest) setTestDetails(matchedTest);
            }
        }
      } catch (err) {
        console.error("Lỗi fetch dữ liệu:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchData();
  }, [id, API_URL, navigate]);

  const formatDuration = (seconds) => {
    if (!seconds) return '---';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '---';

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-bold">Đang tải hồ sơ...</div>;
  if (error || !candidate) return <div className="flex h-screen items-center justify-center text-red-500 font-bold">{error || "Không tìm thấy dữ liệu"}</div>;

  const hasTakenTest = candidate.answers && Object.keys(candidate.answers).length > 0;

  return (
    <div className="font-sans text-slate-800 bg-slate-50 min-h-screen pb-12">
      
      {/* Header Điều hướng */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4 mb-6 shadow-sm sticky top-0 z-40">
         <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
         </button>
         <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight">Chi tiết bài kiểm tra</h1>
            <p className="text-sm font-medium text-slate-500">Ứng viên: <span className="text-blue-600 font-bold">{candidate.name}</span></p>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-6">
        
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col justify-between min-h-[200px] shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Điểm tổng kết</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-6xl font-black tracking-tighter ${candidate.score >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {hasTakenTest ? candidate.score : '0'}
                </span>
                <span className="text-2xl font-bold text-slate-300">/100</span>
              </div>
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 text-sm font-bold text-slate-600 truncate">
                {testDetails?.assessmentName || 'Bài kiểm tra năng lực'}
            </div>
          </div>
          
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col justify-center shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="px-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian bắt đầu</p>
                <p className="text-[15px] font-bold text-slate-800 mb-4">{hasTakenTest ? formatDate(candidate.startedAt) : '---'}</p>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian nộp bài</p>
                <p className="text-[15px] font-bold text-slate-800">{hasTakenTest ? formatDate(candidate.submittedAt) : '---'}</p>
              </div>
              
              <div className="px-6 pt-6 sm:pt-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái bài Test</p>
                  {hasTakenTest ? (
                      <p className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">Đã hoàn thành</p>
                  ) : (
                      <p className="text-base font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block border border-amber-100">Chưa làm bài</p>
                  )}
              </div>
              
              <div className="px-6 pt-6 sm:pt-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời lượng</p>
                  <p className="text-xl font-black text-slate-900">{hasTakenTest ? formatDuration(candidate.duration) : '---'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* TAB HIỂN THỊ KẾT QUẢ ĐƠN GIẢN */}
        <div className="mt-4">
            <div className="border-b-2 border-slate-200 mb-6 flex">
                <div className="border-b-2 border-blue-600 py-3 px-4 text-[15px] font-bold text-blue-600 bg-blue-50/50 rounded-t-lg">
                    Kết quả chi tiết
                </div>
            </div>

            {/* DANH SÁCH CÂU HỎI VÀ ĐÁP ÁN (DỮ LIỆU THẬT) */}
            <div className="space-y-6 animate-fadeIn">
              {!hasTakenTest ? (
                 <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">Ứng viên chưa làm bài kiểm tra</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Hệ thống đang chờ ứng viên hoàn thành để tính điểm.</p>
                 </div>
              ) : testDetails && testDetails.questions ? (
                testDetails.questions.map((q, idx) => {
                  
                  // So khớp đáp án ứng viên đã chọn (hỗ trợ cả Array và Object map)
                  let userAnswerIdx = candidate.answers[idx.toString()] ?? candidate.answers[idx];
                  
                  // Kiểm tra đúng / sai dựa trên field correctAnswer của Schema Assessment
                  const isCorrect = userAnswerIdx !== undefined && userAnswerIdx === q.correctAnswer;

                  return (
                    <div key={idx} className={`border-l-4 rounded-[20px] p-6 bg-white shadow-sm border border-slate-200 ${isCorrect ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-[15px] font-bold text-slate-800 pr-8 leading-relaxed">
                            Câu {idx + 1}: {q.question}
                        </h3>
                        <span className={`shrink-0 inline-flex items-center rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider border ${isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                        {/* Lựa chọn của ứng viên */}
                        <div className={`p-4 rounded-xl border ${isCorrect ? 'bg-slate-50 border-slate-200' : 'bg-red-50/50 border-red-100'}`}>
                          <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isCorrect ? 'text-slate-400' : 'text-red-500'}`}>Câu trả lời của ứng viên</p>
                          <div className={`flex items-start gap-2.5 font-semibold ${isCorrect ? 'text-slate-800' : 'text-red-700'}`}>
                            {isCorrect ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 shrink-0" />}
                            <span className="mt-0.5">{userAnswerIdx !== undefined && q.options ? q.options[userAnswerIdx] : '(Bỏ trống)'}</span>
                          </div>
                        </div>
                        
                        {/* Đáp án đúng (Chỉ hiển thị nếu ứng viên làm sai để đối chiếu) */}
                        {!isCorrect && (
                          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2">Đáp án đúng</p>
                            <div className="flex items-start gap-2.5 font-semibold text-emerald-800">
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                              <span className="mt-0.5">{q.options ? q.options[q.correctAnswer] : 'N/A'}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-500 font-bold">Không tải được nội dung câu hỏi đề thi...</div>
              )}
            </div>
        </div>

      </div>
    </div>
  );
}