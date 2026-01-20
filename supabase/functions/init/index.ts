// Supabase Edge Functions - 菜品初始化服务
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// 核心菜品数据
const dishesData = [
  // 扒饭系列
  { id: 'D101', name: '黑椒猪扒饭', name_en: 'Black Pepper Pork Chop Rice', category_id: '101', price: '150', stock: 50, is_available: true, image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800', is_recommended: true, description: '选用上等里脊肉，搭配特调黑椒汁。' },
  { id: 'D102', name: '香烤牛扒饭', name_en: 'Grilled Steak Rice', category_id: '101', price: '280', stock: 30, is_available: true, image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=800', description: '严选谷饲牛肉，高温碳烤锁住肉汁。' },
  { id: 'D103', name: '泰式鸡腿饭', name_en: 'Thai Chicken Leg Rice', category_id: '101', price: '180', stock: 45, is_available: true, image_url: 'https://images.unsplash.com/photo-1562967916-eb82221dfb92?q=80&w=800', description: '泰式秘制腌料，酸辣适中。' },
  
  // 中式精品
  { id: 'D201', name: '红烧肉套餐', name_en: 'Braised Pork Set', category_id: '002', price: '220', stock: 20, is_available: true, image_url: 'https://images.unsplash.com/photo-1627308595229-7830a5c91f9f?q=80&w=800', is_recommended: true, description: '经典本帮风味，软糯不油腻。' },
  { id: 'D202', name: '麻婆豆腐饭', name_en: 'Mapo Tofu Rice', category_id: '002', price: '120', stock: 100, is_available: true, image_url: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?q=80&w=800', description: '麻辣鲜香，传统川味。' },
  
  // 高端洋酒
  { id: 'W601', name: '轩尼诗 VSOP (700ml)', name_en: 'Hennessy VSOP', category_id: '602', price: '4200', stock: 12, is_available: true, image_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800', description: '干邑界的标杆，果香浓郁，余味悠长。' },
  { id: 'W611', name: '马爹利名仕', name_en: 'Martell Noblige', category_id: '601', price: '3800', stock: 10, is_available: true, image_url: 'https://images.unsplash.com/photo-1594411132791-7667c453f663?q=80&w=800', description: '口感圆润顺滑，带优雅芬芳。' },
  
  // 软饮
  { id: 'B901', name: '可口可乐 (330ml)', name_en: 'Coca Cola', category_id: '901', price: '35', stock: 500, is_available: true, image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=800' },
  { id: 'B903', name: '王老吉', name_en: 'Wong Lo Kat', category_id: '901', price: '45', stock: 200, is_available: true, image_url: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?q=80&w=800', description: '正宗凉茶，清热去火。' },
  
  // 海鲜
  { id: 'S401', name: '清蒸大龙虾', name_en: 'Steamed Lobster', category_id: '004', price: '1200', stock: 15, is_available: true, image_url: 'https://images.unsplash.com/photo-1559700018-9d14fd5a99ce?q=80&w=800', is_recommended: true, description: '鲜活龙虾，原汁原味。' }
];

export const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1', '');
  const method = req.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Init-Service': 'jx-cloud-init-edge'
  };

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 初始化菜品数据
    if (path.endsWith('/init-dishes') && method === 'POST') {
      // 检查是否已有数据
      const { data: existingDishes } = await supabase.from('menu_dishes').select('id').limit(1);
      
      if (existingDishes && existingDishes.length > 0) {
        return new Response(JSON.stringify({
          message: 'Dishes already initialized',
          count: existingDishes.length,
          service: 'jx-cloud-init-edge'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 插入初始菜品数据
      const { data, error } = await supabase.from('menu_dishes').insert(dishesData);
      
      if (error) throw error;

      return new Response(JSON.stringify({
        message: 'Dishes initialized successfully',
        inserted: dishesData.length,
        service: 'jx-cloud-init-edge'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 获取菜品数据
    if (path.endsWith('/dishes') && method === 'GET') {
      const { data, error } = await supabase.from('menu_dishes').select('*');
      
      if (error) throw error;

      return new Response(JSON.stringify(data || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Init route not found',
      path: path,
      service: 'jx-cloud-init-edge'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      service: 'jx-cloud-init-edge'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};

if (import.meta.main) {
  serve(handler);
}