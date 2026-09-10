import type { OutgoingLineMessage, LineQuickReply } from "../types/line";

export const BOT_QUICK_REPLY: LineQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "🐶 /你是誰",
        text: "/你是誰"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🚀 /app",
        text: "/app"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🕵️‍♂️ /search",
        text: "/search"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "📊 /project",
        text: "/project"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🚍 /tdx",
        text: "/tdx"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "📝 /申請",
        text: "/申請"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "💬 /意見",
        text: "/意見"
      }
    },
    {
      type: "action",
      action: {
        type: "location",
        label: "📍 傳送位置"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "❓ /help",
        text: "/help"
      }
    }
  ]
};

/**
 * Generate date-related unique Ticket ID for Feedback:
 * Format: FB-YYYYMMDD-HHMM-XXXX (e.g. FB-20260909-1745-8A2F)
 */
export function generateFeedbackTicketId(userId?: string): string {
  const now = new Date(Date.now() + 8 * 3600 * 1000); // UTC+8 Taiwan Time
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const hh = String(now.getUTCHours()).padStart(2, "0");
  const mi = String(now.getUTCMinutes()).padStart(2, "0");

  const suffix = userId && userId.length >= 4
    ? userId.slice(-4).toUpperCase()
    : Math.random().toString(36).substring(2, 6).toUpperCase();

  return `FB-${yyyy}${mm}${dd}-${hh}${mi}-${suffix}`;
}

/**
 * Build Google Form Pre-filled URL for 意見回復表單:
 * entry.600472523: 【單號 (系統自動帶入)】
 * entry.431757759: 【LINE User ID (系統自動帶入)】
 * entry.42197645:  【LINE 暱稱/名字 (系統自動帶入)】
 */
export function buildPrefilledFeedbackFormUrl(
  userId?: string,
  displayName?: string,
  ticketId?: string
): string {
  const base = "https://docs.google.com/forms/d/e/1FAIpQLSeqcp4e4gbc5L8aE5Kc9dtTVo3Q2UxwQdVd8Mh03tC0Iy94yQ/viewform?usp=pp_url";
  const params = new URLSearchParams();
  if (ticketId) {
    params.set("entry.600472523", ticketId);
  }
  if (userId && userId !== "anonymous") {
    params.set("entry.431757759", userId);
  }
  if (displayName) {
    params.set("entry.42197645", displayName);
  }
  const qs = params.toString();
  return qs ? `${base}&${qs}` : base;
}

/**
 * Build Google Form Pre-filled URL with LINE User ID and Display Name
 */
export function buildPrefilledGoogleFormUrl(
  userId?: string,
  displayName?: string,
  project?: string
): string {
  const base = "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform?usp=pp_url";
  const params = new URLSearchParams();
  if (userId && userId !== "anonymous") {
    params.set("entry.1208718848", userId);
  }
  if (displayName) {
    params.set("entry.41434550", displayName);
  }
  if (project) {
    params.set("entry.1262005042", project);
  }
  const qs = params.toString();
  return qs ? `${base}&${qs}` : base;
}

/**
 * 1. TDX 官網可愛氣泡 Flex Message
 */
