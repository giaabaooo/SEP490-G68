import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, CheckCircle, XCircle, AlertCircle, AlertTriangle, ShieldCheck, ShieldAlert, Mail, Send, X } from 'lucide-react';
import { toast } from 'react-toastify';

export default function CandidateDetail() {
  const { id } = useParams(); // id của Application
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testDetails, setTestDetails] = useState(null);
  const [error, setError] = useState(null);

  // Trạng thái modal gửi email / thông báo
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [emailType, setEmailType] = useState('Pass');
  
  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const templates = {
    suitable: {
      subject: 'Thông báo: Hồ sơ ứng tuyển được đánh giá Phù hợp',
      content: (name, job) => `Thân gửi ${name},\n\nCảm ơn bạn đã quan tâm và ứng tuyển vào vị trí ${job} tại công ty chúng tôi.\n\nSau khi xem xét kỹ lưỡng hồ sơ và kết quả đánh giá, chúng tôi rất vui mừng thông báo rằng hồ sơ của bạn được đánh giá là PHÙ HỢP với các tiêu chí tuyển dụng của vị trí này.\n\nBộ phận tuyển dụng sẽ sớm liên hệ với bạn để trao đổi cụ thể về các bước tiếp theo.\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    },
    unsuitable: {
      subject: 'Thông báo về kết quả ứng tuyển',
      content: (name, job) => `Thân gửi ${name},\n\nCảm ơn bạn đã dành thời gian quan tâm và ứng tuyển vào vị trí ${job} tại công ty chúng tôi.\n\nSau khi xem xét kỹ lưỡng hồ sơ và các tiêu chí tuyển dụng hiện tại, chúng tôi rất tiếc phải thông báo hiện tại hồ sơ của bạn chưa thực sự phù hợp với yêu cầu của vị trí này.\n\nThông tin của bạn sẽ được lưu trữ trong hệ thống và chúng tôi sẽ chủ động liên hệ lại khi có cơ hội nghề nghiệp phù hợp hơn trong tương lai.\n\nChúc bạn luôn thành công trên con đường sự nghiệp!\n\nTrân trọng,\nĐội ngũ Tuyển dụng.`
    }
  };

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
          score: appData.testScore !== null && appData.testScore !== undefined ? appData.testScore : 0, 
          answers: appData.testAnswers || {}, 
          status: appData.status,
          testStatus: appData.testStatus,
          startedAt: appData.testStartedAt || appData.appliedAt,
          submittedAt: appData.testSubmittedAt || appData.appliedAt,
          duration: appData.testDuration || 0,
          tabSwitches: appData.tabSwitches || 0,
        });

        // 2. LẤY DỮ LIỆU BÀI TEST TỪ API ASSESSMENTS THẬT
        // Nếu appData.assessmentId đã được populate sẵn đầy đủ questions
        if (appData.assessmentId && typeof appData.assessmentId === 'object' && Array.isArray(appData.assessmentId.questions) && appData.assessmentId.questions.length > 0) {
          setTestDetails(appData.assessmentId);
        } else {
          // Trích xuất ID dạng string an toàn (tránh [object Object])
          const testIdToFetch = (typeof appData.assessmentId === 'object' ? appData.assessmentId?._id : appData.assessmentId) || 
                                (typeof appData.jobId?.assessmentId === 'object' ? appData.jobId?.assessmentId?._id : appData.jobId?.assessmentId); 

          if (testIdToFetch && testIdToFetch !== '[object Object]') {
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
              // Fallback tìm theo JobId
              const jId = appData.jobId?._id || appData.jobId;
              const fallbackRes = await fetch(`${API_URL}/api/assessments/my-tests`, {
                   headers: { 'Authorization': `Bearer ${token}` } 
              });
              if (fallbackRes.ok) {
                  const allTests = await fallbackRes.json();
                  const matchedTest = allTests.find(t => (t.jobId?._id || t.jobId) === jId);
                  if (matchedTest) setTestDetails(matchedTest);
              }
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

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!id || !candidate) return;
    try {
      setSendingEmail(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/applications/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ subject: emailSubject, content: emailContent, type: emailType })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi gửi thông báo');
      toast.success(data.message || 'Gửi thông báo thành công!');
      setIsNotifyModalOpen(false);
      setCandidate(prev => ({ ...prev, mailSentStatus: data.mailSentStatus }));
    } catch (err) {
      toast.error(err.message || 'Không thể gửi thông báo');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '---';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} phút ${s} giây`;
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN', { hour: '2-digit', minute:'2-digit' }) : '---';

  if (loading) return <div className="flex h-screen items-center justify-center text-slate-500 font-bold">Đang tải hồ sơ...</div>;
  if (error || !candidate) return <div className="flex h-screen items-center justify-center text-red-500 font-bold">{error || "Không tìm thấy dữ liệu"}</div>;

  const hasTakenTest = candidate.testStatus === 'Completed' || (candidate.answers && Object.keys(candidate.answers).length > 0);
  const jobRequiresTest = candidate.hasTest || !!candidate.assessmentId || !!candidate.jobId?.requireTest || !!testDetails;

  return (
    <div className="font-sans text-slate-800 bg-slate-50 min-h-screen pb-12">
      
      {/* Header Điều hướng */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shadow-sm sticky top-0 z-40">
         <div className="flex items-center gap-4">
           <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
              <h1 className="text-xl font-black text-slate-900 leading-tight">Chi tiết bài kiểm tra</h1>
              <p className="text-sm font-medium text-slate-500">Ứng viên: <span className="text-blue-600 font-bold">{candidate.name}</span> <span className="text-slate-400">({candidate.email})</span></p>
           </div>
         </div>

         <div className="flex items-center gap-3">
           {candidate.mailSentStatus && candidate.mailSentStatus !== 'Pending' && (
             <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
               candidate.mailSentStatus === 'Sent_Pass' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
             }`}>
               {candidate.mailSentStatus === 'Sent_Pass' ? '✓ Đã gửi thư mời/đạt' : '✗ Đã gửi thư từ chối'}
             </span>
           )}
           <button
             type="button"
             onClick={() => {
               setEmailSubject(templates.suitable.subject);
               setEmailContent(templates.suitable.content(candidate.name || 'Ứng viên', candidate.position || 'Vị trí ứng tuyển'));
               setEmailType('Pass');
               setIsNotifyModalOpen(true);
             }}
             className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-100 transition-all cursor-pointer"
           >
             <Mail className="w-4 h-4" />
             <span>Gửi Email / Thông báo</span>
           </button>
         </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 flex flex-col gap-6">
        
        {/* STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col justify-between min-h-[200px] shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Điểm tổng kết</p>
              {hasTakenTest ? (
                <div className="flex items-baseline gap-2 mt-2">
                  <span className={`text-6xl font-black tracking-tighter ${candidate.score >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {candidate.score}
                  </span>
                  <span className="text-2xl font-bold text-slate-300">/100</span>
                </div>
              ) : !jobRequiresTest ? (
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-400">Không có bài test</span>
                  <p className="text-xs text-slate-400 font-medium mt-1">Vị trí không yêu cầu kiểm tra</p>
                </div>
              ) : candidate.status === 'Rejected' ? (
                <div className="mt-2">
                  <span className="text-2xl font-black text-slate-400">Đã dừng tuyển</span>
                  <p className="text-xs text-slate-400 font-medium mt-1">Hồ sơ đã bị từ chối trước khi làm bài</p>
                </div>
              ) : (
                <div className="mt-2">
                  <span className="text-3xl font-black text-amber-500">Chưa làm</span>
                  <p className="text-xs text-amber-600 font-medium mt-1">Đang chờ ứng viên làm bài</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-5 border-t border-slate-100 text-sm font-bold text-slate-600 truncate">
                {testDetails?.assessmentName || (jobRequiresTest ? 'Bài kiểm tra năng lực' : 'Không áp dụng bài test')}
            </div>
          </div>
          
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-[24px] p-8 flex flex-col justify-center shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="px-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian bắt đầu</p>
                <p className="text-[15px] font-bold text-slate-800 mb-4">{hasTakenTest ? formatDate(candidate.startedAt) : '---'}</p>
                
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời gian nộp bài</p>
                <p className="text-[15px] font-bold text-slate-800">{hasTakenTest ? formatDate(candidate.submittedAt) : '---'}</p>
              </div>
              
              <div className="px-4 pt-6 sm:pt-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Trạng thái bài Test</p>
                  {!jobRequiresTest ? (
                      <p className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg inline-block border border-slate-200">
                        Không yêu cầu test
                      </p>
                  ) : hasTakenTest ? (
                      <p className="text-base font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg inline-block border border-emerald-100">
                        Đã hoàn thành
                      </p>
                  ) : candidate.status === 'Rejected' ? (
                      <p className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg inline-block border border-slate-200">
                        Đã dừng tuyển
                      </p>
                  ) : (
                      <p className="text-base font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-block border border-amber-100">
                        Chưa làm bài
                      </p>
                  )}
              </div>
              
              <div className="px-4 pt-6 sm:pt-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Thời lượng</p>
                  <p className="text-xl font-black text-slate-900">{hasTakenTest ? formatDuration(candidate.duration) : '---'}</p>
              </div>

              {/* Giám sát thi / Số lần cảnh báo rời màn hình */}
              <div className="px-4 pt-6 sm:pt-0">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Giám sát bài thi</p>
                  {hasTakenTest ? (
                      <div>
                          <div className="flex items-center gap-1.5 mb-1.5">
                              <span className={`text-2xl font-black ${
                                  (candidate.tabSwitches || 0) === 0 
                                      ? 'text-emerald-600' 
                                      : (candidate.tabSwitches || 0) < 3 ? 'text-amber-600' : 'text-red-600'
                              }`}>
                                  {candidate.tabSwitches || 0}
                              </span>
                              <span className="text-xs font-bold text-slate-500">lần rời tab</span>
                          </div>
                          {(candidate.tabSwitches || 0) === 0 ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                  Trung thực (0 vi phạm)
                              </span>
                          ) : (candidate.tabSwitches || 0) < 3 ? (
                              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  Cảnh báo nhẹ
                              </span>
                          ) : (
                              <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 inline-flex items-center gap-1 animate-pulse">
                                  <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                                  Nghi vấn gian lận
                              </span>
                          )}
                      </div>
                  ) : (
                      <p className="text-sm font-bold text-slate-400">---</p>
                  )}
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
              {!jobRequiresTest ? (
                 <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">Vị trí này không yêu cầu bài kiểm tra năng lực</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Hồ sơ ứng viên được sàng lọc qua CV và đánh giá trực tiếp qua phỏng vấn.</p>
                 </div>
              ) : !hasTakenTest ? (
                 <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                    <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800">Ứng viên chưa làm bài kiểm tra</h3>
                    <p className="text-slate-500 font-medium text-sm mt-1">Hệ thống đang chờ ứng viên hoàn thành bài test để tính điểm.</p>
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

      {/* Modal gửi thông báo cho ứng viên */}
      {isNotifyModalOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setIsNotifyModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 border border-slate-200 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Gửi thông báo cho ứng viên
              </h3>
              <button 
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors text-lg font-bold cursor-pointer" 
                onClick={() => setIsNotifyModalOpen(false)}
              >
                &times;
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-sm">
              <p className="text-slate-700 mb-1">Ứng viên: <strong className="text-slate-900">{candidate.name}</strong> ({candidate.email})</p>
              <p className="text-slate-700">Vị trí: <strong className="text-slate-900">{candidate.position}</strong></p>
            </div>

            <div className="mb-4">
              <label className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">Chọn mẫu nhanh</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'suitable', label: 'Phù hợp', type: 'Pass' }, 
                  { key: 'unsuitable', label: 'Không phù hợp', type: 'Reject' }
                ].map((t) => (
                  <button
                    key={t.key} 
                    type="button"
                    onClick={() => {
                      if (templates[t.key]) {
                        setEmailSubject(templates[t.key].subject);
                        setEmailContent(templates[t.key].content(candidate.name || 'Ứng viên', candidate.position || 'Vị trí ứng tuyển'));
                        setEmailType(t.type);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border cursor-pointer text-center ${
                      t.key === 'suitable'
                        ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">Loại thông báo</label>
                <select 
                  value={emailType} 
                  onChange={(e) => setEmailType(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold"
                >
                  <option value="Pass">Đạt / Mời tiếp tục (Xanh)</option>
                  <option value="Reject">Từ chối / Chưa phù hợp (Đỏ)</option>
                  <option value="Info">Thông tin chung</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">Tiêu đề Email</label>
                <input 
                  type="text" 
                  required 
                  value={emailSubject} 
                  onChange={(e) => setEmailSubject(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-900" 
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block mb-1">Nội dung thông báo / Email</label>
                <textarea 
                  required 
                  rows="6" 
                  value={emailContent} 
                  onChange={(e) => setEmailContent(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 font-medium text-slate-900 leading-relaxed"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer" 
                  onClick={() => setIsNotifyModalOpen(false)}
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  disabled={sendingEmail} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md shadow-blue-100 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  {sendingEmail ? 'Đang gửi...' : 'Gửi Email Thông Báo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}