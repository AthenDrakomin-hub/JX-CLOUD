
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Ingredient } from '../../types';
import { translations, Language } from '../constants/translations';
import { 
  Plus, Trash2, Search, X, 
  Sparkles, Box, AlertTriangle,
  History, Package, Save, Tag, Edit3
} from 'lucide-react';
import { api } from '../services/api';

const InventoryManagement: React.FC<{ lang: Language }> = ({ lang }) => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIng, setEditingIng] = useState<Ingredient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const t = (key: string) => (translations[lang] as any)[key] || key;

  const fetchIngredients = useCallback(async () => {
    const data = await api.ingredients.getAll();
    setIngredients(data);
  }, []);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

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
      // Fix: Changed last_restocked to lastRestocked to match Ingredient interface
      lastRestocked: new Date().toISOString()
    };

    if (editingIng) await api.ingredients.update(data);
    else await api.ingredients.create(data);
    
    setIsModalOpen(false);
    setEditingIng(null);
    fetchIngredients();
  };

  const filteredIngs = useMemo(() => {
    return ingredients.filter(i => 
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (i.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ingredients, searchTerm]);

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
        <div className="space-y-2">
           <div className="flex items-center space-x-2 text-[#d4af37]">
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">JX Stocks & Supply Chain</span>
           </div>
           <h2 className="text-5xl font-serif italic text-slate-900 tracking-tighter">食材与物料库存</h2>
           <p className="text-sm text-slate-400 font-medium">实时监控后厨核心资产消耗水位</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 p-6 rounded-[3rem] border border-white shadow-sm backdrop-blur-md">
        <div className="relative group w-full md:w-96">
           <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#d4af37] transition-colors" size={20} />
           <input 
             type="text" 
             placeholder="搜索食材名称或分类..."
             className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-8 focus:ring-slate-50 transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>

        <button 
           onClick={() => { setEditingIng(null); setIsModalOpen(true); }}
           className="bg-slate-900 text-white px-10 py-5 rounded-[1.75rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#d4af37] transition-all shadow-xl active-scale-95 flex items-center space-x-3"
        >
           <Plus size={18} />
           <span>物料入库登记</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
         {filteredIngs.map((ing, idx) => {
           const isLowStock = ing.stock <= ing.min_stock;
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
                      {/* Fix: Changed last_restocked to lastRestocked to match Ingredient interface */}
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">最近入库: {ing.last_restocked ? new Date(ing.lastRestocked).toLocaleDateString() : '—'}</span>
                   </div>
                </div>
             </div>
           );
         })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-3xl" onClick={() => setIsModalOpen(false)} />
          <form onSubmit={handleIngSubmit} className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
             <div className="p-12 lg:p-16 space-y-10">
                <div className="flex items-center justify-between">
                   <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{editingIng ? '编辑物料信息' : '新物料档案登记'}</h3>
                   <button type="button" onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-900 transition-all"><X size={24} /></button>
                </div>
                <div className="space-y-6">
                   <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">物料名称</label><input name="name" defaultValue={editingIng?.name} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:bg-white transition-all font-bold" /></div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">计量单位</label><input name="unit" defaultValue={editingIng?.unit} required placeholder="kg / L" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">分类</label>
                        <select name="category" defaultValue={editingIng?.category || '主食类'} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold">
                           <option value="主食类">主食类</option><option value="油脂类">油脂类</option><option value="水产类">水产类</option><option value="调味类">调味类</option><option value="蔬果类">蔬果类</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">当前库存</label><input name="stock" type="number" step="0.01" defaultValue={editingIng?.stock || 0} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">警戒水位</label><input name="minStock" type="number" step="0.01" defaultValue={editingIng?.minStock || 10} required className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" /></div>
                   </div>
                </div>
                <button type="submit" className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-[#d4af37] transition-all flex items-center justify-center space-x-3"><Save size={18} /><span>保存档案</span></button>
             </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
