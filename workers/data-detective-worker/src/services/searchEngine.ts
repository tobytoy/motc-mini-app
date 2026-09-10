import metadataData from "../data/apiMetadata.json";
import type { ApiMetadataItem, SearchFilters, SearchResult } from "../types/metadata";

const ALL_APIS: ApiMetadataItem[] = metadataData as ApiMetadataItem[];

export const CITY_MAP: Record<string, { en: string; zh: string; code: string }> = {
  "台北": { en: "Taipei", zh: "臺北市", code: "TPE" },
  "臺北": { en: "Taipei", zh: "臺北市", code: "TPE" },
  "新北": { en: "NewTaipei", zh: "新北市", code: "NWT" },
  "桃園": { en: "Taoyuan", zh: "桃園市", code: "TAO" },
  "台中": { en: "Taichung", zh: "臺中市", code: "TXG" },
  "臺中": { en: "Taichung", zh: "臺中市", code: "TXG" },
  "台南": { en: "Tainan", zh: "臺南市", code: "TNN" },
  "臺南": { en: "Tainan", zh: "臺南市", code: "TNN" },
  "高雄": { en: "Kaohsiung", zh: "高雄市", code: "KHH" },
  "基隆": { en: "Keelung", zh: "基隆市", code: "KEE" },
  "新竹市": { en: "Hsinchu", zh: "新竹市", code: "HSZ" },
  "新竹縣": { en: "HsinchuCounty", zh: "新竹縣", code: "HSQ" },
  "苗栗": { en: "MiaoliCounty", zh: "苗栗縣", code: "MIA" },
  "彰化": { en: "ChanghuaCounty", zh: "彰化縣", code: "CHA" },
  "南投": { en: "NantouCounty", zh: "南投縣", code: "NAN" },
  "雲林": { en: "YunlinCounty", zh: "雲林縣", code: "YUN" },
  "嘉義市": { en: "Chiayi", zh: "嘉義市", code: "CYI" },
  "嘉義縣": { en: "ChiayiCounty", zh: "嘉義縣", code: "CYQ" },
  "屏東": { en: "PingtungCounty", zh: "屏東縣", code: "PIF" },
  "宜蘭": { en: "YilanCounty", zh: "宜蘭縣", code: "ILA" },
  "花蓮": { en: "HualienCounty", zh: "花蓮縣", code: "HUA" },
  "台東": { en: "TaitungCounty", zh: "臺東縣", code: "TTT" },
  "臺東": { en: "TaitungCounty", zh: "臺東縣", code: "TTT" },
  "澎湖": { en: "PenghuCounty", zh: "澎湖縣", code: "PEN" },
  "金門": { en: "KinmenCounty", zh: "金門縣", code: "KIN" },
  "連江": { en: "LienchiangCounty", zh: "連江縣", code: "LIE" },
  "馬祖": { en: "LienchiangCounty", zh: "連江縣", code: "LIE" }
};
export class ApiSearchEngine {
  private apis: ApiMetadataItem[];

  constructor(apis: ApiMetadataItem[] = ALL_APIS) {
    this.apis = apis;
  }

