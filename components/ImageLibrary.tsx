
import React, { useState, useRef, useMemo } from 'react';
import { MaterialImage, User } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Trash2, Copy, Search, X, 
  Check, UploadCloud, Loader2, Sparkles, FileText, Maximize, AlertCircle
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { uploadFile, getPublicUrl, deleteFile } from '../services/storageClient';

interface ImageLibraryProps {
  materials: MaterialImage[];
  onAddMaterial: (image: MaterialImage) => void;
  onDeleteMaterial: (id: string) => void;
  currentUser?: User; // 添加当前用户信息用于所有权验证
  lang: Language;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ materials, onAddMaterial, onDeleteMaterial, currentUser, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedCategoryForUpload, setSelectedCategoryForUpload] = useState('Main');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [materials, searchTerm, selectedCategory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      setUploadError('请选择图片文件 (JPEG, PNG, WEBP, GIF)');
      return;
    }

    // 验证文件大小 (5MB限制)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('文件大小不能超过5MB');
      return;
    }

    // 检查用户是否已认证
    if (!currentUser) {
      setUploadError('请先登录以上传文件');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 生成唯一的文件名，包含用户ID以避免冲突
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uniqueFileName = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;
      
      // 上传文件到Supabase存储桶，使用当前用户ID设置所有权
      await uploadFile(file, uniqueFileName, currentUser?.id);
      
      // 获取公开URL
      const publicUrl = getPublicUrl(uniqueFileName);
      
      if (!publicUrl) {
        throw new Error('无法生成公开URL');
      }

      // 创建MaterialImage对象并添加到数据库
      const newMaterial: MaterialImage = {
        id: `mat-${Date.now()}`,
        url: publicUrl,
        name: fileName || file.name.replace(/\.[^/.]+$/, ""), // 移除扩展名作为默认名称
        category: selectedCategoryForUpload,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        dimensions: 'Auto', // 尺寸稍后可补充
        mimeType: file.type
      };

      await onAddMaterial(newMaterial);
      setFileName('');
      setUploadError(null);
    } catch (error) {
      console.error('文件上传失败:', error);
      setUploadError('上传失败: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteMaterial = async (id: string, url: string) => {
    try {
      // 从数据库中删除记录
      await onDeleteMaterial(id);
      
      // 从存储桶中删除文件
      const fileName = url.split('/').pop(); // 提取文件名
      if (fileName) {
        await deleteFile(fileName);
      }
    } catch (error) {
      console.error('删除素材失败:', error);
      // 即使存储桶删除失败，也要从数据库删除记录
      await onDeleteMaterial(id);
    }
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('centralConsole')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('materialLibrary')}</h2>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="..." 
                className="pl-14 pr-8 py-4 bg-white border border-slate-100 rounded-full text-sm outline-none focus:ring-4 focus:ring-slate-50 transition-all w-48 md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-900 text-white p-4 rounded-full hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95 flex items-center"
              disabled={isUploading}
            >
              {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload}
            />
          </div>
          
          {/* 上传表单 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="素材名称"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#d4af37] w-full sm:w-40"
              disabled={isUploading}
            />
            <select
              value={selectedCategoryForUpload}
              onChange={(e) => setSelectedCategoryForUpload(e.target.value)}
              className="px-4 py-3 bg-white border border-slate-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-[#d4af37] w-full sm:w-auto"
              disabled={isUploading}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {uploadError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700">
          <AlertCircle size={20} />
          <span className="text-sm">{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="ml-auto text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="flex bg-white p-1.5 rounded-full border border-slate-100 shadow-sm w-fit">
         {['All', ...CATEGORIES].map(cat => (
           <button 
            key={cat} 
            onClick={() => setSelectedCategory(cat)} 
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
           >
             {cat}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
        {filteredMaterials.map((m, i) => (
          <div key={m.id} className="group flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-slate-100 shadow-xl border border-white">
              <img src={m.url} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" alt={m.name} />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-3 p-6 backdrop-blur-[2px]">
                 <button onClick={() => { navigator.clipboard.writeText(m.url); setCopiedId(m.id); setTimeout(() => setCopiedId(null), 2000); }} className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-[#d4af37] hover:text-white transition-all">
                   {copiedId === m.id ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                 </button>
                 <button 
                   onClick={() => handleDeleteMaterial(m.id, m.url)} 
                   className="p-4 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
            </div>
            
            <div className="px-4 space-y-1">
               <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 truncate tracking-tight">{m.name}</h4>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{m.category}</span>
               </div>
               <div className="flex items-center space-x-4 opacity-40">
                  <div className="flex items-center space-x-1">
                     <FileText size={10} />
                     <span className="text-[9px] font-black uppercase">{m.fileSize || 'N/A'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                     <Maximize size={10} />
                     <span className="text-[9px] font-black uppercase">{m.dimensions || 'N/A'}</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageLibrary;