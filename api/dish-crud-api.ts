// Supabase Edge Function: dish-crud-api
// 用于处理菜品CRUD操作的边缘函数

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0?target=es2022';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// 这是 Supabase Edge Function，将在部署时可用
const supabaseUrl = (globalThis as any).Deno?.env?.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = (globalThis as any).Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export default async function handler(req: Request): Promise<Response> {
  // 处理跨域预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400', // 24小时
      },
    });
  }

  try {
    // 验证请求来源和权限
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }), 
        {
          status: 401,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }

    const token = authHeader.substring(7);
    
    // 解析请求URL以确定操作类型
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const dishId = pathParts[pathParts.length - 1]; // 获取路径的最后一部分作为dish ID
    
    // 根据请求方法和路径处理不同的操作
    switch (req.method) {
      case 'GET':
        // 获取菜品列表或单个菜品
        if (dishId && dishId !== 'dishes') {
          // 获取单个菜品
          return await getDish(dishId);
        } else {
          // 获取菜品列表
          const limit = parseInt(url.searchParams.get('limit') || '1000');
          return await getDishes(limit);
        }
      
      case 'POST':
        // 创建新菜品
        return await createDish(await req.json());
      
      case 'PUT':
        // 更新菜品
        if (!dishId) {
          return new Response(
            JSON.stringify({ error: 'Dish ID is required for update' }), 
            {
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }
        return await updateDish(dishId, await req.json());
      
      case 'DELETE':
        // 删除菜品
        if (!dishId) {
          return new Response(
            JSON.stringify({ error: 'Dish ID is required for delete' }), 
            {
              status: 400,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              }
            }
          );
        }
        return await deleteDish(dishId);
      
      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          {
            status: 405,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            }
          }
        );
    }
  } catch (error: any) {
    console.error('Error in dish-crud-api function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 获取所有菜品
async function getDishes(limit: number): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data || []), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Error getting dishes:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get dishes' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 获取单个菜品
async function getDish(dishId: string): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .select('*')
      .eq('id', dishId)
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Error getting dish:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to get dish' }), 
      {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 创建菜品
async function createDish(dishData: any): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .insert([{
        name: dishData.name,
        name_en: dishData.nameEn,
        description: dishData.description,
        price: dishData.price,
        category: dishData.category,
        stock: dishData.stock,
        image_url: dishData.imageUrl,
        is_recommended: dishData.isRecommended,
        is_available: dishData.isAvailable,
        calories: dishData.calories,
        allergens: dishData.allergens,
        partner_id: dishData.partnerId
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data), 
      {
        status: 201,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Error creating dish:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create dish' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 更新菜品
async function updateDish(dishId: string, dishData: any): Promise<Response> {
  try {
    const { data, error } = await supabase
      .from('dishes')
      .update({
        name: dishData.name,
        name_en: dishData.nameEn,
        description: dishData.description,
        price: dishData.price,
        category: dishData.category,
        stock: dishData.stock,
        image_url: dishData.imageUrl,
        is_recommended: dishData.isRecommended,
        is_available: dishData.isAvailable,
        calories: dishData.calories,
        allergens: dishData.allergens,
        partner_id: dishData.partnerId,
        updated_at: new Date().toISOString()
      })
      .eq('id', dishId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify(data), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Error updating dish:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update dish' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 删除菜品
async function deleteDish(dishId: string): Promise<Response> {
  try {
    const { error } = await supabase
      .from('dishes')
      .delete()
      .eq('id', dishId);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({ success: true }), 
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  } catch (error: any) {
    console.error('Error deleting dish:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to delete dish' }), 
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    );
  }
}

// 配置边缘函数运行时
export const config = {
  runtime: 'edge',
};