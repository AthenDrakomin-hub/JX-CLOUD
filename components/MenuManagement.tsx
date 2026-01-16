
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Dish, User, UserRole, Partner, Category } from '../types';
import { Language, getTranslation } from '../translations';
import { 
  Plus, Search, X, Star, Save, 
  Trash2, Edit3, Box, Layers, 
  ChevronDown, ChevronRight, Loader2,
  Filter, Tag, ExternalLink, ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';
import { api } from '../services/api';
import OptimizedImage from './OptimizedImage';
import ImageUploadModal from './ImageUploadModal';

interface MenuManagementProps {
  dishes: Dish[];
  currentUser: User | null;
  partners: Partner[];
  onAddDish: (dish: Dish) => Promise<void>;
  onUpdateDish: (dish: Dish) => Promise<void>;
  onDeleteDish: (id: string) => Promise<void>;
  lang: Language;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ 
  dishes, currentUser, partners, onAddDish, onUpdateDish, onDeleteDish, lang 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('All');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const pageSize = 12;
  
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  useEffect(() => {
    api.categories.getAll().then(cats => {
      setAllCategories(cats);
      setExpandedGroups(cats.filter(c => cats.some(child => child.parent_id === c.id)).map(c => c.id));
    });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeCategoryId]);

  const filteredDishes = useMemo(() => {
    return (dishes || []).filter(d => {
      const nameMatch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (d.name_en || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchCategory = true;
      if (activeCategoryId !== 'All') {
        const targetCat = allCategories.find(c => c.id === activeCategoryId);
        if (targetCat?.level === 1) {
          const subCatIds = allCategories.filter(c => c.parent_id === activeCategoryId).map(c => c.id);
          matchCategory = d.category === activeCategoryId || subCatIds.includes(d.category);
        } else {
          matchCategory = d.category === activeCategoryId;
        }
      }
      return nameMatch && matchCategory;
    });
  }, [dishes, searchTerm, activeCategoryId, allCategories]);

  const paginatedDishes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDishes.slice(start, start + pageSize);
  }, [filteredDishes, currentPage]);

  const totalPages = Math.ceil(filteredDishes.length / pageSize);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    const fd = new FormData(e.currentTarget);
    const tagsInput = fd.get('tags') as string;
    const tags = tagsInput ? tagsInput.split(/[，,]/).map(s => s.trim()).filter(s => s !== '') : [];

    const dishData: Dish = {
      id: editingDish?.id || fd.get('id') as string,
      name: fd.get('name') as string,
      name_en: fd.get('name_en') as string,
      description: fd.get('description') as string,
      tags: tags,
      price: Number(fd.get('price')),
      stock: Number(fd.get('stock')),
      category: fd.get('category') as string,
      image_url: fd.get('image_url') as string,
      is_available: fd.get('is_available') === 'true',
      is_recommended: fd.get('is_recommended') === 'true',
      partnerId: fd.get('partnerId') as string || undefined
    };

    try {
      editingDish ? await onUpdateDish(dishData) : await onAddDish(dishData);
      setIsModalOpen(false);
      setEditingDish(null);
    } catch (err) {
      alert(t('error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectImage = (imageUrl: string) => {
    const imageInput = document.getElementById('image_url_input') as HTMLInputElement;
    if (imageInput) {
      imageInput.value = imageUrl;
    }
    setShowImageUploadModal(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 relative pb-20 max-w-[1600px] mx-auto">
      <aside className="w-full lg:w-80 shrink-0 space-y-6 sticky top-28 h-fit no-print hidden lg:block">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Navigation Node</p>
           <nav className="space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
              <button onClick={() => setActiveCategoryId('All')} className={`w-full text-left px-5 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-between group ${activeCategoryId === 'All' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-50'}`}>
                <div className="flex items-center space-x-3"><Layers size={14} /><span>{t('all_assets')}</span></div>
                <span className="text-[10px] opacity-40">{dishes.length}</span>
              </button>
              <div className="h-[1px] bg-slate-100 my-4" />
              {allCategories.filter(c => c.level === 1).map(group => (
                <div key={group.id} className="space-y-1">
                   <div className="flex items-center justify-between">
                      <button onClick={() => setActiveCategoryId(group.id)} className={`flex-1 text-left px-4 py-3 rounded-xl transition-all flex items-center space-x-3 ${activeCategoryId === group.id ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:text-slate-600'}`}>
                         <span className="text-[11px] font-black uppercase">{lang === 'zh' ? group.name : group.name_en}</span>
                      </button>
                      <button onClick={() => setExpandedGroups(p => p.includes(group.id) ? p.filter(i => i !== group.id) : [...p, group.id])} className="p-2 text-slate-300">
                        <ChevronDown size={14} className={`transition-transform ${expandedGroups.includes(group.id) ? '' : '-rotate-90'}`} />
                      </button>
                   </div>
                   {expandedGroups.includes(group.id) && allCategories.filter(c => c.parent_id === group.id).map(child => (
                     <button key={child.id} onClick={() => setActiveCategoryId(child.id)} className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-between ml-6 ${activeCategoryId === child.id ? 'text-blue-600 bg-blue-50/30' : 'text-slate-400 hover:text-slate-900'}`}>
                       <span>{lang === 'zh' ? child.name : child.name_en}</span>
                     </button>
                   ))}
                </div>
              ))}
           </nav>
        </div>
      </aside>

      <div className="flex-1 space-y-10">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 sticky top-28 z-30 bg-white/80 backdrop-blur-xl">
           <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-slate-950 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><Box size={24} /></div>
              <div><h2 className="text-2xl font-black text-slate-900 leading-none">{activeCategoryId === 'All' ? t('dish_archives') : (allCategories.find(c=>c.id===activeCategoryId)?.name || activeCategoryId)}</h2><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Resource Controller</p></div>
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-72">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder={t('search')} className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none font-bold focus:bg-white transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => { setEditingDish(null); setIsModalOpen(true); }} className="px-8 h-14 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center space-x-3 shadow-xl hover:bg-blue-600 transition-all active-scale shrink-0"><Plus size={20} /><span>{t('new_asset')}</span></button>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-8">
           {paginatedDishes.map((dish) => (
             <div key={dish.id} className="group bg-white rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-700 cursor-pointer overflow-hidden flex flex-col h-full animate-fade-up" onClick={() => { setEditingDish(dish); setIsModalOpen(true); }}>
                <div className="relative aspect-square overflow-hidden bg-slate-50 p-2">
                   <OptimizedImage src={dish.image_url} alt={dish.name} className="w-full h-full object-cover rounded-[2.5rem] transition-transform duration-[3s] group-hover:scale-110" />
                   <div className="absolute top-4 left-4 flex flex-col gap-2">
                      {dish.is_recommended && <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-lg border-2 border-white"><Star size={12} fill="currentColor" /></div>}
                      <div className="px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] font-mono font-black text-slate-900 shadow-sm border border-slate-200">{dish.id}</div>
                   </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                   <h4 className="font-black text-slate-900 text-base tracking-tight leading-tight line-clamp-1">{lang === 'zh' ? dish.name : dish.name_en}</h4>
                   <div className="flex flex-wrap gap-1 mt-2">
                      {dish.tags?.slice(0,2).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md uppercase border border-blue-100">{tag}</span>
                      ))}
                   </div>
                   <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="text-xl font-serif italic text-slate-950">₱{dish.price}</span>
                      <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${dish.stock < 10 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-400'}`}>{t('inventory')}: {dish.stock}</div>
                   </div>
                </div>
             </div>
           ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12 py-8 border-t border-slate-100">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all active-scale"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-blue-600 disabled:opacity-20 transition-all active-scale"><ChevronRight size={20} /></button>
          </div>
        )}
      </div>
      
      {/* Universal Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in">
           <form onSubmit={handleFormSubmit} className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
              <div className="p-8 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-950 text-blue-500 rounded-2xl flex items-center justify-center shadow-lg"><Edit3 size={24} /></div>
                    <div>
                       <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{editingDish ? t('edit_asset') : t('new_asset_registry')}</h3>
                       <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Global Registry Mode</p>
                    </div>
                 </div>
                 <button type="button" onClick={() => setIsModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-slate-950 transition-all shadow-sm"><X size={20} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar bg-slate-50/30">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('asset_id')}</label>
                       <input name="id" defaultValue={editingDish?.id} required disabled={!!editingDish} className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-mono text-xs focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="D101" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('category_dir')}</label>
                       <select name="category" defaultValue={editingDish?.category} required className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold text-sm focus:border-blue-600 outline-none shadow-sm appearance-none">
                          {allCategories.filter(c => c.level === 2).map(cat => (
                            <option key={cat.id} value={cat.id}>{lang === 'zh' ? cat.name : cat.name_en}</option>
                          ))}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('local_name')}</label>
                       <input name="name" defaultValue={editingDish?.name} required className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold text-sm focus:border-blue-600 outline-none transition-all shadow-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('standard_name')}</label>
                       <input name="name_en" defaultValue={editingDish?.name_en} required className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold text-sm focus:border-blue-600 outline-none transition-all shadow-sm" />
                    </div>
                 </div>

                 <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('unit_price')}</label>
                       <input name="price" type="number" defaultValue={editingDish?.price} required className="w-full px-8 py-5 bg-blue-50 border-2 border-blue-100 text-blue-700 rounded-[1.75rem] font-black text-center text-lg outline-none shadow-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('stock_level')}</label>
                       <input name="stock" type="number" defaultValue={editingDish?.stock} required className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-black text-center text-lg outline-none shadow-sm" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{t('merchant_owner')}</label>
                       <select name="partnerId" defaultValue={editingDish?.partnerId} className="w-full px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold text-xs outline-none shadow-sm">
                          <option value="">{lang === 'zh' ? '直营 (Internal)' : 'Direct (Internal)'}</option>
                          {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">{lang === 'zh' ? '视觉资源' : 'Image Resources'} (URL / S3)</label>
                    <div className="flex gap-4">
                       <input name="image_url" id="image_url_input" defaultValue={editingDish?.image_url} required className="flex-1 px-8 py-5 bg-white border-2 border-slate-100 rounded-[1.75rem] font-mono text-[10px] outline-none shadow-sm" />
                       <button 
                         type="button" 
                         onClick={() => setShowImageUploadModal(true)}
                         className="w-16 h-16 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center shadow-inner hover:bg-blue-100 transition-colors"
                       >
                         <ImageIcon size={20} className="text-blue-600" />
                       </button>
                       <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner p-1">
                          {editingDish?.image_url && <img src={editingDish.image_url} className="w-full h-full object-cover rounded-xl" />}
                       </div>
                    </div>
                 </div>

                 <div className="flex gap-8 p-8 bg-slate-950 rounded-[2.5rem] text-white shadow-2xl">
                    <div className="flex-1 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('operational_status')}</span>
                       <select name="is_available" defaultValue={String(editingDish?.is_available ?? true)} className="bg-transparent font-black text-emerald-400 outline-none cursor-pointer">
                          <option value="true">ACTIVE</option><option value="false">SUSPEND</option>
                       </select>
                    </div>
                    <div className="w-[1px] bg-white/10" />
                    <div className="flex-1 flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t('recommended')}</span>
                       <select name="is_recommended" defaultValue={String(editingDish?.is_recommended ?? false)} className="bg-transparent font-black text-amber-400 outline-none cursor-pointer">
                          <option value="true">YES</option><option value="false">NO</option>
                       </select>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex gap-4 shrink-0">
                 <button type="submit" disabled={isSaving} className="flex-1 py-6 bg-blue-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-3 active-scale hover:bg-slate-950 transition-all">
                    {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span>{editingDish ? t('overwrite_record') : t('deploy_asset')}</span>
                 </button>
                 {editingDish && (
                   <button type="button" onClick={() => { if(confirm(t('permanently_delete') + '?')) { onDeleteDish(editingDish.id); setIsModalOpen(false); }}} className="px-10 text-red-500 hover:bg-red-50 rounded-[2rem] transition-all border-2 border-red-50 active:scale-95">
                      <Trash2 size={24} />
                   </button>
                 )}
              </div>
           </form>
        </div>
      )}

      {/* Image Upload Modal */}
      <ImageUploadModal 
        isOpen={showImageUploadModal}
        onClose={() => setShowImageUploadModal(false)}
        onSelectImage={handleSelectImage}
        lang={lang}
      />
    </div>
  );
};

export default MenuManagement;