  /**
   * Search and filter APIs with relevance scoring.
   */
  search(filters: SearchFilters): SearchResult {
    const rawQuery = (filters.query || "").trim().toLowerCase();
    const targetCity = filters.city;
    const targetCategory = filters.category;
    const targetDomain = filters.domain;
    const restrictedFilter = filters.restricted;
    const limit = Math.max(1, Math.min(filters.limit || 20, 100));
    const offset = Math.max(0, filters.offset || 0);

    // Filter items
    const matched: Array<{ item: ApiMetadataItem; score: number }> = [];

    for (const item of this.apis) {
      // Special filters: Hot or New
      if (filters.hot && !item.isHot) continue;
      if (filters.new && !item.isNew) continue;

      // 1. Category filter
      if (targetCategory && item.category !== targetCategory) {
        continue;
      }

      // 2. Domain filter
      if (targetDomain && item.domain !== targetDomain) {
        continue;
      }

      // 3. Restricted filter
      if (restrictedFilter !== undefined && restrictedFilter !== null) {
        if (item.restricted !== restrictedFilter) {
          continue;
        }
      }
      // 4. City filter (check name, desc, or path)
      if (targetCity) {
        const cityLower = targetCity.toLowerCase();
        const cityInfo = Object.values(CITY_MAP).find(
          (c) => c.en.toLowerCase() === cityLower || c.code.toLowerCase() === cityLower || c.zh.includes(targetCity)
        );

        const cityMatch =
          item.path.toLowerCase().includes(cityLower) ||
          item.name.toLowerCase().includes(cityLower) ||
          item.desc.toLowerCase().includes(cityLower) ||
          (cityInfo && (
            item.path.includes(`/${cityInfo.code}/`) ||
            item.path.endsWith(`/${cityInfo.code}`) ||
            item.name.includes(cityInfo.code) ||
            item.name.includes(cityInfo.zh) ||
            item.name.replace(/台/g, "臺").includes(cityInfo.zh)
          ));

        if (!cityMatch) {
          continue;
        }
      }

      // 5. Query matching and scoring
      let score = 0;
      if (rawQuery.length > 0) {
        const queryTerms: string[] = [];
        for (const rawTerm of rawQuery.split(/\s+/).filter(Boolean)) {
          queryTerms.push(rawTerm);
          // Deconstruct 4+ char compound words into 2-char tokens (e.g. 公車站牌 -> 公車, 站牌)
          if (rawTerm.length >= 4) {
            queryTerms.push(rawTerm.slice(0, 2));
            queryTerms.push(rawTerm.slice(2));
          }
        }

        for (const term of queryTerms) {
          let termMatched = false;
          const nameLower = item.name.toLowerCase();
          const descLower = item.desc.toLowerCase();
          const pathLower = item.path.toLowerCase();
          const themeLower = item.theme.toLowerCase();
          const domainLower = item.domain.toLowerCase();

          // Normalized versions for 台/臺 interchangeability
          const nameNorm = nameLower.replace(/台/g, "臺");
          const termNorm = term.replace(/台/g, "臺");
          const subTerm = term.length >= 3 && /(場|站|路|線)$/.test(term) ? term.slice(0, -1) : null;
          const subTermNorm = subTerm ? subTerm.replace(/台/g, "臺") : null;

          if (nameLower.includes(term) || nameNorm.includes(termNorm)) {
            score += 25;
            termMatched = true;
          } else if (subTerm && nameLower.includes(subTerm)) {
            score += 10;
            termMatched = true;
          }

          if (descLower.includes(term)) {
            score += 10;
            termMatched = true;
          } else if (subTerm && descLower.includes(subTerm)) {
            score += 5;
            termMatched = true;
          }

          if (pathLower.includes(term)) {
            score += 12;
            termMatched = true;
          }

          if (themeLower.includes(term) || domainLower.includes(term)) {
            score += 8;
            termMatched = true;
          } else if (subTerm && (themeLower.includes(subTerm) || domainLower.includes(subTerm))) {
            score += 4;
            termMatched = true;
          }

        }

        if (score === 0) {
          continue;
        }
      } else {
        score = 1; // Default match
      }

      matched.push({ item, score });
    }

    // Sort by score descending, then by name
    matched.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));

    const total = matched.length;
    const paginated = matched.slice(offset, offset + limit).map((m) => m.item);

    return {
      total,
      items: paginated,
      appliedFilters: { ...filters, limit, offset }
    };
  }

  /**
   * Get total counts by category and theme.
   */
  getStatistics(): {
    total: number;
    categories: Record<string, number>;
    themes: Record<string, number>;
    restrictedCount: number;
    publicCount: number;
  } {
    const categories: Record<string, number> = {};
    const themes: Record<string, number> = {};
    let restrictedCount = 0;
    let publicCount = 0;

    for (const item of this.apis) {
      categories[item.category] = (categories[item.category] || 0) + 1;
      themes[item.theme] = (themes[item.theme] || 0) + 1;
      if (item.restricted) {
        restrictedCount++;
      } else {
        publicCount++;
      }
    }

    return {
      total: this.apis.length,
      categories,
      themes,
      restrictedCount,
      publicCount
    };
  }

  /**
   * Get API details by ServiceDetailId.
   */
  getById(id: string): ApiMetadataItem | null {
    return this.apis.find((a) => a.id === id) || null;
  }
}
