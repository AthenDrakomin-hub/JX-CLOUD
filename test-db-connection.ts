// test-db-connection.ts - 数据库连接测试文件
import { supabase, isDemoMode } from './services/supabaseClient';

console.log('开始测试数据库连接...');
console.log('当前模式:', isDemoMode ? '演示模式' : '生产模式');

if (isDemoMode) {
  console.log('警告: 当前为演示模式，缺少Supabase环境变量');
  console.log('请设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 环境变量');
} else {
  console.log('正在连接到Supabase数据库...');

  // 测试连接
  const testConnection = async () => {
    try {
      // 测试获取房间数据
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .limit(5);

      if (roomsError) {
        console.error('房间数据查询错误:', roomsError);
        return;
      }

      console.log('房间数据查询成功:', rooms);

      // 测试获取菜品数据
      const { data: dishes, error: dishesError } = await supabase
        .from('dishes')
        .select('*')
        .limit(5);

      if (dishesError) {
        console.error('菜品数据查询错误:', dishesError);
        return;
      }

      console.log('菜品数据查询成功:', dishes);

      console.log('数据库连接测试完成');
    } catch (error) {
      console.error('数据库连接测试失败:', error);
    }
  };

  testConnection();
}