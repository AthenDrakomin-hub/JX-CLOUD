import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

const MenuVerification: React.FC = () => {
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        if (!supabase) {
          setError('数据库连接未初始化');
          return;
        }

        // 查询菜品数据
        const { data, error: queryError } = await supabase
          .from('menu_dishes')
          .select(`
            id,
            name,
            name_en,
            price,
            description,
            is_available,
            menu_categories(name, name_en)
          `)
          .eq('is_available', true)
          .limit(10);
        
        if (queryError) {
          setError(`菜品加载失败: ${queryError.message}`);
          console.error('Supabase 查询错误:', queryError);
          return;
        }
        
        setMenuItems(data || []);
        console.log('📋 菲律宾菜品加载成功:', data);
      } catch (err: any) {
        setError(`数据库查询异常: ${err.message}`);
        console.error('数据库查询异常:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '50px', 
        background: '#020617', 
        color: 'white', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{fontSize: '24px', marginBottom: '20px'}}>🍽️ 江西云厨 - 扫码点餐验证</h1>
        <div>正在加载菲律宾菜品...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '50px', 
        background: '#020617', 
        color: 'white', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{fontSize: '24px', marginBottom: '20px'}}>❌ 数据库验证失败</h1>
        <div style={{color: '#ef4444', textAlign: 'center'}}>{error}</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '50px', 
      background: '#020617', 
      color: 'white', 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1 style={{fontSize: '24px', marginBottom: '20px'}}>🍽️ 江西云厨 - 扫码点餐验证</h1>
      <div style={{color: '#3b82f6', fontSize: '18px', marginBottom: '30px'}}>✅ 数据库连接正常，菜品加载成功！</div>
      
      {/* 显示加载的菜品 */}
      {menuItems.length > 0 && (
        <div style={{width: '100%', maxWidth: '600px'}}>
          <h2 style={{color: '#3b82f6', marginBottom: '15px', textAlign: 'center'}}>📋 菲律宾特色菜品</h2>
          <div style={{display: 'grid', gap: '15px'}}>
            {menuItems.map((item: any) => (
              <div key={item.id} style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <div>
                    <h3 style={{margin: '0 0 5px 0', fontSize: '18px'}}>{item.name}</h3>
                    <p style={{margin: '0 0 5px 0', fontSize: '14px', opacity: 0.8}}>{item.name_en}</p>
                    <p style={{margin: '0', fontSize: '12px', opacity: 0.6}}>{item.description}</p>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <div style={{fontSize: '20px', fontWeight: 'bold', color: '#f59e0b'}}>
                      ₱{parseFloat(item.price).toFixed(2)}
                    </div>
                    <div style={{fontSize: '12px', opacity: 0.7}}>
                      {item.menu_categories?.name || '未知分类'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{marginTop: '30px', textAlign: 'center', opacity: 0.8}}>
        <p>看到以上菜品说明数据库功能完全可用！</p>
        <p>现在可以进行扫码点餐业务验证了。</p>
      </div>
    </div>
  );
};

export default MenuVerification;