const fs = require('fs');
const path = require('path');

// 获取所有tsx文件
const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(file => file.endsWith('.tsx'));

files.forEach(file => {
    const filePath = path.join(componentsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 替换错误的导入路径
    const oldImport = "from './types'";
    const newImport = "from '../types'";
    
    if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport, 'g'), newImport);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed: ${file}`);
    }
});

console.log('All component imports fixed!');