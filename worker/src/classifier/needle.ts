import type { Env, RoutingResult, BotToolName } from "../types/env";
import { BOT_TOOLS } from "./tools";

export class NeedleClassifier {
  private apiUrl?: string;
  private apiKey?: string;

  constructor(env: Env) {
    this.apiUrl = env.NEEDLE_API_URL;
    this.apiKey = env.NEEDLE_API_KEY;
  }

  /**
   * Route user intent using Fast Edge Heuristics / Needle SAN Model / AI Fallback.
   */
  async classify(
    rawText: string,
    geminiFallbackFn?: (prompt: string) => Promise<RoutingResult>
  ): Promise<RoutingResult> {
    // Strip leading slash if present
    const cleanText = rawText.replace(/^\/+/, "").trim();

    // 1. Fast Edge Heuristics (0ms, 100% precision on command triggers)
    const fastMatch = this.tryFastPatternMatch(cleanText);
    if (fastMatch) {
      return fastMatch;
    }

    // 2. Call Cactus Compute Needle API Service (if URL configured)
    if (this.apiUrl) {
      try {
        const needleResult = await this.callNeedleApi(cleanText);
        if (needleResult && needleResult.confidence >= 0.7) {
          return needleResult;
        }
      } catch (error) {
        console.warn("[NeedleClassifier] Needle API call failed or unavailable:", error);
      }
    }

    // 3. Fallback to Gemini AI Router (if fallback function provided)
    if (geminiFallbackFn) {
      try {
        return await geminiFallbackFn(cleanText);
      } catch (error) {
        console.warn("[NeedleClassifier] Gemini fallback router error:", error);
      }
    }

    // 4. Default Safe Fallback
    return {
      tool: "who_are_you",
      confidence: 0.5,
      reasoning: "Default fallback to bot introduction"
    };
  }

