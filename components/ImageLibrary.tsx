
import React, { useState, useRef, useMemo } from 'react';
import { MaterialImage } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Trash2, Copy, Search, X, 
  Check, UploadCloud, Loader2, Sparkles, FileText, Maximize
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import { storageService } from '../services/storage';
import { api } from '../services/api';

interface ImageLibraryProps {
  materials: MaterialImage[];
  onAddMaterial: (image: MaterialImage) => void;
  onDeleteMaterial: (id: string) => void;
  lang: Language;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ materials, onAddMaterial, onDeleteMaterial, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  // 处理文件选择
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!storageService.isValidImageFile(file)) {
      setUploadError('只支持上传图像文件 (JPG, PNG, WEBP, GIF)');
      return;
    }

    // 验证文件大小 (最大10MB)
    if (!storageService.isValidFileSize(file, 10)) {
      setUploadError('文件大小不能超过10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // 上传文件到Supabase存储
      const uploadResult = await storageService.uploadFile(file);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || '文件上传失败');
      }

      // 生成唯一ID
      const newId = `material-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // 创建素材对象
      const newMaterial: MaterialImage = {
        id: newId,
        url: uploadResult.url!,
        name: file.name,
        category: selectedCategory === 'All' ? 'General' : selectedCategory,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        dimensions: '待计算', // 可以通过Image API获取真实尺寸
        mimeType: file.type
      };

      // 添加到数据库
      await api.materials.create(newMaterial);
      onAddMaterial(newMaterial);

      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('上传处理失败:', error);
      setUploadError(error.message || '上传处理失败');
    } finally {
      setIsUploading(false);
    }
  };

  // 处理删除素材
  const handleDeleteMaterial = async (id: string, url: string) => {
    try {
      // 从数据库删除记录
      await api.materials.delete(id);
      
      // 从Supabase存储删除文件
      const filePath = new URL(url).pathname.split('/').slice(3).join('/'); // 提取存储路径
      await storageService.deleteFile(filePath);
      
      // 从UI更新
      onDeleteMaterial(id);
    } catch (error) {
      console.error('删除素材失败:', error);
      // 即使删除存储失败，也要从UI移除
      onDeleteMaterial(id);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = selectedCategory === 'All' || m.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [materials, searchTerm, selectedCategory]);

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
            className="bg-slate-900 text-white p-4 rounded-full hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95"
          >
            {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*" />
        </div>
      </div>

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
                 <button onClick={() => handleDeleteMaterial(m.id, m.url)} className="p-4 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
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
                     <span className="text-[9px] font-black uppercase">{m.fileSize || '240 KB'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                     <Maximize size={10} />
                     <span className="text-[9px] font-black uppercase">{m.dimensions || '1080x1080'}</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
      
      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
          <div className="flex items-center space-x-2">
            <X size={18} />
            <span>{uploadError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageLibrary;
