# motc-mini-dog | 周邊交通即時資訊助手

LINE Mini App 行動端周邊交通即時資訊整合服務。結合交通部 **TDX 即時聯網資料**、**中央氣象署 CWA 即時天氣** 以及 **Leaflet + OpenStreetMap 內嵌地圖**，為通勤族提供一鍵出行的最佳指引。

---

## ✨ 核心特色功能

- 🚲 **周邊 YouBike 2.0 即時車位**：自動列出最近站點之即時可借車輛、可還空位與步行預估時間。
- 🅿 **路外停車場即時車位**：即時更新周邊停車場剩餘車格與計費說明。
- 🚌 **公車站牌與到站動態**：查詢最近公車站牌各路線「即時進站」、「約 X 分鐘」即時倒數。
- 🌤️ **天候與智慧出行建議**：依據氣象署降雨機率與即時運具狀態，動態生成出行決策（晴天租車、雨天搭公車/室內停車）。
- 🌙 **深色 / 淺色模式切換**：支援太陽 ☀️ / 月亮 🌙 一鍵切換，採用雙層 Cookie (1 年有效期) + LocalStorage 持久化，並內建防閃白初始化機制。
- 🧭 **一鍵導航**：整合 Google Maps Universal Links，單鍵啟動步行或開車導航。
- 🗺️ **開源無限制地圖**：採用 Leaflet + OpenStreetMap，深色模式自帶高品質深色圖磚濾鏡，不需申請昂貴商業圖資金鑰。

---

## 🚀 部署與上線指南

詳細的申請資訊清單、本地測試與 Cloudflare Pages 部署流程，請參閱：
👉 **[完整自行部署指南 (docs/DEPLOYMENT_GUIDE.md)](./docs/DEPLOYMENT_GUIDE.md)**

---

## 🛠️ 技術架構

- **前端介面**：TypeScript + Vite + Leaflet + OpenStreetMap + LINE LIFF SDK v2
- **後端代理**：Cloudflare Pages Functions (Edge Serverless) — 保護 TDX 密鑰並提供邊緣快取
- **資料來源**：
  - 交通部 [TDX 運輸資料流通服務](https://tdx.transportdata.tw)
  - 交通部 [中央氣象署 CWA 開放資料平臺](https://opendata.cwa.gov.tw)
