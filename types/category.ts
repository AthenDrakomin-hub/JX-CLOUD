export interface CategoryRow {
  category_id: number;
  category_name: string;
  category_group: string | null;
  parent_id_backup: number | null;
  level: number;
  path?: number[]; // 可选
}

export interface CategoryNode {
  id: number;
  name: string;
  group: string | null;
  children: CategoryNode[];
}