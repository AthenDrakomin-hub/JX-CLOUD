import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Save, X, Activity, ChevronRight, ChevronDown } from 'lucide-react';
import CategoryTree from './CategoryTree';
import { api } from '../services/api';
import { Category } from '../types';

const CategoryManagement: React.FC<{ lang: string }> = ({ lang }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesFlat, setCategoriesFlat] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // 加载层级分类数据
      const hierarchicalData = await api.categories.getAllHierarchical();
      setCategories(hierarchicalData);
      
      // 加载扁平化数据用于树形组件
      const flatData = await api.categories.getAllHierarchicalFlat();
      setCategoriesFlat(flatData);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const handleAdd = async () => {
    if (!newCategoryName.trim()) return;
    
    const newCategory: Category = {
      id: Math.max(0, ...categories.map(c => c.id)) + 1, // 生成新ID
      name: newCategoryName.trim(),
      parent_id: newCategoryParent,
      level: newCategoryParent ? 1 : 0, // 简单层级计算
      display_order: categories.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const updatedCategories = [...categories, newCategory];
    setCategories(updatedCategories);
    
    // 重新加载扁平数据以更新树形视图
    const flatData = await api.categories.getAllHierarchicalFlat();
    setCategoriesFlat(flatData);
    
    setNewCategoryName('');
    setNewCategoryParent(null);
  };

  const handleRemove = (id: number) => {
    if (confirm(`确定删除分类吗？此操作不可撤销。`)) {
      // 删除分类及其子分类
      const idsToDelete = getDescendantIds(id);
      const updatedCategories = categories.filter(c => !idsToDelete.includes(c.id));
      setCategories(updatedCategories);
    }
  };

  const getDescendantIds = (parentId: number): number[] => {
    const descendants = [parentId];
    const children = categories.filter(c => c.parent_id === parentId);
    
    for (const child of children) {
      descendants.push(...getDescendantIds(child.id));
    }
    
    return descendants;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.categories.saveHierarchical(categories);
      alert('分类架构已成功保存至云端。');
    } catch (error) {
      console.error('保存分类失败:', error);
      alert('保存失败，请重试。');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
            <Layers size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">层级分类架构管理</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Hierarchical Product Taxonomy Control Hub</p>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-70"
        >
          {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          <span>保存架构档案</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">新增分类</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">分类名称</label>
              <input 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                placeholder="如：汤品类" 
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">父分类</label>
              <select 
                value={newCategoryParent || ''} 
                onChange={e => setNewCategoryParent(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all"
              >
                <option value="">作为顶级分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{'.'.repeat(cat.level * 2)}{cat.name}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleAdd} 
              className="w-full py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-lg"
            >
              <Plus size={18} />
              <span>添加分类</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">分类层级结构</h3>
            <div className="text-sm text-slate-500">共 {categories.length} 个分类</div>
          </div>
          
          <div className="max-h-[600px] overflow-y-auto pr-2">
            {categoriesFlat.length > 0 ? (
              <CategoryTree rows={categoriesFlat} />
            ) : (
              <div className="text-center py-10 text-slate-400">
                暂无分类，请添加新的分类
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;