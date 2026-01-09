
export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // 基础导航
    jxCloud: '江西云厨终端系统',
    dashboard: '经营大盘',
    rooms: '桌位点餐',
    orders: '调度中心',
    menu: '商品管理',
    inventory: '库存管理',
    finance: '财务清算',
    financial_hub: '财务与清算',
    users: '员工授权',
    settings: '系统设置',
    images: '图片管理',

    payments: '支付配置',
    partners: '联营合伙',
    category_mgr: '分类管理',
    supply_chain: '供应链管理',
    signOut: '安全退出',
    signIn: '安全登录终端',
    username: '登录工号',
    password: '访问密钥',

    // 菜品分类翻译 - 核心匹配
    cat_主食套餐类: '主食套餐类 / Set Meals',
    cat_中式主食类: '中式主食类 / Chinese Staples',
    cat_中式炒菜类: '中式炒菜类 / Sautéed Dishes',
    cat_粤式菜品: '粤式菜品 / Cantonese Delicacy',
    cat_基础主食: '基础主食 / Basic Sides',
    cat_All: '全部商品 / All',

    // Menu Management
    menuArchiveTitle: '菜品资产档案',
    searchProduct: '检索商品名...',
    addNewProduct: '录入新商品',
    stockLabel: '库存: ',
    unitValue: '单位价值 (PHP)',
    editProductTitle: '维护商品档案',
    newProductTitle: '录入新商品档案',
    nodeRegistrySub: 'JX-Kitchen Master Node Registry',
    noAssetLinked: '无预览图 / No Asset Linked',
    uploadNewImg: '上传新图',
    pickerFromGallery: '资产库选择',
    recRatio: '推荐比例: 16:9 或 4:3',
    productNameLabel: '商品展示名称',
    unitPriceLabel: '单价 (PHP)',
    categoryLabel: '所属品类',
    assetUrlLabel: '视觉资产路径 (URL)',
    stockWatermark: '当前物料库存水位',
    saveArchive: '确认存盘商品档案',
    deleteProductConfirm: '彻底从线上商店移除此商品？',
    galleryPickerTitle: '云端资产库选择器',
    assetBrowserSub: 'JX-Cloud Storage Asset Browser',
    syncingObjects: '正在同步 Supabase 对象列表...',
    galleryEmpty: '资产库为空，请先上传图片',
    selectAsset: '选用该资产',
    assetIndex: '品类资产索引',
    allAssets: '全部资产',
    guestPreview: '进入宾客预览页',
    previewModeDesc: '实时模拟菲律宾本地宾客扫描二维码后看到的移动端界面。',
    visualAssetCenter: '视觉资产中心',
    cloudStorageGateway: 'Cloud Storage Gateway',
    storageVault: '存储库',
    opCommand: '操作指令',
    uploadingNewAsset: '上传新视觉资产',
    syncingNow: '正在同步...',

    // 状态与业务
    status_pending: '待接单',
    status_preparing: '制作中',
    status_completed: '已完成',
    status_cancelled: '已取消',
    currency: '₱',
    
    // KDS & POS
    kdsMode: 'KDS 厨显模式',
    standardMode: '标准模式',
    acceptOrder: '接单制作',
    completeOrder: '出餐完成',
    orderDetails: '订单详情',
    checkout: '结账',
    subtotal: '小计',
    tax: '税费',
    totalBill: '应付总计',
    printTicket: '打印制作单',
    emptyCart: '请从左侧选择菜品',
    clearCart: '清空重选',
    orderSummary: '订单摘要',
    searchDishesPlaceholder: '搜索菜品...',
    stationManagement: '桌位点餐控制',
    manualOrder: '录入新单',
    guestQRCode: '点餐二维码',
    displayQRDesc: '展示二维码供宾客自主点餐',
    staffOperatedDesc: '由服务员代为录入点餐信息',
    cancel: '取消',
    save: '保存全局设置',
    revenue: '今日总营收',
    avgOrderValue: '客单价 (AOV)',
    occupancy: '桌位占用率',
    zone: '区域',
    station: '桌位',
    statusActive: '正常运行',
    welcomeBack: '欢迎回来',
    loginFailed: '访问密钥不匹配',
    syncError: '数据同步链路异常',

    // Guest Order Specific
    orderSuccessTitle: '下单成功',
    orderSuccessDesc: '订单已确认，请稍后。',
    orderMore: '继续点餐',
    confirmOrder: '订单确认',
    verifyBilling: '请核对账单',
    paymentMethodLabel: '支付方式',
    placeOrder: '提交订单',
    soldOut: '售罄',
    chefPick: '主厨推荐',
    addDish: '点餐',

    // 角色
    role_admin: '总管理员 (Admin)',
    role_staff: '普通员工 (Staff)',
    role_maintainer: '开发者 (Maintainer)',
    authCenter: '核心人员授权中心',
    authDesc: '管理全店员工的访问权限及登录安全策略',
    issueNewAccount: '签发新员工账号',

    // Dashboard
    enterpriseIntelligence: '企业经营情报',
    secureCloudActive: '云安全协议已激活',

    // Finance
    cashierShift: '收银交班',
    cashIncome: '现金收入汇总',
    digitalIncome: '网银/扫码收入',
    shiftReport: '班次报告结算',
    endShift: '结束并结算当前班次',

    // Deployment Checklist
    infraSecurity: '基础设施安全',
    sslTlsLabel: 'SSL/TLS 强制加密',
    sslTlsDesc: '全站强制 HTTPS 以保护数据传输安全',
    jwtAuthLabel: 'JWT 鉴权加固',
    jwtAuthDesc: '使用高强度 Secret 签署身份令牌',
    corsPolicyLabel: 'CORS 跨域策略',
    corsPolicyDesc: '限制仅允许受信任的域名访问 API',
    envVarsLabel: '环境变量脱敏',
    envVarsDesc: '确保生产环境密钥不泄露在客户端代码中',
    backendStorage: '后端与存储',
    dbProdLabel: '数据库生产实例',
    dbProdDesc: '连接至高可用生产级 Postgres 集群',
    redisCacheLabel: '分布式缓存',
    redisCacheDesc: '配置 Redis 以加速频繁数据查询',
    dbBackupLabel: '自动备份机制',
    dbBackupDesc: '每日定时快照以防止数据丢失',
    businessIntegration: '业务集成',
    paymentSdkLabel: '支付 SDK 配置',
    paymentSdkDesc: '完成 GCash/Maya 生产环境对接',
    cloudPrintLabel: '云打印机中继',
    cloudPrintDesc: '配置远程热敏打印机 IP 与端口',
    preProductionAudit: '预发布审计',
    productionReadiness: '生产环境就绪检查',
    deploymentDesc: '在切换到生产环境前，请确保以下核心链路已完成审计。',
    completed: '已完成',
    pending: '待处理',
    responseLatency: '响应延迟',
    globalCdn: '全球 CDN 节点',
    dataIntegrity: '数据完整性',
    ddosMitigation: 'DDoS 防护状态',

    // Error Boundary
    errorOccurred: '系统检测到运行时异常',
    errorDescription: '由于内部组件发生未捕获的错误，当前视图已自动挂起以保护数据一致性。',
    retryAction: '尝试重启终端',
    reportIssue: '上报技术故障',

    // System Settings
    printerConfig: '打印机通信配置',
    printerIp: '打印机 IP 地址',
    printerPort: '端口 (Port)',

    // Payment Management
    paymentHub: '支付枢纽配置',
    paymentDesc: '管理全店可用的收银通道与支付网关',
    gatewayConfig: '网关参数配置',
    gatewayName: '通道显示名称',
    paymentInstructions: '支付引导说明',
    registerNewGateway: '注册新支付网关',
    registerNewPaymentGateway: '注册新支付通道'
  },
  en: {
    jxCloud: 'JX CLOUD Terminal',
    dashboard: 'Business Dashboard',
    rooms: 'Tables & POS',
    orders: 'Order Center',
    menu: 'Product Management',
    inventory: 'Inventory',
    finance: 'Financial Center',
    financial_hub: 'Financial Hub',
    users: 'Staff Auth',
    settings: 'System Settings',
    images: 'Media Management',

    payments: 'Payments Config',
    partners: 'Partners Management',
    category_mgr: 'Categories',
    supply_chain: 'Supply Chain',
    signOut: 'Logout',
    signIn: 'Secure Login',
    username: 'Staff ID',
    password: 'Access Key',

    // Categories
    cat_主食套餐类: 'Combo Set Meals',
    cat_中式主食类: 'Chinese Staples',
    cat_中式炒菜类: 'Sautéed Dishes',
    cat_粤式菜品: 'Cantonese Special',
    cat_基础主食: 'Basic Sides',
    cat_All: 'All Products',

    // Menu Management
    menuArchiveTitle: 'Menu Asset Registry',
    searchProduct: 'Search product...',
    addNewProduct: 'New Entry',
    stockLabel: 'Stock: ',
    unitValue: 'Unit Value (PHP)',
    editProductTitle: 'Edit Product Archive',
    newProductTitle: 'Create Product Entry',
    nodeRegistrySub: 'JX-Kitchen Master Node Registry',
    noAssetLinked: 'No Asset Linked',
    uploadNewImg: 'Upload Image',
    pickerFromGallery: 'Gallery Picker',
    recRatio: 'Rec. Ratio: 16:9 or 4:3',
    productNameLabel: 'Product Display Name',
    unitPriceLabel: 'Unit Price (PHP)',
    categoryLabel: 'Category Registry',
    assetUrlLabel: 'Visual Asset URL',
    stockWatermark: 'Current Stock Level',
    saveArchive: 'Commit Archive Changes',
    deleteProductConfirm: 'Remove this item from store permanently?',
    galleryPickerTitle: 'Cloud Asset Picker',
    assetBrowserSub: 'JX-Cloud Storage Asset Browser',
    syncingObjects: 'Syncing cloud objects...',
    galleryEmpty: 'Gallery empty, upload first',
    selectAsset: 'Select Asset',
    assetIndex: 'Category Index',
    allAssets: 'All Assets',
    guestPreview: 'Guest Preview Page',
    previewModeDesc: 'Simulate the mobile interface as seen by guests scanning QR.',
    visualAssetCenter: 'Visual Asset Hub',
    cloudStorageGateway: 'Cloud Storage Gateway',
    storageVault: 'Vault',
    opCommand: 'Commands',
    uploadingNewAsset: 'Upload New Visual Asset',
    syncingNow: 'Syncing...',

    status_pending: 'Pending',
    status_preparing: 'Preparing',
    status_completed: 'Completed',
    status_cancelled: 'Cancelled',
    currency: '₱',

    kdsMode: 'KDS Mode',
    standardMode: 'Standard Mode',
    acceptOrder: 'Accept Order',
    completeOrder: 'Done & Serve',
    orderDetails: 'Order Details',
    checkout: 'Checkout',
    subtotal: 'Subtotal',
    tax: 'Tax',
    totalBill: 'Total Bill',
    printTicket: 'Print Ticket',
    emptyCart: 'Select items',
    clearCart: 'Clear Cart',
    orderSummary: 'Order Summary',
    searchDishesPlaceholder: 'Search...',
    stationManagement: 'Station Control',
    manualOrder: 'Manual Order',
    guestQRCode: 'Guest QR Code',
    displayQRDesc: 'Display QR for guest self-ordering',
    staffOperatedDesc: 'Entered by staff',
    cancel: 'Cancel',
    save: 'Save Settings',
    revenue: 'Revenue',
    avgOrderValue: 'Avg Order',
    occupancy: 'Occupancy',
    zone: 'Zone',
    station: 'Station',
    statusActive: 'Active',
    welcomeBack: 'Welcome Back',
    loginFailed: 'Access Denied',
    syncError: 'Sync error',

    // Guest Order Specific
    orderSuccessTitle: 'Order Successful',
    orderSuccessDesc: 'Your order is confirmed.',
    orderMore: 'Order More',
    confirmOrder: 'Confirm Order',
    verifyBilling: 'Verify Billing Details',
    paymentMethodLabel: 'Payment Method',
    placeOrder: 'Place Order',
    soldOut: 'Sold Out',
    chefPick: "Chef's Pick",
    addDish: 'ADD',

    role_admin: 'Admin',
    role_staff: 'Staff',
    role_maintainer: 'Maintainer',
    authCenter: 'Authorization Center',
    authDesc: 'Manage staff access',
    issueNewAccount: 'Issue New Account',

    // Dashboard
    enterpriseIntelligence: 'Business Intelligence',
    secureCloudActive: 'Cloud Security Active',

    // Finance
    cashierShift: 'Cashier Shift',
    cashIncome: 'Cash Revenue',
    digitalIncome: 'Digital Revenue',
    shiftReport: 'Shift Report',
    endShift: 'End Shift & Settle',

    // Deployment Checklist
    infraSecurity: 'Infra Security',
    sslTlsLabel: 'SSL/TLS Encryption',
    sslTlsDesc: 'Force HTTPS for all traffic',
    jwtAuthLabel: 'JWT Hardening',
    jwtAuthDesc: 'Strong secret for token signing',
    corsPolicyLabel: 'CORS Policy',
    corsPolicyDesc: 'Restrict API access to trusted domains',
    envVarsLabel: 'Environment Variables',
    envVarsDesc: 'Secure production secrets',
    backendStorage: 'Backend & Storage',
    dbProdLabel: 'Database Production',
    dbProdDesc: 'Connect to production Postgres cluster',
    redisCacheLabel: 'Distributed Cache',
    redisCacheDesc: 'Configure Redis for performance',
    dbBackupLabel: 'Auto Backup',
    dbBackupDesc: 'Daily snapshots scheduled',
    businessIntegration: 'Business Integration',
    paymentSdkLabel: 'Payment SDK',
    paymentSdkDesc: 'Configure GCash/Maya production',
    cloudPrintLabel: 'Cloud Printer',
    cloudPrintDesc: 'Thermal printer IP & port setup',
    preProductionAudit: 'Pre-production Audit',
    productionReadiness: 'Production Readiness',
    deploymentDesc: 'Ensure core links are audited before production switch.',
    completed: 'Completed',
    pending: 'Pending',
    responseLatency: 'Latency',
    globalCdn: 'Global CDN',
    dataIntegrity: 'Data Integrity',
    ddosMitigation: 'DDoS Mitigation',

    // Error Boundary
    errorOccurred: 'Runtime Exception Detected',
    errorDescription: 'An uncaught error occurred in internal components.',
    retryAction: 'Restart Terminal',
    reportIssue: 'Report Issue',

    // System Settings
    printerConfig: 'Printer Configuration',
    printerIp: 'Printer IP',
    printerPort: 'Port',

    // Payment Management
    paymentHub: 'Payment Hub',
    paymentDesc: 'Manage store-wide payment gateways',
    gatewayConfig: 'Gateway Configuration',
    gatewayName: 'Display Name',
    paymentInstructions: 'Instructions',
    
    // Dashboard
    revenueTrendChart: '今日营收趋势图 / Daily Revenue Trend',
    categoryRevenueBreakdown: '品类营收占比 / Category Revenue Breakdown',
    
    // Supply Chain
    generateTableQR: '生成所有桌贴二维码 / Generate All Table QR Codes',
    supplyChainAssetMgmt: '供应链资产管理 / Supply Chain Asset Management',
    dishRecords: '菜品档案 / Dish Records',
    categoryStructure: '分类架构 / Category Structure',
    materialInventory: '物料库存 / Material Inventory',
    
    // Financial Hub
    financialControlCenter: '财务与清算中控台 / Financial and Settlement Control Center',
    revenueAuditCenter: '营收流水审计与前台收银交班管理中心 / Revenue Audit and Front Desk Cashier Shift Management Center',
    businessFlow: '营业流水 / Business Transaction Flow',
    fundFlow: '资金流水 / Fund Transaction Flow',
    jointPartnership: '联营合伙 / Joint Partnership',
    paymentGateway: '支付网关 / Payment Gateway',
    
    // Appearance Settings
    globalAppearance: '全局外观风格 / Global Appearance Style',
    lightMode: '明亮模式 / Light Mode',
    darkMode: '深邃模式 / Dark Mode',
    highContrastUI: '高对比度 UI / High Contrast UI',
    highContrastDesc: '开启后加深边框与文字对比度，适合视障或强光操作 / Increases border and text contrast when enabled, suitable for visually impaired users or bright light conditions',
    jxPreview: '江西云厨预览 / Jiangxi Cloud Kitchen Preview',
    fontScaling: '字体与缩放 / Font and Scaling',
    sourceHanSans: '思源黑体 / Source Han Sans',
    intelligentAnnouncement: '智能播报 / Intelligent Announcement',
    
    // RLS Error Messages
    rlsForbidden: 'RLS策略阻止访问 / RLS Policy Blocked Access',
    rlsPermissionDenied: '权限不足：RLS策略阻止访问 / Permission Denied: RLS Policy Blocked Access',
    rlsBlocked: 'RLS策略阻止操作 / RLS Policy Blocked Operation',
    
    // Staff Management
    nodeAuthProtocol: 'Auth Terminal Protocol',
    authTerminalSub: 'JX-Cloud Security Protocol v5.5',
    confirmAndIssueAuth: 'Confirm and Issue Digital Authorization',
    submitAndApplyChanges: 'Submit and Apply Changes',
    
    // Login Page
    confirmTerminalAccess: 'Confirm Terminal Access',
    
    // Order Management
    printTicketAndSync: '打印制作单并同步制作状态',
    printAndPrep: 'Print & Prep',
    
    // Payment Management
    registerNewGateway: 'Register New Payment Gateway',
    registerNewPaymentGateway: 'Register New Payment Channel',
    activeStatus: 'Active Status',
    
    // Partner Management
    confirmTerminatePartner: 'Confirm termination of partnership? This action cannot be undone.',
    
    // General Confirmations
    confirmDeleteGateway: 'Are you sure you want to delete this payment gateway?',
    confirmDeleteCategory: 'Are you sure you want to delete category "%s"? Associated items will become unclassified.',
    
    // System Settings
    configSynced: 'System has synchronized your configuration parameters.',
    
    // Image Library
    confirmAndSaveAsset: 'Confirm and Save Asset',
    saveMaterialChanges: 'Save Material Changes',
    
    // Guest Order
    orderConfirmed: 'Room %s order confirmed.',
    
    // Finance Management
    shiftStatusActive: 'Shift Status: Active',
    paymentHeader: 'Payment Method'
  }
};

export const getTranslation = (lang: Language, key: string): string => {
  const langSet = translations[lang] || translations.en;
  return (langSet as any)[key] || (translations.en as any)[key] || key;
};