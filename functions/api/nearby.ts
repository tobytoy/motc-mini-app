export interface Env {
  TDX_CLIENT_ID: string;
  TDX_CLIENT_SECRET: string;
  CWA_API_KEY?: string;
  GEMINI_API_KEY?: string;
  ENABLE_GEMINI_ADVICE?: string; // "true" | "false"
  TRANSPORT_DATA_SOURCE?: string; // "direct" | "mcp"
  TRANSPORT_MCP_BASE_URL?: string; // e.g. "https://transport-mcp.tobywang2021.workers.dev"
  TRANSPORT_MCP_API_KEY?: string;
}

export interface NearbyResponse {
  success: boolean;
  timestamp: string;
  location: {
    lat: number;
    lon: number;
    city: string;
    cityName: string;
  };
  weather: {
    condition: string;
    rainProbability: number;
    minTemp: string;
    maxTemp: string;
    comfort: string;
  };
  smartAdvice: {
    title: string;
    summary: string;
    detail: string;
    type: "bike" | "parking" | "bus" | "weather" | "general";
  };
  youbikes: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    distanceMeters: number;
    availableBikes: number;
    emptySpaces: number;
    totalCapacity: number;
    updateTime?: string;
  }>;
  parkingLots: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    distanceMeters: number;
    availableSpaces: number;
    totalSpaces: number;
    hourlyRate: string;
    description: string;
  }>;
  busStops: Array<{
    id: string;
    name: string;
    address: string;
    lat: number;
    lon: number;
    distanceMeters: number;
    routes: Array<{
      routeName: string;
      estimateMinutes: number | null;
      statusText: string;
      isArrivingSoon: boolean;
    }>;
  }>;
}


// ==========================================
// 100-Meter Grid Snapped In-Memory Cache
// ==========================================
export interface GridCacheEntry {
  payload: NearbyResponse;
  expiresAt: number;
  source: string;
}

const gridCache = new Map<string, GridCacheEntry>();
const GRID_CACHE_TTL_MS = 25_000; // 25 seconds dynamic TTL
const MAX_GRID_ENTRIES = 300;

export function getGridCacheStats(): { cachedEntries: number; ttlSeconds: number } {
  return {
    cachedEntries: gridCache.size,
    ttlSeconds: Math.round(GRID_CACHE_TTL_MS / 1000),
  };
}

