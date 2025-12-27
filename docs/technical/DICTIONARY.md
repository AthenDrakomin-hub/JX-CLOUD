# JX Cloud 系统中文词典

## 项目概述
- 江西云厨 (JX Cloud) - 企业级酒店管理套件

## 主要功能模块
- 经营分析 (Analytics) - dashboard
- 桌位/房间 (Stations) - rooms  
- 后厨出餐 (Kitchen) - orders
- 菜单配置 (Menu) - menu
- 云端资产 (Assets) - materials
- 财务审计 (Treasury) - finance
- 安全中心 (Security) - users
- 系统部署 (Ops) - deployment

## 系统界面术语
- 中央控制台 (Central Console) - centralConsole
- 加密连接已建立 (Securely Connected) - encryptedConnect
- 同步中... (Syncing...) - syncing
- 安全退出 (Logout) - signOut
- 系统访问 (Log In) - systemAccess
- 身份 (Identity) - identity
- 用户名 (Username) - username
- 凭据 (Credential) - credential
- 密码 (Password) - password
- 初始化会话 (Initialize Session) - initializeSession

## 房间/桌位管理
- 集成空间注册 (Integrated Space Registry) - integratedSpaceRegistry
- 房间标识管理 (Station Identifiers) - stationManagement
- 管理您的房间或桌位标识，仅用于点餐关联 (Manage station identifiers for order association) - stationDesc
- 批量打印二维码 (Bulk Print QR) - bulkPrintQR
- 同步所有数据 (Sync All Data) - syncAllData
- 区域 (Zone) - zone
- 房间 (Room) - station
- 扫码点餐 (Scan to Order) - scanToMenu
- 下载矢量图 (Download Vector) - downloadVector
- 关闭终端 (Close Terminal) - closeTerminal

## 订单管理
- 全部 (All) - filterAll
- 待处理 (Pending) - filterPending
- 进行中 (Ongoing) - filterOngoing
- 已完成 (Finished) - filterFinished
- 实时队列 (Live Queue) - liveQueue
- 厨房工作区 (Kitchen Workspace) - kitchenWorkspace
- 订单ID (Order ID) - orderId
- 总账单 (Total Bill) - totalBill
- 时间戳 (Time) - timestamp
- 开始制作 (Start Cooking) - initPrep
- 开始配送 (Serve) - dispatch
- 确认送达 (Delivered) - confirmArrival
- 作废订单 (Void) - voidOrder
- 已取消 (Cancelled) - cancelled

## 状态术语
- 可用 (Available) - ready
- 使用中 (Active) - ordering
- 已完成 (Completed) - completed
- 待处理 (Pending) - pending
- 烹饪中 (Cooking) - preparing
- 配送中 (Serving) - delivering

## 财务管理
- 财务平衡中心 (Financial Balance Hub) - financialBalanceHub
- 经营分类账 (Dining Ledger) - diningLedger
- 交易审计 (Transaction History) - transHistory
- 日期 (Date) - refDate
- 交易项目 (Entity) - entity
- 金额 (PHP) (Amount PHP) - amount
- 总营业额 (Total Revenue) - totalRev
- 运营支出 (Operating Costs) - opCosts
- 净利现值 (Net Valuation) - netValuation
- 支付渠道分布 (Payment Distribution) - paymentDistribution
- 税金 (12% VAT) (Tax 12% VAT) - tax
- 总计 (Total) - total
- 立即结算 (Pay Now) - payNow
- 处理安全支付 (Process Secure Payment) - processSecurePayment
- 256位端到端加密 (256-bit End-to-End Encryption) - gatewayEncrypt

## 菜单管理
- 精选菜单 (Curated Menu) - curatedMenu
- 厨艺展示 (Kitchen Gallery) - kitchenGallery
- 管理您的菜单项、定价和库存 (Manage menu items, pricing, and inventory) - menuDesc
- 搜索菜品... (Search dishes...) - searchDishes
- 价格 (Price) - price
- 库存 (Inventory) - inventory
- 编辑菜品 (Edit Creation) - editCreation
- 新增菜品 (New Collection) - newCollection
- 中文名称 (Chinese Name) - dishNameZh
- 英文名称 (English Name) - dishNameEn
- 视觉资产 (URL) (Visual Asset URL) - visualAsset
- 取消 (Cancel) - cancel
- 保存 (Save) - save
- 确认 (Confirm) - confirm
- 删除 (Delete) - delete