export function createTdxFlexMessage(tdxUrl: string = "https://tdx.transportdata.tw/"): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0284C7",
      paddingAll: "xl",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "🌐 交通部官方資料平臺",
              color: "#E0F2FE",
              size: "xs",
              weight: "bold"
            }
          ]
        },
        {
          type: "text",
          text: "TDX 運輸資料流通服務",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "Transportation Data eXchange",
          color: "#BAE6FD",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "🚍 嗨！這是全台灣最完整的交通大數據中心！",
          weight: "bold",
          size: "sm",
          color: "#0369A1",
          wrap: true
        },
        {
          type: "text",
          text: "TDX 整合了全台各縣市大眾運輸與即時路況，為智慧出行提供強大且標準化的開放 API 服務。",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F0F9FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚲", size: "sm", flex: 1 },
                { type: "text", text: "即時車位", size: "xs", weight: "bold", color: "#0369A1", flex: 3 },
                { type: "text", text: "YouBike 2.0 / 共享單車", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🅿️", size: "sm", flex: 1 },
                { type: "text", text: "停車格位", size: "xs", weight: "bold", color: "#0369A1", flex: 3 },
                { type: "text", text: "全台路外即時剩餘車位", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚌", size: "sm", flex: 1 },
                { type: "text", text: "公車動態", size: "xs", weight: "bold", color: "#0369A1", flex: 3 },
                { type: "text", text: "各路線即時進站預估時間", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚄", size: "sm", flex: 1 },
                { type: "text", text: "軌道鐵路", size: "xs", weight: "bold", color: "#0369A1", flex: 3 },
                { type: "text", text: "高鐵 / 台鐵 / 捷運時刻", size: "xs", color: "#64748B", flex: 7 }
              ]
            }
          ]
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "✨ 我們的 MOTC Mini App 即時助手也是由 TDX 全力驅動的喔！",
              size: "xxs",
              color: "#0284C7",
              wrap: true
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#0284C7",
          height: "sm",
          action: {
            type: "uri",
            label: "🌐 開啟 TDX 官方入口",
            uri: tdxUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🔑 瀏覽 API 服務",
            uri: "https://tdx.transportdata.tw/api-service"
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🚍 TDX 交通部運輸資料流通服務官網",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 2. 我們的 MOTC Mini App 可愛氣泡 Flex Message
 */
export function createMiniAppFlexMessage(
  miniAppUrl: string = "https://motc-mini-dog.pages.dev/",
  detectiveLiffUrl: string = "https://miniapp.line.me/2011521041-JnfPdXhF",
  formUrl: string = "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform"
): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0D9488",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "📱 MOTC 雙旗艦 LINE Mini App",
          color: "#CCFBF1",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "智慧交通微應用專區",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "專為手機打造 · 周邊交通即時助手 ＆ 資料查詢小偵探",
          color: "#99F6E4",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "lg",
      spacing: "md",
      contents: [
        // Mini App 1: 周邊交通即時資訊助手
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F0FDFA",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🐶 1. 周邊交通即時資訊助手", size: "xs", weight: "bold", color: "#0F766E", flex: 8 },
                { type: "text", text: "一鍵出行", size: "xxs", color: "#14B8A6", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🚲 YouBike 2.0/2.0E 車位即時借還\n• 🅿️ 路外停車場格位與充電樁資訊\n• 🚌 最近站牌各路線即時進站倒數\n• 🌤️ 氣象署降雨機率與出門帶傘指引",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        // Mini App 2: 資料查詢小偵探
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#EEF2FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🕵️‍♂️ 2. 資料查詢小偵探", size: "xs", weight: "bold", color: "#4338CA", flex: 8 },
                { type: "text", text: "數據探勘", size: "xxs", color: "#6366F1", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🔍 全臺 TDX 738+ API 規格即時檢索\n• 🔥 百萬調用量熱門 API 精選推薦\n• 🆕 2026 最新發布交通開放資料集\n• 🎙️ 原生 Web Speech 語音輸入搜尋",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        {
          type: "text",
          text: "💡 提示：Mini App 專為手機端打造，目前處於封測階段，若尚未開通請點擊下方表單申請！",
          size: "xxs",
          color: "#94A3B8",
          wrap: true
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#0D9488",
          height: "sm",
          action: {
            type: "uri",
            label: "🐶 開啟周邊交通助手",
            uri: miniAppUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: "🕵️‍♂️ 開啟資料查詢小偵探",
            uri: detectiveLiffUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 申請測試資格開通",
            uri: formUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "📱 MOTC 雙旗艦 LINE Mini App 專區 (周邊交通 ＆ 資料小偵探)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 3. 項目管理網頁可愛氣泡 Flex Message
 */
/**
 * 3A. 內部人員專案總覽 (/project - 內部人員全部 15 大專案均顯示)
 */
export function createAllInclusiveProjectsFlexMessage(displayName?: string): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#7C3AED",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🔒 科資司全專案主控台 (/project)",
          color: "#EDE9FE",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "MOTC 專案系統總覽",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "內部同仁已解鎖全部 15 大專案系統 (7 內部 + 8 外部)",
          color: "#DDD6FE",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "lg",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: `👋 您好，${displayName || "同仁"}！您已通過內部權限驗證。`,
          weight: "bold",
          size: "sm",
          color: "#6D28D9"
        },
        {
          type: "text",
          text: "以下為科資司全部專案（7 大內部系統 ＋ 8 大外部公開大數據平台），建議使用電腦/寬螢幕瀏覽以獲得最佳體驗：",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "text",
          text: "🔒 科資司 7 大內部專案系統：",
          weight: "bold",
          size: "xs",
          color: "#6D28D9"
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "1. 📊 EVM 專案管理", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "實值管理系統", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ai.studio/apps/0bd118d7-407b-4576-bf5b-e354f697c2cf?fullscreenApplet=true" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "2. 📐 UML 超級系統", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "架構工程系統", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ai.studio/apps/ff844b1e-b6fc-48d7-980e-43f09a695bb5?fullscreenApplet=true" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "3. 🎨 UI catwalk", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "前端走秀展示", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://motc-ui-catwalk.web.app/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "4. 🔌 mcp 資訊", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "cf-mcp-playground", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/cf-mcp-playground" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "5. 🎙️ 語音轉文字", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "voice2text-studio", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/voice2text-studio" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "6. ⚡ motc 壓力測試", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "負載效能檢驗", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/motc-load-testing" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "7. 🛡️ 資安檢測工具", size: "xs", color: "#7C3AED", flex: 6 },
                { type: "text", text: "紅隊演練檢測", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/red-team-tools" }
            }
          ]
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "text",
          text: "🌐 8 大外部公開大數據平台：",
          weight: "bold",
          size: "xs",
          color: "#0369A1"
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "1. 🌐 TDX 官網", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "交通資料流通", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tdx.transportdata.tw/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "2. 🚄 票證大數據分析", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "多模態旅次模擬", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/taiwan-mobility-pulse/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "3. 📹 全網 CCTV 監控", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "即時多源影像", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/motc-cctv-freeway-monitor/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "4. 🐻 即刻救熊", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "生態路段守護", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/save-the-bears-now/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "5. 💳 Tpass 指南", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "通勤月票資訊", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tpassguide-pzwncd5l.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "6. ⚠️ 路口事故高危地圖", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "道安事故熱點", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://twroadmap-8lnw4deb.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "7. 🇹🇼 介紹台灣", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "觀光景點指南", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://taiwantrip-zcjquqjf.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "8. 🚍 介紹 TDX", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "交通數據說明", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tdxtraffic-nvw2e96f.manus.space" }
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#7C3AED",
          height: "sm",
          action: {
            type: "uri",
            label: "📊 EVM 專案管理系統",
            uri: "https://ai.studio/apps/0bd118d7-407b-4576-bf5b-e354f697c2cf?fullscreenApplet=true"
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📐 UML 超級系統",
            uri: "https://ai.studio/apps/ff844b1e-b6fc-48d7-980e-43f09a695bb5?fullscreenApplet=true"
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🚄 票證大數據分析平台",
            uri: "https://tobytoy.github.io/taiwan-mobility-pulse/"
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🔒 MOTC 專案系統總覽 (內部人員已解鎖 15 大專案)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 3B. 外部人員專案總覽 (/project - 非內部人員僅顯示 8 大公開專案)
 */
export function createExternalProjectsFlexMessage(formUrl: string): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0284C7",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🖥️ 全臺交通大數據與開放展示 (/project)",
          color: "#E0F2FE",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "外部公開展示專區",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "8 大公開系統 • 建議使用電腦 / 寬螢幕觀看",
          color: "#BAE6FD",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "lg",
      spacing: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F0F9FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "🖥️ 觀看提示：",
              weight: "bold",
              size: "xs",
              color: "#0369A1"
            },
            {
              type: "text",
              text: "以下系統為完整儀表板與大數據分析圖表，適合以電腦網頁寬螢幕觀看獲得最佳體驗！",
              size: "xs",
              color: "#0C4A6E",
              wrap: true
            }
          ]
        },
        {
          type: "text",
          text: "🌟 8 大公開開放平台清單：",
          weight: "bold",
          size: "xs",
          color: "#334155"
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "1. 🌐 TDX 官網", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "開放資料流通", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tdx.transportdata.tw/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "2. 🚄 票證大數據分析", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "多模態旅次模擬", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/taiwan-mobility-pulse/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "3. 📹 全網 CCTV 監控", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "即時多源影像", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/motc-cctv-freeway-monitor/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "4. 🐻 即刻救熊", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "生態路段守護", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tobytoy.github.io/save-the-bears-now/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "5. 💳 Tpass 指南", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "通勤月票資訊", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tpassguide-pzwncd5l.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "6. ⚠️ 路口事故高危地圖", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "道安事故熱點", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://twroadmap-8lnw4deb.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "7. 🇹🇼 介紹台灣", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "觀光景點指南", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://taiwantrip-zcjquqjf.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "8. 🚍 介紹 TDX", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "交通數據說明", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://tdxtraffic-nvw2e96f.manus.space" }
            }
          ]
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F8FAFC",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "🔒 內部專區提示：",
              weight: "bold",
              size: "xs",
              color: "#64748B"
            },
            {
              type: "text",
              text: "科資司 7 大內部專案（EVM、UML、UI catwalk、mcp、語音轉文字、壓測、資安）僅對內部同仁開放。若您為內部同仁，請點選下方按鈕登記開通加入名冊！",
              size: "xs",
              color: "#475569",
              wrap: true
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#0284C7",
          height: "sm",
          action: {
            type: "uri",
            label: "🚄 票證大數據分析平台",
            uri: "https://tobytoy.github.io/taiwan-mobility-pulse/"
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📹 全網 CCTV 即時監控",
            uri: "https://tobytoy.github.io/motc-cctv-freeway-monitor/"
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 內部同仁登記開通",
            uri: formUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🖥️ MOTC 開放展示專區 (8 大公開平台)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 4. 自我介紹與指令導引可愛氣泡 (/你是誰)
 */
export function createWhoAreYouFlexMessage(urls: {
  tdxUrl: string;
  miniAppUrl: string;
  projectUrl: string;
  formUrl?: string;
  detectiveLiffUrl?: string;
  detectiveWebUrl?: string;
}): OutgoingLineMessage {
  const formUrl = urls.formUrl || "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform";
  const detectiveUrl = urls.detectiveLiffUrl || "https://miniapp.line.me/2011521041-JnfPdXhF";
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#38BDF8",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🐶 智慧交通好夥伴",
          color: "#F0F9FF",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "我是 MOTC 交通小助手！",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "您的專屬交通與專案指引機器人",
          color: "#E0F2FE",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "哈囉！我是您的 MOTC 交通小助手 🐾✨",
          weight: "bold",
          size: "sm",
          color: "#0284C7",
          wrap: true
        },
        {
          type: "text",
          text: "專為您提供 TDX 交通資料、周邊交通 Mini App 以及項目管理網頁的快速捷徑！",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFFBEB",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "📢 封測申請提醒：",
              weight: "bold",
              size: "xs",
              color: "#B45309"
            },
            {
              type: "text",
              text: "目前小助手仍處於測試階段，請先填寫 Google 表單開通測試權限喔！",
              size: "xs",
              color: "#92400E",
              wrap: true
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F0F9FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "🤫 貼心小約定：",
              weight: "bold",
              size: "xs",
              color: "#0284C7"
            },
            {
              type: "text",
              text: "• 我只會在指令開頭為「/」時才會處理與回應喔！",
              size: "xs",
              color: "#0369A1"
            },
            {
              type: "text",
              text: "• 普通聊天說話我會乖乖待命，絕不打擾大家 💤",
              size: "xs",
              color: "#0C4A6E"
            }
          ]
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "text",
          text: "📌 您可以使用以下指令呼喚我：",
          weight: "bold",
          size: "xs",
          color: "#334155"
        },
        {
          type: "box",
          layout: "vertical",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚍 /tdx", size: "xs", weight: "bold", color: "#0284C7", flex: 4 },
                { type: "text", text: "查看 TDX 交通部資料平臺", size: "xs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚀 /app", size: "xs", weight: "bold", color: "#0D9488", flex: 4 },
                { type: "text", text: "開啟周邊交通 Mini App", size: "xs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🕵️‍♂️ /search", size: "xs", weight: "bold", color: "#4F46E5", flex: 4 },
                { type: "text", text: "資料查詢小偵探 (TDX 738+ API)", size: "xs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📊 /project", size: "xs", weight: "bold", color: "#6366F1", flex: 4 },
                { type: "text", text: "開啟項目管理網頁看板", size: "xs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "❓ /help", size: "xs", weight: "bold", color: "#D97706", flex: 4 },
                { type: "text", text: "查看詳細功能與指令說明", size: "xs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📝 /申請", size: "xs", weight: "bold", color: "#D97706", flex: 4 },
                { type: "text", text: "填寫測試開通申請表單", size: "xs", color: "#64748B", flex: 6 }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: "🕵️‍♂️ 資料查詢小偵探",
            uri: detectiveUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🚀 周邊交通 Mini App",
            uri: urls.miniAppUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 申請測試開通 (填表單)",
            uri: formUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🐶 哈囉！我是 MOTC 交通小助手",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 5. 指令說明與選單 Flex Message (/help)
 */
export function createHelpFlexMessage(urls: {
  tdxUrl: string;
  miniAppUrl: string;
  projectUrl: string;
  formUrl?: string;
}): OutgoingLineMessage {
  const formUrl = urls.formUrl || "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform";
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#D97706",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "📖 指令手冊與功能選單",
          color: "#FEF3C7",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "MOTC 助手指令指南",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "所有指令均需以「/」為開頭觸發",
          color: "#FDE68A",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "💡 常用快捷指令清單：",
          weight: "bold",
          size: "sm",
          color: "#B45309"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFFBEB",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🐶 /你是誰", size: "xs", weight: "bold", color: "#0284C7" },
                { type: "text", text: "認識機器人與服務簡介", size: "xxs", color: "#64748B" }
              ]
            },
            { type: "separator", color: "#FDE68A" },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🚍 /tdx", size: "xs", weight: "bold", color: "#0284C7" },
                { type: "text", text: "查看交通部 TDX 運輸資料流通服務官網", size: "xxs", color: "#64748B" }
              ]
            },
            { type: "separator", color: "#FDE68A" },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "🚀 /app (或 /mini-app)", size: "xs", weight: "bold", color: "#0D9488" },
                { type: "text", text: "開啟周邊交通即時資訊助手 (YouBike / 停車場 / 公車)", size: "xxs", color: "#64748B" }
              ]
            },
            { type: "separator", color: "#FDE68A" },
            {
              type: "box",
              layout: "vertical",
              contents: [
                { type: "text", text: "📊 /project (或 /專案)", size: "xs", weight: "bold", color: "#6366F1" },
                { type: "text", text: "開啟 AI Studio 項目管理網頁儀表板", size: "xxs", color: "#64748B" }
              ]
            }
          ]
        },
        {
          type: "text",
          text: "⚠️ 注意：一般未帶「/」開頭之聊天發言，小助手會主動略過不予回應，請多利用斜線指令喔！",
          size: "xxs",
          color: "#94A3B8",
          wrap: true
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#D97706",
          height: "sm",
          action: {
            type: "uri",
            label: "🚀 開啟 Mini App",
            uri: urls.miniAppUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#D97706",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 申請測試開通表單",
            uri: formUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "📊 項目管理看板",
            uri: urls.projectUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "📖 MOTC 小助手指令說明與選單",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 6. Google 表單測試申請可愛氣泡 Flex Message (/申請)
 */
export function createFormFlexMessage(
  formUrl: string = "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform"
): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#D97706",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "📝 封測招募與權限開通",
          color: "#FEF3C7",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "測試資格開通申請",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "Google Form Beta Application",
          color: "#FDE68A",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "🚀 歡迎參與 MOTC 交通小助手封測！",
          weight: "bold",
          size: "sm",
          color: "#B45309",
          wrap: true
        },
        {
          type: "text",
          text: "目前小助手仍處於內部測試階段，為了提供最穩定流暢的交通與專案服務，需請您填寫 Google 表單以利為您開通測試帳號與權限。",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFFBEB",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📋", size: "sm", flex: 1 },
                { type: "text", text: "表單內容", size: "xs", weight: "bold", color: "#B45309", flex: 3 },
                { type: "text", text: "基本資訊與使用需求", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "⚡", size: "sm", flex: 1 },
                { type: "text", text: "開通進度", size: "xs", weight: "bold", color: "#B45309", flex: 3 },
                { type: "text", text: "提交後管理員將盡速為您開通", size: "xs", color: "#64748B", flex: 7 }
              ]
            }
          ]
        },
        {
          type: "text",
          text: "✨ 點擊下方按鈕即可立即開啟 Google 表單填寫！",
          size: "xxs",
          color: "#D97706"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#D97706",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 立即填寫申請表單",
            uri: formUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "📝 填寫 MOTC 交通小助手測試開通申請表單",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 7. 資料查詢小偵探可愛氣泡 Flex Message (/search)
 */
export function createDetectiveFlexMessage(
  liffUrl: string = "https://miniapp.line.me/2011521041-JnfPdXhF",
  webUrl: string = "https://motc-mini-dog.pages.dev/search"
): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#4F46E5",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🕵️‍♂️ 交通數據情報站",
          color: "#E0E7FF",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "資料查詢小偵探",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "motc-mini-search • TDX 738+ API 探勘",
          color: "#C7D2FE",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "🔍 全臺最完整的交通開放 API 探勘神器！",
          weight: "bold",
          size: "sm",
          color: "#4338CA",
          wrap: true
        },
        {
          type: "text",
          text: "整合交通部 TDX 龐大 738+ API 資料集，包含公車、停車、票證、道安與加值治理，支援語音輸入與完整 URL 呼叫語法。",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#EEF2FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🔥", size: "sm", flex: 1 },
                { type: "text", text: "熱門推薦", size: "xs", weight: "bold", color: "#4338CA", flex: 3 },
                { type: "text", text: "即時掌握百萬調用量核心 API", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🆕", size: "sm", flex: 1 },
                { type: "text", text: "最新上線", size: "xs", weight: "bold", color: "#4338CA", flex: 3 },
                { type: "text", text: "2026 最新發布交通資料集", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🎙️", size: "sm", flex: 1 },
                { type: "text", text: "語音搜尋", size: "xs", weight: "bold", color: "#4338CA", flex: 3 },
                { type: "text", text: "直接用說的快速找資料", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📋", size: "sm", flex: 1 },
                { type: "text", text: "程式語法", size: "xs", weight: "bold", color: "#4338CA", flex: 3 },
                { type: "text", text: "一鍵複製完整 URL 與 cURL 指令", size: "xs", color: "#64748B", flex: 7 }
              ]
            }
          ]
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: "🚀 開啟資料小偵探 Mini App",
            uri: liffUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🌐 網頁版入口",
            uri: webUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🕵️‍♂️ 資料查詢小偵探 (TDX 738+ API 探勘)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 8. 意見回復表單可愛氣泡 Flex Message (/意見 或 /feedback)
 */
export function createFeedbackFlexMessage(
  ticketId: string,
  formUrl: string
): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#EC4899",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "💬 意見與問題回報",
          color: "#FCE7F3",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "意見回復申請單",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "您的反饋是我們持續進步的最大動力",
          color: "#FBCFE8",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "xl",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "💌 感謝您使用 MOTC 交通小助手！",
          weight: "bold",
          size: "sm",
          color: "#BE185D",
          wrap: true
        },
        {
          type: "text",
          text: "不論是系統操作問題、服務流程建議、產品功能構想或資訊異常，歡迎填寫意見回覆單，我們將由專人為您追蹤處理。",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FDF2F8",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "sm",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🎫", size: "sm", flex: 1 },
                { type: "text", text: "回復單號", size: "xs", weight: "bold", color: "#BE185D", flex: 3 },
                { type: "text", text: ticketId, size: "xs", weight: "bold", color: "#DB2777", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "👤", size: "sm", flex: 1 },
                { type: "text", text: "用戶識別", size: "xs", weight: "bold", color: "#BE185D", flex: 3 },
                { type: "text", text: "已自動綁定 LINE 帳號", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "⚡", size: "sm", flex: 1 },
                { type: "text", text: "處理時效", size: "xs", weight: "bold", color: "#BE185D", flex: 3 },
                { type: "text", text: "收件後 1~2 工作天內檢視", size: "xs", color: "#64748B", flex: 7 }
              ]
            }
          ]
        },
        {
          type: "text",
          text: "✨ 點選下方按鈕即可自動帶入單號與身分填寫表單！",
          size: "xxs",
          color: "#BE185D"
        }
      ]
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      paddingAll: "lg",
      contents: [
        {
          type: "button",
          style: "primary",
          color: "#EC4899",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 填寫意見回復表單",
            uri: formUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: `💬 意見回復申請單 (${ticketId})`,
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}
