
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Cloud, Upload, Trash2, Copy, Search, RefreshCcw, 
  Image as ImageIcon, Check, Loader2, Sparkles, Filter, 
  ExternalLink, Eye, Maximize2, X, Download, FileType
} from 'lucide-react';
import { s3Service, S3File } from '../services/s3Service';
import { Language, getTranslation } from '../translations';
import OptimizedImage from './OptimizedImage';

interface ImageManagementProps {
  lang: Language;
}

const ImageManagement: React.FC<ImageManagementProps> = ({ lang }) => {
  const [files, setFiles] = useState<S3File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<S3File | null>(null);

  const t = useCallback((key: string, params?: any) => getTranslation(lang, key, params), [lang]);

  const fetchFiles = useCallback(async (showFullLoader = true) => {
    if (showFullLoader) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await s3Service.listFiles();
      setFiles(data);
    } catch (err) {
      console.error("Failed to sync cloud storage:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(t('error'));
      return;
    }

    setIsUploading(true);
    try {
      await s3Service.uploadFile(file);
      await fetchFiles(false);
    } catch (err) {
      alert(t('error'));
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(t('permanently_delete'))) return;
    
    try {
      await s3Service.deleteFile(key);
      setFiles(prev => prev.filter(f => f.key !== key));
      if (previewImage?.key === key) setPreviewImage(null);
    } catch (err) {
      alert(t('error'));
    }
  };

  const copyToClipboard = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredFiles = files.filter(f => 
    f.key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-10 animate-fade-up max-w-[1500px] mx-auto">
      {/* Bento Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-center min-h-[180px]">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
           <div className="relative z-10 space-y-2">
              <div className="flex items-center space-x-2 text-blue-600">
                 <Cloud size={18} className="animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('cloud_gateway')}</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">{t('visual_center')}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {t('vault_info', { name: 'jiangxiyunchu', count: files.length })}
              </p>
           </div>
        </div>

        <div className="bg-slate-950 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center space-y-6 border border-white/5">
           <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Op Command</p>
              <button 
                onClick={() => fetchFiles(false)} 
                disabled={isRefreshing}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
           </div>
           <label className={`group flex items-center justify-center space-x-4 h-18 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all cursor-pointer shadow-xl active-scale-95 ${isUploading ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 text-white hover:bg-white hover:text-slate-950'}`}>
              {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
              <span>{isUploading ? t('syncing') : t('upload_new')}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
           </label>
        </div>
      </div>

      {/* Sticky Filter Bar */}
      <div className="bg-white/70 backdrop-blur-2xl p-4 rounded-[2rem] border border-slate-200 shadow-sm flex items-center px-8 sticky top-28 z-30">
        <Search className="text-slate-300 mr-4" size={20} />
        <input 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder={t('search')}
          className="bg-transparent border-none outline-none font-bold text-sm w-full py-2 text-slate-900 placeholder:text-slate-300" 
        />
        <div className="hidden md:flex items-center space-x-2 ml-4 px-5 border-l border-slate-200">
           <Filter size={16} className="text-slate-300" />
           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">{filteredFiles.length} {lang === 'zh' ? '个结果' : 'Results'}</span>
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-6">
           <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synchronizing Objects...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="h-[400px] bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-200 space-y-6">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center"><ImageIcon size={40} className="opacity-20" /></div>
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('noData')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 pb-32">
          {filteredFiles.map((file, idx) => (
            <div 
              key={file.key} 
              className="group bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4" 
              style={{ animationDelay: `${idx * 30}ms` }}
            >
               <div className="relative aspect-square overflow-hidden bg-slate-50 p-2">
                  <OptimizedImage src={file.url} alt={file.key} className="w-full h-full object-cover rounded-[2rem] transition-transform duration-[3s] group-hover:scale-110" />
                  
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6 space-y-2 backdrop-blur-[2px]">
                     <div className="flex gap-2 w-full">
                        <button 
                          onClick={() => setPreviewImage(file)}
                          className="flex-1 py-3 bg-white/20 hover:bg-white text-white hover:text-slate-950 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border border-white/20"
                        >
                          <Eye size={14} />
                          <span>{t('preview')}</span>
                        </button>
                        <button 
                          onClick={() => copyToClipboard(file.url, file.key)}
                          className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${copiedKey === file.key ? 'bg-emerald-500 text-white' : 'bg-white text-slate-950 hover:bg-blue-600 hover:text-white'}`}
                        >
                          {copiedKey === file.key ? <Check size={14} /> : <Copy size={14} />}
                          <span>{copiedKey === file.key ? t('copied') : t('copy_url')}</span>
                        </button>
                     </div>
                     <button 
                       onClick={() => handleDelete(file.key)}
                       className="w-full py-3 bg-red-500/80 hover:bg-red-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all border border-red-400/20"
                     >
                       <Trash2 size={14} />
                       <span>{t('permanently_delete')}</span>
                     </button>
                  </div>
               </div>

               <div className="p-6 space-y-2">
                  <h4 className="font-bold text-slate-900 truncate text-xs tracking-tight">{file.key.split('-').slice(1).join('-') || file.key}</h4>
                  <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                     <div className="flex items-center space-x-1">
                        <FileType size={10} />
                        <span>{formatSize(file.size)}</span>
                     </div>
                     <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-20 bg-slate-950/95 backdrop-blur-3xl animate-in fade-in duration-500">
           <div className="absolute top-10 right-10 flex items-center space-x-4 z-50">
              <button 
                onClick={() => window.open(previewImage.url, '_blank')}
                className="w-14 h-14 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all active-scale shadow-2xl"
              >
                <ExternalLink size={24} />
              </button>
              <button 
                onClick={() => setPreviewImage(null)}
                className="w-14 h-14 bg-white text-slate-950 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-white transition-all active-scale shadow-2xl"
              >
                <X size={28} />
              </button>
           </div>
           
           <div className="relative w-full h-full flex flex-col items-center justify-center">
              <div className="max-w-4xl w-full aspect-square md:aspect-video rounded-[3rem] overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.6)] border-4 border-white/10 bg-slate-900 relative group">
                 <img 
                    src={previewImage.url} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                 />
                 <div className="absolute bottom-10 left-10 right-10 p-8 bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 shadow-2xl">
                    <div className="space-y-1">
                       <p className="text-white font-bold text-xl tracking-tight">{previewImage.key}</p>
                       <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t('dimension_info')}</p>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(previewImage.url, previewImage.key)}
                      className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 hover:bg-blue-500 transition-all shadow-lg active-scale"
                    >
                       <Copy size={16} />
                       <span>{copiedKey === previewImage.key ? t('copied') : t('copy_link')}</span>
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ImageManagement;
