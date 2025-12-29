 # JX CLOUD (江西云厨) - 酒店餐飲管理系統
  ## 項目概覽
  JX CLOUD (江西云厨)
  是一款專為酒店餐飲業設計的全方位管理系統。該系統採用現代化技術棧構建，支持多語言界面（中文/英文/菲律賓語），提供從
  客房二維碼點餐到後廚訂單管理的完整解決方案。系統特色在於其離線優先架構，即使雲端連接中斷，本地數據仍能正常運行，並
  在重新連接後自動同步。

  ## 核心功能與特性
  ### 1. 多語言支持系統
  - 三語界面：支持中文、英文、菲律賓語切換
  - 動態翻譯：數據庫驅動的翻譯內容，支持實時更新
  - 語言切換：頂部導航欄便捷語言切換功能

  ### 2. 用戶與安全中心
  - 多角色管理：支持管理員、經理、員工三種角色
  - IP白名單：為用戶配置IP訪問白名單，增強安全性
  - 雙因素認證：基於TOTP算法的MFA，支持Google Authenticator
  - 在線狀態管理：實時追蹤用戶在線狀態
  - 強制上線功能：自動下線重複登錄會話

  ### 3. 訂單管理系統
  - 二維碼點餐：客房二維碼掃描點餐功能
  - 實時推送：訂單狀態實時推送到後廚終端
  - 狀態跟蹤：支持待處理、製作中、配送中、已完成、已取消等狀態
  - Webhook集成：支持第三方系統消息推送

  ### 4. 菜單與庫存管理
  - 多語言菜單：支持三語菜單展示
  - 庫存追蹤：實時庫存狀態管理
  - 菜品分類：多種菜品分類管理
  - 圖片管理：菜品圖片上傳與管理

  ### 5. 支付系統
  - 多支付方式：支持GCash、Maya、現金、銀行卡、USDT、記賬到房間等
  - 安全支付：安全支付流程處理
  - 支付狀態：實時支付狀態跟蹤

  ### 6. 財務管理
  - 營收統計：實時營收數據統計
  - 支出管理：支出記錄與管理
  - 財務報表：生成財務報表和分析
  - 稅率計算：自動計算12%增值稅

  ### 7. 系統配置
  - 參數配置：酒店名稱、服務費率、匯率等配置
  - 雲端監測：實時監測Supabase連接狀態
  - 數據遷移：一鍵同步本地數據到雲端

  ## 文件與目錄說明
  ├── App.tsx                    # 主應用組件
  ├── components/               # UI組件目錄
  │   ├── Dashboard.tsx         # 儀表板界面
  │   ├── GuestOrder.tsx        # 客房點餐界面
  │   ├── OrderManagement.tsx   # 訂單管理界面
  │   ├── StaffManagement.tsx   # 員工管理界面
  │   └── ...                  # 其他界面組件
  ├── services/                 # 服務層目錄
  │   ├── api.ts               # API服務
  │   ├── notification.ts      # 通知服務
  │   └── supabaseClient.ts    # Supabase客戶端
  ├── types.ts                  # 類型定義
  ├── translations.ts           # 多語言翻譯
  ├── constants.ts              # 常量定義
  ├── README.md                # 項目說明
  ├── package.json             # 依賴配置
  └── vite.config.ts           # Vite構建配置

  ## 系統部署與配置
  ### 環境要求
  - Node.js：版本 18.x 或更高
  - Vite：現代化構建工具
  - Supabase：雲端數據庫服務
  - 瀏覽器：支持ES6+的現代瀏覽器

  ### 安裝步驟
  1. 克隆項目
  git clone <repository-url>
  cd jx-cloud-enterprise-hospitality-suite

  2. 安裝依賴
  npm install

  3. 配置環境變量
  # .env.local 文件
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

  4. 數據庫初始化
  在Supabase SQL編輯器中運行README.md中的完整數據庫腳本

  ### 配置說明
  - Supabase配置：設置數據庫URL和匿名密鑰
  - Webhook配置：在系統設置中配置第三方消息推送地址
  - 語言設置：支持三語界面切換
  - IP白名單：在用戶管理中配置IP訪問限制

  ## 使用指南
  ### 1. 客房二維碼點餐使用流程
  1. 客戶掃描房間二維碼進入點餐界面
  2. 過速瀏覽多語言菜單
  3. 過速添加菜品到購物車
  4. 過速選擇支付方式並完成支付
  5. 訂單自動推送到後廚系統

  ### 2. 後廚訂單管理使用流程
  1. 登錄管理系統（默認管理員：admin/admin）
  2. 查看實時訂單隊列
  3. 更新訂單狀態（製作中、配送中、已完成）
  4. 訂單狀態變更自動通知相關方

  ### 3. 用戶管理界面說明
  - 添加用戶：設置用戶角色、權限和IP白名單
  - 編輯用戶：修改用戶信息和安全設置
  - 刪除用戶：移除用戶賬戶
  - 強制下線：強制用戶離線

  ## 自定義與擴展
  ### 界面定制
  - 通過translations表自定義界面翻譯
  - 修改Tailwind CSS樣式實現界面定制
  - 擴展組件實現新功能

  ### 功能擴展
  - 擴展API服務實現新業務邏輯
  - 添加新的數據表支持新功能
  - 集成第三方服務通過Webhook

  ## 常見問題與故障排除
  ### 1. 登錄問題
  - 問題：無法登錄系統
  - 解決：檢查Supabase配置是否正確，確認網絡連接

  ### 2. 二維碼點餐問題
  - 問題：掃描二維碼無法進入點餐界面
  - 解決：確認房間ID是否正確，檢查網絡連接

  ### 3. 訂單推送問題
  - 問題：訂單未推送到後廚
  - 解決：檢查通知服務配置，確認Webhook設置

  ### 4. 多語言問題
  - 問題：界面語言未正確切換
  - 解決：確認translations表配置，檢查數據庫連接

  ## 維護與支持
  ### 系統維護
  - 定期備份數據庫
  - 監控系統性能
  - 更新依賴包到安全版本
  - 檢查安全日誌

  ### 技術支持
  - 查閱項目文檔
  - 檢查系統日誌
  - 聯繫技術支持團隊

  ## 更新日誌
  ### v1.0.0 (正式發布)
  - 完整的多語言支持系統
  - IP白名單安全功能
  - 離線優先架構
  - 完整的訂單管理流程
  - 用戶與權限管理
  - 財務與庫存管理
  - Webhook集成支持
  - 二維碼點餐功能
  - 
  ## 協議與版權信息
  本項目為企業級 hospitality 管理系統，版權歸江西云厨所有。未經授權，不得用於商業用途。


