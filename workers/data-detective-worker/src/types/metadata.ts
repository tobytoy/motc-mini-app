export interface ApiMetadataItem {
  id: string;
  name: string;
  desc: string;
  category: string;
  theme: string;
  domain: string;
  method: string;
  path: string;
  fullUrl: string;
  swaggerUrl: string;
  curlCmd: string;
  oasPath: string;
  restricted: boolean;
  updateFreq: string;
  supportOData: boolean;
  format: string;
  publishedDate?: string;
  isNew?: boolean;
  newBadge?: string;
  isHot?: boolean;
  hotBadge?: string;
}

export interface SearchFilters {
  query?: string;
  category?: string;
  theme?: string;
  domain?: string;
  city?: string;
  restricted?: boolean | null;
  hot?: boolean;
  new?: boolean;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  total: number;
  items: ApiMetadataItem[];
  appliedFilters: SearchFilters;
}
