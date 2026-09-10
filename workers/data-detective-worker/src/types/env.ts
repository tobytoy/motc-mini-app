export interface Env {
  ENVIRONMENT?: string;
  LINE_CHANNEL_ID_DEV: string;
  LINE_CHANNEL_ID_REVIEW: string;
  LINE_CHANNEL_ID_PUB: string;
  LINE_CHANNEL_SECRET_DEV?: string;
  LINE_CHANNEL_SECRET_REVIEW?: string;
  LINE_CHANNEL_SECRET_PUB?: string;
  LIFF_URL_DEV: string;
  LIFF_URL_REVIEW: string;
  LIFF_URL_PUB: string;
  TDX_BASIC_PORTAL_URL: string;
  MINI_APP_SEARCH_URL: string;
  GEMINI_API_KEY?: string;
}

export type DomainCategory =
  | "transport"
  | "parking"
  | "governance"
  | "ticket"
  | "safety"
  | "tourism_weather"
  | "general_search";

export interface MultiLayerNeedleResult {
  layer1Domain: DomainCategory;
  layer2Operation: string;
  layer3Entities: {
    city?: string;
    cityNameZh?: string;
    keyword?: string;
    restricted?: boolean;
    format?: string;
  };
  confidence: number;
  reasoning: string;
}
