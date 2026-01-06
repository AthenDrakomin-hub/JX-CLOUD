
import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Save, X, Activity } from 'lucide-react';
import { api } from '../services/api';

const CategoryManagement: React.FC<{ lang: string }> = ({ lang }) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api.categories.getAll().then(setCategories);
  }, []);

  const handleAdd = () => {
    if (!newCat.trim()) return;
    setCategories([...categories, newCat.trim()]);
    setNewCat('');
  };

  const handleRemove = (cat: string) => {
    if (confirm(`确定删除分类 "${cat}" 吗？关联商品将变为未分类状态。`)) {
      setCategories(categories.filter(c => c !== cat));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await api.categories.saveAll(categories);
    setIsSaving(false);
    alert('分类架构已成功保存至云端。');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-fade-up">
      <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center space-x-6">
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center"><Layers size={32} /></div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">分类架构管理</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Product Taxonomy Control Hub</p>
           </div>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="px-10 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-95">
          {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
          <span>保存架构档案</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">新增品类</h3>
           <div className="flex gap-4">
              <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="如：极品瓦罐汤" className="flex-1 px-8 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:bg-white focus:border-blue-500 transition-all" />
              <button onClick={handleAdd} className="w-16 h-16 bg-slate-950 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg active:scale-95"><Plus size={28} /></button>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
           <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">当前活跃分类 ({categories.length})</h3>
           <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-blue-500 transition-all">
                   <span className="font-bold text-slate-900">{cat}</span>
                   <button onClick={() => handleRemove(cat)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
