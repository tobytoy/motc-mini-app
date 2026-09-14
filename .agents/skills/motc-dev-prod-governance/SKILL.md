---
name: motc-dev-prod-governance
description: >-
  Enforces stable development workflows, Dev/Prod environment isolation, JWT identity verification,
  feature gating, and zero-downtime rollbacks for the MOTC LINE Bot and Mini App ecosystem.
  Keeps all changes strictly in the Dev stage until the user explicitly commands "prod", then guides
  a painless, rock-solid production release.
---

# MOTC LINE Bot & Mini App 穩定開發與生產維運規範 (Dev/Prod Governance Skill)

本 Skill 專為 `motc-mini-app` 與 `motc-line-bot-worker` 專案量身打造，確保團隊在進行任何新功能研發、UI 改版或 API 介接時，**絕不影響線上正式環境 (Prod) 的穩定性**。

---

## 🎯 核心原則 (Core Principles)

1. **預設保持 Dev 階段 (Default to Dev Mode)**：
   - 目前專案處於開發階段，所有代碼變更、測試、部屬指令預設鎖定在 **`dev` / `development`**。
   - **除非使用者明確指示「prod」、「上 prod」、「進入 prod」或「發布正式版」**，否則嚴禁將變更部屬至生產環境，也不得更動生產環境的金鑰與開關。
2. **故障絕對隔離 (Fault Isolation)**：
   - LINE Bot 僅作為 Gateway 分流器；重型計算與各 Mini App（鷹眼、小偵探、銀髮守護）由獨立後端或獨立 try-catch 區塊封裝。
   - 單一功能或外部 API 異常時，必須優雅降級為維護卡片，嚴禁拋出 500 錯誤中斷其他功能。
3. **身分安全零信任 (JWT Anti-Spoofing)**：
   - 聊天室訊息依賴 `x-line-signature` HMAC 簽名。
   - Mini App (LIFF) 呼叫後端 API 時，**必須攜帶 `liff.getIDToken()`**，由後端 `verifyLineIdToken` 驗證 JWT，嚴禁僅憑前端傳入的 `userId` 字串授權。
4. **隨時具備 30 秒秒級回滾能力 (Instant Rollback Ready)**：
   - 每次發布記錄最新 Deployment ID。遇重大故障時，於 30 秒內執行 `wrangler rollback` 恢復上一穩定版。

---

## 🛠️ 開發階段工作流程 (Dev Phase SOP)

在日常開發、修改新功能或重構時，請嚴格遵循以下規範：

### 1. 環境設定檢查
- 檢查 `worker/wrangler.jsonc` 中的 `ENVIRONMENT` 必須為 `development`。
- 使用 Developing 階段之 LINE Channel ID (`2011556606`) 與 Developing LIFF URL。
- 功能開關（如 `FEATURE_SILVER_CARE_ENABLED`）在 Dev 環境可設為 `true` 搶先體驗。

### 2. 測試驅動驗證 (TDD)
每次修改 `tools.ts`、`needle.ts`、`commandProcessor.ts` 或樣板時，必須在本機執行測試：
```bash
cd /home/toby/projects/Github/motc-mini-app/worker
npm test
```
確認四大核心測試（簽章驗證、40+ 意圖分類、Flex 結構遞迴檢驗、HTTP 端點狀態碼）**100% 通過**。

### 3. 開發環境部屬
```bash
# 僅部屬至開發專屬 Worker (motc-line-bot-worker-dev)
npm run deploy:dev
```

---

## 🚀 正式環境無痛發布流程 (Prod Promotion Protocol)

**觸發條件**：當使用者在對話中明確說出「**prod**」、「**上 prod**」、「**切換到正式版**」時，方可啟動本發布程序。

### 發布前檢核清單 (Pre-Flight Checklist)
1. [ ] **代碼測試**：`npm test` 執行無任何警告與錯誤。
2. [ ] **JWT 鑑權完備**：Mini App 涉及使用者身分存取處皆已對接 `verifyLineIdToken`。
3. [ ] **Channel 與 LIFF 網址校驗**：
   - 正式 LINE Channel ID 確認為 Published 版本。
   - LIFF URL 確認為 `Published`（如 `https://miniapp.line.me/2011556608-DKqWK5Ms`）。
4. [ ] **Feature Flags 審定**：審視哪些 Mini App 已經過完整審核，未成熟之 App 保持 `"false"` 軟性遮蔽。
5. [ ] **前端 Cache-Busting**：確認靜態資源帶有 Hash 檔名，避免手機瀏覽器快取舊代碼。

### 正式發布指令
```bash
cd /home/toby/projects/Github/motc-mini-app/worker
# 執行生產部屬
npm run deploy:prod
```

### 發布後驗證 (Post-Flight Verification)
1. 呼叫健康檢查端點：
   ```bash
   curl -s https://motc-line-bot-worker.tobywang2021.workers.dev/health
   ```
   確認 `environment` 為 `production`，狀態為 `ok`。
2. 在 LINE 實機發送 `/help` 與主要指令，驗證 Flex 卡片渲染無誤。

---

## 🚨 災難復原與秒級回滾 SOP (Rollback Runbook)

當 Prod 環境發生非預期故障（如卡片已讀不回、API 連線崩潰）時，立即執行：

### 方案 A：軟性回滾（Feature Flag 關閉，耗時 1 秒）
若僅為特定 Mini App 出現問題：
1. 在 `wrangler.jsonc` 將該功能的 `FEATURE_XXX_ENABLED` 改為 `false`。
2. 重新發布，系統自動降級為「系統維護升級中」提示卡片。

### 方案 B：硬體版本秒級倒退（Worker Rollback，耗時 30 秒）
若為整個 Worker 崩潰：
```bash
# 1. 查詢上一穩定版 Deployment ID
npx wrangler deployments list

# 2. 瞬間回退至該版本
npx wrangler rollback <STABLE_DEPLOYMENT_ID>
```
無需重新編譯代碼，全球邊緣節點於 30 秒內全數退回上一穩定版本。
