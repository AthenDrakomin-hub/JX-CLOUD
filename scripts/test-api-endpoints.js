import { createClient } from '@supabase/supabase-js';

// 从环境变量获取配置
const SUPABASE_URL = 'https://zlbemopcgjohrnyyiwvs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmVtb3BjZ2pvaHJueXlpd3ZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Njg5MzksImV4cCI6MjA4MTQ0NDkzOX0.vsV-Tkt09tlMN5EmYdRm_x_YI6oNL4otkVwEjqtji6g';

async function testApiEndpoints() {
  console.log('🚀 测试API端点...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 测试基本连接
    console.log('1. 测试Supabase连接...');
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' });
    
    if (error && error.code !== '42P01') { // 42P01表示表不存在，这是正常的
      console.log('✅ Supabase连接正常');
    } else if (error) {
      console.log('⚠️  表不存在，但连接正常');
    } else {
      console.log('✅ Supabase连接正常，找到用户表');
    }
    
    // 测试API函数调用
    console.log('2. 测试API函数...');
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/api`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      console.log(`   API响应状态: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ API函数可访问');
        console.log('   响应:', JSON.stringify(result, null, 2));
      } else {
        console.log('⚠️  API函数返回错误状态');
        const errorText = await response.text();
        console.log('   错误详情:', errorText);
      }
    } catch (apiError) {
      console.log('❌ API函数测试失败:', apiError.message);
    }
    
    // 测试认证函数
    console.log('3. 测试认证函数...');
    try {
      const authResponse = await fetch(`${SUPABASE_URL}/functions/v1/auth`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: 'health-check' })
      });
      
      console.log(`   认证API响应状态: ${authResponse.status}`);
      
      if (authResponse.ok) {
        const result = await authResponse.json();
        console.log('✅ 认证函数可访问');
      } else {
        console.log('⚠️  认证函数返回错误状态');
      }
    } catch (authError) {
      console.log('❌ 认证函数测试失败:', authError.message);
    }
    
    console.log('🎉 API端点测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    throw error;
  }
}

// 执行测试
testApiEndpoints().catch(console.error);