## 员工/安全管理
- 企业安全控制台 (Enterprise Security Console) - enterpriseSecurityConsole
- 人员审计 (Personnel Audit) - personnelAudit
- 员工名录 (Directory) - directory
- 审计日志 (Audit Logs) - auditLogs
- 安全状态 (Security Health) - securityHealth
- 防火墙状态 (WAF Status) - firewallActive
- 数据备份 (Data Backup) - dataBackup
- 最后活跃 (Last Active) - lastActive
- 时间戳 (Timestamp) - securityTimestamp
- 认证用户 (Agent) - authAgent
- 操作行为 (Action) - action
- 威胁等级 (Threat Level) - threatLevel
- 登录地点 (Location) - location
- IP 地址 (IP Address) - ipAddress

## 素材库
- 素材库 (Asset Library) - materialLibrary

## 系统部署
- 预生产审计 (Pre-Production Audit) - preProductionAudit
- 生产就绪度 (Production Readiness) - productionReadiness
- 检查系统部署状态，确保所有模块已上线 (Verify deployment status before go-live) - deploymentDesc
- 基础架构安全 (Infrastructure Security) - infraSecurity
- SSL/TLS 配置 (SSL/TLS Configuration) - sslTlsLabel
- 端到端加密传输协议 (End-to-end encryption protocol) - sslTlsDesc
- JWT 认证 (JWT Authentication) - jwtAuthLabel
- 无状态身份验证令牌 (Stateless authentication token) - jwtAuthDesc
- CORS 策略 (CORS Policy) - corsPolicyLabel
- 跨域资源共享限制 (Cross-origin resource sharing restrictions) - corsPolicyDesc
- 环境变量 (Environment Variables) - envVarsLabel
- 敏感凭据隔离 (Sensitive credential isolation) - envVarsDesc
- 后端存储 (Backend Storage) - backendStorage
- 生产数据库 (Production Database) - dbProdLabel
- 高性能持久化存储 (High-performance persistent storage) - dbProdDesc
- Redis 缓存 (Redis Cache) - redisCacheLabel
- 内存级数据加速 (Memory-level data acceleration) - redisCacheDesc
- 数据库备份 (Database Backup) - dbBackupLabel
- 异地容灾恢复策略 (Disaster recovery strategy) - dbBackupDesc
- 业务集成 (Business Integration) - businessIntegration
- 支付 SDK (Payment SDK) - paymentSdkLabel
- 第三方支付网关对接 (Third-party payment gateway integration) - paymentSdkDesc
- 云打印 (Cloud Print) - cloudPrintLabel
- 远程小票打印集成 (Remote receipt printing integration) - cloudPrintDesc
- 积分算法 (Points Algorithm) - pointsAlgoLabel
- 忠诚度计划逻辑 (Loyalty program logic) - pointsAlgoDesc
- 响应延迟 (Response Latency) - responseLatency
- 全球 CDN (Global CDN) - globalCdn
- 数据完整性 (Data Integrity) - dataIntegrity
- DDoS 防护 (DDoS Protection) - ddosMitigation
- 激活中 (Active) - statusActive

## 仪表板/分析
- 分析引擎 (Analytics Engine) - analyticsEngine
- 企业情报 (Enterprise Intelligence) - enterpriseIntelligence
- 安全云激活 (Secure Cloud Active) - secureCloudActive
- 实时节点延迟 (Live Node Latency) - liveNodeLatency
- 总收入 (Revenue) - revenue
- 总支出 (Expenses) - expenses
- 活跃顾客 (Active Guests) - activeGuests
- 占用率 (Occupancy) - occupancy
- 高峰流量 (Peak Traffic) - peakTraffic
- 厨房负载 (Kitchen Load) - kitchenLoad
- 市场份额 (Market Share) - marketShare
- 分品类收入 (Revenue by Category) - revByCategory
- 总产量 (Total Yield) - totalYield
- 隐私政策 (Privacy Policy) - privacyPolicy
- 食品安全 (Food Safety) - foodSafety

## 错误处理
- 系统发生错误 (An Error Occurred) - errorOccurred
- 系统遇到预期之外的问题，请尝试重试或联系技术支持 (The system encountered an unexpected issue. Please retry.) - errorDescription
- 重试操作 (Retry) - retryAction
- 报告问题 (Report Issue) - reportIssue

## 其他术语
- 酒店管理套件 (Hospitality Suite) - hospitalitySuite
- 系统主宰 (System Sovereign) - systemSovereign
- 操作单元 (Operational Unit) - operationalUnit
- ₱ (₱) - currency
- 创立于 (Established) - establishment
- 注册控制 (Registry Controls) - registryControls
- 云端异常 (Cloud Exception) - networkError
- 请登录 (Please Log In) - verifyCredentials