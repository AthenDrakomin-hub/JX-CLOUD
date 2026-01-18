import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Copy, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { s3Service } from '../services/s3Service';
import { Language, getTranslation } from '../translations';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (imageUrl: string) => void;
  lang: Language;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ 
  isOpen, 
  onClose, 
  onSelectImage, 
  lang 
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedImages, setUploadedImages] = useState<{url: string, key: string}[]>([]);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('invalid_image_format'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const path = await s3Service.uploadFile(file);
      // Use the s3Service to get the proper public URL instead of hardcoded URL
      const imageUrl = await s3Service.getPublicUrl(path);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      setUploadedImages(prev => [{ url: imageUrl, key: path }, ...prev]);
      onSelectImage(imageUrl);
      
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setIsUploading(false);
      setUploadProgress(0);
      alert(t('upload_failed'));
    }
  };

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
        <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ImageIcon size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('image_library')}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Asset Management Center</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-950 transition-all shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/30">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
            <h4 className="text-lg font-black text-slate-900 mb-4">{t('upload_new_image')}</h4>
            <div 
              className={`border-2 border-dashed rounded-[2rem] p-12 text-center cursor-pointer transition-all ${
                isUploading 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
              }`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
                      style={{ transform: 'rotate(0deg)', transition: 'transform 0.5s linear' }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-blue-600 font-black text-sm">{uploadProgress}%</span>
                    </div>
                  </div>
                  <p className="text-slate-600 font-bold">{t('uploading')}...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Upload size={32} className="text-slate-400" />
                  </div>
                  <p className="text-slate-600 font-bold mb-2">{t('click_upload_image')}</p>
                  <p className="text-slate-400 text-sm">{t('supported_formats')}</p>
                </div>
              )}
            </div>
          </div>

          {uploadedImages.length > 0 && (
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200">
              <h4 className="text-lg font-black text-slate-900 mb-4">{t('recent_uploads')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {uploadedImages.slice(0, 8).map((img, index) => (
                  <div key={index} className="group relative bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
                    <img 
                      src={img.url} 
                      alt={img.key} 
                      className="w-full h-32 object-cover cursor-pointer"
                      onClick={() => onSelectImage(img.url)}
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                      <button
                        onClick={() => copyToClipboard(img.url)}
                        className={`p-2 rounded-lg transition-all ${
                          copiedUrl === img.url 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white text-slate-900 hover:bg-blue-600 hover:text-white'
                        }`}
                      >
                        {copiedUrl === img.url ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                      <button
                        onClick={() => onSelectImage(img.url)}
                        className="p-2 bg-white text-slate-900 rounded-lg hover:bg-green-500 hover:text-white transition-all"
                      >
                        <ImageIcon size={16} />
                      </button>
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-[10px] text-slate-500 truncate">{img.key.split('-').slice(1).join('-')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-white flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-10 py-4 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-slate-200 transition-all"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;