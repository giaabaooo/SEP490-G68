import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, Info, X, Loader2 } from 'lucide-react';

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Xác nhận thao tác',
    message,
    confirmText = 'Xác nhận',
    cancelText = 'Hủy',
    type = 'warning', // 'danger' | 'warning' | 'info' | 'success'
    isLoading = false,
    icon: CustomIcon,
    confirmBtnClass,
    cancelBtnClass,
    children
}) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !isLoading) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isLoading, onClose]);

    if (!isOpen) return null;

    // Cấu hình theme theo loại Modal
    const config = {
        danger: {
            icon: AlertTriangle,
            iconBg: 'bg-red-100 text-red-600 border-red-200',
            btnBg: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25',
        },
        warning: {
            icon: AlertCircle,
            iconBg: 'bg-amber-100 text-amber-600 border-amber-200',
            btnBg: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
        },
        info: {
            icon: Info,
            iconBg: 'bg-blue-100 text-blue-600 border-blue-200',
            btnBg: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25',
        },
        success: {
            icon: CheckCircle2,
            iconBg: 'bg-emerald-100 text-emerald-600 border-emerald-200',
            btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25',
        }
    };

    const currentTheme = config[type] || config.warning;
    const IconComponent = CustomIcon || currentTheme.icon;

    return (
        <div 
            className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => { if (!isLoading) onClose(); }}
        >
            <div 
                className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-150 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Nút đóng góc phải */}
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
                    title="Đóng"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Icon tròn */}
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl border flex items-center justify-center ${currentTheme.iconBg}`}>
                    <IconComponent className="w-7 h-7" />
                </div>

                {/* Tiêu đề */}
                <h3 className="text-xl font-black text-slate-900 mb-2.5">
                    {title}
                </h3>

                {/* Nội dung thông báo */}
                {message && (
                    <div className="text-sm text-slate-600 mb-5 leading-relaxed">
                        {typeof message === 'string' ? <p>{message}</p> : message}
                    </div>
                )}

                {/* Nội dung bổ sung tùy biến */}
                {children && (
                    <div className="mb-5 text-left">
                        {children}
                    </div>
                )}

                {/* Các nút hành động */}
                <div className="flex items-center gap-3 pt-2">
                    {cancelText && (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer disabled:opacity-50 ${cancelBtnClass || ''}`}
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${confirmBtnClass || currentTheme.btnBg}`}
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
