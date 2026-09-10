import type { MultiLayerNeedleResult, DomainCategory, Env } from "../types/env";
import { CITY_MAP } from "../services/searchEngine";

export class MultiLayerNeedleClassifier {
  private geminiKey?: string;

  constructor(env: Env) {
    this.geminiKey = env.GEMINI_API_KEY;
  }

  /**
   * Execute Multi-Layer Needle Classification:
   * Layer 1: Domain
   * Layer 2: Operation / Sub-domain
   * Layer 3: Entity & Parameter extraction
   */
  async classify(rawQuery: string): Promise<MultiLayerNeedleResult> {
    const text = rawQuery.replace(/^\/+/, "").trim();

    // 1. Layer 1: Domain Classification (Fast Edge Heuristic)
    const layer1 = this.classifyLayer1Domain(text);

    // 2. Layer 2: Operation / Sub-domain Classification
    const layer2 = this.classifyLayer2Operation(layer1, text);

    // 3. Layer 3: Entity Extraction (City, Route, Format, Restricted)
    const layer3 = this.extractLayer3Entities(text);

    return {
      layer1Domain: layer1,
      layer2Operation: layer2,
      layer3Entities: layer3,
      confidence: 1.0,
      reasoning: `Layer1: ${layer1} -> Layer2: ${layer2}`
    };
  }

  /**
   * Layer 1: Top-level domain classification.
   */
  private classifyLayer1Domain(text: string): DomainCategory {
    const lower = text.toLowerCase();

    // Parking & EV
    if (/(停車|車位|停車場|格位|充電|ev|carpark)/i.test(lower)) {
      return "parking";
    }

    // Governance & Value-added analytics
    if (/(加值|治理|轉乘|空間縫隙|時間縫隙|人流|人潮|風險情報|績效|敏感度|governance|predict)/i.test(lower)) {
      return "governance";
    }

    // Ticket & IC card OD data
    if (/(票證|刷卡|原始票證|odic|to1|to2|to3|段次|上下車刷卡|ticket)/i.test(lower)) {
      return "ticket";
    }

    // Road safety & Accidents
    if (/(道安|事故|車禍|易肇事|當事人|a1|a2|a30|死傷|肇事|accident|safety)/i.test(lower)) {
      return "safety";
    }

    // Tourism & Weather & Marine
    if (/(觀光|景點|纜車|海象|航路|氣象|雷達|tourism|weather|ship)/i.test(lower)) {
      return "tourism_weather";
    }

    // Public transport (Bus, Rail, Metro, Transit)
    if (/(公車|客運|捷運|高鐵|台鐵|輕軌|公車站|站牌|到站|時刻表|bus|rail|transit|mrt)/i.test(lower)) {
      return "transport";
    }

    return "general_search";
  }

  /**
   * Layer 2: Sub-domain / Operation classification based on Layer 1.
   */
  private classifyLayer2Operation(domain: DomainCategory, text: string): string {
    const lower = text.toLowerCase();

    switch (domain) {
      case "transport":
        if (/(預估|到站|還有幾分|等多久|即將進站|n1|eta)/i.test(lower)) {
          return "realtime_eta";
        }
        if (/(定點|a2|nearstop)/i.test(lower)) {
          return "realtime_nearstop";
        }
        if (/(定時|a1|frequency)/i.test(lower)) {
          return "realtime_freq";
        }
        if (/(時刻表|班表|發車|首末班|schedule|timetable)/i.test(lower)) {
          return "static_schedule";
        }
        if (/(站牌|站點|組站位|stop)/i.test(lower)) {
          return "static_stop";
        }
        if (/(通阻|最新消息|新聞|施工|停駛|alert|news)/i.test(lower)) {
          return "bus_alert";
        }
        return "static_route";

      case "parking":
        if (/(剩餘|即時|空位|車位|availability)/i.test(lower)) {
          return "parking_availability";
        }
        if (/(績效|指標|評估|indicator)/i.test(lower)) {
          return "parking_performance";
        }
        return "parking_basic";

      case "governance":
        if (/(空間縫隙|transfer.*space)/i.test(lower)) {
          return "transfer_space_gap";
        }
        if (/(時間縫隙|transfer.*time)/i.test(lower)) {
          return "transfer_time_gap";
        }
        if (/(風險情報|肇事風險|cbi)/i.test(lower)) {
          return "junction_cbi";
        }
        if (/(人流|預測|predict|traveler)/i.test(lower)) {
          return "predict_traveler";
        }
        if (/(公車od|od服務效率)/i.test(lower)) {
          return "city_bus_od";
        }
        return "governance_general";

      case "ticket":
        if (/(段次|to1a|to1)/i.test(lower)) {
          return "ticket_section";
        }
        if (/(軌道|捷運|台鐵|高鐵)/i.test(lower)) {
          return "ticket_rail";
        }
        return "ticket_bus_od";

      case "safety":
        if (/(易肇事|路口排行|排行|熱點|rank)/i.test(lower)) {
          return "accident_rank";
        }
        if (/(a1|死亡)/i.test(lower)) {
          return "accident_a1";
        }
        if (/(a2|受傷)/i.test(lower)) {
          return "accident_a2";
        }
        if (/(a30|財損)/i.test(lower)) {
          return "accident_a30";
        }
        return "accident_general";

      case "tourism_weather":
        if (/(氣象|海象|航路|雷達)/i.test(lower)) {
          return "weather_marine";
        }
        return "tourism_attraction";

      default:
        return "search_all";
    }
  }

  /**
   * Layer 3: Extract entity parameters (City, Route, Restricted, Format).
   */
  private extractLayer3Entities(text: string): {
    city?: string;
    cityNameZh?: string;
    keyword?: string;
    restricted?: boolean;
    format?: string;
  } {
    let matchedCityEn: string | undefined;
    let matchedCityZh: string | undefined;
    let matchedCityKey: string | undefined;

    // 1. Detect City
    for (const [key, val] of Object.entries(CITY_MAP)) {
      if (text.includes(key)) {
        matchedCityEn = val.en;
        matchedCityZh = val.zh;
        matchedCityKey = key;
        break;
      }
    }

    // 2. Detect Restricted (0 = 免審核, 1 = 需審查)
    let restricted: boolean | undefined;
    if (/(免審核|公開|免費|open)/i.test(text)) {
      restricted = false;
    } else if (/(需審查|審核|機敏|專案申請|restricted)/i.test(text)) {
      restricted = true;
    }

    // 3. Detect Format
    let format: string | undefined;
    if (/(xml)/i.test(text)) format = "XML";
    else if (/(csv)/i.test(text)) format = "CSV";
    else if (/(json)/i.test(text)) format = "JSON";

    // 4. Clean Keyword (remove noise words and detected city)
    let cleanKeyword = text
      .replace(/(查詢|搜尋|我想看|有沒有|資料|api|資訊|請給我|tdx)/gi, "");

    if (matchedCityKey) {
      cleanKeyword = cleanKeyword.replace(new RegExp(matchedCityKey, "g"), "");
    }
    if (matchedCityZh) {
      cleanKeyword = cleanKeyword.replace(new RegExp(matchedCityZh, "g"), "");
    }
    cleanKeyword = cleanKeyword.replace(/^[市縣]/, "").trim();

    return {
      city: matchedCityEn,
      cityNameZh: matchedCityZh,
      keyword: cleanKeyword.length > 0 ? cleanKeyword : undefined,
      restricted,
      format
    };
  }
}
