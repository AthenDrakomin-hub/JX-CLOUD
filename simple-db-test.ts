// 简单的数据库测试
// 从环境变量读取数据库URL

import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 1000,
    connectionTimeoutMillis: 3000,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.log('❌ 数据库连接失败:', err.message);
        process.exit(1);
    } else {
        console.log('✅ 数据库连接成功!');
        console.log('当前时间:', res.rows[0].now);
        process.exit(0);
    }
});