async function fetchFromTransportMcp(
  baseUrl: string,
  apiKey: string | undefined,
  lat: number,
  lon: number,
  radius: number
): Promise<{
  youbikes?: NearbyResponse["youbikes"];
  parkingLots?: NearbyResponse["parkingLots"];
  busStops?: NearbyResponse["busStops"];
} | null> {
  try {
    const url = `${baseUrl.replace(/\/+$/, "")}/api/transport/context`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        latitude: lat,
        longitude: lon,
        radius_meters: radius,
      }),
      signal: AbortSignal.timeout(3000),
    });

    if (!resp.ok) {
      console.warn("[MCP] Transport MCP returned status:", resp.status);
      return null;
    }

    const data = (await resp.json()) as {
      context?: {
        nearbyTransport?: {
          youbike?: Array<{
            id?: string;
            name: string;
            latitude?: number;
            longitude?: number;
            distanceMeters?: number;
            availableBikes?: number;
            emptySpaces?: number;
            totalSpaces?: number;
            address?: string;
          }>;
          parking?: Array<{
            id?: string;
            name: string;
            latitude?: number;
            longitude?: number;
            distanceMeters?: number;
            availableSpaces?: number;
            totalSpaces?: number;
            hourlyRate?: string;
            address?: string;
          }>;
          bus?: Array<{
            id?: string;
            name: string;
            latitude?: number;
            longitude?: number;
            distanceMeters?: number;
            routes?: Array<{
              routeName: string;
              estimateMinutes?: number | null;
              statusText?: string;
              isArrivingSoon?: boolean;
            }>;
            address?: string;
          }>;
        };
      };
    };

    const nt = data.context?.nearbyTransport;
    if (!nt) return null;

    return {
      youbikes: nt.youbike?.map((b) => ({
        id: b.id || b.name,
        name: b.name.replace(/^YouBike2\.0_/, ""),
        address: b.address || "",
        lat: b.latitude ?? lat,
        lon: b.longitude ?? lon,
        distanceMeters: b.distanceMeters ?? calculateDistanceMeters(lat, lon, b.latitude ?? lat, b.longitude ?? lon),
        availableBikes: b.availableBikes ?? 0,
        emptySpaces: b.emptySpaces ?? 0,
        totalCapacity: b.totalSpaces ?? 0,
      })),
      parkingLots: nt.parking?.map((p) => ({
        id: p.id || p.name,
        name: p.name,
        address: p.address || "",
        lat: p.latitude ?? lat,
        lon: p.longitude ?? lon,
        distanceMeters: p.distanceMeters ?? calculateDistanceMeters(lat, lon, p.latitude ?? lat, p.longitude ?? lon),
        availableSpaces: p.availableSpaces ?? 0,
        totalSpaces: p.totalSpaces ?? 0,
        hourlyRate: p.hourlyRate || "依現場公告",
        description: p.address || "路外停車場",
      })),
      busStops: nt.bus?.map((s) => ({
        id: s.id || s.name,
        name: s.name,
        address: s.address || "",
        lat: s.latitude ?? lat,
        lon: s.longitude ?? lon,
        distanceMeters: s.distanceMeters ?? calculateDistanceMeters(lat, lon, s.latitude ?? lat, s.longitude ?? lon),
        routes: (s.routes || []).map((r) => ({
          routeName: r.routeName,
          estimateMinutes: r.estimateMinutes ?? null,
          statusText: r.statusText || "未發車",
          isArrivingSoon: r.isArrivingSoon ?? false,
        })),
      })),
    };
  } catch (err) {
    console.warn("[MCP] Failed to fetch from transport-mcp, fallback to direct TDX:", err);
    return null;
  }
}
// In-memory token cache in worker instance
let cachedTdxToken: { token: string; expiresAt: number } | null = null;

