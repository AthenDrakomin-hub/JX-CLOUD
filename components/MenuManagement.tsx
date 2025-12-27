
import React, { useState, useEffect, useMemo } from 'react';
import { Dish, MaterialImage } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Edit3, Trash2, Search, X, Eye, EyeOff, 
  Layers, ImageIcon, Sparkles 
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
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; dishId: string | null }>({ isOpen: false, dishId: null });
  
  const t = (key: keyof typeof translations.zh) => translations[lang][key] || key;

  // 搜索去抖逻辑
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
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
      stock: Number(formData.get('stock')),
      imageUrl: tempImageUrl || (formData.get('imageUrl') as string) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      isAvailable: editingDish ? editingDish.isAvailable : true,
    };

    if (editingDish) onUpdateDish(dishData);
    else onAddDish(dishData);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDish(null);
    setTempImageUrl('');
  };

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">{t('curatedMenu')}</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">{t('kitchenGallery')}</h2>
           <p className="text-xs text-slate-400 font-medium tracking-widest max-w-md leading-relaxed">
             {t('menuDesc')}
           </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t('searchDishes')}
              className="pl-14 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm outline-none focus:ring-4 focus:ring-slate-100 transition-all w-64 lg:w-80 font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 text-white p-5 rounded-full hover:bg-[#d4af37] transition-all shadow-2xl active:scale-95 group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-10">
        {filteredDishes.map((dish, idx) => (
          <div 
            key={dish.id} 
            className="group relative bg-white rounded-[3.5rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 hover:shadow-[0_30px_70px_rgba(0,0,0,0.12)] transition-all duration-700 animate-in fade-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
               <OptimizedImage 
                 src={dish.imageUrl} 
                 alt={dish.name}
                 aspectRatio="aspect-[4/5]"
                 className={dish.isAvailable === false ? 'grayscale blur-[2px] opacity-40' : ''} 
               />
               
               <div className="absolute top-8 left-8 flex flex-col space-y-2">
                  <div className={`px-4 py-1.5 rounded-full backdrop-blur-xl border border-white/20 shadow-lg text-[9px] font-black uppercase tracking-widest
                    ${dish.isAvailable !== false ? 'bg-white/80 text-slate-900' : 'bg-slate-950/80 text-white'}`}>
                    {dish.category}
                  </div>
               </div>

               <div className="absolute bottom-8 right-8 flex flex-col space-y-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                  <button onClick={() => { setEditingDish(dish); setTempImageUrl(dish.imageUrl); setIsModalOpen(true); }} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-2xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Edit3 size={20} /></button>
                  <button onClick={() => onUpdateDish({ ...dish, isAvailable: !dish.isAvailable })} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90 ${dish.isAvailable !== false ? 'bg-white text-slate-900' : 'bg-emerald-500 text-white'}`}>{dish.isAvailable !== false ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  <button onClick={() => setConfirmDelete({ isOpen: true, dishId: dish.id })} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"><Trash2 size={20} /></button>
               </div>
            </div>

            <div className="p-10 space-y-6">
               <div className="space-y-1">
                  <h4 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{dish.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{dish.nameEn}</p>
               </div>
               <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                  <div>
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">{t('price')}</span>
                     <p className="text-3xl font-serif italic text-slate-900 leading-none"><span className="text-base not-italic font-sans mr-1">¥</span>{dish.price}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">{t('inventory')}</span>
                     <p className={`text-sm font-black ${dish.stock === 0 ? 'text-red-500' : 'text-slate-900'}`}>{dish.stock} <span className="text-[10px] text-slate-400">pcs</span></p>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl" onClick={closeModal} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="lg:w-1/2 bg-slate-50 relative">
                <OptimizedImage src={tempImageUrl || editingDish?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt="Preview" aspectRatio="h-full w-full" />
             </div>
             <div className="lg:w-1/2 p-12 lg:p-20 space-y-10 max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="flex items-center justify-between">
                   <h3 className="text-2xl font-bold text-slate-900">{editingDish ? t('editCreation') : t('newCollection')}</h3>
                   <button type="button" onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('dishNameZh')}</label>
                        <input name="name" defaultValue={editingDish?.name} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-bold" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('price')}</label>
                        <input name="price" type="number" step="0.01" defaultValue={editingDish?.price} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-bold" required />
                      </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('dishNameEn')}</label>
                     <input name="nameEn" defaultValue={editingDish?.nameEn} className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-bold" />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('visualAsset')}</label>
                     <input name="imageUrl" value={tempImageUrl} onChange={(e) => setTempImageUrl(e.target.value)} placeholder="https://..." className="w-full px-6 py-4 bg-slate-50 border border-transparent rounded-2xl outline-none focus:ring-1 focus:ring-[#d4af37] transition-all font-bold" />
                   </div>
                </div>
                <div className="pt-10 flex items-center space-x-6">
                   <button type="button" onClick={closeModal} className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">{t('cancel')}</button>
                   <button type="submit" className="flex-1 bg-slate-900 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all">{editingDish ? t('save') : t('confirm')}</button>
                </div>
             </div>
          </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title={t('delete')}
        message={lang === 'zh' ? '您确定要从菜单中移除该菜品吗？' : 'Are you sure you want to remove this dish?'}
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
