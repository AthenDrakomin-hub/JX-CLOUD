const http = require('http');

// 测试 /api/system/status 端点
const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/system/status',
  method: 'GET'
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', res.headers);
    console.log('Response Body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', jsonData);
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error.message);
});

req.setTimeout(5000, () => {
  console.error('Request Timeout');
  req.destroy();
});

req.end();