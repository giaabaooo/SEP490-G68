import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();
  const [isVisible, setIsVisible] = useState(false);

  // 1. Tự động cuộn lên đầu trang mỗi khi chuyển route / URL
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname, search]);

  // 2. Theo dõi vị trí cuộn chuột để hiển thị nút "Lên đầu trang"
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 280) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTopSmooth = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      {isVisible && (
        <button
          type="button"
          onClick={scrollToTopSmooth}
          aria-label="Cuộn lên đầu trang"
          title="Cuộn lên đầu trang"
          className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl shadow-blue-500/25 border border-white/20 hover:from-blue-700 hover:to-indigo-700 hover:scale-110 hover:shadow-2xl transition-all duration-300 flex items-center justify-center group cursor-pointer animate-fade-in"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-bold transition-all duration-300 group-hover:max-w-xs group-hover:ml-1.5 opacity-0 group-hover:opacity-100">
            Lên đầu trang
          </span>
        </button>
      )}
    </>
  );
};

export default ScrollToTop;
