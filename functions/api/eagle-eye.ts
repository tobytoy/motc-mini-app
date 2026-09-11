import hotspotsData from "../../src/data/hotspots.json";
import cctvData from "../../src/data/cctvData.json";

export interface Env {
  TDX_CLIENT_ID?: string;
  TDX_CLIENT_SECRET?: string;
  CWA_API_KEY?: string;
}

export interface HotspotItem {
  rank: number;
  city: string;
  roads: string;
  address: string;
  lat: number;
  lng: number;
  accidents: number;
  deaths: number;
  injuries: number;
  recent: number;
  score: number;
  tier: string;
}

export interface CCTVRecord {
  cctvId: string;
  roadId: string;
  roadName: string;
  locationName: string;
  longitude: number;
  latitude: number;
  videoUrl: string;
  snapshotUrl?: string;
  status: string;
  region: string;
  direction?: string;
  mileage?: string;
}

export interface LiveRoadEvent {
  id: string;
  title: string;
  description: string;
  eventType: number;
  eventTypeName: string;
  severity: number;
  severityName: string;
  blockedLanes: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  publishTime: string;
  roadName?: string;
  direction?: string;
}

// Haversine distance calculation in meters
function computeDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function parseWktPoint(posStr?: string): { lat: number; lon: number } | null {
  if (!posStr) return null;
  const match = posStr.match(/POINT\s*\(\s*([0-9.-]+)\s+([0-9.-]+)\s*\)/i);
  if (!match) return null;
  const lon = parseFloat(match[1]);
  const lat = parseFloat(match[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  return { lat, lon };
}

function getEventTypeName(type: number): string {
  switch (type) {
    case 1:
      return "交通事故";
    case 2:
      return "道路施工";
    case 3:
      return "交通壅塞";
    case 4:
      return "特殊管制";
    case 5:
      return "天候影響";
    case 6:
      return "天然災害";
    case 7:
      return "大型活動";
    default:
      return "路況警示";
  }
}

function getSeverityName(sev: number): string {
  switch (sev) {
    case 2:
      return "全線封閉";
    case 1:
      return "車道受阻";
    case 0:
      return "順暢提醒";
    default:
      return "注意減速";
  }
}

// In-memory token cache
let cachedTdxToken: { token: string; expiresAt: number } | null = null;

async function getTdxAccessToken(clientId?: string, clientSecret?: string): Promise<string | null> {
  if (!clientId || !clientSecret) return null;
  const now = Date.now();
  if (cachedTdxToken && cachedTdxToken.expiresAt > now + 60000) {
    return cachedTdxToken.token;
  }
  try {
    const params = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });
    const resp = await fetch("https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
      signal: AbortSignal.timeout(4000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { access_token: string; expires_in: number };
    cachedTdxToken = {
      token: data.access_token,
      expiresAt: now + (data.expires_in || 3600) * 1000,
    };
    return data.access_token;
  } catch (err) {
    console.warn("[TDX Auth] Token request failed:", err);
    return null;
  }
}

// Fetch live road events from TDX Freeway & Highway
async function fetchLiveRoadEvents(token: string | null, userLat: number, userLon: number, radiusMeters: number): Promise<LiveRoadEvent[]> {
  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) motc-mini-eagle-eye/1.0",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const events: LiveRoadEvent[] = [];
  const endpoints = [
    "https://tdx.transportdata.tw/api/basic/v1/Traffic/RoadEvent/LiveEvent/Freeway?$top=20&$format=JSON",
    "https://tdx.transportdata.tw/api/basic/v1/Traffic/RoadEvent/LiveEvent/Highway?$top=20&$format=JSON",
  ];

  await Promise.all(
    endpoints.map(async (url) => {
      try {
        const resp = await fetch(url, { headers, signal: AbortSignal.timeout(3500) });
        if (!resp.ok) return;
        const data = (await resp.json()) as {
          LiveEvents?: Array<{
            EventID: string;
            EventTitle: string;
            Description: string;
            EventType: number;
            Positions?: string;
            Impact?: { Severity?: number; BlockedLanes?: string };
            PublishTime: string;
            Location?: { FreeExpressHighway?: { Road?: string; Direction?: string } };
          }>;
        };
        const rawEvents = data.LiveEvents || [];
        for (const ev of rawEvents) {
          const pt = parseWktPoint(ev.Positions);
          if (!pt) continue;
          const dist = computeDistance(userLat, userLon, pt.lat, pt.lon);
          // Only include within 15km for live road incidents
          if (dist <= Math.max(radiusMeters, 15000)) {
            events.push({
              id: ev.EventID,
              title: ev.EventTitle || getEventTypeName(ev.EventType),
              description: ev.Description || "現場事件處理中，請小心行駛",
              eventType: ev.EventType,
              eventTypeName: getEventTypeName(ev.EventType),
              severity: ev.Impact?.Severity ?? 0,
              severityName: getSeverityName(ev.Impact?.Severity ?? 0),
              blockedLanes: ev.Impact?.BlockedLanes && ev.Impact.BlockedLanes !== "-1" ? ev.Impact.BlockedLanes : "無車道封閉",
              lat: pt.lat,
              lon: pt.lon,
              distanceMeters: dist,
              publishTime: ev.PublishTime,
              roadName: ev.Location?.FreeExpressHighway?.Road,
              direction: ev.Location?.FreeExpressHighway?.Direction,
            });
          }
        }
      } catch (err) {
        console.warn("[RoadEvents] Endpoint fetch error:", url, err);
      }
    })
  );

  return events.sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const latStr = url.searchParams.get("lat") || "25.0478";
  const lonStr = url.searchParams.get("lon") || "121.5170";
  const radiusStr = url.searchParams.get("radius") || "5000";

  const userLat = parseFloat(latStr);
  const userLon = parseFloat(lonStr);
  const radiusMeters = parseInt(radiusStr, 10) || 5000;

  // 1. Process 300 Danger Hotspots
  const allHotspots = (hotspotsData as HotspotItem[]).map((spot) => {
    const dist = computeDistance(userLat, userLon, spot.lat, spot.lng);
    let alertLevel: "danger" | "warning" | "caution" | "safe" = "safe";
    let defensiveTip = "保持行車車距，注意兩側盲區。";

    if (dist < 350) {
      alertLevel = "danger";
      defensiveTip = "🚨 即將進入高危路段！注意多向車流、轉彎內輪差與變換車道！";
    } else if (dist < 1000) {
      alertLevel = "warning";
      defensiveTip = "⚠️ 接近歷史事故集中熱點，減速慢行並確認左右號誌。";
    } else if (dist < 2500) {
      alertLevel = "caution";
      defensiveTip = "進入警戒路段範圍，請隨時保持行車間距。";
    }

    return {
      ...spot,
      distanceMeters: dist,
      alertLevel,
      defensiveTip,
    };
  });

  // Filter within radius (or fallback to closest 10 if outside radius)
  let nearbyHotspots = allHotspots.filter((s) => s.distanceMeters <= radiusMeters);
  if (nearbyHotspots.length === 0) {
    nearbyHotspots = allHotspots.slice(0, 10);
  }
  nearbyHotspots.sort((a, b) => a.distanceMeters - b.distanceMeters);

  // 2. Process CCTVs
  const allCCTVs = (cctvData as CCTVRecord[]).map((cctv) => {
    const dist = computeDistance(userLat, userLon, cctv.latitude, cctv.longitude);
    return {
      id: cctv.cctvId,
      name: cctv.roadName + (cctv.locationName && cctv.locationName !== cctv.roadName ? ` (${cctv.locationName})` : ""),
      roadName: cctv.roadName,
      locationName: cctv.locationName,
      lat: cctv.latitude,
      lon: cctv.longitude,
      distanceMeters: dist,
      videoUrl: cctv.videoUrl,
      snapshotUrl: cctv.snapshotUrl || cctv.videoUrl,
      status: cctv.status || "online",
      region: cctv.region,
      mileage: cctv.mileage,
    };
  });

  allCCTVs.sort((a, b) => a.distanceMeters - b.distanceMeters);
  const nearbyCCTVs = allCCTVs.slice(0, 8); // Top 8 closest cameras

  // 3. Process Live Road Events from TDX
  const token = await getTdxAccessToken(context.env.TDX_CLIENT_ID, context.env.TDX_CLIENT_SECRET);
  const liveEvents = await fetchLiveRoadEvents(token, userLat, userLon, radiusMeters);

  // 4. Determine Closest Hazard and Summary Alert
  const closestSpot = nearbyHotspots[0] || null;
  const closestLiveEvent = liveEvents[0] || null;

  let radarStatus: "danger" | "warning" | "safe" = "safe";
  let radarHeadline = "周邊道路目前大致安全順暢";
  let radarDetail = "方圓 300 公尺內無嚴重事故熱點或車道阻斷事件。";

  if (closestLiveEvent && closestLiveEvent.distanceMeters <= 500 && closestLiveEvent.severity >= 1) {
    radarStatus = "danger";
    radarHeadline = `🚨 前方 ${closestLiveEvent.distanceMeters}m 發生【${closestLiveEvent.title}】！`;
    radarDetail = `${closestLiveEvent.description} (${closestLiveEvent.blockedLanes})，請儘速減速或改道。`;
  } else if (closestSpot && closestSpot.distanceMeters <= 350) {
    radarStatus = "danger";
    radarHeadline = `🚨 距離易肇事點【${closestSpot.roads.split("；")[0] || closestSpot.roads}】僅 ${closestSpot.distanceMeters} 公尺！`;
    radarDetail = `歷史累計事故 ${closestSpot.accidents} 件 (死傷 ${closestSpot.deaths + (closestSpot.injuries || 0)} 人)，${closestSpot.defensiveTip}`;
  } else if (closestLiveEvent && closestLiveEvent.distanceMeters <= 1500) {
    radarStatus = "warning";
    radarHeadline = `⚠️ 前方 ${(closestLiveEvent.distanceMeters / 1000).toFixed(1)}km 有【${closestLiveEvent.title}】事件`;
    radarDetail = `${closestLiveEvent.description}，注意路況。`;
  } else if (closestSpot && closestSpot.distanceMeters <= 1000) {
    radarStatus = "warning";
    radarHeadline = `⚠️ 接近易肇事路口 (${closestSpot.distanceMeters}m)：${closestSpot.roads.split("；")[0] || closestSpot.roads}`;
    radarDetail = `歷史事故 ${closestSpot.accidents} 件，請注意左右來車。`;
  }

  return new Response(
    JSON.stringify(
      {
        success: true,
        timestamp: new Date().toISOString(),
        userLocation: {
          lat: userLat,
          lon: userLon,
        },
        radarAlert: {
          status: radarStatus,
          headline: radarHeadline,
          detail: radarDetail,
          closestHazardMeters: closestSpot ? closestSpot.distanceMeters : null,
        },
        dangerHotspots: nearbyHotspots.slice(0, 15),
        liveEvents: liveEvents.slice(0, 10),
        cctvs: nearbyCCTVs,
        stats: {
          totalHotspotsLoaded: allHotspots.length,
          totalCCTVsLoaded: allCCTVs.length,
          matchedHotspots: nearbyHotspots.length,
          matchedLiveEvents: liveEvents.length,
          matchedCCTVs: nearbyCCTVs.length,
        },
      },
      null,
      2
    ),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=15, s-maxage=30",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
};
