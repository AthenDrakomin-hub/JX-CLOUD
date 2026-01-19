
export type Language = 'zh' | 'en' | 'fil';

export const translations = {
  zh: {
    // 导航与标识
    jxCloud: '江西云厨终端系统',
    dashboard: '经营大盘',
    rooms: '桌位点餐',
    orders: '调度矩阵',
    menu: '资产档案',
    inventory: '物料库存',
    finance: '财务审计',
    financial_hub: '财务与结算',
    users: '组织授权',
    settings: '系统控制台',
    images: '视觉资产',
    supply_chain: '供应链资产',
    signOut: '安全退出',
    enMode: 'English Mode',
    zhMode: '中文模式',
    filMode: 'Tagalog Mode',
    enterprise_auth: '企业级授权 v2',
    collapse: '折叠导航',
    expand: '展开导航',
    
    // 登录/注册 (Auth & Passkey)
    auth_title: '身份准入',
    auth_subtitle: '企业云端资产访问网关',
    auth_passkey_entry: '生物识别登录',
    auth_passkey_desc: '使用已绑定的指纹或面部识别',
    auth_root_access: '根权限访问 (Master)',
    email_placeholder: '输入授权邮箱地址',
    auth_verify: '验证权限协议...',
    rls_status: '数据库 RLS 审计已激活',
    auth_failed: '认证失败：该身份未获得授权',
    auth_passkey_error: 'Passkey 验证中断或设备未绑定',
    auth_not_found: '🔑 未找到你的生物识别凭证。点击下方按钮进行初始化。',
    auth_not_allowed: '🔄 跨设备认证已激活！请使用手机扫描屏幕上的二维码进行确认。',
    auth_register_init: '初始化生物凭证',
    auth_register_desc: '注册新的硬件令牌 (Hardware Token)',
    digital_driven: '数字驱动，',
    cloud_kitchen: '云端厨卫。',
    auth_description: '江西云厨：集成本地 RLS 审计、多维财务模型与物理硬件链路。',
    master_inject_btn: '立即注入系统级 Session',
    intel_node: '企业级智能节点',
    // ... 保持原有翻译
    save: '保存', cancel: '取消', delete: '删除', edit: '编辑', add: '新增', search: '搜索', confirm: '确认', refresh: '刷新',
    success: '操作成功', error: '系统错误',
    new_order_toast: '新订单来自: {room}', sync_active: '实时同步中', sync_offline: '离线模式'
  },
  en: {
    jxCloud: 'JX CLOUD Terminal',
    dashboard: 'Dashboard',
    rooms: 'Floor Plan',
    orders: 'Order Matrix',
    menu: 'Asset Files',
    inventory: 'Inventory',
    finance: 'Audit',
    financial_hub: 'Financials',
    users: 'Auth Center',
    settings: 'Control Console',
    images: 'Visuals',
    supply_chain: 'Supply Chain',
    signOut: 'Logout',
    enMode: 'English Mode',
    zhMode: 'Chinese Mode',
    filMode: 'Tagalog Mode',
    enterprise_auth: 'Enterprise Auth v2',
    collapse: 'Collapse',
    expand: 'Expand',

    auth_title: 'Access Identity',
    auth_subtitle: 'Enterprise Asset Access Gateway',
    auth_passkey_entry: 'Biometric Entry',
    auth_passkey_desc: 'Touch ID / Face ID recognized',
    auth_root_access: 'Advanced Authority (Root)',
    email_placeholder: 'Authorized Email Address',
    auth_verify: 'Verifying protocol...',
    rls_status: 'Database RLS Audit Active',
    auth_failed: 'Authorization denied: Unknown identity',
    auth_passkey_error: 'Passkey failed or device not bound',
    auth_not_found: '🔑 No credentials found. Click the button below to initialize.',
    auth_not_allowed: '🔄 Cross-device auth active! Please use your mobile to scan the QR code.',
    auth_register_init: 'Initialize Biometrics',
    auth_register_desc: 'Register New Hardware Token',
    digital_driven: 'Digital Driven,',
    cloud_kitchen: 'Cloud Kitchen.',
    auth_description: 'JX Cloud: Integrated RLS audit, financial models and physical hardware links.',
    master_inject_btn: 'Inject System Session',
    intel_node: 'Enterprise Intel Node',
    // ... 保持原有翻译
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', search: 'Search', confirm: 'Confirm', refresh: 'Refresh',
    success: 'Success', error: 'Error',
    new_order_toast: 'New Order: {room}', sync_active: 'Synced', sync_offline: 'Offline'
  },
  fil: {
    jxCloud: 'JX CLOUD Terminal',
    dashboard: 'Dashboard',
    rooms: 'Floor Plan',
    orders: 'Order Matrix',
    menu: 'Asset Files',
    inventory: 'Inventory',
    finance: 'Audit',
    financial_hub: 'Financials',
    users: 'Auth Center',
    settings: 'Control Console',
    images: 'Visuals',
    supply_chain: 'Supply Chain',
    signOut: 'Logout',
    enMode: 'English Mode',
    zhMode: 'Chinese Mode',
    filMode: 'Tagalog Mode',
    enterprise_auth: 'Enterprise Auth v2',
    collapse: 'Collapse',
    expand: 'Expand',

    auth_title: 'Access Identity',
    auth_subtitle: 'Enterprise Asset Access Gateway',
    auth_passkey_entry: 'Biometric Entry',
    auth_passkey_desc: 'Touch ID / Face ID recognized',
    auth_root_access: 'Advanced Authority (Root)',
    email_placeholder: 'Authorized Email Address',
    auth_verify: 'Verifying protocol...',
    rls_status: 'Database RLS Audit Active',
    auth_failed: 'Authorization denied: Unknown identity',
    auth_passkey_error: 'Passkey failed or device not bound',
    auth_not_found: '🔑 No credentials found. Click the button below to initialize.',
    auth_not_allowed: '🔄 Cross-device auth active! Please use your mobile to scan the QR code.',
    auth_register_init: 'Initialize Biometrics',
    auth_register_desc: 'Register New Hardware Token',
    digital_driven: 'Digital Driven,',
    cloud_kitchen: 'Cloud Kitchen.',
    auth_description: 'JX Cloud: Integrated RLS audit, financial models and physical hardware links.',
    master_inject_btn: 'Inject System Session',
    intel_node: 'Enterprise Intel Node',
    // ... 保持原有翻译
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', search: 'Search', confirm: 'Confirm', refresh: 'Refresh',
    success: 'Success', error: 'Error',
    new_order_toast: 'New Order: {room}', sync_active: 'Synced', sync_offline: 'Offline'
  }
};

export const getTranslation = (lang: Language, key: string, params?: Record<string, string | number>): string => {
  const langSet = translations[lang] || translations.zh;
  let text = (langSet as any)[key] || (translations.zh as any)[key] || key;
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, String(v));
    });
  }
  
  return text;
};