async function getTdxToken(clientId: string, clientSecret: string): Promise<string> {
  const now = Date.now();
  if (cachedTdxToken && cachedTdxToken.expiresAt > now + 60_000) {
    return cachedTdxToken.token;
  }

  const tokenUrl = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Failed to obtain TDX token: ${resp.status} ${errText}`);
  }

  const data = (await resp.json()) as { access_token: string; expires_in: number };
  cachedTdxToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 86400) * 1000,
  };

  return cachedTdxToken.token;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function resolveCity(lat: number, lon: number): { tdxCity: string; cwaLocation: string } {
  // Taipei & New Taipei bounding box
  if (lat >= 24.95 && lat <= 25.25 && lon >= 121.45 && lon <= 121.65) {
    return { tdxCity: "Taipei", cwaLocation: "臺北市" };
  }
  if (lat >= 24.80 && lat <= 25.30 && lon >= 121.20 && lon <= 121.90) {
    return { tdxCity: "NewTaipei", cwaLocation: "新北市" };
  }
  // Taoyuan
  if (lat >= 24.80 && lat <= 25.15 && lon >= 121.00 && lon <= 121.40) {
    return { tdxCity: "Taoyuan", cwaLocation: "桃園市" };
  }
  // Taichung
  if (lat >= 24.00 && lat <= 24.45 && lon >= 120.40 && lon <= 120.95) {
    return { tdxCity: "Taichung", cwaLocation: "臺中市" };
  }
  // Tainan
  if (lat >= 22.85 && lat <= 23.40 && lon >= 120.00 && lon <= 120.55) {
    return { tdxCity: "Tainan", cwaLocation: "臺南市" };
  }
  // Kaohsiung
  if (lat >= 22.45 && lat <= 23.00 && lon >= 120.15 && lon <= 120.65) {
    return { tdxCity: "Kaohsiung", cwaLocation: "高雄市" };
  }

  // Default to Taipei
  return { tdxCity: "Taipei", cwaLocation: "臺北市" };
}

async function fetchYouBike(
  token: string,
  city: string,
  lat: number,
  lon: number,
  radius: number
) {
  try {
    const stationUrl = `https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/${city}?$spatialFilter=nearby(${lat},${lon},${radius})&$top=10&$format=JSON`;
    const stationResp = await fetch(stationUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!stationResp.ok) {
      console.warn(`[TDX] Bike station query returned ${stationResp.status}`);
      return [];
    }

    const stations = (await stationResp.json()) as Array<{
      StationUID: string;
      StationID: string;
      StationName?: { Zh_tw?: string };
      StationAddress?: { Zh_tw?: string };
      StationPosition?: { PositionLat?: number; PositionLon?: number };
      BikesCapacity?: number;
      UpdateTime?: string;
    }>;

    if (!stations || stations.length === 0) {
      return [];
    }

    // Top station UIDs for availability
    const uids = stations.map((s) => s.StationUID).filter(Boolean);
    const filterParts = uids.map((id) => `StationUID eq %27${encodeURIComponent(id)}%27`).join(" or ");
    const availUrl = `https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/${city}?$filter=${filterParts}&$format=JSON`;

    let availMap = new Map<string, { rent: number; returnSpace: number; updateTime?: string }>();
    try {
      const availResp = await fetch(availUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (availResp.ok) {
        const availList = (await availResp.json()) as Array<{
          StationUID: string;
          AvailableRentBikes?: number;
          AvailableReturnBikes?: number;
          UpdateTime?: string;
        }>;
        for (const item of availList) {
          availMap.set(item.StationUID, {
            rent: item.AvailableRentBikes ?? 0,
            returnSpace: item.AvailableReturnBikes ?? 0,
            updateTime: item.UpdateTime,
          });
        }
      }
    } catch (e) {
      console.warn("[TDX] Bike availability fetch error:", e);
    }

    const results = stations.map((s) => {
      const sLat = s.StationPosition?.PositionLat ?? lat;
      const sLon = s.StationPosition?.PositionLon ?? lon;
      const dist = calculateDistanceMeters(lat, lon, sLat, sLon);
      const avail = availMap.get(s.StationUID);

      return {
        id: s.StationUID,
        name: (s.StationName?.Zh_tw ?? "YouBike 站點").replace(/^YouBike2\.0_/, ""),
        address: s.StationAddress?.Zh_tw ?? "",
        lat: sLat,
        lon: sLon,
        distanceMeters: dist,
        availableBikes: avail?.rent ?? 0,
        emptySpaces: avail?.returnSpace ?? 0,
        totalCapacity: s.BikesCapacity ?? 0,
        updateTime: avail?.updateTime || s.UpdateTime,
      };
    });

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results.slice(0, 6);
  } catch (err) {
    console.error("[TDX] fetchYouBike error:", err);
    return [];
  }
}

async function fetchParking(
  token: string,
  city: string,
  lat: number,
  lon: number,
  radius: number
) {
  try {
    const carparkUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/CarPark/City/${city}?$spatialFilter=nearby(${lat},${lon},${radius})&$top=10&$format=JSON`;
    const carparkResp = await fetch(carparkUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!carparkResp.ok) {
      console.warn(`[TDX] CarPark query returned ${carparkResp.status}`);
      return [];
    }

    const carparkData = (await carparkResp.json()) as {
      CarParks?: Array<{
        CarParkID: string;
        CarParkName?: { Zh_tw?: string };
        Description?: string;
        Address?: string;
        CarParkPosition?: { PositionLat?: number; PositionLon?: number };
        TotalSpaces?: number;
      }>;
    };

    const carParks = carparkData?.CarParks ?? [];
    if (carParks.length === 0) {
      return [];
    }

    // Top CarParkIDs for availability
    const ids = carParks.map((p) => p.CarParkID).filter(Boolean);
    const filterParts = ids.map((id) => `CarParkID eq %27${encodeURIComponent(id)}%27`).join(" or ");
    const availUrl = `https://tdx.transportdata.tw/api/basic/v1/Parking/OffStreet/ParkingAvailability/City/${city}?$filter=${filterParts}&$format=JSON`;

    let availMap = new Map<string, { total: number; avail: number }>();
    try {
      const availResp = await fetch(availUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (availResp.ok) {
        const availJson = (await availResp.json()) as {
          ParkingAvailabilities?: Array<{
            CarParkID: string;
            TotalSpaces?: number;
            AvailableSpaces?: number;
          }>;
        };
        for (const item of availJson.ParkingAvailabilities ?? []) {
          availMap.set(item.CarParkID, {
            total: item.TotalSpaces ?? 0,
            avail: item.AvailableSpaces ?? 0,
          });
        }
      }
    } catch (e) {
      console.warn("[TDX] Parking availability fetch error:", e);
    }

    const results = carParks.map((p) => {
      const pLat = p.CarParkPosition?.PositionLat ?? lat;
      const pLon = p.CarParkPosition?.PositionLon ?? lon;
      const dist = calculateDistanceMeters(lat, lon, pLat, pLon);
      const avail = availMap.get(p.CarParkID);

      // Extract hourly rate estimate from description if possible
      let hourlyRate = "依現場公告";
      const desc = p.Description || "";
      const match = desc.match(/(\d+)\s*元\s*\/\s*(?:時|小時)/);
      if (match) {
        hourlyRate = `${match[1]} 元/時`;
      } else if (desc.includes("計時")) {
        hourlyRate = "計時收費";
      }

      return {
        id: p.CarParkID,
        name: p.CarParkName?.Zh_tw ?? "路外停車場",
        address: p.Address ?? "",
        lat: pLat,
        lon: pLon,
        distanceMeters: dist,
        availableSpaces: avail ? avail.avail : (p.TotalSpaces ? Math.max(0, Math.floor(p.TotalSpaces * 0.3)) : 0),
        totalSpaces: avail?.total || p.TotalSpaces || 0,
        hourlyRate,
        description: p.Description || "公有/民營路外停車場",
      };
    });

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results.slice(0, 6);
  } catch (err) {
    console.error("[TDX] fetchParking error:", err);
    return [];
  }
}

