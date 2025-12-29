
import React, { useState, useEffect, useMemo } from 'react';
import { Dish, MaterialImage } from '../types';
import { translations, Language } from '../translations';
import { 
  Plus, Edit3, Trash2, Search, X, Eye, EyeOff, 
  Star, Flame, Save, Package, ChevronRight, Filter, Smartphone,
  FileText, Tag, DollarSign, Image as ImageIcon,
  // Added missing Globe icon
  Globe
} from 'lucide-react';
import { CATEGORIES } from '../constants';
import ConfirmationModal from './ConfirmationModal';
import OptimizedImage from './OptimizedImage';
import GuestOrder from './GuestOrder';

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
  const [activeCategory, setActiveCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [isRecommended, setIsRecommended] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; dishId: string | null }>({ isOpen: false, dishId: null });
  
  const t = (key: string) => (translations[lang] as any)[key] || (translations.zh as any)[key] || key;

  const filteredDishes = useMemo(() => {
    return dishes.filter(d => {
      const matchSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (d.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = activeCategory === 'All' || d.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [dishes, searchTerm, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: { [key: string]: number } = { All: dishes.length };
    dishes.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [dishes]);

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

  const closeModal = () => {
    setIsModalOpen(false);
    setIsPreviewOpen(false);
    setEditingDish(null);
  };

  return (
    <div className="space-y-12 pb-24">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-[#d4af37]">
              <div className="w-8 h-[2px] bg-[#d4af37] rounded-full" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">{t('curatedMenu')}</span>
           </div>
           <h2 className="text-6xl font-serif italic text-slate-900 tracking-tighter leading-tight">{t('kitchenGallery')}</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <button 
            onClick={() => setIsPreviewOpen(true)}
            className="h-20 px-8 bg-slate-50 border border-slate-200 text-slate-600 rounded-[2.5rem] font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-3 hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
          >
            <Smartphone size={18} />
            <span>点餐预览</span>
          </button>
          <div className="relative group w-full lg:w-72">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-all" size={20} />
            <input 
              type="text" 
              placeholder={t('searchDishes')}
              className="w-full pl-14 pr-8 py-6 bg-slate-50 border border-transparent rounded-[2.5rem] text-sm outline-none focus:bg-white focus:ring-8 focus:ring-slate-50 transition-all font-bold shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-[#0f172a] text-white h-20 px-10 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-4 shadow-2xl hover:bg-[#d4af37] transition-all active:scale-95 group shrink-0"
          >
            <Plus size={20} />
            <span>新增菜品</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar pb-2 px-2 -mx-2">
        {['All', ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center space-x-3 shrink-0 border
              ${activeCategory === cat 
                ? 'bg-slate-900 text-white border-transparent shadow-xl translate-y-[-2px]' 
                : 'bg-white text-slate-400 border-slate-100 hover:text-slate-900 hover:border-slate-200 shadow-sm'}`}
          >
            <span>{cat === 'All' ? t('allCategories') : cat}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] ${activeCategory === cat ? 'bg-white/20 text-[#d4af37]' : 'bg-slate-50 text-slate-400'}`}>
              {categoryCounts[cat] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredDishes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-40 bg-white/40 rounded-[4rem] border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
              <Filter size={32} />
           </div>
           <p className="text-sm font-black text-slate-400 uppercase tracking-widest">在该分类下未找到匹配菜品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
          {filteredDishes.map((dish, idx) => (
            <div 
              key={dish.id} 
              className={`group bg-white rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl transition-all duration-700 hover:-translate-y-4 cursor-pointer animate-in fade-in slide-in-from-bottom-8 ${dish.isAvailable === false ? 'opacity-60 grayscale' : ''}`}
              style={{ animationDelay: `${idx * 80}ms` }}
              onClick={() => openModal(dish)}
            >
              <div className="relative aspect-[5/4] rounded-t-[3.5rem] overflow-hidden m-2 bg-slate-100">
                <OptimizedImage src={dish.imageUrl} alt={dish.name} aspectRatio="h-full w-full" className="transition-all duration-1000 group-hover:scale-110" />
                <div className="absolute top-6 left-6 flex flex-col space-y-2">
                    <div className="px-4 py-2 bg-slate-900/60 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-[0.3em] border border-white/10">{dish.category}</div>
                    {dish.isRecommended && <div className="px-4 py-2 bg-[#d4af37] text-white rounded-full shadow-lg text-[8px] font-black uppercase tracking-[0.3em] flex items-center space-x-1"><Star size={8} fill="white" /> <span>推荐</span></div>}
                </div>
                <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm" onClick={e => e.stopPropagation()}>
                    <div className="flex space-x-4 translate-y-6 group-hover:translate-y-0 transition-transform duration-500">
                      <button onClick={() => openModal(dish)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl hover:bg-[#d4af37] hover:text-white transition-all"><Edit3 size={20} /></button>
                      <button onClick={() => onUpdateDish({ ...dish, isAvailable: !dish.isAvailable })} className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all ${dish.isAvailable !== false ? 'bg-white text-slate-950' : 'bg-emerald-500 text-white'}`}>{dish.isAvailable !== false ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                      <button onClick={() => setConfirmDelete({ isOpen: true, dishId: dish.id })} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-red-500 shadow-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                    </div>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-2xl font-bold text-slate-900 tracking-tight truncate max-w-[150px]">{dish.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{dish.nameEn}</p>
                    </div>
                    <p className="text-2xl font-serif italic text-[#d4af37] tracking-tighter">₱{dish.price}</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-3xl flex items-center justify-between border border-slate-100">
                    <div className="flex items-center space-x-3">
                      <Package size={14} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">存量</span>
                    </div>
                    <span className={`text-sm font-black ${dish.stock < 10 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>{dish.stock} 份</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500" onClick={closeModal} />
          <form onSubmit={handleSubmit} className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-700 max-h-[95vh]">
             <div className="lg:w-1/2 bg-slate-950 relative border-r border-slate-50 hidden lg:block">
                <OptimizedImage src={tempImageUrl || editingDish?.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'} alt="Preview" aspectRatio="h-full w-full" className="opacity-40" />
                <div className="absolute inset-0 flex flex-col justify-end p-20 text-white">
                   <h4 className="text-6xl font-serif italic tracking-tighter leading-tight">JX Kitchen Hub</h4>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mt-4">江西云厨核心菜单管理</p>
                </div>
             </div>
             <div className="lg:w-1/2 p-12 lg:p-16 space-y-8 overflow-y-auto no-scrollbar bg-white">
                <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingDish ? '编辑菜品资产' : '录入新菜品'}</h3>
                   <button type="button" onClick={closeModal} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-950 hover:text-white transition-all"><X size={24} /></button>
                </div>
                
                <div className="space-y-6">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Tag size={12}/> 中文名称</label>
                         <input name="name" defaultValue={editingDish?.name} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" />
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><DollarSign size={12}/> 售价 (PHP)</label>
                         <input name="price" type="number" step="0.01" defaultValue={editingDish?.price} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Globe size={12}/> 英文名称 / International Name</label>
                      <input name="nameEn" defaultValue={editingDish?.nameEn} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold" />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText size={12}/> 详细描述 / Flavor Profile</label>
                      <textarea name="description" defaultValue={editingDish?.description} rows={3} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-medium no-scrollbar resize-none" placeholder="描述菜品的口感、制作工艺或特色..." />
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Filter size={12}/> 所属分类</label>
                         <select name="category" defaultValue={editingDish?.category || CATEGORIES[0]} className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black appearance-none cursor-pointer">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                         </select>
                      </div>
                      <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Package size={12}/> 初始库存</label>
                         <input name="stock" type="number" defaultValue={editingDish?.stock || 0} required className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-black" />
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><ImageIcon size={12}/> 图片资源链接</label>
                      <input name="imageUrl" value={tempImageUrl} onChange={e => setTempImageUrl(e.target.value)} placeholder="Unsplash 或云端 URL..." className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl outline-none focus:bg-white focus:border-[#d4af37] transition-all font-bold text-xs" />
                   </div>

                   <div className={`p-6 rounded-3xl border-2 flex items-center justify-between transition-all ${isRecommended ? 'bg-amber-50 border-amber-100 shadow-inner' : 'bg-slate-50 border-transparent'}`}>
                      <div className="flex items-center space-x-3">
                         <Flame className={isRecommended ? 'text-[#d4af37]' : 'text-slate-300'} size={20} />
                         <span className="text-sm font-black text-slate-900">设为主厨推荐精品</span>
                      </div>
                      <button type="button" onClick={() => setIsRecommended(!isRecommended)} className={`w-14 h-7 rounded-full relative transition-all ${isRecommended ? 'bg-[#d4af37]' : 'bg-slate-200'}`}>
                         <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${isRecommended ? 'right-1' : 'left-1'}`} />
                      </button>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex items-center space-x-6">
                   <button type="button" onClick={closeModal} className="text-xs font-black text-slate-400 uppercase tracking-widest px-4 hover:text-slate-950">取消</button>
                   <button type="submit" className="flex-1 bg-slate-950 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-[#d4af37] transition-all active:scale-95 flex items-center justify-center space-x-3">
                      <Save size={18} />
                      <span>{editingDish ? '保存菜品更改' : '录入江西云厨'}</span>
                   </button>
                </div>
             </div>
          </form>
        </div>
      )}

      <ConfirmationModal 
        isOpen={confirmDelete.isOpen}
        title="清除菜品资产"
        message="该操作将从前端菜单中永久移除该菜品。历史订单审计数据将被保留。确定执行？"
        confirmVariant="danger"
        onConfirm={() => { if(confirmDelete.dishId) onDeleteDish(confirmDelete.dishId); setConfirmDelete({ isOpen: false, dishId: null }); }}
        onCancel={() => setConfirmDelete({ isOpen: false, dishId: null })}
        lang={lang}
      />
    </div>
  );
};

export default MenuManagement;
