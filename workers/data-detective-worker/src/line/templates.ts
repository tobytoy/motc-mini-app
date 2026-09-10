import type { ApiMetadataItem } from "../types/metadata";

export interface OutgoingFlexMessage {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
}

/**
 * 1. API 搜尋結果可愛氣泡卡片
 */
export function createSearchResultFlexMessage(
  query: string,
  items: ApiMetadataItem[],
  total: number,
  liffUrl: string
): OutgoingFlexMessage {
  const displayItems = items.slice(0, 3);

  const itemBoxes = displayItems.map((api, idx) => {
    const isPublic = !api.restricted;
    const badgeColor = isPublic ? "#10B981" : "#F59E0B";
    const badgeText = isPublic ? "🟢 免審核" : "🔒 需審查";

    return {
      type: "box",
      layout: "vertical",
      backgroundColor: "#F8FAFC",
      cornerRadius: "md",
      paddingAll: "md",
      spacing: "xs",
      margin: idx > 0 ? "md" : "none",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: badgeText,
              size: "xxs",
              weight: "bold",
              color: badgeColor,
              flex: 4
            },
            {
              type: "text",
              text: `⏱️ ${api.updateFreq}`,
              size: "xxs",
              color: "#64748B",
              align: "end",
              flex: 6
            }
          ]
        },
        {
          type: "text",
          text: api.name,
          weight: "bold",
          size: "xs",
          color: "#1E293B",
          wrap: true
        },
        {
          type: "box",
          layout: "horizontal",
          backgroundColor: "#EEF2FF",
          cornerRadius: "sm",
          paddingAll: "xs",
          contents: [
            {
              type: "text",
              text: `${api.method} ${api.path}`,
              size: "xxs",
              color: "#4F46E5",
              wrap: true
            }
          ]
        }
      ]
    };
  });

  const jumpUrl = `${liffUrl}?q=${encodeURIComponent(query)}`;

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
          text: "🔍 資料查詢小偵探",
          color: "#E0E7FF",
          size: "xs",
          weight: "bold"
        },
        {
          type: "text",
          text: `搜尋：「${query.slice(0, 15)}」`,
          color: "#FFFFFF",
          size: "lg",
          weight: "bold",
          margin: "sm"
        },
        {
          type: "text",
          text: `共找到 ${total} 支相關 TDX API 資料集`,
          color: "#C7D2FE",
          size: "xs",
          margin: "xs"
        }
      ]
    },
    body: {
      type: "box",
      layout: "vertical",
      paddingAll: "lg",
      contents: itemBoxes.length > 0
        ? itemBoxes
        : [
            {
              type: "text",
              text: "查無直接匹配之 API，請嘗試更換關鍵字或點擊下方按鈕進行進階篩選。",
              size: "xs",
              color: "#64748B",
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
          color: "#4F46E5",
          height: "sm",
          action: {
            type: "uri",
            label: `🚀 開啟 Mini App 檢視全部 (${total})`,
            uri: jumpUrl
          }
        },
        {
          type: "button",
          style: "secondary",
          height: "sm",
          action: {
            type: "uri",
            label: "🌐 瀏覽 TDX 官網目錄",
            uri: "https://tdx.transportdata.tw/data-service/basic"
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: `🔍 資料查詢小偵探：找到 ${total} 支相關 API`,
    contents
  };
}

/**
 * 2. 機器人自我介紹可愛氣泡卡片
 */
export function createDetectiveIntroFlexMessage(liffUrl: string): OutgoingFlexMessage {
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
          text: "TDX 738+ 全臺交通開放 API 即時指引",
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
          text: "哈囉！我是「資料查詢小偵探」🔍",
          weight: "bold",
          size: "sm",
          color: "#4F46E5"
        },
        {
          type: "text",
          text: "專門協助開發者與通勤族快速探勘交通部 TDX 龐大的 738+ API 資料庫！",
          size: "xs",
          color: "#475569",
          wrap: true
        },
        {
          type: "box",
          layout: "vertical",
          backgroundColor: "#EEF2FF",
          cornerRadius: "md",
          paddingAll: "md",
          spacing: "xs",
          contents: [
            { type: "text", text: "💡 您可以直接對我說：", weight: "bold", size: "xs", color: "#4F46E5" },
            { type: "text", text: "• 「台北市公車動態」", size: "xs", color: "#4338CA" },
            { type: "text", text: "• 「路外停車場即時車位」", size: "xs", color: "#4338CA" },
            { type: "text", text: "• 「易肇事路口排行」", size: "xs", color: "#4338CA" },
            { type: "text", text: "• 「捷運電子票證刷卡」", size: "xs", color: "#4338CA" }
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
            label: "🌐 前往 TDX 官網",
            uri: "https://tdx.transportdata.tw/data-service/basic"
          }
        }
      ]
    }
  };

  return {
    type: "flex",
    altText: "🕵️‍♂️ 資料查詢小偵探",
    contents
  };
}
