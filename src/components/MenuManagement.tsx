import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Dish, User, Partner, Category } from '../../types';
import { Language, getTranslation } from '../constants/translations';
import { 
  Plus, Search, X, Star, Save, 
  Trash2, Edit3, Box, Layers, 
  ChevronDown, Loader2, Tag
} from 'lucide-react';
import { api } from '../services/api';
import OptimizedImage from './OptimizedImage';

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
  dishes, partners, onAddDish, onUpdateDish, onDeleteDish, lang 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('All');
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);

  useEffect(() => {
    api.categories.getAll().then(cats => {
      setAllCategories(cats);
      setExpandedGroups(cats.filter(c => cats.some(child => child.parent_id === c.id)).map(c => c.id));
    });
  }, []);

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
      price: Number(fd.get('price')),
      stock: Number(fd.get('stock')),
      category: fd.get('category') as string,
      image_url: fd.get('image_url') as string,
      is_available: fd.get('is_available') === 'true',
      is_recommended: fd.get('is_recommended') === 'true',
      partner_id: fd.get('partner_id') as string || undefined,
      created_at: new Date().toISOString()
    };

    try {
      if (editingDish) {
        await onUpdateDish(dishData);
      } else {
        await onAddDish(dishData);
      }
      setIsModalOpen(false);
      setEditingDish(null);
    } catch (error) {
      console.error('Error saving dish:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const groupedDishes = useMemo(() => {
    const groups: Record<string, { group: Category; children: Category[]; dishes: Dish[] }> = {};
    
    // Group dishes by top-level categories
    allCategories.filter(c => c.level === 1).forEach(topCat => {
      const subCats = allCategories.filter(c => c.parent_id === topCat.id);
      const groupDishes = filteredDishes.filter(d => 
        d.category === topCat.id || subCats.some(sub => d.category === sub.id)
      );
      
      if (groupDishes.length > 0 || expandedGroups.includes(topCat.id)) {
        groups[topCat.id] = {
          group: topCat,
          children: subCats,
          dishes: groupDishes
        };
      }
    });

    // Handle orphan dishes (no category or invalid category)
    const orphanDishes = filteredDishes.filter(d => 
      !allCategories.some(c => c.id === d.category)
    );
    
    if (orphanDishes.length > 0) {
      groups['orphan'] = {
        group: { id: 'orphan', name: '未分类', name_en: 'Uncategorized', code: 'ORPHAN', level: 1, display_order: 999, is_active: true, parent_id: null } as Category,
        children: [],
        dishes: orphanDishes
      };
    }

    return Object.values(groups);
  }, [filteredDishes, allCategories, expandedGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] focus:border-blue-600 outline-none font-bold"
          />
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingDish(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.75rem] font-bold transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('add')} 菜品
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategoryId('All')}
          className={`px-4 py-2 rounded-full font-bold text-sm ${
            activeCategoryId === 'All' 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          全部
        </button>
        {allCategories.filter(c => c.level === 1).map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm ${
              activeCategoryId === cat.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {lang === 'zh' ? cat.name : cat.name_en}
          </button>
        ))}
      </div>

      {/* Dish Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {groupedDishes.map(({ group, children, dishes: groupDishes }) => (
          <div key={group.id} className="space-y-4">
            {/* Category Header */}
            <div 
              className="flex items-center justify-between cursor-pointer p-4 bg-slate-50 rounded-xl"
              onClick={() => toggleGroup(group.id)}
            >
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">
                  {lang === 'zh' ? group.name : group.name_en}
                </h3>
                {children.length > 0 && (
                  <p className="text-sm text-slate-500 mt-1">
                    {children.length} 个子分类
                  </p>
                )}
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-slate-400 transition-transform ${
                  expandedGroups.includes(group.id) ? 'rotate-180' : ''
                }`} 
              />
            </div>

            {/* Sub-categories */}
            {expandedGroups.includes(group.id) && children.length > 0 && (
              <div className="pl-4 space-y-2">
                {children.map(child => (
                  <div 
                    key={child.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${
                      activeCategoryId === child.id 
                        ? 'bg-blue-50 border-2 border-blue-200' 
                        : 'bg-white border border-slate-100 hover:border-slate-200'
                    }`}
                    onClick={() => setActiveCategoryId(child.id)}
                  >
                    <span>{lang === 'zh' ? child.name : child.name_en}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-full">
                      {filteredDishes.filter(d => d.category === child.id).length}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dishes */}
            <div className="space-y-4">
              {groupDishes.map(dish => (
                <div key={dish.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="aspect-square relative">
                    <OptimizedImage 
                      src={dish.image_url || ''}
                      alt={dish.name}
                      className="w-full h-full object-cover"
                    />
                    {dish.is_recommended && (
                      <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-black flex items-center gap-1">
                        <Star className="w-3 h-3 fill-current" />
                        推荐
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <h4 className="font-black text-slate-900 text-base tracking-tight leading-tight line-clamp-1">
                      {lang === 'zh' ? dish.name : dish.name_en}
                    </h4>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-50 pt-4">
                      <span className="text-xl font-serif italic text-slate-950">
                        ₱{dish.price}
                      </span>
                      <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase ${
                        dish.stock < 10 
                          ? 'bg-red-50 text-red-500' 
                          : 'bg-slate-50 text-slate-400'
                      }`}>
                        {t('inventory')}: {dish.stock}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          setEditingDish(dish);
                          setIsModalOpen(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1.25rem] font-bold transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => onDeleteDish(dish.id)}
                        className="flex items-center justify-center px-4 py-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-[1.25rem] font-bold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {groupDishes.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Box className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-bold">暂无菜品</p>
                  <p className="text-sm mt-1">该分类下还没有添加菜品</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-900">
                {editingDish ? '编辑菜品' : '新增菜品'}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingDish(null);
                }}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    菜品名称 *
                  </label>
                  <input
                    name="name"
                    defaultValue={editingDish?.name}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    英文名称
                  </label>
                  <input
                    name="name_en"
                    defaultValue={editingDish?.name_en}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    价格 (₱) *
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingDish?.price}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    库存数量 *
                  </label>
                  <input
                    name="stock"
                    type="number"
                    defaultValue={editingDish?.stock}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    分类 *
                  </label>
                  <select
                    name="category"
                    defaultValue={editingDish?.category}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  >
                    <option value="">请选择分类</option>
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {lang === 'zh' ? cat.name : cat.name_en}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-black text-slate-700 mb-2">
                    图片URL
                  </label>
                  <input
                    name="image_url"
                    defaultValue={editingDish?.image_url}
                    className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-[1.75rem] font-bold focus:border-blue-600 outline-none"
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      name="is_available"
                      type="checkbox"
                      defaultChecked={editingDish?.is_available ?? true}
                      className="rounded"
                    />
                    <span className="font-bold">上架销售</span>
                  </label>
                </div>
                
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      name="is_recommended"
                      type="checkbox"
                      defaultChecked={editingDish?.is_recommended}
                      className="rounded"
                    />
                    <span className="font-bold">推荐菜品</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-[1.75rem] font-bold transition-colors"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {t('save')}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDish(null);
                  }}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-[1.75rem] font-bold transition-colors"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;