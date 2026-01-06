// Supabase TypeScript interfaces aligned with database schema

export interface Users {
  id: string; // uuid (PK)
  email: string; // text, NOT NULL
  full_name?: string; // text, nullable
  avatar_url?: string; // text, nullable
  metadata?: Record<string, any>; // jsonb, nullable
  created_at: string; // timestamptz, NOT NULL
  updated_at: string; // timestamptz, NOT NULL
  auth_id?: string; // uuid, nullable
  role?: string; // text, nullable
  username: string; // text, NOT NULL
  password?: string; // text, nullable
  last_login?: string; // timestamptz, nullable
  module_permissions?: Record<string, any>; // jsonb, nullable
  ip_whitelist?: string[]; // text[], nullable
  is_online?: boolean; // boolean, nullable
}

export interface MenuDishes {
  idx?: number; // integer, nullable
  id: string; // text (PK)
  name_zh: string; // text, NOT NULL
  name_en?: string; // text, nullable
  price_cents: number; // bigint → number, NOT NULL
  stock?: number; // integer, NOT NULL (default 0)
  image_url?: string; // text, nullable
  is_available?: boolean; // boolean, NOT NULL (default true)
  created_at?: string; // timestamptz, nullable
  category_id?: number; // integer, nullable
}

export interface MenuCategories {
  id: number; // integer (PK)
  name: string; // text, NOT NULL
  parent_id?: number; // integer, nullable
  level?: number; // integer, nullable
  display_order?: number; // integer, nullable
  created_at?: string; // timestamptz, nullable
  updated_at?: string; // timestamptz, nullable
}

export interface Rooms {
  id: string; // text (PK)
  status?: string; // text, nullable (default 'ready')
  guest_name?: string; // text, nullable
  check_in_time?: string; // timestamptz, nullable
  created_at?: string; // timestamptz, nullable
  updated_at?: string; // timestamptz, nullable
}