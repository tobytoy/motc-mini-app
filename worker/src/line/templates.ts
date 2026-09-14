import type { OutgoingLineMessage, LineQuickReply } from "../types/line";

export const BOT_QUICK_REPLY: LineQuickReply = {
  items: [
    {
      type: "action",
      action: {
        type: "message",
        label: "🚦 Mini App",
        text: "/app"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🌐 網頁版",
        text: "/web"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🦅 路安鷹眼",
        text: "/eagle"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🧓 銀髮守護",
        text: "/silver"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "🕵️‍♂️ 資料偵探",
        text: "/search"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "💻 專案大廳",
        text: "/project"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "📝 服務表單",
        text: "/form"
      }
    },
    {
      type: "action",
      action: {
        type: "message",
        label: "❓ 服務說明",
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
  trafficLiffUrl: string = "https://miniapp.line.me/2011479506-1DIDNGJQ",
  eagleEyeLiffUrl: string = "https://miniapp.line.me/2011551329-VWljb6fv",
  detectiveLiffUrl: string = "https://miniapp.line.me/2011521041-JnfPdXhF",
  seniorCareLiffUrl: string = "https://miniapp.line.me/2011556606-KbygvdxR"
): OutgoingLineMessage {
  // Graceful fallback if caller passes web URL as first param
  const actualTrafficUrl = trafficLiffUrl.startsWith("http") && trafficLiffUrl.includes("miniapp.line.me")
    ? trafficLiffUrl
    : "https://miniapp.line.me/2011479506-1DIDNGJQ";

  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0F766E",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "📱 MOTC 旗艦微應用專區 · LINE Mini App 專屬",
          color: "#CCFBF1",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "四大旗艦 LINE Mini App",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "專為手機打造 · 點擊直達 · 免下載 · 原生沈浸體驗",
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
                { type: "text", text: "🚦 1. 周邊交通即時資訊", size: "xs", weight: "bold", color: "#0F766E", flex: 8 },
                { type: "text", text: "Mini App", size: "xxs", color: "#14B8A6", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 🚲 YouBike 2.0/2.0E 即時車位借還\n• 🅿️ 路外停車場格位與費率說明\n• 🚌 最近站牌各路線即時進站倒數\n• 🌤️ 氣象署降雨機率與出門帶傘指引",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        // Mini App 2: 路安鷹眼雷達
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F8FAFC",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🦅 2. 路安鷹眼即時防禦雷達", size: "xs", weight: "bold", color: "#0284C7", flex: 8 },
                { type: "text", text: "Mini App", size: "xxs", color: "#38BDF8", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 🚨 300 大易肇事熱點距離倒數警示\n• ⚡ TDX 即時車禍事故與車道封閉通報\n• 📹 669+ 支即時 CCTV 監視器直擊\n• 🧭 地圖飛移聚焦與 Google 導航",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        // Mini App 3: 資料查詢小偵探
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
                { type: "text", text: "🕵️‍♂️ 3. 資料查詢小偵探", size: "xs", weight: "bold", color: "#4338CA", flex: 8 },
                { type: "text", text: "Mini App", size: "xxs", color: "#6366F1", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 🔍 全臺 TDX 738+ API 規格即時檢索\n• 🔥 百萬調用量熱門 API 精選推薦\n• 🎙️ 原生語音輸入搜尋 ＆ cURL 複製",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        // Mini App 4: 銀髮出行守護員
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFF1F2",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🧓 4. 銀髮出行守護員", size: "xs", weight: "bold", color: "#BE123C", flex: 8 },
                { type: "text", text: "Mini App", size: "xxs", color: "#FB7185", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 👵 樂齡大字體與直覺圖像出行指引\n• 💊 看藥袋智慧辨識 ＆ 常用地點導航\n• 🆘 一鍵緊急求救通報與子女守護",
              size: "xxs",
              color: "#334155",
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
          color: "#0D9488",
          height: "sm",
          action: {
            type: "uri",
            label: "🚦 開啟周邊交通 Mini App",
            uri: actualTrafficUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#0284C7",
          height: "sm",
          action: {
            type: "uri",
            label: "🦅 開啟路安鷹眼 Mini App",
            uri: eagleEyeLiffUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: "🕵️‍♂️ 開啟資料小偵探 Mini App",
            uri: detectiveLiffUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#E11D48",
          height: "sm",
          action: {
            type: "uri",
            label: "🧓 開啟銀髮守護 Mini App",
            uri: seniorCareLiffUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "📱 MOTC 四大旗艦 LINE Mini App 專區 (周邊交通 ＆ 鷹眼 ＆ 偵探 ＆ 銀髮)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 2B. 網頁版入口大廳 (/web - 免登入 LINE，電腦/手機瀏覽器直接開啟)
 */
export function createWebPortalFlexMessage(urls?: {
  trafficWebUrl?: string;
  eagleEyeWebUrl?: string;
  detectiveWebUrl?: string;
  guardianWebUrl?: string;
}): OutgoingLineMessage {
  const trafficUrl = urls?.trafficWebUrl || "https://motc-mini-dog.pages.dev/";
  const eagleUrl = urls?.eagleEyeWebUrl || "https://motc-mini-dog.pages.dev/eagle-eye";
  const detectiveUrl = urls?.detectiveWebUrl || "https://motc-mini-dog.pages.dev/search";
  const guardianUrl = urls?.guardianWebUrl || "https://motc-mini-dog.pages.dev/guardian";

  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#1E293B",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🌐 MOTC 交通部智慧出行 • 網頁版入口大廳",
          color: "#94A3B8",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "免登入 LINE · 網頁版入口",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "電腦 / 手機瀏覽器通用 · 免安裝 · 點擊即開",
          color: "#38BDF8",
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
          backgroundColor: "#F1F5F9",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🚦 1. 周邊交通即時資訊 (網頁版)", size: "xs", weight: "bold", color: "#0F172A", flex: 8 },
                { type: "text", text: "免登入", size: "xxs", color: "#0EA5E9", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🚲 全臺 YouBike 2.0/2.0E 車位即時查詢\n• 🅿️ 路外即時剩餘車位與收費費率\n• 🚌 公車站牌即時進站倒數 ＆ CWA 降雨機率",
              size: "xxs",
              color: "#475569",
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
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🦅 2. 路安鷹眼雷達 (網頁版)", size: "xs", weight: "bold", color: "#0369A1", flex: 8 },
                { type: "text", text: "免登入", size: "xxs", color: "#0EA5E9", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🚨 300 大易肇事熱點地圖直擊與語音提示\n• 📹 669+ 支即時 CCTV 監視器畫面與路況事故",
              size: "xxs",
              color: "#475569",
              wrap: true
            }
          ]
        },
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
                { type: "text", text: "🕵️‍♂️ 3. 資料查詢小偵探 (網頁版)", size: "xs", weight: "bold", color: "#3730A3", flex: 8 },
                { type: "text", text: "免登入", size: "xxs", color: "#6366F1", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🔍 全臺 TDX 738+ API 規格與端點即時探勘\n• 📋 一鍵複製完整 API URL 與 cURL 指令語法",
              size: "xxs",
              color: "#475569",
              wrap: true
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFF1F2",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💻 4. 銀髮出行守護員代管平台 (網頁版)", size: "xs", weight: "bold", color: "#9F1239", flex: 8 },
                { type: "text", text: "免登入", size: "xxs", color: "#F43F5E", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 🏠 子女端遠端代管平台，設定長輩常去安全地點\n• 🔑 邀請碼即時綁定與守護紀錄回溯",
              size: "xxs",
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
            label: "🚦 開啟周邊交通網頁版",
            uri: trafficUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#0369A1",
          height: "sm",
          action: {
            type: "uri",
            label: "🦅 開啟路安鷹眼網頁版",
            uri: eagleUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: "🕵️‍♂️ 開啟資料偵探網頁版",
            uri: detectiveUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#BE123C",
          height: "sm",
          action: {
            type: "uri",
            label: "💻 開啟銀髮守護代管平台",
            uri: guardianUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🌐 MOTC 智慧交通網頁版入口大廳 (免登入 LINE，電腦/手機瀏覽器直接開啟)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}


/**
 * 3. 項目管理網頁可愛氣泡 Flex Message
 */
/**
 * 3A. 內部人員專案總覽 (/project - 內部人員全部 24 大系統均顯示)
 */
export function createAllInclusiveProjectsFlexMessage(
  displayName?: string,
  demoAppUrl: string = "https://miniapp.line.me/2011556606-KbygvdxR"
): OutgoingLineMessage {
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
          text: "內部同仁已解鎖全部 24 大系統平台 (13 內部 ＋ 11 外部)",
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
          text: "以下為科資司全部專案（13 大內部研發工具 ＋ 11 大外部公開大數據平台），建議使用電腦/寬螢幕瀏覽以獲得最佳體驗：",
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
          text: "🔒 科資司 13 大內部核心與研發工具：",
          weight: "bold",
          size: "xs",
          color: "#6D28D9"
        },
        // 一、策略工程與專案實值 (3項)
        {
          type: "text",
          text: "🏗️ 策略工程與專案實值 (3項)",
          weight: "bold",
          size: "xxs",
          color: "#7C3AED",
          margin: "sm"
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
                { type: "text", text: "1. 🎯 OKR & OGSM", size: "xs", color: "#6D28D9", flex: 6 },
                { type: "text", text: "雙引擎目標管理", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ai.studio/apps/d82a5044-8526-4c32-9ef7-a724ff0035ba?fullscreenApplet=true" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "2. 📊 EVM 專案管理", size: "xs", color: "#6D28D9", flex: 6 },
                { type: "text", text: "實值管理系統", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ai.studio/apps/0bd118d7-407b-4576-bf5b-e354f697c2cf?fullscreenApplet=true" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "3. 📐 UML 超級系統", size: "xs", color: "#6D28D9", flex: 6 },
                { type: "text", text: "架構工程系統", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ai.studio/apps/ff844b1e-b6fc-48d7-980e-43f09a695bb5?fullscreenApplet=true" }
            }
          ]
        },
        // 二、AI 智慧與模型研發 (4項)
        {
          type: "text",
          text: "🤖 AI 智慧與模型研發 (4項)",
          weight: "bold",
          size: "xxs",
          color: "#4F46E5",
          margin: "sm"
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
                { type: "text", text: "4. 👁️ 訓練測試 Yolo26", size: "xs", color: "#4F46E5", flex: 6 },
                { type: "text", text: "視覺模型 Hub", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://yolo26hub-97sxcr5h.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "5. 🎙️ 語音轉文字", size: "xs", color: "#4F46E5", flex: 6 },
                { type: "text", text: "voice2text 辨識", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/voice2text-studio" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "6. 🧓 銀髮守護", size: "xs", color: "#4F46E5", flex: 6 },
                { type: "text", text: "⚠️ 早期 PoC 階段", size: "xxs", color: "#D97706", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: demoAppUrl }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "7. 🔮 命理工作室", size: "xs", color: "#4F46E5", flex: 6 },
                { type: "text", text: "多維數理推算", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://multidivine-jmhmllyb.manus.space" }
            }
          ]
        },
        // 三、雲端基座與數據情報 (6項)
        {
          type: "text",
          text: "🛡️ 雲端基座與數據情報 (6項)",
          weight: "bold",
          size: "xxs",
          color: "#0D9488",
          margin: "sm"
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
                { type: "text", text: "8. 🔌 MCP 資訊基座", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "cf-mcp 協定", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/cf-mcp-playground" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "9. ⚡ MOTC 壓力測試", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "負載效能檢驗", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/motc-load-testing" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "10. 🛡️ 資安檢測工具", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "紅隊演練檢測", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://github.com/tobytoy/red-team-tools" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "11. 📈 全球市場分析", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "MarketPulse 趨勢", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://marketpulse-ugkkupnk.manus.space/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "12. 🔍 SEO 行銷分析", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "搜尋優化分析", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://searchanalyz-vj5fhzdc.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "13. ⏱️ 期限內分享訊息", size: "xs", color: "#0D9488", flex: 6 },
                { type: "text", text: "安全暫態筆記", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://sharenote-fzfdkymv.manus.space" }
            }
          ]
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "text",
          text: "🌐 11 大外部公開大數據與展示平台：",
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
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "9. 🎨 UI catwalk", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "前端走秀展示", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://motc-ui-catwalk.web.app/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "10. 📑 OpenData 語料轉換", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "PDF API 萃取", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://taic-pdf-api-44da8rni.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "11. 📡 項目監測站", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "開源專案雷達", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ossradar-4kcro5oa.manus.space" }
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
            label: "🎯 OKR & OGSM 目標管理",
            uri: "https://ai.studio/apps/d82a5044-8526-4c32-9ef7-a724ff0035ba?fullscreenApplet=true"
          }
        },
        {
          type: "button",
          style: "secondary",
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
            label: "🧓 銀髮守護 (早期 PoC)",
            uri: demoAppUrl
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
    altText: "🔒 MOTC 專案系統總覽 (內部人員已解鎖 24 大系統)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 3B. 外部人員專案總覽 (/project - 非內部人員僅顯示 11 大公開專案)
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
          text: "🖥️ MOTC 開放展示專區 (/project)",
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
          text: "11 大公開系統 • 建議使用電腦 / 寬螢幕觀看",
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
          text: "🌟 11 大公開開放平台清單：",
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
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "9. 🎨 UI catwalk", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "前端走秀展示", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://motc-ui-catwalk.web.app/" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "10. 📑 OpenData 語料轉換", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "PDF API 萃取", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://taic-pdf-api-44da8rni.manus.space" }
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "11. 📡 項目監測站", size: "xs", color: "#0284C7", flex: 6 },
                { type: "text", text: "開源專案雷達", size: "xxs", color: "#64748B", align: "end", flex: 4 }
              ],
              action: { type: "uri", uri: "https://ossradar-4kcro5oa.manus.space" }
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
              text: "🔒 科資司內部研發實驗室（已解鎖 13 項核心系統）：",
              weight: "bold",
              size: "xs",
              color: "#6D28D9"
            },
            {
              type: "text",
              text: "含 OKR & OGSM 目標管理、EVM 實值監控、UML 架構工程、資安紅隊演練、Yolo26 模型與銀髮守護 (早期 PoC 階段) 等 13 大核心工具，僅對內部同仁開放。\n\n若您為科資司同仁，請點選下方按鈕登記開通加入名冊！",
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
            label: "🎨 UI catwalk 設計展示",
            uri: "https://motc-ui-catwalk.web.app/"
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
    altText: "🖥️ MOTC 開放展示專區 (11 大公開平台)",
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
  detectiveLiffUrl?: string;
  detectiveWebUrl?: string;
  eagleEyeLiffUrl?: string;
  eagleEyeWebUrl?: string;
}): OutgoingLineMessage {
  const detectiveUrl = urls.detectiveLiffUrl || "https://miniapp.line.me/2011521041-JnfPdXhF";
  const eagleEyeUrl = urls.eagleEyeLiffUrl || "https://miniapp.line.me/2011551329-VWljb6fv";
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
          text: "📖 服務指南與快捷目錄",
          color: "#FEF3C7",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "MOTC 智慧交通指南",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "點擊下方快捷按鈕輕鬆開啟三大旗艦服務",
          color: "#FDE68A",
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
          text: "您好！我是交通部智慧交通小助手 🐾✨",
          weight: "bold",
          size: "sm",
          color: "#B45309"
        },
        {
          type: "text",
          text: "整合全台 TDX 交通聯網、CWA 氣象即時動態與公路路網，為您提供三大即時出行與資料微應用：",
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
          text: "🌟 三大旗艦 Mini App 服務：",
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
                { type: "text", text: "🚦 /app", size: "xs", weight: "bold", color: "#0D9488", flex: 4 },
                { type: "text", text: "周邊交通即時資訊 (車位/公車/天氣)", size: "xxs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🦅 /eagle", size: "xs", weight: "bold", color: "#0284C7", flex: 4 },
                { type: "text", text: "路安鷹眼雷達 (事故熱點/CCTV直擊)", size: "xxs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "🕵️‍♂️ /search", size: "xs", weight: "bold", color: "#4F46E5", flex: 4 },
                { type: "text", text: "資料小偵探 (TDX 738+ API 探勘)", size: "xxs", color: "#64748B", flex: 6 }
              ]
            }
          ]
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        {
          type: "text",
          text: "📌 常用輔助指令：",
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
                { type: "text", text: "📍 傳送位置", size: "xs", weight: "bold", color: "#0284C7", flex: 4 },
                { type: "text", text: "GPS 自動查找方圓設施與防禦雷達", size: "xxs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💬 /意見", size: "xs", weight: "bold", color: "#EC4899", flex: 4 },
                { type: "text", text: "意見回覆單 (自動綁定單號與身分)", size: "xxs", color: "#64748B", flex: 6 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💻 /project", size: "xs", weight: "bold", color: "#7C3AED", flex: 4 },
                { type: "text", text: "專案大廳 (24 大系統平台總覽)", size: "xxs", color: "#64748B", flex: 6 }
              ]
            },
          ]
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
          spacing: "xs",
          contents: [
            {
              type: "text",
              text: "💡 快速上手指南：",
              weight: "bold",
              size: "xs",
              color: "#B45309"
            },
            {
              type: "text",
              text: "• 點選下方「快捷按鈕」即可一鍵查詢，免手動打字！\n• 私聊或群組中指令需加「/」開頭（如 /app、/eagle），避免打擾日常交談 💤",
              size: "xxs",
              color: "#92400E",
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
          color: "#0D9488",
          height: "sm",
          action: {
            type: "uri",
            label: "🚦 開啟周邊交通助手",
            uri: urls.miniAppUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#0284C7",
          height: "sm",
          action: {
            type: "uri",
            label: "🦅 開啟路安鷹眼雷達",
            uri: eagleEyeUrl
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
            uri: detectiveUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "📖 MOTC 交通小助手使用指南與功能清單",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 6B. MOTC 服務與回饋專區統一表單 (/form - 整合「測試開通申請」與「意見回報單號」雙按鈕)
 */
export function createUnifiedFormFlexMessage(
  formUrl: string = "https://docs.google.com/forms/d/e/1FAIpQLSd84pIjXoYOYO8qAodE6mI-aBfPyMuXoabBWHsw_g2Lu_u6Eg/viewform",
  feedbackFormUrl: string = "https://docs.google.com/forms/d/e/1FAIpQLSeqcp4e4gbc5L8aE5Kc9dtTVo3Q2UxwQdVd8Mh03tC0Iy94yQ/viewform",
  ticketId: string = "FB-MOTC-SERVICE"
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
          text: "📝 MOTC 服務與回報專區",
          color: "#FEF3C7",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "線上服務與意見回饋表單",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "身分自動帶入 · 專屬工單即時派發 · 快速申辦",
          color: "#FDE68A",
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
          backgroundColor: "#FFFBEB",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📝 1. 內部測試資格開通申請", size: "xs", weight: "bold", color: "#92400E", flex: 8 },
                { type: "text", text: "內部權限", size: "xxs", color: "#B45309", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: "• 專為交通部內部同仁、計畫主持人與專案夥伴打造。\n• 填寫表單登記 LINE 身分，審核通過即可解鎖 24 大系統平台完整主控台權限！",
              size: "xxs",
              color: "#78350F",
              wrap: true
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FDF2F8",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💬 2. 意見回饋與問題回報", size: "xs", weight: "bold", color: "#9D174D", flex: 8 },
                { type: "text", text: "工單追蹤", size: "xxs", color: "#BE185D", align: "end", flex: 3 }
              ]
            },
            {
              type: "text",
              text: `• 若在操作 Mini App 遇到數據異常、操作疑問或功能建議，歡迎填寫意見單。\n• 系統已為您自動生成專屬追蹤單號：${ticketId}，送出後專人即刻追蹤！`,
              size: "xxs",
              color: "#831843",
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
          color: "#D97706",
          height: "sm",
          action: {
            type: "uri",
            label: "📝 申請內部測試權限",
            uri: formUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#EC4899",
          height: "sm",
          action: {
            type: "uri",
            label: "💬 填寫意見回報單",
            uri: feedbackFormUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: `📝 MOTC 服務與回報專區 (測試開通申請 ＆ 意見回饋單號 ${ticketId})`,
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
 * 8. 路安鷹眼雷達可愛氣泡 Flex Message (/eagle)
 */
export function createEagleEyeFlexMessage(
  liffUrl: string = "https://miniapp.line.me/2011551329-VWljb6fv",
  webUrl: string = "https://motc-mini-dog.pages.dev/eagle-eye"
): OutgoingLineMessage {
  const contents = {
    type: "bubble",
    size: "mega",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#0F172A",
      paddingAll: "xl",
      contents: [
        {
          type: "text",
          text: "🦅 全臺路況直擊 ＆ 事故防禦",
          color: "#94A3B8",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "路安鷹眼雷達",
          color: "#38BDF8",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "motc-mini-eagle-eye • 危險路段 ＆ 即時 CCTV",
          color: "#CBD5E1",
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
          text: "🛡️ GPS 即時偵測，雙雷達守護您的出行安全！",
          weight: "bold",
          size: "sm",
          color: "#0284C7",
          wrap: true
        },
        {
          type: "text",
          text: "結合全台 300 大易肇事路口資料庫、TDX 突發事故即時通報，與 669+ 支國道/省道/市區即時 CCTV 監視器畫面。",
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
                { type: "text", text: "🚨", size: "sm", flex: 1 },
                { type: "text", text: "肇事熱點", size: "xs", weight: "bold", color: "#EF4444", flex: 3 },
                { type: "text", text: "危險路口距離倒數與盲區預警", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "⚡", size: "sm", flex: 1 },
                { type: "text", text: "突發路況", size: "xs", weight: "bold", color: "#F59E0B", flex: 3 },
                { type: "text", text: "車道封閉/車禍事故即時通報", size: "xs", color: "#64748B", flex: 7 }
              ]
            },
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "📹", size: "sm", flex: 1 },
                { type: "text", text: "即時CCTV", size: "xs", weight: "bold", color: "#06B6D4", flex: 3 },
                { type: "text", text: "秒級直擊現場路況監視畫面", size: "xs", color: "#64748B", flex: 7 }
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
          color: "#0284C7",
          height: "sm",
          action: {
            type: "uri",
            label: "🦅 開啟路安鷹眼 Mini App",
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
    altText: "🦅 路安鷹眼雷達 (即時路況 ＆ 事故防禦)",
    contents,
    quickReply: BOT_QUICK_REPLY
  };
}

/**
 * 9. 銀髮出行守護員專案氣泡 Flex Message (/銀髮守護 或 /silver)
 */
export function createSilverProtectFlexMessage(
  miniAppUrl: string = "https://miniapp.line.me/2011556606-KbygvdxR",
  guardianWebUrl: string = "https://motc-mini-dog.pages.dev/guardian"
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
          text: "🧓 銀髮出行守護員 • AI Senior Companion",
          color: "#FEF3C7",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: "長輩極簡出行 ✕ 家人安心代管",
          color: "#FFFFFF",
          size: "xl",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: "motc-senior-care • 雙介面智慧照護陪伴系統",
          color: "#FDE68A",
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
          text: "科技不該是長輩的高牆，而是有溫度的守護 🐾✨",
          weight: "bold",
          size: "sm",
          color: "#B45309",
          wrap: true
        },
        {
          type: "text",
          text: "顛覆傳統交通 App 複雜操作，繁複建檔由子女電腦代管，長輩在 LINE 手機端完全零負擔！",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "separator",
          color: "#E2E8F0"
        },
        // 模組 1: 長者端
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#F0FDF4",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "👴 長者端 (LINE Mini App)", size: "xs", weight: "bold", color: "#065F46", flex: 8 },
                { type: "text", text: "零認知負擔", size: "xxs", color: "#059669", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 🏠 一鍵回家 ＆ 🏥 看醫生 特大對比方塊\n• 🖼️ 親友合照地點格，一指點擊直達公車\n• 🎙️ 語音問路與相機拍照 (看站牌、看藥袋)\n• 🚨 SOS 求救長按 3 秒，秒傳 GPS 地址給家人",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        // 模組 2: 子女端
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FAF5FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            {
              type: "box",
              layout: "horizontal",
              contents: [
                { type: "text", text: "💻 子女端 (PC 電腦管理台)", size: "xs", weight: "bold", color: "#6B21A8", flex: 8 },
                { type: "text", text: "遠端代管設定", size: "xxs", color: "#7C3AED", align: "end", flex: 4 }
              ]
            },
            {
              type: "text",
              text: "• 🖼️ 上傳父母常用實景招牌與親友合照庫\n• ♿ 生理輔具偏好 (避階梯/低地板/步行上限)\n• 📲 一鍵產生長者配對 QR Code 與邀請碼\n• 🤖 設定個人 Gemini Key，掌握外出日誌",
              size: "xxs",
              color: "#334155",
              wrap: true
            }
          ]
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#FFFBEB",
          cornerRadius: "md",
          paddingAll: "sm",
          contents: [
            {
              type: "text",
              text: "⚠️ 本系統目前為早期概念驗證 (PoC 階段)，歡迎家庭照護者搶先試用與提供回饋！",
              size: "xxs",
              color: "#92400E",
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
          color: "#059669",
          height: "sm",
          action: {
            type: "uri",
            label: "👴 開啟長者端 Mini App",
            uri: miniAppUrl
          }
        },
        {
          type: "button",
          style: "primary",
          color: "#7C3AED",
          height: "sm",
          action: {
            type: "uri",
            label: "💻 開啟子女代管平台 (電腦端)",
            uri: guardianWebUrl
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🧓 銀髮出行守護員 (長者端 Mini App ✕ 子女端電腦代管平台)",
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

/**
 * Feature Flag / Maintenance Fallback Message
 */
export function createFeatureMaintenanceFlexMessage(title: string, description: string): OutgoingLineMessage {
  return {
    type: "flex",
    altText: `🛠️ ${title}`,
    contents: {
      type: "bubble",
      size: "kilo",
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "18px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "md",
            color: "#1E293B"
          },
          {
            type: "text",
            text: description,
            wrap: true,
            size: "sm",
            color: "#64748B"
          }
        ]
      }
    },
    quickReply: BOT_QUICK_REPLY
  };
}

