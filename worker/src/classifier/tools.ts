import type { ToolDefinition } from "../types/env";

export const BOT_TOOLS: ToolDefinition[] = [
  {
    name: "who_are_you",
    description: "自我介紹機器人身分 (MOTC 交通小助手)、說明專屬功能與斜線指令規則 (例如 /你是誰)",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_tdx",
    description: "開啟或顯示交通部 TDX 運輸資料流通服務官網 (https://tdx.transportdata.tw/) 介紹、特色服務 (YouBike/停車/公車/鐵路) 與官方連結",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_motc_app",
    description: "開啟 MOTC 周邊交通即時資訊助手 LINE Mini App (YouBike 2.0 車位、停車場空位、公車到站預估、天氣建議與開源地圖一鍵導航)",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_detective",
    description: "開啟「資料查詢小偵探」LINE Mini App (motc-mini-search)，提供交通部 TDX 738+ API 全臺資料集探勘、熱門推薦、最新上線、語音輸入與完整 URL 呼叫語法檢索",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_silver_protect",
    description: "開啟「銀髮出行守護員」專區 (/銀髮守護 或 /silver)。展示雙介面陪伴系統：長者端 LINE Mini App (一鍵回家、看醫生、大照片地點、語音問路、相機看站牌與藥袋) 與 子女家屬 PC 電腦代管平台",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_eagle_eye",
    description: "開啟「路安鷹眼」LINE Mini App (motc-mini-eagle-eye)，提供 300 大易肇事熱點距離倒數警示、全台周邊即時 CCTV 監視器直擊、TDX 突發事故與道路施工即時通報",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "show_projects",
    description: "查看 MOTC 專案展示與系統總覽 (/project)。依據使用者內部權限動態分流：外部訪客顯示 11 大公開大數據與展示平台；內部同仁同時解鎖 13 大內部核心工具與 11 大公開平台 (共 24 大系統)",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "apply_test",
    description: "開啟 Google 測試開通申請表單 (https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform)，供使用者填寫開通測試資格",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "submit_feedback",
    description: "開啟 Google 意見回復申請表單 (https://docs.google.com/forms/d/e/1FAIpQLSeqcp4e4gbc5L8aE5Kc9dtTVo3Q2UxwQdVd8Mh03tC0Iy94yQ/viewform)，自動帶入日期單號、LINE ID 與暱稱供使用者回報問題與提供建議",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "help",
    description: "查看 MOTC 小助手的完整可用指令清單、功能選單與操作說明",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "ai_chat",
    description: "一般性問題諮詢或智慧問答回覆",
    parameters: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "使用者詢問的內容" }
      },
      required: ["prompt"]
    }
  }
];