async function fetchNearbyBusStops(
  token: string,
  city: string,
  lat: number,
  lon: number,
  radius: number
) {
  try {
    const stopUrl = `https://tdx.transportdata.tw/api/basic/v2/Bus/Stop/City/${city}?$spatialFilter=nearby(${lat},${lon},${radius})&$top=8&$format=JSON`;
    const stopResp = await fetch(stopUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!stopResp.ok) {
      console.warn(`[TDX] Bus stop query returned ${stopResp.status}`);
      return [];
    }

    const stops = (await stopResp.json()) as Array<{
      StopUID: string;
      StopID: string;
      StopName?: { Zh_tw?: string };
      StopAddress?: string;
      StopPosition?: { PositionLat?: number; PositionLon?: number };
    }>;

    if (!stops || stops.length === 0) return [];

    const uids = stops.map((s) => s.StopUID).filter(Boolean);
    const filterParts = uids.map((id) => `StopUID eq %27${encodeURIComponent(id)}%27`).join(" or ");
    const etaUrl = `https://tdx.transportdata.tw/api/basic/v2/Bus/EstimatedTimeOfArrival/City/${city}?$filter=${filterParts}&$top=40&$format=JSON`;

    const etaMap = new Map<
      string,
      Array<{
        routeName: string;
        estimateMinutes: number | null;
        statusText: string;
        isArrivingSoon: boolean;
      }>
    >();

    try {
      const etaResp = await fetch(etaUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (etaResp.ok) {
        const etas = (await etaResp.json()) as Array<{
          StopUID: string;
          RouteName?: { Zh_tw?: string };
          EstimateTime?: number;
          StopStatus?: number;
        }>;

        for (const item of etas) {
          const rName = item.RouteName?.Zh_tw || "公車";
          let estimateMinutes: number | null = null;
          let statusText = "未發車";
          let isArrivingSoon = false;

          if (item.EstimateTime != null) {
            const mins = Math.round(item.EstimateTime / 60);
            estimateMinutes = mins;
            if (mins <= 1) {
              statusText = "即將進站";
              isArrivingSoon = true;
            } else {
              statusText = `約 ${mins} 分鐘`;
              isArrivingSoon = mins <= 3;
            }
          } else {
            const statusMap: Record<number, string> = {
              1: "尚未發車",
              2: "交管不停",
              3: "末班已過",
              4: "今日未營運",
            };
            statusText = statusMap[item.StopStatus ?? 0] || "尚未發車";
          }

          if (!etaMap.has(item.StopUID)) {
            etaMap.set(item.StopUID, []);
          }
          etaMap.get(item.StopUID)!.push({
            routeName: rName,
            estimateMinutes,
            statusText,
            isArrivingSoon,
          });
        }
      }
    } catch (e) {
      console.warn("[TDX] Bus ETA query error:", e);
    }

    const results = stops.map((s) => {
      const sLat = s.StopPosition?.PositionLat ?? lat;
      const sLon = s.StopPosition?.PositionLon ?? lon;
      const dist = calculateDistanceMeters(lat, lon, sLat, sLon);
      const rawRoutes = etaMap.get(s.StopUID) || [];

      // Sort routes: arriving soon first, then by minutes, then undispatched
      const sortedRoutes = [...rawRoutes].sort((a, b) => {
        if (a.estimateMinutes != null && b.estimateMinutes != null) {
          return a.estimateMinutes - b.estimateMinutes;
        }
        if (a.estimateMinutes != null) return -1;
        if (b.estimateMinutes != null) return 1;
        return 0;
      });

      return {
        id: s.StopUID,
        name: s.StopName?.Zh_tw ?? "公車站牌",
        address: s.StopAddress || "",
        lat: sLat,
        lon: sLon,
        distanceMeters: dist,
        routes: sortedRoutes.slice(0, 6),
      };
    });

    results.sort((a, b) => a.distanceMeters - b.distanceMeters);
    return results.slice(0, 6);
  } catch (err) {
    console.error("[TDX] fetchNearbyBusStops error:", err);
    return [];
  }
}

async function fetchWeather(cwaKey: string | undefined, locationName: string) {
  if (!cwaKey) {
    return {
      condition: "多雲時晴",
      rainProbability: 20,
      minTemp: "26",
      maxTemp: "31",
      comfort: "舒適",
    };
  }

  try {
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${cwaKey}&locationName=${encodeURIComponent(
      locationName
    )}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      return {
        condition: "多雲時晴",
        rainProbability: 20,
        minTemp: "26",
        maxTemp: "31",
        comfort: "舒適",
      };
    }

    const data = (await resp.json()) as {
      records?: {
        location?: Array<{
          weatherElement?: Array<{
            elementName: string;
            time?: Array<{ parameter?: { parameterName?: string } }>;
          }>;
        }>;
      };
    };

    const loc = data.records?.location?.[0];
    if (!loc || !loc.weatherElement) {
      return {
        condition: "多雲時晴",
        rainProbability: 20,
        minTemp: "26",
        maxTemp: "31",
        comfort: "舒適",
      };
    }

    const map = new Map<string, string>();
    for (const elem of loc.weatherElement) {
      const val = elem.time?.[0]?.parameter?.parameterName;
      if (val) map.set(elem.elementName, val);
    }

    return {
      condition: map.get("Wx") || "多雲時晴",
      rainProbability: parseInt(map.get("PoP") || "20", 10),
      minTemp: map.get("MinT") || "26",
      maxTemp: map.get("MaxT") || "31",
      comfort: map.get("CI") || "舒適",
    };
  } catch (err) {
    console.warn("[CWA] Weather fetch error:", err);
    return {
      condition: "多雲時晴",
      rainProbability: 20,
      minTemp: "26",
      maxTemp: "31",
      comfort: "舒適",
    };
  }
}

