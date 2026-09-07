# LINE Mini App - 周邊交通即時資訊助手 自行部署指南

本專案是一個整合 **LINE Mini App (LIFF)**、**交通部 TDX 即時大眾運輸資料**、**中央氣象署 CWA 天氣** 以及 **Leaflet + OpenStreetMap 內嵌地圖** 的行動端輕量 Web 應用。

本文件詳細說明如何準備所需金鑰、本地測試，並將一套屬於您自己的即時交通助手部署至 **Cloudflare Pages** 與 **LINE Developers Console**。

---

## 一、事前準備資訊與金鑰清單

在開始部署前，您需要申請以下 4 個平台的帳號與憑證：

| 服務名稱 | 用途 | 取得管道 | 必要性 |
| :--- | :--- | :--- | :--- |
| **交通部 TDX 憑證** | 查詢即時 YouBike 借還量、停車場空位、公車站牌預估到站時間 | [TDX 運輸資料流通服務](https://tdx.transportdata.tw) | **必備** |
| **中央氣象署 CWA API Key** | 取得當前所在縣市即時降雨機率、天氣現象與氣溫 | [氣象署開放資料平臺](https://opendata.cwa.gov.tw) | **建議** (無則降級為預設) |
| **LINE LIFF ID** | 在 LINE 應用程式內作為 Mini App 開啟與取得使用者身分 | [LINE Developers Console](https://developers.line.biz/console/) | **必備** |
| **Cloudflare 帳號** | 免費託管前端靜態網站與 Edge Serverless Functions (BFF API) | [Cloudflare 官網](https://dash.cloudflare.com) | **必備** |

---

### 1. 申請交通部 TDX API 金鑰
1. 前往 [TDX 運輸資料流通服務](https://tdx.transportdata.tw) 註冊並登入會員。
2. 進入「會員中心」->「API 金鑰管理」或「應用程式管理」。
3. 取得您的 **Client ID** 與 **Client Secret**。
4. 憑證權限需包含：基礎服務 (`basic`)、路外停車 (`parkingFee`)、氣象 (`cwa`)。

### 2. 申請中央氣象署 CWA API Key
1. 前往 [氣象資料開放平臺](https://opendata.cwa.gov.tw)。
2. 註冊帳號後，於「個人設定」或「取得授權碼」頁面複製您的 **授權碼 (API Key)**（格式如：`CWA-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX`）。

### 3. 申請 LINE Mini App (LIFF ID)
1. 前往 [LINE Developers Console](https://developers.line.biz/console/)。
2. 建立或選擇現有的 **Provider (提供者)**。
3. 建立一個 **LINE Login** Channel（若具備 Mini App 認證資格可建立 LINE Mini App Channel）。
4. 切換至 **LIFF** 分頁，點擊 **Add**：
   - **LIFF app name**：自行命名（例如：`motc-mini-dog`）
   - **Size**：建議設定 `Full`
   - **Endpoint URL**：暫時填寫 `https://example.com`（待後續部署至 Cloudflare Pages 後更新為真實網址）
   - **Scopes**：勾選 `profile`、`openid`
   - **Bot link feature**：Off 或 On (可選)
5. 建立完成後，複製產生的 **LIFF ID**（格式如：`201xxxxxxx-xxxxxxxx`）。

---

## 二、專案架構與安全設計

```
[使用者裝置 / LINE In-App Browser]
         │
         │  1. 載入前端 (Leaflet 地圖 + LIFF SDK + 深淺色主題)
         │  2. 請求 GPS 座標 (W3C navigator.geolocation)
         ▼
[Cloudflare Pages Functions] (路徑: /api/nearby?lat=...&lon=...)
         │
         │  ★ 安全特性：TDX Client Secret 與 CWA Key 保存在 Edge 端，絕不外洩至前端
         │  ★ 自動快取：TDX Token 自動在記憶體快取 24 小時，大幅節省授權請求
         ├──────► 交通部 TDX Bike API (周邊 YouBike 站點 & 可借/可還量)
         ├──────► 交通部 TDX Parking API (路外停車場即時車位 & 計費)
         ├──────► 交通部 TDX Bus API (公車站牌 & 各路線預估到站時間)
         └──────► 氣象署 CWA API (當前即時天候與降雨機率)
         │
         ▼
[智慧出行建議引擎]
  - 天晴車充裕 ➔ 推薦步行騎乘 YouBike
  - 降雨機率高 ➔ 推薦就近公車路線（到站倒數）或室內停車場
  - 一鍵導航 ➔ Google Maps Universal Links (步行/駕車)
```

---

## 三、本地開發與測試

### 1. 複製倉庫與安裝依賴
```bash
git clone <your-repo-url>
cd motc-mini-app
npm install
```

### 2. 設定環境變數
複製 `.env.example` 為 `.env`：
```bash
cp .env.example .env
```
編輯 `.env` 並填入您的金鑰：
```ini
TDX_CLIENT_ID="您的 TDX Client ID"
TDX_CLIENT_SECRET="您的 TDX Client Secret"
CWA_API_KEY="您的 CWA API Key"
VITE_LIFF_ID="您的 LIFF ID"
```

### 3. 啟動本地開發伺服器
```bash
npm run dev
```
- 開啟瀏覽器訪問 `http://localhost:3000`。
- Vite 開發伺服器已內建 Pages Functions 模擬代理，本機即可直接查詢即時 YouBike、停車場與公車到站資訊。

---

## 四、部署至 Cloudflare Pages

本專案使用 Cloudflare Pages 原生支援的 **Pages Functions**，無需另外維護獨立後端伺服器。

### 1. 登入 Cloudflare
```bash
npx wrangler login
```

### 2. 建立 Cloudflare Pages 專案
將 `<your-project-name>` 替換為您喜歡的專案名稱（例如 `my-motc-app`）：
```bash
npx wrangler pages project create <your-project-name> --production-branch main
```

### 3. 在 Cloudflare Pages 設定安全密鑰 (Secrets)
執行以下指令，依提示或透過管道輸入您的敏感金鑰：
```bash
echo "您的 TDX Client ID" | npx wrangler pages secret put TDX_CLIENT_ID --project-name=<your-project-name>
echo "您的 TDX Client Secret" | npx wrangler pages secret put TDX_CLIENT_SECRET --project-name=<your-project-name>
echo "您的 CWA API Key" | npx wrangler pages secret put CWA_API_KEY --project-name=<your-project-name>
echo "您的 Gemini API Key" | npx wrangler pages secret put GEMINI_API_KEY --project-name=<your-project-name>
echo "false" | npx wrangler pages secret put ENABLE_GEMINI_ADVICE --project-name=<your-project-name>
```

### 4. 編譯並部署
```bash
npm run build
npx wrangler pages deploy dist --project-name=<your-project-name> --branch=main
```
部署完成後，Wrangler 會輸出正式 Production URL，例如：
`https://<your-project-name>.pages.dev`

---

## 五、完成 LINE Mini App 設定

部署完成取得 Cloudflare 網址後：

1. 回到 [LINE Developers Console](https://developers.line.biz/console/)。
2. 進入您的 Channel -> **LIFF** 分頁。
3. 編輯該 LIFF App，將 **Endpoint URL** 修改為您的 Cloudflare Pages 網址：
   ```
   https://<your-project-name>.pages.dev
   ```
4. 儲存設定。
5. 使用手機 LINE 點擊您的 **LIFF URL**（例如 `https://miniapp.line.me/201xxxxxxx-xxxxxxxx`）即可正式啟動 Mini App！

---

## 六、進階自訂功能說明

### 1. 深色 / 淺色模式（太陽 ☀️ / 月亮 🌙 切換）
- 系統支援右上角單鍵切換亮色/暗色主題。
- **雙層持久化記憶**：使用者偏好同時保存在瀏覽器 **Cookie**（有效期 1 年）與 **LocalStorage** 中。
- **防閃白機制**：在 HTML `<head>` 內置入同步初始腳本，下次開啟 Mini App 時會於畫面渲染前直接套用上次設定，保證絕不閃爍白光。

### 2. 公車到站動態功能
- 自動抓取使用者方圓 800 公尺內的公車站牌。
- 自動關聯各站牌下所有營運路線的即時到站秒數，轉換為「即時進站」、「約 X 分鐘」或營運狀態。
- 3 分鐘內即將進站之公車路線具備動態發光提醒徽章。

### 3. 預設降級位置自訂
若使用者未允許 GPS 定位，預設會降級顯示台北車站周邊。若需變更預設中心點，可修改 `src/main.ts` 中的 `DEFAULT_CONFIG`：
```typescript
const DEFAULT_CONFIG = {
  LIFF_ID: "您的 LIFF ID",
  DEFAULT_LAT: 25.0478, // 自訂預設緯度
  DEFAULT_LON: 121.5170, // 自訂預設經度
  DEFAULT_LOCATION_NAME: "台北車站周邊 (預設位置)",
};
```

### 4. 智慧出行建議：Gemini AI vs 邊緣規則引擎開關
系統內建雙軌架構，可隨時透過開關切換：
- **設定位置**：
  - 本地開發：在 `.env` 中設定 `ENABLE_GEMINI_ADVICE="false"` 或 `"true"`。
  - Cloudflare 線上環境：執行 `echo "false" | npx wrangler pages secret put ENABLE_GEMINI_ADVICE --project-name=<your-project-name>`。
- **開關行為說明**：
  - **`false`（預設推薦）**：採用 **Cloudflare Edge 邊緣規則引擎**。運算時間不到 1 毫秒、零延遲、不消耗任何 Google 配額，結合即時降雨機率、YouBike 與公車站動態進行高精確決策。
  - **`true`（備援啟用）**：啟用 **Google Gemini (`gemini-3.5-flash-lite`)**。依據現場數據生成更自然生動的口語化出行問候；若遇到 Gemini API 網路延遲超過 2 秒或配額耗盡，系統會**自動無縫降級**回邊緣規則引擎，保證前端 Mini App 永遠順暢載入。
修改後重新執行 `npm run build && npx wrangler pages deploy dist --project-name=<your-project-name>` 即可。

### 5. 高並發與快取架構：百米網格快取與 transport-mcp (Redis) 切換
當同時在線上使用 Mini App 的人數增加時，若每次定位都直連 TDX，會因為 GPS 座標微小差異無法命中傳統快取，進而耗盡 TDX 的 50 QPS 頻率限制。

專案內建了兩種應對策略，可由 `TRANSPORT_DATA_SOURCE` 自由切換：

#### 模式 A：`TRANSPORT_DATA_SOURCE="direct"`（預設推薦，已啟用百米網格快取）
- **運作原理**：系統自動將使用者精確經緯度**吸附至小數點後第 3 位的百米網格**（約 110 公尺商圈範圍，`Math.round(coord * 1000) / 1000`），並在 Cloudflare Edge 記憶體中維持 25 秒的動態快取。
- **效果**：在同一捷運站、商辦大樓或街區內的所有使用者，全部共用同一筆 TDX 即時數據。
- **效益**：TDX API 呼叫量減少 **90% 以上**，快取命中時回傳時間不到 **2 毫秒**，且具備 `X-Cache: HIT-GRID` 標頭可供除錯。

#### 模式 B：`TRANSPORT_DATA_SOURCE="mcp"`（集中式 Redis / KV 微服務模式）
- **運作原理**：Mini App 後端不會直接打 TDX，而是將請求轉發至您現有的 `transport-mcp` Worker（如 `https://transport-mcp.tobywang2021.workers.dev`）。
- **後端支援**：由 `transport-mcp` 的 Redis / Cloudflare KV 進行跨伺服器集中式快取與多節點流量調配。
- **設定方式**：
  ```bash
  echo "mcp" | npx wrangler pages secret put TRANSPORT_DATA_SOURCE --project-name=<your-project-name>
  echo "https://transport-mcp.tobywang2021.workers.dev" | npx wrangler pages secret put TRANSPORT_MCP_BASE_URL --project-name=<your-project-name>
  ```
- **無縫降級保障**：若設定為 `mcp` 但 `transport-mcp` 服務暫時無法連線或逾時（超過 3 秒），系統會**自動降級回直連 TDX 模式**，保證終端使用者永遠不會看到空白畫面！
