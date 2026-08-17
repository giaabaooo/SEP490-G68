import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Sparkles, FileText, UploadCloud, Edit3, X } from 'lucide-react';

const MiniTemplatePreview = ({ layout, color }) => {
  return (
    <div className="w-full h-full bg-white p-3 sm:p-4 flex flex-col gap-3 pointer-events-none select-none overflow-hidden scale-100 transform origin-top">
      {layout === '2-col' && (
        <>
          <div className="w-full h-8 rounded-sm" style={{ backgroundColor: color }}></div>
          <div className="flex gap-3 flex-1 overflow-hidden">
            <div className="w-1/3 flex flex-col gap-2 border-r border-slate-100 pr-2">
              <div className="w-10 h-10 rounded-full bg-slate-200 mb-2"></div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-3/4 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2"></div>
              <div className="w-1/2 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
            <div className="w-2/3 flex flex-col gap-3">
              <div className="w-1/2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
              <div className="w-5/6 h-1.5 bg-slate-100 rounded-full mb-1"></div>
              <div className="w-1/2 h-2 rounded-full" style={{ backgroundColor: color }}></div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
              <div className="w-4/5 h-1.5 bg-slate-100 rounded-full"></div>
            </div>
          </div>
        </>
      )}

      {layout === 'minimalist' && (
        <>
          <div className="flex flex-col gap-2 border-b-2 pb-3 mb-1" style={{ borderColor: color }}>
            <div className="w-1/2 h-4 rounded-full" style={{ backgroundColor: color }}></div>
            <div className="flex gap-2">
              <div className="w-12 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="w-1/3 h-2 rounded-full mt-1" style={{ backgroundColor: color }}></div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-3/4 h-1.5 bg-slate-100 rounded-full"></div>
            
            <div className="w-1/3 h-2 rounded-full mt-2" style={{ backgroundColor: color }}></div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-5/6 h-1.5 bg-slate-100 rounded-full"></div>
          </div>
        </>
      )}

      {layout === 'classic' && (
        <div className="flex flex-col items-center gap-2 h-full">
          <div className="w-1/2 h-3 bg-slate-700 rounded-full mt-2 mb-1"></div>
          <div className="flex gap-2 mb-3">
            <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
            <div className="w-10 h-1 bg-slate-200 rounded-full"></div>
          </div>
          <div className="w-full flex flex-col gap-3">
            <div className="w-full border-b border-slate-300 pb-1">
              <div className="w-1/4 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full"></div>
            
            <div className="w-full border-b border-slate-300 pb-1 mt-2">
              <div className="w-1/4 h-2 rounded-full" style={{ backgroundColor: color }}></div>
            </div>
            <div className="flex justify-between">
              <div className="w-1/3 h-1.5 bg-slate-200 rounded-full"></div>
              <div className="w-1/5 h-1.5 bg-slate-100 rounded-full"></div>
            </div>
            <div className="w-full h-1.5 bg-slate-50 rounded-full"></div>
            <div className="w-5/6 h-1.5 bg-slate-50 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
};

const TemplateCV = () => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [isUploading, setIsUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const aiReviewData = location.state?.aiReviewData; 
  
  const pendingFile = location.state?.pendingFile; 

  const recommendedTemplates = [
    { name: "Tech CV", targetIndustry: "Web / App Developer", designConfig: { primaryColor: "#8b5cf6", fontFamily: "Roboto", layout: "2-col" } },
    { name: "Marketing CV", targetIndustry: "Digital Marketing", designConfig: { primaryColor: "#f97316", fontFamily: "Inter", layout: "minimalist" } },
    { name: "Finance CV", targetIndustry: "Finance / Blockchain", designConfig: { primaryColor: "#0ea5e9", fontFamily: "Times New Roman", layout: "classic" } }
  ];

  const templates = [
    { id: 1, name: 'Tiêu chuẩn', type: 'ATS', author: 'Đơn giản', color: '#1e293b', layout: 'classic' },
    { id: 2, name: 'Thanh lịch', type: 'ATS', author: 'Tối giản', color: '#0ea5e9', layout: 'minimalist' },
    { id: 3, name: 'Hiện Đại', type: 'Mới', author: 'Sáng tạo', color: '#10b981', layout: '2-col' },
    { id: 4, name: 'Ấn tượng', type: 'Sáng tạo', author: 'Chuyên nghiệp', color: '#f43f5e', layout: '2-col' },
  ];

  const filters = ['Tất cả', 'Đơn giản', 'Chuyên nghiệp', 'Hiện đại', 'Ấn tượng', 'Harvard', 'ATS'];

  const openModal = async (template) => {
    // FIX: Bắt login tại đây để không chặn khách xem giao diện bên ngoài
    if (!localStorage.getItem('token')) {
        toast.info('Vui lòng đăng nhập để bắt đầu tạo CV!');
        navigate('/login');
        return;
    }

    setSelectedTemplate(template);
    
    const templateConfig = template.designConfig || { 
        primaryColor: template.color, 
        fontFamily: "Roboto", 
        layout: template.layout 
    };

    if (pendingFile) {
        setIsUploading(true);
        const toastId = toast.loading('Đang chuyển dữ liệu từ file PDF của bạn vào mẫu mới...');
        
        const formData = new FormData();
        formData.append('cvFile', pendingFile);
        
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/cv/parse-pdf`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const result = await response.json();
          
          if (response.ok && result.parsedData) {
            toast.update(toastId, { render: "Đã đổ dữ liệu thành công!", type: "success", isLoading: false, autoClose: 2000 });
            navigate('/candidate/cv-builder', { 
              state: { 
                parsedData: result.parsedData,
                dynamicConfig: templateConfig,
                aiReviewData: aiReviewData 
              } 
            });
          } else {
            throw new Error(result.message || "Không thể bóc tách dữ liệu.");
          }
        } catch (error) {
          toast.update(toastId, { render: "Lỗi trích xuất: " + error.message, type: "error", isLoading: false, autoClose: 3000 });
          setIsModalOpen(true); 
        } finally {
          setIsUploading(false);
        }
    } else {
        setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTemplate(null);
  };

  const handleCreateBlank = () => {
    closeModal();
    const templateConfig = selectedTemplate?.designConfig || (selectedTemplate ? { 
        primaryColor: selectedTemplate.color, fontFamily: "Roboto", layout: selectedTemplate.layout 
    } : null);

    navigate('/candidate/cv-builder', { 
      state: { 
         dynamicConfig: templateConfig,
         aiReviewData: aiReviewData
      } 
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return toast.error('Hệ thống chỉ hỗ trợ định dạng PDF.');
    }

    const templateConfig = selectedTemplate?.designConfig || (selectedTemplate ? { 
        primaryColor: selectedTemplate.color, fontFamily: "Roboto", layout: selectedTemplate.layout 
    } : null);

    const formData = new FormData();
    formData.append('cvFile', file);
    setIsUploading(true);
    const toastId = toast.loading('Hệ thống đang phân tích và bóc tách dữ liệu CV của bạn...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/cv/parse-pdf`,  {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.parsedData) {
        toast.update(toastId, { render: "Bóc tách thành công! Đang chuyển trang...", type: "success", isLoading: false, autoClose: 2000 });
        closeModal();
        navigate('/candidate/cv-builder', { 
          state: { 
            parsedData: result.parsedData,
            dynamicConfig: templateConfig,
            aiReviewData: aiReviewData 
          } 
        });
      } else {
        throw new Error(result.message || "Không thể bóc tách dữ liệu.");
      }
    } catch (error) {
      toast.update(toastId, { render: "Lỗi: " + error.message, type: "error", isLoading: false, autoClose: 3000 });
    } finally {
      setIsUploading(false);
      e.target.value = null; 
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans animate-fade-in">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="max-w-6xl mx-auto">
        
        {aiReviewData && aiReviewData.score < 60 && (
            <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-4 animate-scale-in">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                    <h3 className="font-black text-amber-800 text-lg">Tạo CV mới để tối ưu điểm số!</h3>
                    <p className="text-amber-700 font-medium text-sm">Vui lòng chọn 1 Template dưới đây để viết lại CV theo hướng dẫn của AI nhé.</p>
                </div>
            </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 tracking-tight">Danh sách mẫu CV xin việc chuẩn 2026</h1>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto">
            Các mẫu CV được thiết kế theo chuẩn, đa dạng phong cách, tối ưu hoá cho hệ thống quét tự động ATS giúp bạn dễ dàng ghi điểm với nhà tuyển dụng.
          </p>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-200"></div>
            <h2 className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-wider">
              <Sparkles className="w-5 h-5" /> Mới: Mẫu CV Gợi Ý Tuần Này
            </h2>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendedTemplates.map(tpl => (
              <div key={tpl.name} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-emerald-300 transition-all group">
                <div className="aspect-[1/1.414] bg-slate-100 relative border-b border-slate-100 overflow-hidden flex items-center justify-center p-4">
                  <div className="w-full h-full bg-white shadow-sm border border-slate-200">
                    <MiniTemplatePreview layout={tpl.designConfig.layout} color={tpl.designConfig.primaryColor} />
                  </div>
                  
                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => openModal(tpl)}
                      className="text-white font-bold px-6 py-2.5 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 cursor-pointer"
                      style={{ backgroundColor: tpl.designConfig.primaryColor }}
                    >
                      Dùng mẫu này
                    </button>
                  </div>
                </div>
                
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-1" style={{ color: tpl.designConfig.primaryColor }}>{tpl.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">HOT</span>
                    <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded">Dành cho {tpl.targetIndustry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-slate-200"></div>
            <h2 className="text-slate-500 font-black text-sm uppercase tracking-wider">
              Thư Viện Mẫu Tiêu Chuẩn
            </h2>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {filters.map(filter => (
              <button 
                key={filter} 
                onClick={() => setActiveFilter(filter)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition-all border ${activeFilter === filter ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500 hover:text-emerald-600'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {templates.map(tpl => (
              <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all group">
                <div className="aspect-[1/1.414] bg-slate-100 relative border-b border-slate-100 overflow-hidden p-3">
                   <div className="w-full h-full bg-white shadow-sm border border-slate-200">
                    <MiniTemplatePreview layout={tpl.layout} color={tpl.color} />
                  </div>

                  <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button 
                      onClick={() => openModal(tpl)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:scale-105 text-sm cursor-pointer"
                    >
                      Dùng mẫu này
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-base mb-2">{tpl.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">{tpl.type}</span>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">{tpl.author}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in p-4" onClick={closeModal}>
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors" onClick={closeModal}>
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-slate-900 mb-6 text-center">Bạn muốn tạo CV từ đâu?</h3>
            
            <div className="space-y-4">
              <label className={`block border border-slate-200 rounded-2xl p-5 hover:border-emerald-500 hover:bg-emerald-50 transition-all group ${isUploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input type="file" accept="application/pdf" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUploading ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'}`}>
                    {isUploading ? <UploadCloud className="w-6 h-6 animate-pulse" /> : <FileText className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">Dùng công cụ trích xuất CV cũ</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {isUploading ? 'Hệ thống đang đọc dữ liệu, vui lòng chờ...' : 'Tải lên CV cũ (PDF), hệ thống sẽ tự động đọc thông tin và điền vào mẫu mới.'}
                    </p>
                  </div>
                </div>
              </label>

              <div 
                className={`block border border-slate-200 rounded-2xl p-5 hover:border-blue-500 hover:bg-blue-50 transition-all group ${isUploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : 'cursor-pointer'}`}
                onClick={!isUploading ? handleCreateBlank : undefined}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-200 transition-colors">
                    <Edit3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base mb-1">Tạo CV từ đầu</h4>
                    <p className="text-sm text-slate-500 font-medium">Bắt đầu bằng một khung trắng và tự tay điền từng thông tin của bạn vào hệ thống.</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateCV;