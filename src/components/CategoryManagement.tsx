import React, { useState, useEffect, useCallback } from 'react';
import { 
  Layers, Plus, Trash2, Save, Activity, 
  ArrowUp, ArrowDown, AlertCircle, 
  GripVertical, Edit3, Check, X
} from 'lucide-react';
import { useForm, useFieldArray, useWatch, Control } from 'react-hook-form';
import { api } from '../services/api';
import { Language, getTranslation } from '../constants/translations';
import { Category } from '../../types';

interface FormValues {
  categories: Category[];
}

interface CategoryRowProps {
  index: number;
  item: Category;
  depth: number;
  control: Control<FormValues>;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
  onAddChild: (parentId: string) => void;
  lang: Language;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ 
  index, item, depth, control, onRemove, onMove, onAddChild, lang 
}) => {
  const { register, setValue } = useForm();
  
  const generateId = useCallback((level: number, parentId: string | null) => {
    return `${parentId ? `${parentId}-` : ''}L${level}-${Date.now()}`;
  }, []);

  const handleNameChange = (field: keyof Category, value: string) => {
    setValue(`${field}`, value);
  };

  return (
    <div className={`flex items-center gap-4 p-6 hover:bg-slate-50 transition-colors ${depth > 0 ? `pl-${8 + depth * 8}` : ''}`}>
      <div className="flex items-center gap-3 w-full">
        <div className="flex items-center gap-2">
          {[...Array(depth)].map((_, i) => (
            <div key={i} className="w-4 h-px bg-slate-300" />
          ))}
          <GripVertical className="text-slate-400 cursor-move" size={16} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
          <input
            {...register(`categories.${index}.name`)}
            defaultValue={item.name}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={lang === 'zh' ? '分类名称' : 'Category Name'}
          />
          <input
            {...register(`categories.${index}.name_en`)}
            defaultValue={item.name_en}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={lang === 'zh' ? '英文名称' : 'English Name'}
          />
          <input
            {...register(`categories.${index}.code`)}
            defaultValue={item.code}
            className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="CAT_001"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            item.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            {item.is_active ? 'ACTIVE' : 'INACTIVE'}
          </span>
          <span className="text-xs text-slate-500 font-mono">
            L{item.level}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAddChild(item.id)}
          disabled={item.level >= 3}
          className="p-2 text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title={lang === 'zh' ? '添加子分类' : 'Add Child'}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 'up')}
          className="p-2 text-slate-400 hover:text-blue-600"
          title={lang === 'zh' ? '上移' : 'Move Up'}
        >
          <ArrowUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMove(index, 'down')}
          className="p-2 text-slate-400 hover:text-blue-600"
          title={lang === 'zh' ? '下移' : 'Move Down'}
        >
          <ArrowDown size={16} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-2 text-slate-400 hover:text-red-600"
          title={lang === 'zh' ? '删除' : 'Delete'}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const CategoryManagement: React.FC<{ 
  lang: Language; 
  onRefreshGlobal?: () => void 
}> = ({ lang, onRefreshGlobal }) => {
  const t = useCallback((key: string) => getTranslation(lang, key), [lang]);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  const { control, handleSubmit, formState: { isDirty }, reset, watch } = useForm<FormValues>({
    defaultValues: { categories: [] }
  });
  
  const { fields, append, remove, move, replace } = useFieldArray({
    control,
    name: "categories"
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.categories.getAll();
      setCategories(data);
      reset({ categories: data });
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [reset]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const generateNewId = useCallback((level: number, parentId: string | null) => {
    return `${parentId ? `${parentId}-` : ''}L${level}-${Date.now()}`;
  }, []);

  const handleAdd = (parentId: string | null = null) => {
    const parent = parentId ? fields.find(c => c.id === parentId) : null;
    const newLevel = parent ? parent.level + 1 : 1;
    
    if (newLevel > 3) {
      alert(lang === 'zh' ? "系统目前仅支持最高三级分类架构" : "Supports up to 3 levels only.");
      return;
    }

    const newId = generateNewId(newLevel, parentId);
    const newCat: Category = {
      id: newId,
      name: lang === 'zh' ? '新分类' : 'New Category',
      name_en: 'New Category',
      code: `CAT_${newId}`,
      parent_id: parentId,
      level: newLevel,
      display_order: fields.filter(c => c.parent_id === parentId).length + 1,
      is_active: true
    };

    if (parentId) {
      let insertIndex = fields.findIndex(f => f.id === parentId) + 1;
      while (insertIndex < fields.length && (fields[insertIndex].parent_id === parentId || isDescendant(fields[insertIndex].parent_id, parentId))) {
        insertIndex++;
      }
      const newFields = [...fields];
      newFields.splice(insertIndex, 0, newCat as any);
      replace(newFields);
    } else {
      append(newCat);
    }
  };

  const isDescendant = (childPid: string | null | undefined, ancestorId: string): boolean => {
    if (!childPid) return false;
    if (childPid === ancestorId) return true;
    const parent = fields.find(f => f.id === childPid);
    return isDescendant(parent?.parent_id, ancestorId);
  };

  const handleRemove = (index: number) => {
    const target = fields[index];
    const childrenCount = fields.filter(c => c.parent_id === target.id).length;
    if (confirm(lang === 'zh' ? `确定删除 [${target.name}] 吗？${childrenCount > 0 ? '其下所有子类将同步删除' : ''}` : `Delete [${target.name}]?`)) {
      const idsToRemove = new Set<string>();
      const collectIds = (pid: string) => {
        idsToRemove.add(pid);
        fields.filter(c => c.parent_id === pid).forEach(child => collectIds(child.id));
      };
      collectIds(target.id);
      replace(fields.filter(f => !idsToRemove.has(f.id)));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = fields[index];
    const siblings = fields.filter(f => f.parent_id === target.parent_id);
    const siblingIndex = siblings.findIndex(s => s.id === target.id);

    if (direction === 'up' && siblingIndex > 0) {
      const prevSibling = siblings[siblingIndex - 1];
      const prevSiblingIndex = fields.findIndex(f => f.id === prevSibling.id);
      move(index, prevSiblingIndex);
    } else if (direction === 'down' && siblingIndex < siblings.length - 1) {
      const nextSibling = siblings[siblingIndex + 1];
      const nextSiblingIndex = fields.findIndex(f => f.id === nextSibling.id);
      move(index, nextSiblingIndex);
    }
  };

  const onSave = async (data: FormValues) => {
    setIsSaving(true);
    try {
      const orderedData = data.categories.map((c, i) => ({
        ...c,
        display_order: i + 1
      }));
      await api.categories.saveAll(orderedData);
      await fetchCategories();
      if (onRefreshGlobal) onRefreshGlobal();
      alert(lang === 'zh' ? "分类架构部署成功" : "Taxonomy deployed successfully");
    } catch (e) {
      alert("Sync Error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-premium flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="flex items-center space-x-6 relative z-10">
           <div className="w-16 h-16 bg-slate-900 text-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-white">
             <Layers size={28} />
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase leading-none">{t('taxonomy_mgmt')}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Dynamic Field Orchestrator</p>
           </div>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
           {isDirty && (
             <div className="flex items-center gap-3 px-5 py-2 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 animate-pulse">
                <AlertCircle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">{lang === 'zh' ? '检测到未保存变更' : 'Unsaved Changes'}</span>
             </div>
           )}
           <button type="button" onClick={() => handleAdd(null)} className="px-8 h-14 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 hover:bg-slate-50 transition-all active-scale shadow-sm">
             <Plus size={18} />
             <span>{t('add_l1_cat')}</span>
           </button>
           <button 
             type="button"
             onClick={handleSubmit(onSave)} 
             disabled={isSaving || !isDirty} 
             className={`px-10 h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl active-scale-95
               ${isSaving || !isDirty ? 'bg-slate-100 text-slate-400' : 'bg-slate-950 text-white hover:bg-blue-600 ring-4 ring-blue-600/10'}`}
           >
             {isSaving ? <Activity className="animate-spin" size={18} /> : <Save size={18} />}
             <span>{isSaving ? (lang === 'zh' ? '同步中..' : 'Syncing...') : t('deploy_arch')}</span>
           </button>
        </div>
      </div>

      <form className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden" onSubmit={handleSubmit(onSave)}>
        <div className="divide-y divide-slate-50">
           {fields.map((item, index) => (
             <CategoryRow 
               key={item.id}
               index={index}
               item={item}
               depth={item.level - 1}
               control={control}
               onRemove={handleRemove}
               onMove={handleMove}
               onAddChild={handleAdd}
               lang={lang}
             />
           ))}
           {fields.length === 0 && (
             <div className="p-20 text-center text-slate-300 uppercase tracking-widest text-[10px] font-black">
               {t('noData')}
             </div>
           )}
        </div>
      </form>

      <div className="bg-blue-50/50 p-6 rounded-3xl border border-dashed border-blue-100 flex gap-4">
         <AlertCircle className="text-blue-500 shrink-0" size={20} />
         <div>
            <p className="text-[11px] font-black text-blue-900 uppercase tracking-widest">Real-time Interface Note</p>
            <p className="text-[10px] text-blue-600 font-medium leading-relaxed mt-1">
              Changes made here will be reflected in the dish registry and customer ordering portal immediately after clicking "Deploy Architecture".
            </p>
         </div>
      </div>
    </div>
  );
};

export default CategoryManagement;