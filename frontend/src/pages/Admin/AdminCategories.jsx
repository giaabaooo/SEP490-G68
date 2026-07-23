import React, { useEffect, useMemo, useState } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Loader2, 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { toast } from 'react-toastify';

const API_BASE_URL = 'http://localhost:5000/api';

const initialForm = {
  name: '',
  description: '',
  isActive: true,
};

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = useMemo(() => localStorage.getItem('token'), []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/categories?search=${encodeURIComponent(search)}&page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Không thể tải danh sách ngành nghề');
      }
      setCategories(data.categories || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (error) {
      toast.error(error.message || 'Lỗi khi tải ngành nghề');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchCategories(), 300);
    return () => clearTimeout(timer);
  }, [search, page, token]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingId(category._id);
    setForm({
      name: category.name || '',
      description: category.description || '',
      isActive: category.isActive !== false,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      return toast.warning('Tên ngành nghề là bắt buộc');
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/admin/categories${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          isActive: form.isActive,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Thao tác thất bại');
      }
      toast.success(data.message || (editingId ? 'Cập nhật thành công!' : 'Thêm mới thành công!'));
      closeModal();
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Đã xảy ra lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ngành nghề này không?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Xóa thất bại');
      }
      toast.success(data.message || 'Đã xóa ngành nghề!');
      fetchCategories();
    } catch (error) {
      toast.error(error.message || 'Không thể xóa ngành nghề');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-blue-600" />
            Quản lý ngành nghề
          </h1>
          <p className="text-slate-500 mt-2">
            Tạo, chỉnh sửa và quản lý các ngành nghề hiển thị trên hệ thống
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Thêm ngành nghề mới
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm ngành nghề..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs uppercase tracking-wider text-slate-500 font-bold bg-white border-b border-slate-100">
                <th className="p-5">Tên ngành nghề</th>
                <th className="p-5">Mô tả</th>
                <th className="p-5">Trạng thái</th>
                <th className="p-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center p-10">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-10 text-slate-500">
                    Không tìm thấy ngành nghề nào.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-5 text-slate-800 font-bold">{category.name}</td>
                    <td className="p-5 text-slate-500 max-w-md truncate">
                      {category.description || '—'}
                    </td>
                    <td className="p-5">
                      {category.isActive ? (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg text-xs">
                          Hiển thị
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-red-50 text-red-700 font-bold rounded-lg text-xs">
                          Đã ẩn
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(category)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category._id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <span className="text-sm text-slate-500 font-medium">
            Trang <span className="font-bold text-slate-800">{pagination.page || page}</span> / {pagination.totalPages || 1}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <button
              type="button"
              disabled={page >= (pagination.totalPages || 1) || loading}
              onClick={() => setPage((prev) => prev + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 transition-colors text-sm flex items-center gap-1"
            >
              Sau <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-xl border border-slate-200 relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">
                {editingId ? 'Chỉnh sửa ngành nghề' : 'Thêm ngành nghề mới'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tên ngành nghề</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  placeholder="Nhập tên ngành nghề..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả</label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium text-slate-800"
                  placeholder="Nhập mô tả ngành nghề..."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Trạng thái</label>
                <select
                  value={form.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 bg-white"
                >
                  <option value="active">Hiển thị</option>
                  <option value="inactive">Đã ẩn</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {editingId ? 'Cập nhật' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;