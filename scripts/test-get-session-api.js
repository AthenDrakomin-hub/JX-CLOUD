// 测试 Better-Auth getSession API
async function testGetSessionAPI() {
  console.log('🚀 测试 Better-Auth getSession API...');
  
  try {
    const response = await fetch('https://www.jiangxijiudian.store/api/auth/get-session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`状态码: ${response.status}`);
    console.log(`状态文本: ${response.statusText}`);
    
    const text = await response.text();
    console.log('响应内容:', text);
    
    if (response.ok) {
      console.log('✅ API 调用成功');
      try {
        const data = JSON.parse(text);
        console.log('解析后的数据:', data);
      } catch (e) {
        console.log('无法解析 JSON 响应');
      }
    } else {
      console.log('❌ API 调用失败');
    }
    
  } catch (error) {
    console.error('❌ 网络请求失败:', error);
  }
}

// 执行测试
testGetSessionAPI();