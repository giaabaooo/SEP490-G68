import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Briefcase, DollarSign, Clock, Bookmark, Loader2 } from 'lucide-react';
import { getSavedJobs, toggleSavedJob } from '../../utils/savedJobs';

const SavedJobs = () => {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSavedJobs = () => {
      setSavedJobs(getSavedJobs());
      setLoading(false);
    };

    loadSavedJobs();
    window.addEventListener('saved-jobs-updated', loadSavedJobs);
    return () => window.removeEventListener('saved-jobs-updated', loadSavedJobs);
  }, []);

  const handleToggleSaved = (job) => {
    const result = toggleSavedJob(job);
    setSavedJobs(result.jobs);
  };

  const jobs = useMemo(() => savedJobs, [savedJobs]);

  return (
    <div className="bg-slate-50 min-h-screen pb-12 font-inter">
      <div className="bg-gradient-to-b from-slate-900 to-slate-800 pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Việc làm đã lưu</h1>
          <p className="text-slate-300">Danh sách công việc bạn đã lưu để xem lại sau.</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
            <p className="text-slate-500 font-medium">Đang tải danh sách đã lưu...</p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => {
              const jobId = job._id || job.id;
              return (
                <div key={jobId} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group relative">
                  <div className="flex flex-col md:flex-row gap-5">
                    <Link to={`/jobs/${jobId}`} className="flex-1 flex flex-col md:flex-row gap-5">
                      <div className="w-16 h-16 rounded-xl border border-slate-100 p-1 shrink-0 overflow-hidden flex items-center justify-center bg-white">
                        <img src={job.companyLogo || `https://ui-avatars.com/api/?name=${job.companyName}&background=eff6ff&color=059669`} alt={job.companyName} className="w-full h-full object-contain" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">{job.title}</h2>
                        <p className="text-sm font-semibold text-slate-500 mt-1">{job.companyName}</p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm font-medium text-slate-600">
                          <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location || 'Chưa cập nhật'}</div>
                          <div className="flex items-center gap-1.5 text-emerald-600"><DollarSign className="w-4 h-4" /> {job.salary || 'Thỏa thuận'}</div>
                          <div className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.experience}</div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md">{job.type}</span>
                          {job.tags && job.tags.slice(0, 3).map((tag, idx) => (
                            <span key={idx} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </Link>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start mt-4 md:mt-0 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleSaved(job);
                        }}
                        className="text-emerald-600 transition-colors mb-auto hidden md:block"
                        aria-label="Bỏ lưu việc làm"
                      >
                        <Bookmark className="w-5 h-5 fill-current" />
                      </button>
                      <div className="flex items-center gap-1 text-xs font-medium text-slate-400 mt-auto">
                        <Clock className="w-3.5 h-3.5" />
                        {job.postedAt ? new Date(job.postedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa có việc làm nào được lưu</h3>
            <p className="text-slate-500 font-medium text-sm">Hãy quay lại trang việc làm để lưu những cơ hội phù hợp.</p>
            <Link to="/jobs" className="inline-flex mt-6 bg-emerald-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-emerald-700 transition-colors">Xem việc làm</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedJobs;