  /**
   * Fast regex / keyword heuristic match for sub-millisecond dispatch.
   */
  private tryFastPatternMatch(prompt: string): RoutingResult | null {
    const lower = prompt.toLowerCase();

    // 1. Identity & Introduction
    if (/^(你是誰|誰|自我介紹|who\s*are\s*you|who|about|bot)$/i.test(lower) || /你是誰/.test(lower)) {
      return {
        tool: "who_are_you",
        confidence: 1.0,
        reasoning: "Matched who_are_you pattern"
      };
    }

    // 2. TDX Portal
    if (
      /^(tdx|交通部|運輸資料|tdx官網|tdx平台|tdx入口|transportdata)$/i.test(lower) ||
      /(tdx|交通部運輸|運輸資料流通|transportdata\.tw)/i.test(lower)
    ) {
      return {
        tool: "show_tdx",
        confidence: 1.0,
        reasoning: "Matched show_tdx pattern"
      };
    }

    // 3. MOTC Mini App
    if (
      /^(app|mini-?app|motc-mini-app|周邊交通|交通助手|交通小狗|即時交通|youbike|ubike|停車場|公車)$/i.test(lower) ||
      /(mini-?app|周邊交通|交通助手|交通小狗|motc-mini-dog|即時車位)/i.test(lower)
    ) {
      return {
        tool: "show_motc_app",
        confidence: 1.0,
        reasoning: "Matched show_motc_app pattern"
      };
    }

    // 4. Data Query Detective (motc-mini-search)
    if (
      /^(search|偵探|小偵探|資料偵探|資料小偵探|api|查詢|查api|apisearch|探員)$/i.test(lower) ||
      /(資料查詢|小偵探|motc-mini-search|api查詢|738)/i.test(lower)
    ) {
      return {
        tool: "show_detective",
        confidence: 1.0,
        reasoning: "Matched show_detective pattern"
      };
    }

    // Eagle Eye Radar (motc-mini-eagle-eye)
    if (
      /^(eagle|eagle-?eye|鷹眼|路安|防禦雷達|雷達|cctv|監視器|即時路況|路況|危險路段|肇事熱點|車禍|事故)$/i.test(lower) ||
      /(鷹眼|路安鷹眼|防禦雷達|周邊cctv|即時cctv|路況監視|危險路段|易肇事|事故熱點)/i.test(lower)
    ) {
      return {
        tool: "show_eagle_eye",
        confidence: 1.0,
        reasoning: "Matched show_eagle_eye pattern"
      };
    }

    // Silver Mobility Companion (motc-senior-care / 銀髮出行守護員)
    if (
      /^(silver|銀髮|銀髮守護|守護員|長輩|高齡|樂齡|老人|看藥袋)$/i.test(lower) ||
      /(銀髮|銀髮守護|守護員|長輩出行|老人出行|高齡交通|看藥袋)/i.test(lower)
    ) {
      return {
        tool: "show_silver_protect",
        confidence: 1.0,
        reasoning: "Matched show_silver_protect pattern"
      };
    }

    // Web Portal (免登入 LINE 網頁版入口大廳)
    if (
      /^(web|網頁|網頁版|瀏覽器|web-?portal|portal|免登入)$/i.test(lower) ||
      /(網頁版|網頁入口|瀏覽器開啟|免登入)/i.test(lower)
    ) {
      return {
        tool: "show_web_portal",
        confidence: 1.0,
        reasoning: "Matched show_web_portal pattern"
      };
    }

    // 5. Unified Project Hub (內部與外部專案系統，依權限動態分流)
    if (
      /^(project|專案|項目管理|專案管理|外部|內部|科資司|系統|平台|展示|資源|internal|links|demo|yolo|yolo26|opendata|語料|seo|市場|市場分析|marketpulse|oss|項目監測|ossradar|命理|sharenote|分享訊息|okr|ogsm|目標管理|雙引擎)$/i.test(lower) ||
      /(專案|項目管理|外部系統|內部專案|大數據平台|系統清單|內部系統|展示平台|demo|開發階段|yolo|yolo26|opendata|開放語料|seo|全球市場|marketpulse|項目監測|ossradar|命理工作室|sharenote|分享訊息|okr|ogsm|目標管理|雙引擎)/i.test(lower)
    ) {
      return {
        tool: "show_projects",
        confidence: 1.0,
        reasoning: "Matched show_projects pattern"
      };
    }

    // 6. Unified Service Form (表單專區：申請內部測試 ＆ 填寫意見回報，包含 /form, /申請, /意見 等別名)
    if (
      /^(form|申請|測試申請|測試|開通|開通測試|googleform|表單|填表單|feedback|意見|回報|建議|意見回復|意見回覆|反映|客訴|問題回報)$/i.test(lower) ||
      /(申請測試|開通測試|測試表單|填寫表單|google\s*表單|意見回復|意見回覆|問題回報|填寫意見|提供建議|服務表單)/i.test(lower)
    ) {
      return {
        tool: "show_unified_form",
        confidence: 1.0,
        reasoning: "Matched show_unified_form pattern"
      };
    }


    // 9. Help / Menu
    if (/^(help|說明|幫助|指令|選單|功能|目錄|menu|\?)$/i.test(lower)) {
      return {
        tool: "help",
        confidence: 1.0,
        reasoning: "Matched help pattern"
      };
    }

    return null;
  }

  /**
   * Call Cactus Compute Needle REST API endpoint.
   */
  private async callNeedleApi(prompt: string): Promise<RoutingResult | null> {
    if (!this.apiUrl) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
        },
        body: JSON.stringify({
          prompt,
          tools: BOT_TOOLS
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Needle API error ${response.status}`);
      }

      const data = (await response.json()) as {
        tool?: BotToolName;
        name?: BotToolName;
        arguments?: Record<string, unknown>;
        parameters?: Record<string, unknown>;
        confidence?: number;
      };

      const tool = (data.tool || data.name || "unknown") as BotToolName;
      return {
        tool,
        arguments: data.arguments || data.parameters || { prompt },
        confidence: data.confidence ?? 0.85,
        reasoning: "Classified via Needle REST API"
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
