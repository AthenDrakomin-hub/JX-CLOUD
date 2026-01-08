
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Dish, User, UserRole } from '../types';
import { translations, Language, getTranslation } from '../translations';
import { 
  Plus, Search, X, Star, Save, Package, 
  Settings2, Trash2, Edit3, 
  Utensils, ChevronRight, ExternalLink,
  ChevronDown, AlertCircle, Loader2, Eye, Grid, ListFilter,
  Layers, ShoppingBag, UploadCloud, Check,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import { s3Service, S3File } from '../services/s3Service';
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
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 items per page
  
  // Storage Integration State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [isGalleryPickerOpen, setIsGalleryPickerOpen] = useState(false);
  const [galleryAssets, setGalleryAssets] = useState<S3File[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);
  
  useEffect(() => {
    api.categories.getAll().then(setCustomCategories);
  }, []);

  const fetchGallery = async () => {
    setIsGalleryLoading(true);
    try {
      const files = await s3Service.listFiles();
      setGalleryAssets(files);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [dishes, searchTerm, activeCategory]);

  // Calculate paginated dishes
  const paginatedDishes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDishes.slice(startIndex, endIndex);
  }, [filteredDishes, currentPage, itemsPerPage]);

  // Calculate pagination info
  const totalPages = Math.ceil(filteredDishes.length / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategory]);

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
      const path = await s3Service.uploadFile(file);
      // Construct public URL using the bucket domain
      const publicUrl = `https://zlbemopcgjohrnyyiwvs.supabase.co/storage/v1/object/public/jiangxiyunchu/${path}`;
      setUploadedUrl(publicUrl);
    } catch (err) {
      alert(t('syncError'));
    } finally {
      setIsUploading(false);
    }
  };

  const openGalleryPicker = () => {
    fetchGallery();
    setIsGalleryPickerOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 relative pb-20">
      {/* Sidebar Categories */}
      <aside className="w-full lg:w-72 shrink-0 space-y-8 sticky top-28 h-fit no-print">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-premium space-y-6">
           <div className="flex items-center justify-between px-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('assetIndex')}</p>
              <Grid size={14} className="text-blue-500" />
           </div>
           <nav className="space-y-1">
              {['All', ...customCategories].map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                  <div className="flex items-center space-x-3">
                    <Layers size={14} className={activeCategory === cat ? 'text-white' : 'text-slate-300 group-hover:text-blue-500'} />
                    <span>{cat === 'All' ? t('allAssets') : t(`cat_${cat}`)}</span>
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
                <h4 className="text-lg font-bold tracking-tight">{t('guestPreview')}</h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {t('previewModeDesc')}
              </p>
              <button 
                onClick={() => window.open(`${window.location.origin}${window.location.pathname}?room=PREVIEW_MODE`, '_blank')}
                className="w-full py-4.5 bg-white/10 hover:bg-white text-white hover:text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center space-x-3 active-scale border border-white/5"
              >
                <Eye size={14} />
                <span>{t('guestPreview')}</span>
              </button>
           </div>
        </div>
      </aside>

      <div className="flex-1 space-y-10">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-premium flex flex-col md:flex-row items-center justify-between gap-6 sticky top-28 z-30 backdrop-blur-xl bg-white/90 no-print">
           <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100"><Utensils size={24} /></div>
              <div><h2 className="text-2xl font-black text-slate-950 leading-none">{t('menuArchiveTitle')}</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">International Menu Management</p></div>
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64 group"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder={t('searchProduct')} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-bold focus:bg-white focus:border-blue-500 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button onClick={() => handleOpenModal(null)} className="px-8 h-14 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 shadow-xl hover:bg-blue-600 transition-all active-scale shrink-0"><Plus size={20} /><span>{t('addNewProduct')}</span></button>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8">
           {paginatedDishes.map((dish, idx) => (
             <div key={dish.id} className="group bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-sm hover:border-blue-500 hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden flex flex-col h-full animate-fade-up" style={{ animationDelay: `${idx * 50}ms` }} onClick={() => handleOpenModal(dish)}>
                <div className="relative aspect-square overflow-hidden bg-slate-100 p-2">
                   <OptimizedImage src={dish.imageUrl} alt={dish.name} className="w-full h-full object-cover rounded-[3rem] transition-transform duration-[3s] group-hover:scale-110" />
                   {dish.isRecommended && <div className="absolute top-6 left-6 p-2.5 bg-amber-500 text-white rounded-2xl shadow-xl animate-pulse border-2 border-white"><Star size={14} fill="currentColor" /></div>}
                   <div className="absolute bottom-6 right-6 px-4 py-1.5 bg-slate-950/80 backdrop-blur-md text-white rounded-xl text-[9px] font-black uppercase tracking-widest">
                     {t('stockLabel')}{dish.stock}
                   </div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                   <div>
                      <h4 className="font-black text-slate-950 text-xl tracking-tight leading-tight truncate">{lang === 'en' && dish.nameEn ? dish.nameEn : dish.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 mb-6">{t(`cat_${dish.category}`)}</p>
                   </div>
                   <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{t('unitValue')}</span>
                        <span className="text-3xl font-serif italic text-blue-700">{t('currency')}{dish.price}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all"><Edit3 size={18} /></div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {/* Pagination Controls */}
        {filteredDishes.length > itemsPerPage && (
          <div className="flex flex-col items-center space-y-6 pt-8 pb-12">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-xl font-bold ${
                  currentPage === 1 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-950 text-white hover:bg-blue-600'
                }`}
              >
                ← 上一页
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-xl font-bold ${
                  currentPage === totalPages 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-slate-950 text-white hover:bg-blue-600'
                }`}
              >
                下一页 →
              </button>
            </div>
            
            {/* Page info and controls */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-slate-600">
              <span>第 {currentPage} 页，共 {totalPages} 页 ({filteredDishes.length} 个菜品)</span>
              
              {/* Items per page selector */}
              <div className="flex items-center space-x-2">
                <span>每页:</span>
                <select 
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing items per page
                  }}
                  className="border border-slate-200 rounded-xl px-3 py-1 text-center font-bold focus:outline-none focus:border-blue-500"
                >
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="16">16</option>
                  <option value="20">20</option>
                  <option value={filteredDishes.length}>全部</option>
                </select>
              </div>
            </div>
            
            {/* Jump to page input */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-bold text-slate-600">跳转到:</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                defaultValue={currentPage}
                className="w-16 px-3 py-2 border border-slate-200 rounded-xl text-center font-bold focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const targetPage = parseInt((e.target as HTMLInputElement).value);
                    if (targetPage >= 1 && targetPage <= totalPages) {
                      setCurrentPage(targetPage);
                    }
                  }
                }}
              />
              <button 
                onClick={() => {
                  const input = document.querySelector('input[type="number"][className*="w-16"]');
                  if (input) {
                    const targetPage = parseInt((input as HTMLInputElement).value);
                    if (targetPage >= 1 && targetPage <= totalPages) {
                      setCurrentPage(targetPage);
                    }
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                跳转
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Edit Modal */}
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
                   <div><h3 className="text-2xl font-black text-slate-900 tracking-tighter">{editingDish ? t('editProductTitle') : t('newProductTitle')}</h3><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('nodeRegistrySub')}</p></div>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-950 transition-all hover:shadow-md"><X size={24} /></button>
                </div>
                <div className="p-12 space-y-8 overflow-y-auto no-scrollbar flex-1 bg-white">
                   {/* Optimized Image Logic with Picker Support */}
                   <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 border-2 border-slate-100 group">
                      {uploadedUrl ? (
                        <img src={uploadedUrl} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                          <ImageIcon size={48} className="opacity-20 mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-widest">{t('noAssetLinked')}</p>
                        </div>
                      )}
                      
                      {/* Control Overlays */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center space-y-3 backdrop-blur-sm">
                         <div className="flex gap-3">
                            <button 
                              type="button" 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploading}
                              className="px-6 py-3 bg-white text-slate-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:bg-blue-600 hover:text-white transition-all shadow-xl active-scale"
                            >
                               {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                               <span>{t('uploadNewImg')}</span>
                            </button>
                            <button 
                              type="button" 
                              onClick={openGalleryPicker}
                              className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 hover:bg-blue-500 transition-all shadow-xl active-scale border border-white/10"
                            >
                               <ImageIcon size={16} />
                               <span>{t('pickerFromGallery')}</span>
                            </button>
                         </div>
                         <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('recRatio')}</p>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                   </div>

                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('productNameLabel')}</label><input name="name" defaultValue={editingDish?.name} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-blue-500 font-bold text-lg transition-all shadow-sm" /></div>
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('unitPriceLabel')}</label><input name="price" type="number" defaultValue={editingDish?.price} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl text-blue-700" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('categoryLabel')}</label><select name="category" defaultValue={editingDish?.category || customCategories[0]} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold appearance-none cursor-pointer">{customCategories.map(c=><option key={c} value={c}>{t(`cat_${c}`)}</option>)}</select></div>
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('assetUrlLabel')}</label>
                     <div className="flex gap-2">
                       <input 
                         name="img" 
                         value={uploadedUrl} 
                         onChange={(e) => setUploadedUrl(e.target.value)} 
                         required 
                         placeholder="https://..." 
                         className="flex-1 px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-[11px] truncate text-slate-500" 
                       />
                       {uploadedUrl && <div className="px-4 py-5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center justify-center"><Check size={20} /></div>}
                     </div>
                   </div>

                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('stockWatermark')}</label><input name="stock" type="number" defaultValue={editingDish?.stock} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-lg" /></div>
                </div>
                <div className="p-10 border-t border-slate-100 bg-slate-50 flex gap-4 sticky bottom-0 z-10">
                   <button type="submit" disabled={isUploading} className="flex-1 py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] hover:bg-blue-600 transition-all shadow-xl active-scale flex items-center justify-center space-x-3 disabled:opacity-50"><Save size={20} /><span>{t('saveArchive')}</span></button>
                   {editingDish && <button type="button" onClick={() => { if(confirm(t('deleteProductConfirm'))) { onDeleteDish(editingDish.id); setIsModalOpen(false); }}} className="px-8 text-red-500 hover:bg-red-50 rounded-[2rem] transition-all"><Trash2 size={24} /></button>}
                </div>
          </form>
        </div>
      )}

      {/* Gallery Picker Modal */}
      {isGalleryPickerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 sm:p-20 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-500">
           <div className="absolute inset-0" onClick={() => setIsGalleryPickerOpen(false)} />
           <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[4rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-10 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl"><ImageIcon size={28} /></div>
                    <div>
                       <h3 className="text-2xl font-black text-slate-950 tracking-tighter uppercase">{t('galleryPickerTitle')}</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{t('assetBrowserSub')}</p>
                    </div>
                 </div>
                 <button onClick={() => setIsGalleryPickerOpen(false)} className="w-14 h-14 bg-white border border-slate-200 text-slate-400 hover:text-slate-950 rounded-2xl flex items-center justify-center transition-all"><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-12 no-scrollbar bg-white">
                 {isGalleryLoading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-6">
                       <Loader2 size={48} className="animate-spin text-blue-600" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">{t('syncingObjects')}</p>
                    </div>
                 ) : galleryAssets.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                       <UploadCloud size={64} className="opacity-10 mb-6" />
                       <p className="text-xs font-black uppercase tracking-widest">{t('galleryEmpty')}</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                       {galleryAssets.map((asset) => (
                          <div 
                             key={asset.key} 
                             onClick={() => { setUploadedUrl(asset.url); setIsGalleryPickerOpen(false); }}
                             className="group flex flex-col space-y-4 cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                          >
                             <div className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 border-4 border-transparent group-hover:border-blue-500 transition-all shadow-sm hover:shadow-2xl">
                                <OptimizedImage src={asset.url} alt={asset.key} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                                   <div className="px-6 py-2 bg-white text-blue-600 rounded-full font-black text-[9px] uppercase tracking-widest shadow-xl">{t('selectAsset')}</div>
                                </div>
                             </div>
                             <div className="px-4">
                                <p className="text-[10px] font-black text-slate-900 truncate uppercase tracking-tighter">{asset.key.split('-').slice(1).join('-') || asset.key}</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{(asset.size/1024).toFixed(1)} KB</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
              
              <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-center">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">JX-Cloud Storage Gateway v5.5 Aligned</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;