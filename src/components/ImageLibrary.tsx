
import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { MaterialImage, Ingredient } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Trash2, Copy, Search, X, 
  Check, UploadCloud, Loader2, Sparkles, FileText, Maximize,
  Box, Image as ImageIcon, LayoutGrid, ListFilter, AlertTriangle,
  ArrowUpRight, History, Package, Save, Scale,
  Tag, Edit3, ExternalLink, RefreshCcw
} from 'lucide-react';
import { api } from '../services/api-client';
import { s3Service, S3File } from '../services/s3Service';
import OptimizedImage from './OptimizedImage';

interface ImageLibraryProps {
  materials: MaterialImage[];
  onAddMaterial: (image: MaterialImage) => void;
  onDeleteMaterial: (id: string) => void;
  lang: Language;
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({ lang }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'images'>('inventory');
  
  // Inventory state
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);

  // S3 Image Gallery state
  const [s3Files, setS3Files] = useState<S3File[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = (key: string) => (translations[lang] as any)[key] || key;

  const fetchIngredients = useCallback(async () => {
    const data = await api.ingredients.getAll();
    setIngredients(data);
  }, []);

  const fetchGallery = useCallback(async (quiet = false) => {
    if (!quiet) setIsGalleryLoading(true);
    else setIsRefreshing(true);
    
    try {
      const files = await s3Service.listFiles();
      setS3Files(files);
    } finally {
      setIsGalleryLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'inventory') fetchIngredients();
    else fetchGallery();
  }, [activeTab, fetchIngredients, fetchGallery]);

  const handleIngSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Ingredient = {
      id: editingIng?.id || `ing-${Date.now()}`,
      name: formData.get('name') as string,
      unit: formData.get('unit') as string,
      stock: Number(formData.get('stock')),
      minStock: Number(formData.get('minStock')),
      category: formData.get('category') as string,
      // Fix: Use last_restocked to match Ingredient interface
      last_restocked: new Date().toISOString()
    };

    if (editingIng) await api.ingredients.update(data);
    else await api.ingredients.create(data);
    
    setIsModalOpen(false);
    setEditingIng(null);
    fetchIngredients();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await s3Service.uploadFile(file);
      await fetchGallery(true);
    } catch (err) {
      alert('Upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageDelete = async (key: string) => {
    if (!confirm('Permanently delete this cloud asset?')) return;
    try {
      await s3Service.deleteFile(key);
      fetchGallery(true);
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const filteredIngs = useMemo(() => {
    return ingredients.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, searchTerm]);

  const filteredImages = useMemo(() => {
    return s3Files.filter(f => f.key.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [s3Files, searchTerm]);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">JX Cloud Assets & Stocks</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">
             {activeTab === 'inventory' ? '食材与物料库存' : '云端视觉资产库'}
           </h2>
        </div>

        <div className="flex items-center space-x-4 bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
           <button 
             onClick={() => setActiveTab('inventory')}
             className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'inventory' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <Box size={14} />
             <span>物料库存</span>
           </button>
           <button 
             onClick={() => setActiveTab('images')}
             className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'images' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
           >
             <ImageIcon size={14} />
             <span>视觉素材</span>
           </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 p-6 rounded-[3rem] border border-white shadow-sm backdrop-blur-md">
        <div className="relative group w-full md:w-96">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={20} />
           <input 
             type="text" 
             placeholder={activeTab === 'inventory' ? "搜索食材名称或分类..." : "搜索图片资产名称..."}
             className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-8 focus:ring-slate-50 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <div className="flex items-center space-x-4">
           {activeTab === 'inventory' ? (
             <button 
               onClick={() => { setEditingIng(null); setIsModalOpen(true); }}
               className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-xl active:scale-95 flex items-center space-x-3"
             >
               <Plus size={18} />
               <span>物料入库登记</span>
             </button>
           ) : (
             <div className="flex gap-4">
                <button 
                  onClick={() => fetchGallery(true)}
                  className="w-14 h-14 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-blue-600 hover:border-blue-600 transition-all active-scale flex items-center justify-center"
                >
                   <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 flex items-center space-x-3"
                >
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
                  <span>上传素材至 S3</span>
                </button>
             </div>
           )}
           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
      </div>

      {activeTab === 'inventory' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
           {filteredIngs.map((ing, idx) => {
             const isLowStock = ing.stock <= ing.minStock;
             return (
               <div key={ing.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-700 group relative overflow-hidden animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 50}ms` }}>
                  {isLowStock && (
                    <div className="absolute top-0 left-0 w-full h-2 bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]" />
                  )}
                  
                  <div className="flex items-start justify-between mb-10">
                     <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                           <h4 className="text-2xl font-bold text-slate-900 tracking-tight">{ing.name}</h4>
                           {isLowStock && <AlertTriangle size={18} className="text-red-500 animate-bounce" />}
                        </div>
                        <div className="px-3 py-1 bg-slate-100 rounded-lg inline-flex items-center space-x-2">
                           <Tag size={10} className="text-slate-400" />
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{ing.category}</span>
                        </div>
                     </div>
                     <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingIng(ing); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-950 hover:bg-white hover:shadow-md rounded-xl transition-all"><Edit3 size={16} /></button>
                        <button onClick={async () => { if(confirm('确定删除该物料？')) { await api.ingredients.delete(ing.id); fetchIngredients(); } }} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-md rounded-xl transition-all"><Trash2 size={16} /></button>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div className={`p-6 rounded-[2.5rem] space-y-2 ${isLowStock ? 'bg-red-50 border border-red-100' : 'bg-slate-50'}`}>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isLowStock ? 'text-red-600' : 'text-slate-400'}`}>当前库存</p>
                        <p className={`text-4xl font-black tracking-tighter ${isLowStock ? 'text-red-700' : 'text-slate-900'}`}>
                           {ing.stock} <span className="text-sm font-bold opacity-40">{ing.unit}</span>
                        </p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-[2.5rem] space-y-2 border border-slate-100 shadow-inner">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">预警阈值</p>
                        <p className="text-4xl font-black text-slate-900 opacity-20">
                           {ing.minStock} <span className="text-sm font-bold">{ing.unit}</span>
                        </p>
                     </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                     <div className="flex items-center space-x-2">
                        <History size={14} className="text-slate-300" />
                        {/* Fix: Use last_restocked instead of lastRestocked */}
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{t('last_restocked')}: {ing.last_restocked ? new Date(ing.last_restocked).toLocaleDateString() : '—'}</span>
                     </div>
                     <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${isLowStock ? 'bg-red-600 text-white border-transparent shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                        {isLowStock ? t('low_stock_alert') : t('stock_sufficient_safe')}
                     </div>
                  </div>
               </div>
             );
           })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-10">
          {isGalleryLoading ? (
            <div className="col-span-full py-40 flex flex-col items-center justify-center space-y-6">
              <Loader2 size={48} className="animate-spin text-blue-600" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synchronizing S3 Assets...</p>
            </div>
          ) : (
            filteredImages.map((file, i) => (
              <div key={file.key} className="group flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="relative aspect-square rounded-[3.5rem] overflow-hidden bg-slate-100 shadow-xl border border-white p-2">
                  <OptimizedImage src={file.url} alt={file.key} className="w-full h-full object-cover rounded-[3rem] transition-transform duration-[2s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center space-x-3 p-6 backdrop-blur-[2px]">
                     <button onClick={() => { navigator.clipboard.writeText(file.url); setCopiedId(file.key); setTimeout(() => setCopiedId(null), 2000); }} className="p-4 bg-white text-slate-900 rounded-2xl hover:bg-[#d4af37] hover:text-white transition-all shadow-xl">
                       {copiedId === file.key ? <Check size={20} className="text-emerald-500" /> : <Copy size={20} />}
                     </button>
                     <button onClick={() => handleImageDelete(file.key)} className="p-4 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl">
                       <Trash2 size={20} />
                     </button>
                  </div>
                </div>
                
                <div className="px-6 space-y-1">
                   <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 truncate tracking-tight text-xs">{file.key.split('-').slice(1).join('-') || file.key}</h4>
                   </div>
                   <div className="flex items-center justify-between opacity-40">
                      <span className="text-[9px] font-black uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                      <span className="text-[9px] font-black uppercase">{new Date(file.lastModified).toLocaleDateString()}</span>
                   </div>
                </div>
              </div>
            ))
          )}
          {!isGalleryLoading && filteredImages.length === 0 && (
            <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300">
              <ImageIcon size={64} className="opacity-10 mb-4" />
              <p className="text-xs font-black uppercase tracking-widest">No Cloud Assets Found</p>
            </div>
          )}
        </div>
      )}

      {/* Inventory Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleIngSubmit} className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-500">
             <div className="h-2 w-full bg-[#d4af37]" />
             <div className="p-12 lg:p-16 space-y-10">
                <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingIng ? '编辑物料信息' : '新物料档案登记'}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inventory Management System</p>
                   </div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all">
                      <X size={24} />
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">物料名称</label>
                      <input name="name" defaultValue={editingIng?.name} required placeholder="如：特级菜籽油" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-bold text-slate-900" />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">计量单位</label>
                        <input name="unit" defaultValue={editingIng?.unit} required placeholder="kg / L / Pcs" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-bold text-slate-900" />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">物料分类</label>
                        <select name="category" defaultValue={editingIng?.category || '主食类'} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-black text-slate-900 appearance-none">
                           <option value="主食类">主食类</option>
                           <option value="油脂类">油脂类</option>
                           <option value="水产类">水产类</option>
                           <option value="调味类">调味类</option>
                           <option value="蔬果类">蔬果类</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">当前库存量</label>
                        <div className="relative">
                           <input name="stock" type="number" step="0.01" defaultValue={editingIng?.stock || 0} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-black text-slate-900" />
                           <Package className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">预警最低存量</label>
                        <div className="relative">
                           <input name="minStock" type="number" step="0.01" defaultValue={editingIng?.minStock || 0} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:ring-4 focus:ring-[#d4af37]/10 transition-all font-black text-slate-900" />
                           <AlertTriangle className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
                        </div>
                      </div>
                   </div>
                </div>

                <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-3 group">
                   <Save size={18} className="group-hover:rotate-12 transition-transform" />
                   <span>{editingIng ? '保存物料修改' : '确认并录入资产库'}</span>
                </button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ImageLibrary;