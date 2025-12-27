
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

      {/* 错误占位 */}
      {status === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200">
          <AlertCircle className="text-slate-300 mb-2" size={20} />
          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Image Unavailable</span>
        </div>
      )}

      {/* 实际图片 */}
      <img
        src={imgSrc}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover transition-all duration-1000 ease-out
          ${status === 'loaded' ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-105 blur-lg'}`}
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
