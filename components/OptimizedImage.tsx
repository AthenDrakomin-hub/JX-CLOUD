
import React, { useState, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({ src, alt, className = '', aspectRatio = 'aspect-square' }) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imgSrc, setImgSrc] = useState(src);

  useEffect(() => {
    // 如果 src 为空或无效，直接显示错误
    if (!src || src.trim() === '') {
      setStatus('error');
      return;
    }
    setStatus('loading');
    setImgSrc(src);
  }, [src]);

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${aspectRatio} ${className}`}>
      {/* 骨架屏 / 加载占位 */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="w-full h-full bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite] shadow-inner" />
          <ImageIcon className="absolute text-slate-300 opacity-50" size={24} />
        </div>
      )}

      {/* 错误占位 (当您的 URL 失效或格式错误时显示) */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200">
          <AlertCircle className="text-slate-300 mb-2" size={20} />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center px-4">链接失效或无法访问</span>
        </div>
      )}

      {/* 实际图片渲染 - 支持任意网络 URL */}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-700 ease-out
          ${status === 'loaded' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default OptimizedImage;
