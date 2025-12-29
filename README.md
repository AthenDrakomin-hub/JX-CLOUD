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
