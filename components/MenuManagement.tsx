
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Dish, User, UserRole } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Search, X, Star, Save, Package, 
  Settings2, Trash2, Edit3, 
  Utensils, ChevronRight, ExternalLink,
  ChevronDown, AlertCircle, Loader2, Eye, Grid, ListFilter,
  Layers, ShoppingBag, UploadCloud, Check,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { s3Service } from '../services/s3Service';
import OptimizedImage from './OptimizedImage';

interface MenuManagementProps {
  dishes: Dish[];
  currentUser: User | null;
  onAddDish: (dish: Dish) => Promise<void>;
  onUpdateDish: (dish: Dish) => Promise<void>;
  onDeleteDish: (id: string) => Promise<void>;
  lang: Language;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ 
  dishes, currentUser, onAddDish, onUpdateDish, onDeleteDish, lang 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  
  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;
  
  useEffect(() => {
    api.categories.getAll().then(setCustomCategories);
  }, []);

  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [dishes, searchTerm, activeCategory]);

  const handleOpenModal = (dish: Dish | null) => {
    setEditingDish(dish);
    setUploadedUrl(dish?.imageUrl || '');
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const key = await s3Service.uploadFile(file);
      // Construct public URL - using the base from s3Service.ts logic
      const publicUrlBase = `https://zlbemopcgjohrnyyiwvs.supabase.co/storage/v1/object/public/jiangxiyunchu/`;
      const url = `${publicUrlBase}${key}`;
      setUploadedUrl(url);
    } catch (err) {
      alert('Upload failed. Please check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 relative pb-20">
      {/* Sidebar Categories */}
      <aside className="w-full lg:w-72 shrink-0 space-y-8 sticky top-28 h-fit no-print">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-premium space-y-6">
           <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">品类资产索引</p>
              <Grid size={14} className="text-blue-500" />
           </div>
           <nav className="space-y-1">
              {['All', ...customCategories].map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <div className="flex items-center space-x-3">
                    <Layers size={14} className={activeCategory === cat ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'} />
                    <span>{cat === 'All' ? '全部资产' : cat}</span>
                  </div>
                  <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black ${activeCategory === cat ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                    {(dishes||[]).filter(d=>cat==='All'||d.category===cat).length}
                  </span>
                </button>
              ))}
           </nav>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden">
           <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 blur-3xl rounded-full" />
           <div className="relative z-10 space-y-5">
              <div className="flex items-center space-x-3 text-blue-400">
                <ShoppingBag size={20} />
                <h4 className="text-lg font-bold tracking-tight">模拟点餐预览</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                实时模拟菲律宾本地宾客扫描二维码后看到的移动端界面。
              </p>
              <button 
                onClick={() => window.open(`${window.location.origin}${window.location.pathname}?room=PREVIEW_MODE`, '_blank')}
                className="w-full py-4.5 bg-white/10 hover:bg-white text-white hover:text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-3 active-scale border border-white/5"
              >
                <Eye size={14} />
                <span>进入宾客预览页</span>
              </button>
           </div>
        </div>
      </aside>

      <div className="flex-1 space-y-10">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 sticky top-28 z-30 backdrop-blur-xl bg-white/90 no-print">
           <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100"><Utensils size={24} /></div>
              <div><h2 className="text-2xl font-black text-slate-950 leading-none">菜品资产档案</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">International Menu Management</p></div>
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="检索商品名..." className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-bold focus:bg-white focus:border-blue-500 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button onClick={() => handleOpenModal(null)} className="px-8 h-14 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 shadow-xl hover:bg-blue-600 transition-all active-scale shrink-0"><Plus size={20} /><span>录入新商品</span></button>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8">
           {filteredDishes.map((dish, idx) => (
             <div key={dish.id} className="group bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden flex flex-col h-full animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }} onClick={() => handleOpenModal(dish)}>
                <div className="relative aspect-square overflow-hidden bg-slate-100 p-2">
                   <OptimizedImage src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover rounded-[3rem] transition-transform duration-[3s] group-hover:scale-110" />
                   {dish.isRecommended && <div className="absolute top-6 left-6 p-2.5 bg-amber-500 text-white rounded-2xl shadow-xl animate-pulse border-2 border-white"><Star size={14} fill="currentColor" /></div>}
                   <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                     库存: {dish.stock}
                   </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                   <div>
                      <h4 className="font-black text-slate-950 text-xl tracking-tight leading-tight truncate">{dish.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6">{dish.category}</p>
                   </div>
                   <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Unit Value (PHP)</span>
                        <span className="text-3xl font-serif italic text-blue-700">₱{dish.price}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><Edit3 size={18} /></div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto no-print">
          <form onSubmit={async (e) => { 
            e.preventDefault(); 
            const fd = new FormData(e.currentTarget); 
            const data: Dish = {
              ...editingDish, 
              id: editingDish?.id || `d-${Date.now()}`, 
              name: fd.get('name') as string, 
              category: fd.get('category') as string, 
              price: Number(fd.get('price')), 
              stock: Number(fd.get('stock')), 
              imageUrl: uploadedUrl || fd.get('img') as string, 
              isAvailable: true
            }; 
            editingDish ? await onUpdateDish(data) : await onAddDish(data); 
            setIsModalOpen(false); 
          }} className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 flex flex-col max-h-[95vh]">
                <div className="p-10 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
                   <div><h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingDish ? '维护商品档案' : '录入新视觉资产'}</h3><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">JX-Kitchen Core Registry</p></div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all hover:shadow-md"><X size={24} /></button>
                </div>
                <div className="p-12 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-white">
                   {/* Preview Area */}
                   <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-100 group">
                      {uploadedUrl ? (
                        <img src={uploadedUrl} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={48} className="opacity-20 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">No Image Asset Selected</p>
                        </div>
                      )}
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white space-x-3 backdrop-blur-sm"
                      >
                        {isUploading ? <Loader2 size={24} className="animate-spin" /> : <UploadCloud size={24} />}
                        <span className="font-black text-xs uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Upload New Asset'}</span>
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                   </div>

                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">商品中文全名</label><input name="name" defaultValue={editingDish?.name} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold text-lg transition-all" /></div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">零售价格 (PHP)</label><input name="price" type="number" defaultValue={editingDish?.price} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-blue-700" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">资产归属分类</label><select name="category" defaultValue={editingDish?.category || 'Land & Sea'} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold appearance-none cursor-pointer">{customCategories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">视觉图路径 (Cloud URL)</label>
                     <div className="flex gap-2">
                       <input 
                         name="img" 
                         value={uploadedUrl} 
                         onChange={(e) => setUploadedUrl(e.target.value)} 
                         required 
                         placeholder="https://..." 
                         className="flex-1 px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-[11px] truncate" 
                       />
                       {uploadedUrl && <div className="px-4 py-5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center"><Check size={20} /></div>}
                     </div>
                   </div>

                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">生产环境库存水位</label><input name="stock" type="number" defaultValue={editingDish?.stock} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg" /></div>
                </div>
                <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 sticky bottom-0 z-10">
                   <button type="submit" disabled={isUploading} className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl active-scale flex items-center justify-center space-x-3 disabled:opacity-50"><Save size={20} /><span>确认保存资产档案</span></button>
                   {editingDish && <button type="button" onClick={() => { if(confirm('彻底下架此商品？')) { onDeleteDish(editingDish.id); setIsModalOpen(false); }}} className="px-8 text-red-500 hover:bg-red-50 rounded-[2rem] transition-all hover:shadow-sm"><Trash2 size={24} /></button>}
                </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