function generateSmartAdvice(
  weather: { condition: string; rainProbability: number },
  youbikes: Array<{ name: string; availableBikes: number; distanceMeters: number }>,
  parkingLots: Array<{ name: string; availableSpaces: number; distanceMeters: number; hourlyRate: string }>,
  busStops: Array<{ name: string; distanceMeters: number; routes: Array<{ routeName: string; estimateMinutes: number | null }> }>
): { title: string; summary: string; detail: string; type: "bike" | "parking" | "bus" | "weather" | "general" } {
  // 1. Rain alert
  if (weather.rainProbability >= 60) {
    // Check for nearby incoming bus
    const incomingBusStop = busStops.find((b) => b.routes.some((r) => r.estimateMinutes != null && r.estimateMinutes <= 6));
    if (incomingBusStop) {
      const quickRoute = incomingBusStop.routes.find((r) => r.estimateMinutes != null && r.estimateMinutes <= 6);
      const minsText = quickRoute?.estimateMinutes != null ? (quickRoute.estimateMinutes <= 1 ? "即將進站" : `約 ${quickRoute.estimateMinutes} 分鐘進站`) : "即將抵達";
      return {
        title: "🚌 雨天推薦搭乘公車",
        summary: `降雨機率 ${weather.rainProbability}%，鄰近站牌「${incomingBusStop.name}」已有班次`,
        detail: `公車路線【${quickRoute?.routeName}】預估 ${minsText}（站牌距您 ${incomingBusStop.distanceMeters} 公尺），雨天搭乘舒適又免淋雨！`,
        type: "bus",
      };
    }

    const park = parkingLots.find((p) => p.availableSpaces > 5);
    return {
      title: "☔ 雨天出行提醒",
      summary: `目前降雨機率高達 ${weather.rainProbability}%，天候為「${weather.condition}」`,
      detail: park
        ? `路面濕滑不建議騎乘單車。建議開車前往「${park.name}」（距 ${park.distanceMeters}m，尚餘 ${park.availableSpaces} 格車位）或搭乘捷運公車。`
        : "路面濕滑不建議騎乘單車。建議優先搭乘公車或捷運等大眾運輸工具。",
      type: "weather",
    };
  }

  // 2. Good weather & close YouBike available
  const nearestBike = youbikes[0];
  if (nearestBike && nearestBike.availableBikes >= 3 && nearestBike.distanceMeters <= 500) {
    const mins = Math.max(1, Math.round(nearestBike.distanceMeters / 80));
    return {
      title: "🚲 推薦騎乘 YouBike",
      summary: `最近站點「${nearestBike.name}」步行約 ${mins} 分鐘，車位充裕`,
      detail: `目前尚有 ${nearestBike.availableBikes} 台車可借（距您約 ${nearestBike.distanceMeters} 公尺），天候「${weather.condition}」，適合綠色低碳出行！`,
      type: "bike",
    };
  }

  // 3. Close YouBike has zero bikes
  if (nearestBike && nearestBike.availableBikes === 0 && youbikes.length > 1) {
    const altBike = youbikes.find((b) => b.availableBikes > 0);
    if (altBike) {
      const mins = Math.max(1, Math.round(altBike.distanceMeters / 80));
      return {
        title: "⚠️ 最近站點已無車輛",
        summary: `「${nearestBike.name}」目前無可借車輛，建議前往備選站點`,
        detail: `建議步行約 ${mins} 分鐘至「${altBike.name}」（距 ${altBike.distanceMeters} 公尺），尚有 ${altBike.availableBikes} 台車可借。`,
        type: "bike",
      };
    }
  }

  // 4. Driving & Parking
  const goodPark = parkingLots.find((p) => p.availableSpaces > 10);
  if (goodPark) {
    return {
      title: "🅿 停車位充裕",
      summary: `鄰近「${goodPark.name}」車位充足（${goodPark.hourlyRate}）`,
      detail: `距離約 ${goodPark.distanceMeters} 公尺，目前剩餘 ${goodPark.availableSpaces} 格車位，適合快速泊車。`,
      type: "parking",
    };
  }

  return {
    title: "💡 出行即時助手",
    summary: "周邊交通資訊已即時更新",
    detail: "點選下方站點或停車場可查看詳細資訊並開啟一鍵 Google Maps 路線導航。",
    type: "general",
  };
}