Copyright (c) 2025 江西云厨 (Jiangxi Star Hotel)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
>>>>>>> 27b1d84fc3f790c1e02c7761d5bd16c0b94b8277
# JX CLOUD (江西云厨) - 酒店餐饮管理系统

## 项目概述

JX CLOUD 是一套专为酒店餐饮业务设计的综合管理系统，采用 React 19 + TypeScript + Vite 6 构建，结合 Supabase 作为后端服务。系统支持多语言（中文/英文/菲律宾语），具备离线优先架构，即使网络中断也能正常运行。

## 核心功能模块

### 1. 用户与安全中心
- **多角色用户管理**：支持管理员、经理、员工三种角色，具有不同权限级别
- **IP白名单功能**：可为用户配置IP访问白名单，增强安全性
- **双因素认证 (2FA)**：基于TOTP算法的MFA，支持Google Authenticator等
- **账户锁定机制**：支持账户锁定/解锁功能
- **在线状态管理**：实时跟踪用户在线状态，强制上线功能
- **安全审计日志**：记录所有用户操作和登录行为

### 2. 订单管理系统
- **房间二维码点餐**：客户通过扫描房间二维码进行点餐
- **订单状态管理**：支持待处理、制作中、配送中、已完成、已取消等状态
- **实时订单推送**：订单创建后实时推送到后厨终端
- **订单状态更新通知**：订单状态变更时推送通知
- **Webhook集成**：支持第三方系统（钉钉、飞书、企业微信）消息推送

