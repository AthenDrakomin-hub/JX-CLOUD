
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, Upload, Trash2, Copy, Search, RefreshCcw, 
  Image as ImageIcon, Check, Loader2, Sparkles, Filter, ExternalLink
} from 'lucide-react';
import { s3Service, S3File } from '../services/s3Service';
import { translations, Language } from '../translations';
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

  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const fetchFiles = useCallback(async (showFullLoader = true) => {
    if (showFullLoader) setIsLoading(true);
    else setIsRefreshing(true);
    
    try {
      const data = await s3Service.listFiles();
      setFiles(data);
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

    setIsUploading(true);
    try {
      await s3Service.uploadFile(file);
      await fetchFiles(false);
    } catch (err) {
      alert('上传失败，请检查网络或存储配置。');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('确定要删除这张图片吗？此操作不可撤销。')) return;
    
    try {
      await s3Service.deleteFile(key);
      setFiles(prev => prev.filter(f => f.key !== key));
    } catch (err) {
      alert('删除失败。');
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
    <div className="space-y-10 animate-fade-up">
      {/* 头部区域 */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full" />
        <div className="relative z-10 space-y-2">
           <div className="flex items-center space-x-2 text-blue-600">
              <Sparkles size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Cloud Storage Integration</span>
           </div>
           <h2 className="text-4xl font-bold text-slate-900 tracking-tight">图片资产管理</h2>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
             当前存储路径: jiangxiyunchu
           </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
           <button 
             onClick={() => fetchFiles(false)} 
             disabled={isRefreshing}
             className="w-12 h-12 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 transition-all active-scale"
           >
             <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
           </button>
           <label className={`flex items-center space-x-3 px-8 h-12 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm active-scale ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
              {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <span>{isUploading ? '正在上传...' : '上传新图片'}</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
           </label>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center px-8">
        <Search className="text-slate-300 mr-4" size={20} />
        <input 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          placeholder="检索图片名称..." 
          className="bg-transparent border-none outline-none font-bold text-sm w-full py-2 text-slate-900 placeholder:text-slate-300" 
        />
        <div className="hidden md:flex items-center space-x-2 ml-4 px-4 border-l border-slate-200">
           <Filter size={16} className="text-slate-300" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{filteredFiles.length} 张图片</span>
        </div>
      </div>

      {/* 内容网格 */}
      {isLoading ? (
        <div className="h-96 flex flex-col items-center justify-center space-y-4">
           <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">同步云端数据...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="h-96 bg-white rounded-[3rem] border border-slate-200 flex flex-col items-center justify-center text-slate-200 space-y-6">
           <ImageIcon size={48} className="opacity-10" />
           <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">暂无图片数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8 pb-20">
          {filteredFiles.map((file, idx) => (
            <div key={file.key} className="group bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col animate-in fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
               <div className="relative aspect-square overflow-hidden bg-slate-100">
                  <OptimizedImage src={file.url} alt={file.key} className="w-full h-full object-cover" />
                  
                  {/* 悬浮层 */}
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center p-6 space-y-2 backdrop-blur-[2px]">
                     <button 
                       onClick={() => copyToClipboard(file.url, file.key)}
                       className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${copiedKey === file.key ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-blue-600 hover:text-white'}`}
                     >
                       {copiedKey === file.key ? <Check size={16} /> : <Copy size={16} />}
                       <span>{copiedKey === file.key ? '已复制' : '复制链接'}</span>
                     </button>
                     <button 
                       onClick={() => window.open(file.url, '_blank')}
                       className="w-full py-3 bg-white/10 border border-white/20 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 hover:bg-white/20 transition-all"
                     >
                       <ExternalLink size={16} />
                       <span>预览</span>
                     </button>
                     <button 
                       onClick={() => handleDelete(file.key)}
                       className="w-full py-3 bg-red-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 hover:bg-red-600 transition-all"
                     >
                       <Trash2 size={16} />
                       <span>删除图片</span>
                     </button>
                  </div>
               </div>

               <div className="p-5 space-y-3">
                  <h4 className="font-bold text-slate-900 truncate text-sm">{file.key.split('-').slice(1).join('-') || file.key}</h4>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                     <span>{formatSize(file.size)}</span>
                     <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageManagement;
