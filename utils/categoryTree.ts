import { CategoryRow, CategoryNode } from '../types/category';

export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const nodes = new Map<number, CategoryNode>();
  
  // 1. 初始化所有节点
  for (const r of rows) {
    nodes.set(r.category_id, {
      id: r.category_id,
      name: r.category_name,
      group: r.category_group ?? null,
      children: []
    });
  }
  
  // 2. 连接父子关系
  const roots: CategoryNode[] = [];
  for (const r of rows) {
    const node = nodes.get(r.category_id)!;
    
    if (r.parent_id_backup == null) {
      roots.push(node);
    } else {
      const parent = nodes.get(r.parent_id_backup);
      if (parent) parent.children.push(node);
      else roots.push(node); // 容错：父节点缺失时当作根
    }
  }
  
  // Optional: sort children by id or name
  const sortFn = (a: CategoryNode, b: CategoryNode) => a.id - b.id;
  const sortRecursively = (n: CategoryNode) => {
    n.children.sort(sortFn);
    n.children.forEach(sortRecursively);
  };
  roots.forEach(sortRecursively);
  
  return roots;
}