### 3. 菜单与库存管理
- **多语言菜单**：支持中英菲三语菜单展示
- **库存管理**：实时库存跟踪和管理
- **菜品分类管理**：支持多种菜品分类
- **图片素材管理**：支持菜品图片上传和管理
- **推荐菜品标识**：可设置菜品为推荐菜品

### 4. 支付系统
- **多支付方式**：支持GCash、Maya、现金、银行卡、USDT、记账到房间等多种支付方式
- **安全支付处理**：处理安全支付流程
- **支付状态跟踪**：跟踪支付状态和记录

### 5. 财务管理系统
- **营收统计**：实时营收数据统计
- **支出管理**：记录和管理各项支出
- **财务报表**：生成财务报表和分析
- **税率计算**：自动计算12%增值税

### 6. 房间与桌位管理
- **房间状态管理**：管理房间状态（就绪/点餐中）
- **房间配置**：支持67个房间（8201-8232, 8301-8332, VIP房间）
- **实时状态同步**：房间状态实时同步

### 7. 系统配置
- **系统参数配置**：可配置酒店名称、服务费率、汇率等
- **多语言支持**：支持中文、英文、菲律宾语切换
- **Webhook配置**：配置第三方消息推送地址
- **云端连接监测**：实时监测与Supabase的连接状态

## 技术特性

### 前端技术栈
- **React 19**：最新版React框架，优化并发特性
- **TypeScript**：全流程类型约束，减少运行时错误
- **Tailwind CSS**：原子化CSS引擎，提供极致视觉体验
- **Lucide React**：轻量化矢量图标库
- **Recharts**：专业级数据可视化引擎
- **QRCode React**：二维码生成与扫描

### 后端与云服务
- **Supabase（PostgreSQL）**：核心数据库，PostgREST特性
- **行级安全 (RLS)**：数据库级安全策略
- **边缘计算**：Vercel Edge Runtime优化，低延迟响应
- **实时订阅**：PostgreSQL逻辑复制，实时订单状态更新

### 存储架构
- **混合存储架构（VirtualDB）**：
  - 本地存储：离线可靠层，断网时系统正常运行
  - 云端同步：Supabase云端镜像同步
- **离线优先**：云端不可用时本地数据自动对齐

### 安全特性
- **MFA双因素认证**：基于TOTP算法的安全认证
- **IP白名单验证**：登录IP地址验证机制
- **审计日志系统**：完整操作记录和追踪
- **Webhook安全**：第三方推送安全验证

## 部署配置

### 环境配置
- **Vite构建工具**：毫秒级热更新（HMR）
- **ESM.sh导入**：无需node_modules，提升部署速度
- **Vercel部署**：CI/CD流程支持
- **Supabase集成**：数据库连接配置

### 数据库架构

系统使用 Supabase (PostgreSQL) 作为后端数据库，包含用户、房间、订单、菜品、支付、财务等核心表结构，并配置了完善的行级安全策略（RLS）和索引优化。

## 使用说明

### 系统启动
1. **环境配置**：设置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量
2. **数据库初始化**：在Supabase中运行提供的SQL脚本
3. **启动应用**：运行`npm run dev`启动开发服务器

### 用户登录
- 系统支持多角色登录（管理员、经理、员工）
- 登录凭据由系统管理员配置和分配
- 支持双因素认证和IP白名单验证

### 业务流程
1. **客户点餐**：扫描房间二维码进入点餐页面
2. **订单处理**：订单实时推送到后厨系统
3. **状态跟踪**：订单状态实时更新和通知
4. **支付处理**：支持多种支付方式
5. **财务统计**：自动生成营收和支出报表

### 系统管理
- **用户管理**：创建、编辑、删除用户账号
- **菜单管理**：添加、编辑、删除菜单项
- **库存管理**：跟踪和管理食材库存
- **系统配置**：配置酒店参数和支付设置

## 核心竞争力

这套系统不仅仅是一个管理工具，它通过VirtualDB镜像技术解决了许多中小酒店最担心的"断网无法营业"的问题。即使云端不可用，本地数据在重新联网后自动对齐，这是目前纯SaaS系统所不具备的。同时，系统提供了完整的多语言支持、IP白名单安全验证、实时订单推送等企业级功能。

