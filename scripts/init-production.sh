#!/bin/bash
# 江西云厨终端系统 - 生产环境初始化脚本

echo "==========================================="
echo "江西云厨终端系统 - 生产环境初始化"
echo "==========================================="

# 检查环境变量
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "错误: 请设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量"
    exit 1
fi

echo "环境变量检查通过"

# 提示用户创建初始管理员账户
echo ""
echo "请通过 Supabase Dashboard 或 API 创建初始管理员账户:"
echo "1. 访问你的 Supabase 项目仪表板"
echo "2. 进入 Authentication -> Users"
echo "3. 点击 'New User' 创建管理员账户"
echo "4. 设置用户为管理员角色"
echo ""

# 创建初始系统配置
echo "设置初始系统配置..."
psql -d $DATABASE_URL << EOF
INSERT INTO system_config (id, hotel_name, version, theme, printer_ip, printer_port, service_charge_rate) 
VALUES ('global', '江西云厨', '5.2.0', 'light', '192.168.1.100', '9100', 0.05)
ON CONFLICT (id) DO UPDATE SET
  hotel_name = EXCLUDED.hotel_name,
  version = EXCLUDED.version,
  theme = EXCLUDED.theme,
  printer_ip = EXCLUDED.printer_ip,
  printer_port = EXCLUDED.printer_port,
  service_charge_rate = EXCLUDED.service_charge_rate;
EOF

echo "系统配置已设置"

# 设置默认支付方式
echo "设置默认支付方式..."
psql -d $DATABASE_URL << EOF
INSERT INTO payments (name, type, is_active, icon_type, instructions) 
VALUES 
  ('现金', 'Cash', true, 'credit-card', '接受现金支付'),
  ('支付宝', 'Alipay', true, 'credit-card', '扫描二维码支付'),
  ('微信支付', 'Wechat', true, 'credit-card', '扫描二维码支付')
ON CONFLICT DO NOTHING;
EOF

echo "默认支付方式已设置"

# 创建默认品类
echo "创建默认品类..."
psql -d $DATABASE_URL << EOF
INSERT INTO categories (name, display_order) 
VALUES 
  ('招牌菜品', 1),
  ('汤品', 2),
  ('主食', 3),
  ('饮品', 4),
  ('特色菜', 5)
ON CONFLICT DO NOTHING;
EOF

echo "默认品类已创建"

echo ""
echo "==========================================="
echo "初始化完成！"
echo "请确保："
echo "1. 在 Supabase 仪表板中创建了管理员用户"
echo "2. 用户的 metadata 中包含角色信息 (role: 'admin')"
echo "3. 验证 RLS 策略已正确应用"
echo "==========================================="