
import React, { useState, useEffect, useMemo } from 'react';
import { Dish, MaterialImage } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Edit3, Trash2, Search, X, Eye, EyeOff, 
  ImageIcon, Sparkles, Star, Flame, AlertCircle,
  Save, Package, DollarSign, Tag, MoreHorizontal,
  Layers, BarChart3, ChevronRight, Activity,
  Info, Zap, Minus, Plus as PlusIcon
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import OptimizedImage from './OptimizedImage';

interface MenuManagementProps {
  dishes: Dish[];
  materials: MaterialImage[];
  onAddDish: (dish: Dish) => void;
  onUpdateDish: (dish: Dish) => void;
  onDeleteDish: (id: string) => void;
  onAddMaterial: (image: MaterialImage) => void;
  onDeleteMaterial: (id: string) => void;
  lang: Language;
}

const MenuManagement: React.FC<MenuManagementProps> = ({ 
  dishes, onAddDish, onUpdateDish, onDeleteDish, lang 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; dishId: string | null }>({ isOpen: false, dishId: null });
  
  const t = (key: keyof typeof translations.zh) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  // Search Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => 
      d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      (d.nameEn || '').toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [dishes, debouncedSearch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dishData: Dish = {
      id: editingDish?.id || `dish-${Date.now()}`,
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      description: formData.get('description') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      calories: Number(formData.get('calories')),
      allergens: (formData.get('allergens') as string).split(',').map(s => s.trim()).filter(Boolean),
      imageUrl: tempImageUrl || (formData.get('imageUrl') as string) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      isAvailable: editingDish ? editingDish.isAvailable : true,
      isRecommended: isRecommended,
    };

    if (editingDish) onUpdateDish(dishData);
    else onAddDish(dishData);
    closeModal();
  };

  const openModal = (dish: Dish | null = null) => {
    if (dish) {
      setEditingDish(dish);
      setTempImageUrl(dish.imageUrl);
      setIsRecommended(!!dish.isRecommended);
    } else {
      setEditingDish(null);
      setTempImageUrl('');
      setIsRecommended(false);
    }
    setIsModalOpen(true);
  };

  const openDetails = (dish: Dish) => {
    setSelectedDish(dish);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingDish(null);
    setSelectedDish(null);
    setTempImageUrl('');
    setIsRecommended(false);
  };

  const updateStockInDetail = (adjustment: number) => {
    if (!selectedDish) return;
    const updatedDish = { ...selectedDish, stock: Math.max(0, selectedDish.stock + adjustment) };
    onUpdateDish(updatedDish);
    setSelectedDish(updatedDish);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Dynamic Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('curatedMenu')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('kitchenGallery')}</h2>
           <p className="text-sm text-slate-400 font-medium tracking-widest max-w-lg leading-relaxed">
             {t('menuDesc')}
           </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-all" size={20} />
            <input 
              type="text" 
              placeholder={t('searchDishes')}
              className="pl-16 pr-8 py-6 bg-slate-50 border border-transparent rounded-[2.5rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-slate-50 focus:border-slate-100 transition-all w-full lg:w-96 font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-[#0f172a] text-white w-full sm:w-auto px-10 h-20 rounded-[2.5rem] flex items-center justify-center hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95 group relative overflow-hidden space-x-4"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">{t('newCollection')}</span>
          </button>
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
        {filteredDishes.map((dish, idx) => (
          <div 
            key={dish.id} 
            className={`group flex flex-col bg-white rounded-[3.5rem] border border-slate-50 shadow-[0_15px_45px_rgba(0,0,0,0.02)] transition-all duration-700 hover:shadow-[0_40px_90px_rgba(0,0,0,0.1)] hover:-translate-y-4 animate-in fade-in slide-in-from-bottom-8 cursor-pointer ${dish.isAvailable === false ? 'opacity-60' : ''}`}
            style={{ animationDelay: `${idx * 80}ms` }}
            onClick={() => openDetails(dish)}
          >
            {/* Visual Asset Container */}
            <div className="relative aspect-[5/4] rounded-t-[3.5rem] overflow-hidden bg-slate-50 m-2">
               <OptimizedImage 
                 src={dish.imageUrl} 
                 alt={dish.name}
                 aspectRatio="h-full w-full"
                 className={`transition-all duration-1000 group-hover:scale-110 ${dish.isAvailable === false ? 'grayscale blur-[1px]' : ''}`} 
               />
               
               {/* Availability Indicator */}
               {dish.isAvailable === false && (
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px]">
                   <span className="bg-white/90 text-slate-900 px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white">
                     {lang === 'zh' ? '暂未发布' : 'Unpublished'}
                   </span>
                 </div>
               )}

               {/* Asset Floating Meta */}
               <div className="absolute top-6 left-6 flex flex-col space-y-2">
                  <div className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-[0.3em] border border-white/20 flex items-center space-x-2">
                    <Layers size={10} />
                    <span>{dish.category}</span>
                  </div>
                  {dish.isRecommended && (
                    <div className="px-4 py-2 bg-[#d4af37] text-white rounded-full shadow-lg border border-white/20 animate-gold flex items-center space-x-2">
                       <Star size={10} fill="white" />
                       <span className="text-[8px] font-black uppercase tracking-[0.3em]">{lang === 'zh' ? '主厨推荐' : 'Chef Choice'}</span>
                    </div>
                  )}
               </div>

               {/* Quick Management Overlay */}
               <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex space-x-4 translate-y-6 group-hover:translate-y-0 transition-transform duration-500" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => openModal(dish)} 
                      className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl hover:bg-[#d4af37] hover:text-white transition-all active:scale-90"
                    >
                      <Edit3 size={20} />
                    </button>
                    <button 
                      onClick={() => onUpdateDish({ ...dish, isAvailable: !dish.isAvailable })} 
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${dish.isAvailable !== false ? 'bg-white text-slate-950 hover:bg-slate-100' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                    >
                      {dish.isAvailable !== false ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button 
                      onClick={() => setConfirmDelete({ isOpen: true, dishId: dish.id })} 
                      className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
               </div>
            </div>

            {/* Information Suite */}
            <div className="p-8 space-y-8">
               <div className="space-y-2">
                  <div className="flex items-center justify-between">
                     <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight truncate pr-4">{dish.name}</h4>
                     <p className="text-2xl font-serif italic text-[#d4af37] tracking-tighter">₱{dish.price}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{dish.nameEn}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-1 group/item hover:bg-slate-100 transition-colors">
                     <div className="flex items-center space-x-2 text-slate-400">
                        <BarChart3 size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{t('inventory')}</span>
                     </div>
                     <div className="flex items-end space-x-2">
                        <span className={`text-xl font-bold ${dish.stock < 10 ? 'text-red-500' : 'text-slate-900'}`}>{dish.stock}</span>
                        <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Units</span>
                     </div>
                  </div>
                  <div className="p-5 bg-slate-50 rounded-3xl space-y-1 group/item hover:bg-slate-100 transition-colors">
                     <div className="flex items-center space-x-2 text-slate-400">
                        <Activity size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest">Status</span>
                     </div>
                     <div className="flex items-center space-x-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${dish.isAvailable !== false ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-300'}`} />
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                           {dish.isAvailable !== false ? (lang === 'zh' ? '运行中' : 'Active') : (lang === 'zh' ? '已休眠' : 'Paused')}
                        </span>
                     </div>
                  </div>
               </div>
               
               <button 
                onClick={(e) => { e.stopPropagation(); openModal(dish); }}
                className="w-full py-4 border-2 border-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 hover:border-[#d4af37] hover:text-[#d4af37] transition-all flex items-center justify-center space-x-2 group/btn"
               >
                  <span>{t('editCreation')}</span>
                  <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
               </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dish Details Modal */}
      {isDetailModalOpen && selectedDish && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-10">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-in fade-in duration-500" onClick={closeModal} />
          <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-20 duration-700 max-h-[90vh]">
             <div className="md:w-1/2 bg-slate-100">
                <OptimizedImage src={selectedDish.imageUrl} alt={selectedDish.name} aspectRatio="h-full w-full" className="w-full h-full" />
             </div>
             <div className="md:w-1/2 p-10 md:p-16 overflow-y-auto no-scrollbar space-y-10">
                <div className="flex items-start justify-between">
                   <div className="space-y-2">
                      <div className="flex items-center space-x-3 text-[#d4af37]">
                        <Zap size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">{selectedDish.category}</span>
                      </div>
                      <h2 className="text-5xl font-bold text-slate-900 tracking-tight leading-none">{selectedDish.name}</h2>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{selectedDish.nameEn}</p>
                   </div>
                   <button onClick={closeModal} className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-100">
                      <X size={24} />
                   </button>
                </div>

                <div className="flex items-baseline space-x-3">
                   <span className="text-4xl font-serif italic text-[#d4af37]">₱{selectedDish.price}</span>
                   <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Base Pricing</span>
                </div>

                <div className="space-y-4">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center space-x-2">
                      <Info size={12} />
                      <span>{lang === 'zh' ? '详情介绍' : 'Details'}</span>
                   </h5>
                   <p className="text-slate-600 leading-relaxed text-sm font-medium italic">
                      {selectedDish.description || (lang === 'zh' ? '该菜品暂无详细描述。' : 'No description available for this item.')}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Calories</span>
                      <p className="text-xl font-bold text-slate-900">{selectedDish.calories || '—'} <span className="text-[10px] text-slate-400 font-medium">kcal</span></p>
                   </div>
                   <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Allergens</span>
                      <div className="flex flex-wrap gap-2">
                         {selectedDish.allergens?.length ? selectedDish.allergens.map(a => (
                           <span key={a} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-600">{a}</span>
                         )) : <span className="text-xs font-medium text-slate-400">None</span>}
                      </div>
                   </div>
                </div>

                <div className="p-8 bg-slate-900 rounded-[2.5rem] shadow-2xl space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <h5 className="text-white text-lg font-bold">Inventory Control</h5>
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Real-time Stock Management</p>
                      </div>
                      <div className="flex items-center space-x-3">
                         <div className={`w-2 h-2 rounded-full ${selectedDish.stock > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                         <span className="text-[10px] font-black text-white uppercase tracking-widest">{selectedDish.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                      </div>
                   </div>
                   
                   <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                      <button 
                        onClick={() => updateStockInDetail(-1)}
                        className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-[#d4af37] transition-all active:scale-90"
                      >
                        <Minus size={20} />
                      </button>
                      <div className="flex flex-col items-center">
                         <span className="text-3xl font-black text-white tracking-tighter">{selectedDish.stock}</span>
                         <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Available Units</span>
                      </div>
                      <button 
                        onClick={() => updateStockInDetail(1)}
                        className="w-12 h-12 bg-[#d4af37] rounded-xl flex items-center justify-center text-slate-900 hover:bg-white transition-all active:scale-90"
                      >
                        <PlusIcon size={20} />
                      </button>
                   </div>
                </div>

                <button 
                  onClick={() => { closeModal(); openModal(selectedDish); }}
                  className="w-full py-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.4em] text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Enter Edit Mode
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Advanced Management Modal (Edit/Add) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-12">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500" onClick={closeModal} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-6xl bg-white rounded-[4rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 max-h-[90vh]">
             {/* Dynamic Asset Preview */}
             <div className="lg:w-1/2 bg-slate-950 relative group border-r border-slate-100 overflow-hidden hidden lg:block">
                <OptimizedImage 
                  src={tempImageUrl || editingDish?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} 
                  alt="Preview" 
                  aspectRatio="h-full w-full" 
                  className="w-full h-full opacity-60 group-hover:opacity-80 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent flex flex-col justify-end p-20">
                   <div className="space-y-6">
                      <div className="flex items-center space-x-4">
                         <div className="px-6 py-2 bg-white/10 backdrop-blur-xl rounded-full text-[10px] font-black text-white uppercase tracking-[0.3em] border border-white/20">
                           {editingDish ? 'Asset Modification' : 'Entry Initialization'}
                         </div>
                         {isRecommended && <div className="p-3 bg-[#d4af37] rounded-2xl text-white shadow-[0_0_30px_rgba(212,175,55,0.4)]"><Star size={16} fill="white" /></div>}
                      </div>
                      <h4 className="text-white text-6xl font-serif italic tracking-tighter leading-none">Management Workspace</h4>
                      <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em]">Authorized Kitchen Identity Hub</p>
                   </div>
                </div>
             </div>
             
             {/* Data Entry Suite */}
             <div className="lg:w-1/2 p-12 lg:p-20 space-y-10 overflow-y-auto no-scrollbar bg-white">
                <div className="flex items-center justify-between">
                   <div className="space-y-2">
                      <h3 className="text-4xl font-bold text-slate-900 tracking-tight">{editingDish ? t('editCreation') : t('newCollection')}</h3>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Secure Database Transaction</p>
                      </div>
                   </div>
                   <button type="button" onClick={closeModal} className="w-16 h-16 flex items-center justify-center rounded-[1.5rem] bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-inner border border-slate-200">
                     <X size={28} />
                   </button>
                </div>

                <div className="space-y-8">
                   {/* Grid Row 1: Primary Data */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                          <Tag size={12} />
                          <span>{t('dishNameZh')}</span>
                        </label>
                        <input name="name" defaultValue={editingDish?.name} placeholder="江西经典红烧肉" className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-xl text-slate-900" required />
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                          <DollarSign size={12} />
                          <span>{t('price')} (PHP)</span>
                        </label>
                        <input name="price" type="number" step="0.01" defaultValue={editingDish?.price} placeholder="0.00" className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-xl text-slate-900" required />
                      </div>
                   </div>

                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">{t('dishNameEn')}</label>
                     <input name="nameEn" defaultValue={editingDish?.nameEn} placeholder="Braised Pork Belly - Jiangxi Style" className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-lg text-slate-900" />
                   </div>

                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Description / 详情描述</label>
                     <textarea name="description" defaultValue={editingDish?.description} rows={3} placeholder="Describe the flavors, origin, or preparation..." className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-medium text-slate-900 no-scrollbar resize-none" />
                   </div>

                   {/* Grid Row 2: Logic & Volume */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                           <Layers size={12} />
                           <span>{t('category')}</span>
                        </label>
                        <select name="category" defaultValue={editingDish?.category || CATEGORIES[0]} className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black appearance-none cursor-pointer text-slate-900">
                           {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center space-x-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">
                          <Package size={12} />
                          <span>{t('inventory')}</span>
                        </label>
                        <input name="stock" type="number" defaultValue={editingDish?.stock || 0} className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black text-slate-900" required />
                      </div>
                   </div>

                   {/* Grid Row 3: Nutrition & Allergens */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Calories (kcal)</label>
                        <input name="calories" type="number" defaultValue={editingDish?.calories} className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-slate-900" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Allergens (comma separated)</label>
                        <input name="allergens" defaultValue={editingDish?.allergens?.join(', ')} placeholder="Peanuts, Seafood, Dairy" className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-slate-900" />
                      </div>
                   </div>

                   {/* Row 4: Asset Control */}
                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">{t('visualAsset')} URL</label>
                     <div className="relative group">
                        <ImageIcon className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#d4af37]" size={22} />
                        <input 
                          name="imageUrl" 
                          value={tempImageUrl} 
                          onChange={(e) => setTempImageUrl(e.target.value)} 
                          placeholder="https://images.unsplash.com/..." 
                          className="w-full pl-20 pr-10 py-6 bg-slate-50 border-2 border-transparent rounded-[2.5rem] outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-sm text-slate-600" 
                        />
                     </div>
                   </div>

                   {/* Toggleable Flags */}
                   <div className={`p-10 rounded-[3rem] border-2 transition-all duration-500 flex items-center justify-between ${isRecommended ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-transparent'}`}>
                      <div className="flex items-center space-x-6">
                         <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isRecommended ? 'bg-[#d4af37] text-white shadow-xl' : 'bg-white text-slate-300'}`}>
                            {isRecommended ? <Flame size={32} /> : <Star size={32} />}
                         </div>
                         <div>
                            <h5 className="font-bold text-slate-900 text-lg leading-tight">{t('recommendedForYou')}</h5>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Prioritize in Customer Gateway</p>
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setIsRecommended(!isRecommended)}
                        className={`w-20 h-10 rounded-full transition-all relative border-4 ${isRecommended ? 'bg-[#d4af37] border-[#d4af37]/20' : 'bg-slate-200 border-transparent'}`}
                      >
                         <div className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${isRecommended ? 'right-2' : 'left-2'}`} />
                      </button>
                   </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-10 flex items-center space-x-8 border-t border-slate-50">
                   <button type="button" onClick={closeModal} className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-8 py-4 hover:text-slate-950 transition-colors">{t('cancel')}</button>
                   <button type="submit" className="flex-1 bg-[#0f172a] text-white py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-4 group active:scale-95 border border-white/10">
                      <Save size={20} className="group-hover:translate-y-[-2px] transition-transform" />
                      <span>{editingDish ? t('save') : t('confirm')}</span>
                   </button>
                </div>
             </div>
          </form>
        </div>
      )}

      {/* Logic for Asset Removal */}
      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title={t('delete')}
        message={lang === 'zh' ? '正在执行资产清除程序。此菜品将从菜单视图中消失，但历史交易记录将由于审计要求而被保留。' : 'Purging menu asset. The item will be removed from display, but transaction history will persist for auditing.'}
        confirmVariant="danger"
        onConfirm={() => {
          if (confirmDelete.dishId) onDeleteDish(confirmDelete.dishId);
          setConfirmDelete({ isOpen: false, dishId: null });
        }}
        onCancel={() => setConfirmDelete({ isOpen: false, dishId: null })}
        lang={lang}
      />
    </div>
  );
};

export default MenuManagement;
