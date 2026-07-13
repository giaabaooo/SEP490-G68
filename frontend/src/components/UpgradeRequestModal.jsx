// File: src/components/UpgradeRequestModal.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UpgradeRequestModal = ({ isOpen, onClose, title, message, currentPlan, targetPlan }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-scaleUp">
                {/* Header Image / Gradient */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    <span className="material-symbols-outlined text-6xl text-white/90 drop-shadow-lg">lock</span>
                </div>

                <div className="p-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{title || "Mở khóa tính năng VIP"}</h3>
                    <p className="text-gray-500 mb-6 leading-relaxed">
                        {message || "Tính năng này chỉ dành cho tài khoản cao cấp. Nâng cấp ngay để mở khóa toàn bộ sức mạnh của AI!"}
                    </p>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate('/candidate/upgrade-account')}
                            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold shadow-lg shadow-yellow-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">workspace_premium</span>
                            Nâng cấp lên {targetPlan || "Premium"}
                        </button>
                        
                        <button 
                            onClick={onClose}
                            className="w-full py-3 px-6 rounded-xl text-gray-500 font-medium hover:bg-gray-50 transition-colors"
                        >
                            Để sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpgradeRequestModal;