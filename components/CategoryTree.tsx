import React from 'react';
import CategoryNode from './CategoryNode';
import type { CategoryRow } from '../types/category';
import { buildCategoryTree } from '../utils/categoryTree';

interface Props {
  rows: CategoryRow[]; // 从 execute_sql 返回的数据
}

export default function CategoryTree({ rows }: Props) {
  const tree = buildCategoryTree(rows);
  
  if (!rows || rows.length === 0) {
    return <div className="p-4 text-gray-500">暂无分类</div>;
  }
  
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="font-bold text-lg mb-4 text-slate-900">分类树</div>
      <div className="space-y-1">
        {tree.map((root) => (
          <CategoryNode key={root.id} node={root} />
        ))}
      </div>
    </div>
  );
}