async function generateGeminiAdvice(
  apiKey: string,
  weather: { condition: string; rainProbability: number; minTemp: string; maxTemp: string },
  youbikes: Array<{ name: string; availableBikes: number; distanceMeters: number }>,
  parkingLots: Array<{ name: string; availableSpaces: number; distanceMeters: number }>,
  busStops: Array<{ name: string; distanceMeters: number; routes: Array<{ routeName: string; statusText: string }> }>
): Promise<{ title: string; summary: string; detail: string; type: "bike" | "parking" | "bus" | "weather" | "general" } | null> {
  const model = "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const nearestBike = youbikes[0];
  const nearestPark = parkingLots[0];
  const nearestBus = busStops[0];
  const quickBusRoute = nearestBus?.routes[0];

  const prompt = `你是一位台灣在地 LINE Mini App 交通出行助手。請根據以下現場即時數據：
- 當前天候：${weather.condition}，氣溫 ${weather.minTemp}~${weather.maxTemp}°C，降雨機率 ${weather.rainProbability}%
- 最近 YouBike：${nearestBike ? `${nearestBike.name} (距 ${nearestBike.distanceMeters}m，可借 ${nearestBike.availableBikes} 台)` : "無近距站點"}
- 最近停車場：${nearestPark ? `${nearestPark.name} (距 ${nearestPark.distanceMeters}m，剩餘 ${nearestPark.availableSpaces} 格)` : "無"}
- 最近公車：${nearestBus ? `${nearestBus.name} (距 ${nearestBus.distanceMeters}m${quickBusRoute ? `，${quickBusRoute.routeName} ${quickBusRoute.statusText}` : ""})` : "無"}

請根據天候與運具狀況，產生 1 組貼心的出行建議。直接輸出 JSON 格式（不得包含 markdown 標籤或反引號）：
{"title":"短標題帶emoji","summary":"15字以內摘要","detail":"40字以內具體出行建議","type":"bike"或"parking"或"bus"或"weather"或"general"}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      console.warn("[GeminiAdvice] HTTP Error:", resp.status);
      return null;
    }

    const data = (await resp.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!text) return null;

    const cleanJson = text.replace(/^```json\s*/i, "").replace(/```$/g, "").trim();
    const parsed = JSON.parse(cleanJson) as {
      title?: string;
      summary?: string;
      detail?: string;
      type?: "bike" | "parking" | "bus" | "weather" | "general";
    };

    if (parsed.title && parsed.summary && parsed.detail) {
      return {
        title: parsed.title,
        summary: parsed.summary,
        detail: parsed.detail,
        type: parsed.type || "general",
      };
    }
    return null;
  } catch (err) {
    console.warn("[GeminiAdvice] Failed or timed out, fallback to rule engine:", err);
    return null;
  }
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // Default coordinates: Taipei Main Station
  const latParam = url.searchParams.get("lat");
  const lonParam = url.searchParams.get("lon");
  const radiusParam = url.searchParams.get("radius");

  const lat = latParam ? parseFloat(latParam) : 25.0478;
  const lon = lonParam ? parseFloat(lonParam) : 121.5170;
  const radius = radiusParam ? parseInt(radiusParam, 10) : 1000;
  if (isNaN(lat) || isNaN(lon)) {
    return new Response(JSON.stringify({ error: "Invalid lat/lon parameters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 100-meter grid coordinates snapping (~0.001 deg ~= 110m)
  const gridLat = Math.round(lat * 1000) / 1000;
  const gridLon = Math.round(lon * 1000) / 1000;
  const cacheKey = `${gridLat}:${gridLon}:${radius}`;

  // Check 100m Grid Cache
  const cached = gridCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return new Response(JSON.stringify(cached.payload), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=15",
        "X-Cache": "HIT-GRID",
        "X-Grid-Coords": `${gridLat},${gridLon}`,
        "X-Data-Source": cached.source,
      },
    });
  }

  const clientId = env.TDX_CLIENT_ID;
  const clientSecret = env.TDX_CLIENT_SECRET;
  const cwaKey = env.CWA_API_KEY;

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({
        error: "Missing TDX_CLIENT_ID or TDX_CLIENT_SECRET in environment variables",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { tdxCity, cwaLocation } = resolveCity(lat, lon);

  try {
    const token = await getTdxToken(clientId, clientSecret);

    const dataSource = (env.TRANSPORT_DATA_SOURCE || "direct").toLowerCase();
    let youbikes: NearbyResponse["youbikes"] = [];
    let parkingLots: NearbyResponse["parkingLots"] = [];
    let busStops: NearbyResponse["busStops"] = [];
    let resolvedSource = "direct-tdx";

    if (dataSource === "mcp" && env.TRANSPORT_MCP_BASE_URL) {
      const mcpRes = await fetchFromTransportMcp(
        env.TRANSPORT_MCP_BASE_URL,
        env.TRANSPORT_MCP_API_KEY,
        lat,
        lon,
        radius
      );
      if (mcpRes) {
        youbikes = mcpRes.youbikes || [];
        parkingLots = mcpRes.parkingLots || [];
        busStops = mcpRes.busStops || [];
        resolvedSource = "transport-mcp";
      }
    }

    // Direct TDX mode or MCP fallback
    if (resolvedSource === "direct-tdx") {
      const [bList, pList, bsList] = await Promise.all([
        fetchYouBike(token, tdxCity, lat, lon, radius),
        fetchParking(token, tdxCity, lat, lon, radius),
        fetchNearbyBusStops(token, tdxCity, lat, lon, radius),
      ]);
      youbikes = bList;
      parkingLots = pList;
      busStops = bsList;
    }

    const weather = await fetchWeather(cwaKey, cwaLocation);
    const enableGemini = env.ENABLE_GEMINI_ADVICE === "true" || env.ENABLE_GEMINI_ADVICE === "1";
    let smartAdvice: NearbyResponse["smartAdvice"] | null = null;

    if (enableGemini && env.GEMINI_API_KEY) {
      smartAdvice = await generateGeminiAdvice(env.GEMINI_API_KEY, weather, youbikes, parkingLots, busStops);
    }

    // Fallback to Rule-based engine if Gemini disabled or failed
    if (!smartAdvice) {
      smartAdvice = generateSmartAdvice(weather, youbikes, parkingLots, busStops);
    }

    const payload: NearbyResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      location: {
        lat,
        lon,
        city: tdxCity,
        cityName: cwaLocation,
      },
      weather,
      smartAdvice,
      youbikes,
      parkingLots,
      busStops,
    };

    // Save to 100m grid cache
    if (gridCache.size >= MAX_GRID_ENTRIES) {
      const oldestKey = gridCache.keys().next().value;
      if (oldestKey) gridCache.delete(oldestKey);
    }
    gridCache.set(cacheKey, {
      payload,
      expiresAt: Date.now() + GRID_CACHE_TTL_MS,
      source: resolvedSource,
    });

    return new Response(JSON.stringify(payload), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=15",
        "X-Cache": "MISS",
        "X-Grid-Coords": `${gridLat},${gridLon}`,
        "X-Data-Source": resolvedSource,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch transport data";
    console.error("[/api/nearby] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
