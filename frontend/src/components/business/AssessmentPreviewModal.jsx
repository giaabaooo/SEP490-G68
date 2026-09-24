import { CheckCircle2, Clock3, FileQuestion, Loader2, X } from 'lucide-react';

const optionLabel = (index) => String.fromCharCode(65 + index);

export default function AssessmentPreviewModal({ isOpen, onClose, tests, loading }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Bài test đã được Moderator xuất bản</h2>
            <p className="mt-1 text-xs font-medium text-slate-500">HR chỉ có quyền xem nội dung, câu hỏi và đáp án.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-500 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-88px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-48 items-center justify-center text-slate-500">
              <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Đang tải bài test...
            </div>
          ) : tests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center font-bold text-slate-500">
              Chưa tìm thấy bài test của công việc này.
            </div>
          ) : (
            <div className="space-y-6">
              {tests.map((test, testIndex) => (
                <section key={test._id || testIndex} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-5 py-4">
                    <div>
                      <h3 className="font-black text-slate-900">{test.assessmentName || `Bài test ${testIndex + 1}`}</h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {test.timeLimit || 0} phút</span>
                        <span className="inline-flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" /> {test.questions?.length || 0} câu</span>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black ${test.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {test.status === 'PUBLISHED' ? 'ĐÃ PUBLISH' : 'BẢN NHÁP'}
                    </span>
                  </div>

                  <div className="space-y-4 p-5">
                    {(test.questions || []).map((question, questionIndex) => (
                      <div key={`${test._id || testIndex}-${questionIndex}`} className="rounded-xl border border-slate-200 p-4">
                        <div className="mb-3 flex items-start gap-2">
                          <span className="rounded-lg bg-blue-100 px-2 py-1 text-xs font-black text-blue-700">Câu {questionIndex + 1}</span>
                          <p className="font-bold leading-relaxed text-slate-900">{question.question}</p>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {(question.options || []).map((option, optionIndex) => {
                            const isCorrect = optionIndex === question.correctAnswer;
                            return (
                              <div key={optionIndex} className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${isCorrect ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}>
                                <span>{optionLabel(optionIndex)}.</span>
                                <span className="flex-1">{option}</span>
                                {isCorrect && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