## 协议与版权信息

### 版权声明
Copyright (c) 2025 Jiangxi Star Hotel. 保留所有权利.

### 软件使用条款
本软件及其相关文档受国际版权法和条约的保护。用户可以：
- 在授权范围内使用本软件
- 根据授权协议进行必要的修改
- 在遵守协议条款的前提下分发软件

### 授权条款
本项目采用 Apache License 2.0 授权（具体请参见 LICENSE 文件）：
- 可以自由使用、修改和分发
- 必须保留原始版权声明和免责声明
- 修改后的文件需要显著标记变更信息

### 第三方依赖版权信息
本项目使用了以下开源项目（完整列表见 package.json）：
- React - MIT License
- TypeScript - Apache License 2.0
- Supabase - MIT License
- Tailwind CSS - MIT License
- Lucide React - MIT License
- Recharts - MIT License
- QRCode React - MIT License

所有第三方库的版权和许可条款均保持不变。

---

本项目为酒店餐饮管理系统，版权归属江西云厨所有。系统包含多语言支持（中文/英文/菲律宾语）、离线优先架构、双因素认证、IP白名单等企业级安全功能。未经许可，不得用于商业用途。
=======
 # JX CLOUD (江西云厨) - 酒店餐飲管理系統
  ## 項目概覽
  JX CLOUD (江西云厨)
  是一款專為酒店餐飲業設計的全方位管理系統。該系統採用現代化技術棧構建，支持多語言界面（中文/英文/菲律賓語），提供從
  客房二維碼點餐到後廚訂單管理的完整解決方案。系統特色在於其離線優先架構，即使雲端連接中斷，本地數據仍能正常運行，並
  在重新連接後自動同步。

  ## 核心功能與特性
  ### 1. 多語言支持系統
  - 三語界面：支持中文、英文、菲律賓語切換
  - 動態翻譯：數據庫驅動的翻譯內容，支持實時更新
  - 語言切換：頂部導航欄便捷語言切換功能

  ### 2. 用戶與安全中心
  - 多角色管理：支持管理員、經理、員工三種角色
  - IP白名單：為用戶配置IP訪問白名單，增強安全性
  - 雙因素認證：基於TOTP算法的MFA，支持Google Authenticator
  - 在線狀態管理：實時追蹤用戶在線狀態
  - 強制上線功能：自動下線重複登錄會話

  ### 3. 訂單管理系統
  - 二維碼點餐：客房二維碼掃描點餐功能
  - 實時推送：訂單狀態實時推送到後廚終端
  - 狀態跟蹤：支持待處理、製作中、配送中、已完成、已取消等狀態
  - Webhook集成：支持第三方系統消息推送

  ### 4. 菜單與庫存管理
  - 多語言菜單：支持三語菜單展示
  - 庫存追蹤：實時庫存狀態管理
  - 菜品分類：多種菜品分類管理
  - 圖片管理：菜品圖片上傳與管理

  ### 5. 支付系統
  - 多支付方式：支持GCash、Maya、現金、銀行卡、USDT、記賬到房間等
  - 安全支付：安全支付流程處理
  - 支付狀態：實時支付狀態跟蹤

  ### 6. 財務管理
  - 營收統計：實時營收數據統計
  - 支出管理：支出記錄與管理
  - 財務報表：生成財務報表和分析
  - 稅率計算：自動計算12%增值稅

  ### 7. 系統配置
  - 參數配置：酒店名稱、服務費率、匯率等配置
  - 雲端監測：實時監測Supabase連接狀態
  - 數據遷移：一鍵同步本地數據到雲端

  ## 文件與目錄說明
  ├── App.tsx                    # 主應用組件
  ├── components/               # UI組件目錄
  │   ├── Dashboard.tsx         # 儀表板界面
  │   ├── GuestOrder.tsx        # 客房點餐界面
  │   ├── OrderManagement.tsx   # 訂單管理界面
  │   ├── StaffManagement.tsx   # 員員管理界面
  │   └── ...                  # 其他界面組件
  ├── services/                 # 服務層目錄
  │   ├── api.ts               # API服務
  │   ├── notification.ts      # 通知服務
  │   └── supabaseClient.ts    # Supabase客戶端
  ├── types.ts                  # 類型定義
  ├── translations.ts           # 多語言翻譯
  ├── constants.ts              # 常量定義
  ├── README.md                # 項目說明
  ├── package.json             # 依賴配置
  └── vite.config.ts           # Vite構建配置

  ## 系統部署與配置
  ### 環境要求
  - Node.js：版本 18.x 或更高
  - Vite：現代化構建工具
  - Supabase：雲端數據庫服務
  - 瀏覽器：支持ES6+的現代瀏覽器

  ### 安裝步驟
  1. 克隆項目
  git clone <repository-url>
  cd jx-cloud-enterprise-hospitality-suite

  2. 安裝依賴
  npm install

  3. 配置環境變量
  # .env.local 文件
  VITE_SUPABASE_URL=your_supabase_url
  VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

  4. 數據庫初始化
  在Supabase SQL編輯器中運行README.md中的完整數據庫腳本

  ### 配置說明
  - Supabase配置：設置數據庫URL和匿名密鑰
  - Webhook配置：在系統設置中配置第三方消息推送地址
  - 語言設置：支持三語界面切換
  - IP白名單：在用戶管理中配置IP訪問限制

  ## 使用指南
  ### 1. 客房二維碼點餐使用流程
  1. 客戶掃描房間二維碼進入點餐界面
  2. 遫速瀏覽多語言菜單
  3. 遫速添加菜品到購物車
  4. 遫速選擇支付方式並完成支付
  5. 訂單自動推送到後廚系統

  ### 2. 後廚訂單管理使用流程
  1. 登錄管理系統（默認管理員：admin/admin）
  2. 查看實時訂單隊列
  3. 更新訂單狀態（製作中、配送中、已完成）
  4. 訂單狀態變更自動通知相關方

  ### 3. 用戶管理界面說明
  - 添加用戶：設置用戶角色、權限和IP白名單
  - 編輯用戶：修改用戶信息和安全設置
  - 刪除用戶：移除用戶賬戶
  - 強制下線：強制用戶離線

  ## 自定義與擴展
  ### 界面定制
  - 通過translations表自定義界面翻譯
  - 修改Tailwind CSS樣式實現界面定制
  - 擴展組件實現新功能

  ### 功能擴展
  - 擴展API服務實現新業務邏輯
  - 添加新的數據表支持新功能
  - 集成第三方服務通過Webhook

  ## 常見問題與故障排除
  ### 1. 登錄問題
  - 問題：無法登錄系統
  - 解決：檢查Supabase配置是否正確，確認網絡連接

  ### 2. 二維碼點餐問題
  - 問題：掃描二維碼無法進入點餐界面
  - 解決：確認房間ID是否正確，檢查網絡連接

  ### 3. 訂單推送問題
  - 問題：訂單未推送到後廚
  - 解決：檢查通知服務配置，確認Webhook設置

  ### 4. 多語言問題
  - 問題：界面語言未正確切換
  - 解決：確認translations表配置，檢查數據庫連接

  ## 維護與支持
  ### 系統維護
  - 定期備份數據庫
  - 監控系統性能
  - 更新依賴包到安全版本
  - 檢查安全日誌

  ### 技術支持
  - 查閱項目文檔
  - 檢查系統日誌
  - 聯繫技術支持團隊

  ## 更新日誌
  ### v1.0.0 (正式發布)
  - 完整的多語言支持系統
  - IP白名單安全功能
  - 離線優先架構
  - 完整的訂單管理流程
  - 用戶與權限管理
  - 財務與庫存管理
  - Webhook集成支持
  - 二維碼點餐功能
  - 
  ## 協議與版權信息
  本項目為企業級 hospitality 管理系統，版權歸江西云厨所有。未經授權，不得用於商業用途。


Copyright (c) 2025 江西云厨 (Jiangxi Star Hotel)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
>>>>>>> 27b1d84fc3f790c1e02c7761d5bd16c0b94b8277
