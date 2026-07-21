import { toast } from 'react-toastify';

const STORAGE_PREFIX = 'careerio_saved_jobs';

const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;

  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const getStorageKey = () => {
  const user = getCurrentUser();
  const userKey = user?._id || user?.id || user?.email || 'guest';
  return `${STORAGE_PREFIX}:${userKey}`;
};

export const getSavedJobs = () => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(getStorageKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveSavedJobs = (jobs) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(), JSON.stringify(jobs));
};

export const isJobSaved = (jobId) => {
  const savedJobs = getSavedJobs();
  return savedJobs.some((job) => String(job._id || job.id) === String(jobId));
};

export const toggleSavedJob = (job, toastFn = toast) => {
  const currentUser = getCurrentUser();

  if (!currentUser || currentUser.role !== 'candidate') {
    toastFn?.info('Vui lòng đăng nhập bằng tài khoản Ứng viên để lưu việc làm.');
    return { saved: false, jobs: [] };
  }

  const normalizedJob = {
    ...job,
    _id: job?._id || job?.id,
    id: job?._id || job?.id,
  };

  const savedJobs = getSavedJobs();
  const exists = savedJobs.some((item) => String(item._id || item.id) === String(normalizedJob._id || normalizedJob.id));

  const nextJobs = exists
    ? savedJobs.filter((item) => String(item._id || item.id) !== String(normalizedJob._id || normalizedJob.id))
    : [normalizedJob, ...savedJobs];

  saveSavedJobs(nextJobs);
  toastFn?.success(exists ? 'Đã bỏ lưu việc làm này.' : 'Đã lưu việc làm này.');

  return { saved: !exists, jobs: nextJobs };
};
