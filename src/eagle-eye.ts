import liff from "@line/liff";
import L from "leaflet";
import metroStationsData from "./data/metroStations.json";

// ==========================================
// Types
// ==========================================

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
  distanceMeters: number;
  alertLevel: "danger" | "warning" | "caution" | "safe";
  defensiveTip: string;
}

export interface CCTVItem {
  id: string;
  name: string;
  videoUrl: string;
  snapshotUrl: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  status: "online" | "standby";
  roadName: string;
  locationName: string;
  mileage: string;
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

export interface MetroStationItem {
  id: string;
  name: string;
  op: string;
  lat: number;
  lon: number;
  city: string;
  distanceMeters: number;
}

export interface EagleEyeApiResponse {
  success: boolean;
  timestamp: string;
  userLocation: {
    lat: number;
    lon: number;
  };
  radarAlert: {
    status: "danger" | "warning" | "safe";
    headline: string;
    detail: string;
    closestHazardMeters: number | null;
  };
  dangerHotspots: HotspotItem[];
  liveEvents: LiveRoadEvent[];
  cctvs: CCTVItem[];
  stats: {
    totalHotspotsLoaded: number;
    totalCCTVsLoaded: number;
    matchedHotspots: number;
    matchedLiveEvents: number;
    matchedCCTVs: number;
  };
}

// ==========================================
// App State & Config
// ==========================================

const CONFIG = {
  LIFF_ID: "2011551329-VWljb6fv", // motc-mini-eagle-eye Developing LIFF ID
  DEFAULT_LAT: 25.0478, // 台北車站
  DEFAULT_LON: 121.5170,
  CARTO_KEY: "cb1_34ly_1_0922d1c895d7b40fd9f335f0",
};

export const BASEMAP_TILES = {
  nlsc: {
    url: "https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}",
    options: {
      maxZoom: 20,
      attribution: '&copy; <a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>',
    },
  },
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    options: {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    },
  },
  carto: {
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CONFIG.CARTO_KEY}`,
    options: {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    },
  },
};

export type BasemapType = "nlsc" | "osm" | "carto";

function getCartoTileUrl(_theme?: string): string {
  // CARTO Voyager: 亮色高清圖磚，道路標記與地標鮮明對比，無暗黑感
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CONFIG.CARTO_KEY}`;
}
export type FilterMode = "all" | "hotspot" | "event" | "cctv" | "metro";

interface AppState {
  currentLat: number;
  currentLon: number;
  activeMode: FilterMode;
  currentBasemap: BasemapType;
  data: EagleEyeApiResponse | null;
  nearbyMetros: MetroStationItem[];
  map: L.Map | null;
  userMarker: L.Marker | null;
  layers: {
    hotspots: L.LayerGroup;
    events: L.LayerGroup;
    cctvs: L.LayerGroup;
    metros: L.LayerGroup;
  } | null;
  voiceAlertEnabled: boolean;
  activeCctvInterval: number | null;
  tileLayer: L.TileLayer | null;
  markersMap: Map<string, L.Marker>;
  isMapLocked: boolean;
}

const state: AppState = {
  currentLat: CONFIG.DEFAULT_LAT,
  currentLon: CONFIG.DEFAULT_LON,
  activeMode: "all",
  currentBasemap: "nlsc",
  data: null,
  nearbyMetros: [],
  map: null,
  userMarker: null,
  layers: null,
  voiceAlertEnabled: true,
  activeCctvInterval: null,
  tileLayer: null,
  markersMap: new Map(),
  isMapLocked: false,
};
// ==========================================
// DOM References
// ==========================================

const DOM = {
  userName: document.getElementById("userName") as HTMLElement,
  userAvatar: document.getElementById("userAvatar") as HTMLElement,
  themeToggleBtn: document.getElementById("themeToggleBtn") as HTMLButtonElement,
  themeIcon: document.getElementById("themeIcon") as HTMLElement,
  radarAlertBanner: document.getElementById("radarAlertBanner") as HTMLElement,
  radarAlertIcon: document.getElementById("radarAlertIcon") as HTMLElement,
  radarHeadline: document.getElementById("radarHeadline") as HTMLElement,
  radarDetail: document.getElementById("radarDetail") as HTMLElement,
  voiceAlertBtn: document.getElementById("voiceAlertBtn") as HTMLButtonElement,
  voiceAlertIcon: document.getElementById("voiceAlertIcon") as HTMLElement,
  locateBtn: document.getElementById("locateBtn") as HTMLButtonElement,
  refreshBtn: document.getElementById("refreshBtn") as HTMLButtonElement,
  shareBtn: document.getElementById("shareBtn") as HTMLButtonElement,
  locCoordsText: document.getElementById("locCoordsText") as HTMLElement,
  radarMapWrapper: document.getElementById("radarMapWrapper") as HTMLElement,
  lockRadarMapBtn: document.getElementById("lockRadarMapBtn") as HTMLButtonElement,
  centerRadarMeBtn: document.getElementById("centerRadarMeBtn") as HTMLButtonElement,
  toast: document.getElementById("toast") as HTMLElement,
  toastMsg: document.getElementById("toastMsg") as HTMLElement,
  radarLoader: document.getElementById("radarLoader") as HTMLElement,
  radarCardsGrid: document.getElementById("radarCardsGrid") as HTMLElement,
  countAll: document.getElementById("countAll") as HTMLElement,
  countHotspot: document.getElementById("countHotspot") as HTMLElement,
  countEvent: document.getElementById("countEvent") as HTMLElement,
  countCctv: document.getElementById("countCctv") as HTMLElement,
  countMetro: document.getElementById("countMetro") as HTMLElement,
  // CCTV Modal
  cctvModal: document.getElementById("cctvModal") as HTMLElement,
  cctvModalOverlay: document.getElementById("cctvModalOverlay") as HTMLElement,
  closeCctvModalBtn: document.getElementById("closeCctvModalBtn") as HTMLButtonElement,
  cctvModalTitle: document.getElementById("cctvModalTitle") as HTMLElement,
  cctvImagePlayer: document.getElementById("cctvImagePlayer") as HTMLImageElement,
  cctvPlayerLoader: document.getElementById("cctvPlayerLoader") as HTMLElement,
  cctvRefreshIndicator: document.getElementById("cctvRefreshIndicator") as HTMLElement,
  cctvNavBtn: document.getElementById("cctvNavBtn") as HTMLAnchorElement,
  cctvDirectStreamBtn: document.getElementById("cctvDirectStreamBtn") as HTMLAnchorElement,
};

// ==========================================
// Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  initTheme();
  setupEventListeners();
  initMap();
  await initLiff();
  await loadRadarData();
});

// ==========================================
// Theme Management
// ==========================================

function initTheme(): void {
  const saved = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  DOM.themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    updateThemeIcon(next);
    if (state.tileLayer && state.currentBasemap === "carto") {
      state.tileLayer.setUrl(getCartoTileUrl(next));
    }
  });
}

function updateThemeIcon(theme: string): void {
  DOM.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
}

// ==========================================
// LINE LIFF Initialization
// ==========================================

async function initLiff(): Promise<void> {
  try {
    await liff.init({ liffId: CONFIG.LIFF_ID });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      DOM.userName.textContent = profile.displayName || "同仁";
      if (profile.pictureUrl) {
        DOM.userAvatar.innerHTML = `<img src="${profile.pictureUrl}" alt="Avatar" class="avatar-img" />`;
      }
    } else {
      DOM.userName.textContent = "訪客模式";
    }
  } catch (err) {
    console.warn("[LIFF Init] Web fallback preview:", err);
    DOM.userName.textContent = "Web 預覽";
  }
}

// ==========================================
// Map (Leaflet) Initialization
// ==========================================

function initMap(): void {
  const mapEl = document.getElementById("radarMap");
  if (!mapEl) return;

  state.map = L.map("radarMap", {
    zoomControl: false,
    attributionControl: false,
  }).setView([state.currentLat, state.currentLon], 16);

  L.control.zoom({ position: "topright" }).addTo(state.map);

  const cfg = BASEMAP_TILES[state.currentBasemap];
  state.tileLayer = L.tileLayer(cfg.url, cfg.options).addTo(state.map);

  // User pulse marker
  const userIcon = L.divIcon({
    className: "radar-user-icon",
    html: `<div class="user-pulse-marker"><div class="pulse-ring"></div><div class="user-core-dot"></div></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  state.userMarker = L.marker([state.currentLat, state.currentLon], { icon: userIcon }).addTo(state.map);
  state.userMarker.bindPopup("<b>📍 目前位置</b><br>路安鷹眼掃描核心").openPopup();

  // Layer groups for markers
  state.layers = {
    hotspots: L.layerGroup().addTo(state.map),
    events: L.layerGroup().addTo(state.map),
    cctvs: L.layerGroup().addTo(state.map),
    metros: L.layerGroup().addTo(state.map),
  };
}

function switchBasemap(type: BasemapType): void {
  if (!state.map || state.currentBasemap === type) return;
  state.currentBasemap = type;

  if (state.tileLayer) {
    state.map.removeLayer(state.tileLayer);
  }

  const cfg = BASEMAP_TILES[type];
  state.tileLayer = L.tileLayer(cfg.url, cfg.options).addTo(state.map);
  state.tileLayer.bringToBack();

  document.querySelectorAll(".basemap-pill").forEach((pill) => {
    const pType = pill.getAttribute("data-basemap") || pill.getAttribute("data-layer");
    if (pType === type) {
      pill.classList.add("active");
    } else {
      pill.classList.remove("active");
    }
  });

  const names: Record<BasemapType, string> = {
    nlsc: "🇹🇼 臺灣通用圖 (含地標大樓與捷運出口)",
    osm: "🗺️ OpenStreetMap 街道圖",
    carto: "🎨 CARTO 極簡風格圖",
  };
  showToast(`底圖已切換：${names[type]}`);
}

function computeDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
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

// ==========================================
// Data Fetching & Rendering
// ==========================================

async function loadRadarData(): Promise<void> {
  DOM.radarLoader.style.display = "flex";
  DOM.radarCardsGrid.innerHTML = "";

  DOM.locCoordsText.textContent = `${state.currentLat.toFixed(4)}° N, ${state.currentLon.toFixed(4)}° E`;

  try {
    // 1. Calculate nearest metro stations based on current user position
    const rawMetros = metroStationsData as Array<{ id: string; name: string; op: string; lat: number; lon: number; city: string }>;
    const allMetrosWithDist = rawMetros.map((st) => ({
      ...st,
      distanceMeters: computeDistance(state.currentLat, state.currentLon, st.lat, st.lon),
    })).sort((a, b) => a.distanceMeters - b.distanceMeters);

    let nearby = allMetrosWithDist.filter((st) => st.distanceMeters <= 3500).slice(0, 10);
    if (nearby.length === 0 && allMetrosWithDist.length > 0 && allMetrosWithDist[0].distanceMeters <= 8000) {
      nearby = allMetrosWithDist.slice(0, 3);
    }
    state.nearbyMetros = nearby;

    const res = await fetch(`/api/eagle-eye?lat=${state.currentLat}&lon=${state.currentLon}&radius=6000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data: EagleEyeApiResponse = await res.json();
    state.data = data;

    renderRadarAlert(data.radarAlert);
    renderMapMarkers(data);
    renderCards(data, state.activeMode);
    updateTabCounts(data);

    // Voice announce if danger
    if (state.voiceAlertEnabled && data.radarAlert.status === "danger") {
      speakAlert(data.radarAlert.headline);
    }
  } catch (err) {
    console.error("[EagleEye] Fetch error:", err);
    DOM.radarCardsGrid.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p class="empty-title">無法取得路況與雷達資料</p>
        <p class="empty-desc">請檢查網路連線或稍後再試。</p>
      </div>
    `;
  } finally {
    DOM.radarLoader.style.display = "none";
  }
}

// ==========================================
// Radar Alert Banner Rendering
// ==========================================

function renderRadarAlert(alert: EagleEyeApiResponse["radarAlert"]): void {
  DOM.radarAlertBanner.className = `radar-alert-banner alert-${alert.status}`;
  DOM.radarHeadline.textContent = alert.headline;
  DOM.radarDetail.textContent = alert.detail;

  if (alert.status === "danger") {
    DOM.radarAlertIcon.textContent = "🚨";
  } else if (alert.status === "warning") {
    DOM.radarAlertIcon.textContent = "⚠️";
  } else {
    DOM.radarAlertIcon.textContent = "🛡️";
  }
}

function panToMarker(id: string, lat: number, lon: number): void {
  if (!state.map) return;

  state.map.flyTo([lat, lon], 16, { duration: 0.8 });
  const marker = state.markersMap.get(id);
  if (marker) {
    setTimeout(() => {
      marker.openPopup();
    }, 850);
  }

  const mapElem = document.getElementById("radarMap");
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ==========================================
// Leaflet Map Markers Rendering
// ==========================================

function renderMapMarkers(data: EagleEyeApiResponse): void {
  if (!state.map || !state.layers) return;

  // Clear existing
  state.layers.hotspots.clearLayers();
  state.layers.events.clearLayers();
  state.layers.cctvs.clearLayers();
  state.layers.metros.clearLayers();
  state.markersMap.clear();

  // Update user marker position
  if (state.userMarker) {
    state.userMarker.setLatLng([state.currentLat, state.currentLon]);
  }

  // 1. Hotspots Markers
  data.dangerHotspots.forEach((spot) => {
    const color = spot.alertLevel === "danger" ? "#EF4444" : spot.alertLevel === "warning" ? "#F59E0B" : "#3B82F6";
    const icon = L.divIcon({
      className: "radar-marker-wrap",
      html: `<div class="radar-danger-marker" style="background-color: ${color};"><span class="marker-rank">#${spot.rank}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const popupHtml = `
      <div class="map-popup-card">
        <div class="popup-badge badge-${spot.alertLevel}">#${spot.rank} 肇事熱點 (${spot.distanceMeters}m)</div>
        <h4 class="popup-title">${spot.roads.split("；")[0] || spot.roads}</h4>
        <p class="popup-stats">累計事故 <b>${spot.accidents}</b> 件 • 死傷 <b>${spot.deaths + spot.injuries}</b> 人</p>
        <p class="popup-tip">${spot.defensiveTip}</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" class="popup-nav-link">🧭 前往導航</a>
      </div>
    `;

    const marker = L.marker([spot.lat, spot.lng], { icon }).bindPopup(popupHtml).addTo(state.layers!.hotspots);
    state.markersMap.set(`hotspot-${spot.rank}`, marker);
  });

  // 2. Live Events Markers
  data.liveEvents.forEach((ev) => {
    const icon = L.divIcon({
      className: "radar-marker-wrap",
      html: `<div class="radar-event-marker"><span class="marker-emoji">⚡</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const popupHtml = `
      <div class="map-popup-card">
        <div class="popup-badge badge-event">${ev.eventTypeName} • ${ev.severityName}</div>
        <h4 class="popup-title">${ev.title}</h4>
        <p class="popup-detail">${ev.description}</p>
        <p class="popup-lanes">受阻車道：${ev.blockedLanes}</p>
        <span class="popup-dist">距離 ${ev.distanceMeters} 公尺</span>
      </div>
    `;

    const marker = L.marker([ev.lat, ev.lon], { icon }).bindPopup(popupHtml).addTo(state.layers!.events);
    state.markersMap.set(`event-${ev.id}`, marker);
  });

  // 3. CCTV Markers
  data.cctvs.forEach((cctv) => {
    const icon = L.divIcon({
      className: "radar-marker-wrap",
      html: `<div class="radar-cctv-marker"><span class="marker-emoji">📹</span></div>`,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    const popupHtml = `
      <div class="map-popup-card">
        <div class="popup-badge badge-cctv">CCTV 監視器 • ${cctv.distanceMeters}m</div>
        <h4 class="popup-title">${cctv.name}</h4>
        <p class="popup-status">連線狀態：<span class="status-online">🟢 正常連線</span></p>
        <button class="btn btn-primary btn-sm popup-cctv-btn" data-cctv-id="${cctv.id}">📹 查看即時影像</button>
      </div>
    `;

    const marker = L.marker([cctv.lat, cctv.lon], { icon }).bindPopup(popupHtml).addTo(state.layers!.cctvs);
    state.markersMap.set(`cctv-${cctv.id}`, marker);

    marker.on("popupopen", () => {
      const btn = document.querySelector(`.popup-cctv-btn[data-cctv-id="${cctv.id}"]`);
      if (btn) {
        btn.addEventListener("click", () => openCctvModal(cctv));
      }
    });
  });

  // 4. Metro Station Markers
  state.nearbyMetros.forEach((metro) => {
    const icon = L.divIcon({
      className: "radar-marker-wrap",
      html: `<div class="radar-metro-marker"><span class="marker-emoji">🚇</span><span class="marker-metro-name">${metro.name}</span></div>`,
      iconSize: [68, 28],
      iconAnchor: [34, 14],
    });

    const popupHtml = `
      <div class="map-popup-card">
        <div class="popup-badge badge-metro">🚇 ${metro.op} • 捷運車站</div>
        <h4 class="popup-title">${metro.name} 站 (${metro.id})</h4>
        <p class="popup-stats">距您約 <b>${formatDistance(metro.distanceMeters)}</b> • 徒步約 <b>${Math.max(1, Math.round(metro.distanceMeters / 80))}</b> 分鐘</p>
        <p class="popup-tip">具備顯著捷運標誌牌、出入口與主要交通節點，可協助您明確辨識目前位置與周邊方向。</p>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${metro.lat},${metro.lon}" target="_blank" class="popup-nav-link">🧭 Google 路線導航</a>
      </div>
    `;

    const marker = L.marker([metro.lat, metro.lon], { icon }).bindPopup(popupHtml).addTo(state.layers!.metros);
    state.markersMap.set(`metro-${metro.id}`, marker);
  });
}

// ==========================================
// Cards Grid Rendering
// ==========================================

function renderCards(data: EagleEyeApiResponse, mode: FilterMode): void {
  DOM.radarCardsGrid.innerHTML = "";

  const container = DOM.radarCardsGrid;

  // 1. Render Hotspots
  if (mode === "all" || mode === "hotspot") {
    data.dangerHotspots.forEach((spot) => {
      const card = document.createElement("div");
      card.className = `radar-card card-${spot.alertLevel} interactive-card`;
      card.innerHTML = `
        <div class="card-header-row">
          <div class="card-badge-box">
            <span class="badge-rank">#${spot.rank}</span>
            <span class="badge-alert-tag tag-${spot.alertLevel}">
              ${spot.alertLevel === "danger" ? "🚨 極度高危" : spot.alertLevel === "warning" ? "⚠️ 肇事熱點" : "注意減速"}
            </span>
          </div>
          <span class="card-distance">${formatDistance(spot.distanceMeters)}</span>
        </div>
        <h3 class="card-title">${spot.roads.split("；")[0] || spot.roads}</h3>
        <p class="card-address">📍 ${spot.address}</p>
        <div class="card-stats-row">
          <span class="stat-pill">累計事故 <b>${spot.accidents}</b> 件</span>
          <span class="stat-pill">死傷 <b>${spot.deaths + spot.injuries}</b> 人</span>
          <span class="stat-pill">安全評分 <b>${spot.score}</b></span>
        </div>
        <div class="card-tip-box">
          <span class="tip-icon">💡</span>
          <p class="tip-text">${spot.defensiveTip}</p>
        </div>
        <div class="card-footer-row card-actions-flex">
          <button class="btn btn-secondary btn-sm locate-marker-btn" data-id="hotspot-${spot.rank}">
            <span>📍 查看位置</span>
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" class="btn btn-outline btn-sm nav-link-btn" onclick="event.stopPropagation()">
            <span>🧭 Google 導航</span>
          </a>
        </div>
      `;
      card.addEventListener("click", () => {
        panToMarker(`hotspot-${spot.rank}`, spot.lat, spot.lng);
      });
      const locBtn = card.querySelector(".locate-marker-btn");
      if (locBtn) {
        locBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          panToMarker(`hotspot-${spot.rank}`, spot.lat, spot.lng);
        });
      }
      container.appendChild(card);
    });
  }

  // 2. Render Live Events
  if (mode === "all" || mode === "event") {
    data.liveEvents.forEach((ev) => {
      const card = document.createElement("div");
      card.className = "radar-card card-event interactive-card";
      card.innerHTML = `
        <div class="card-header-row">
          <div class="card-badge-box">
            <span class="badge-event-type">⚡ ${ev.eventTypeName}</span>
            <span class="badge-severity sev-${ev.severity}">${ev.severityName}</span>
          </div>
          <span class="card-distance">${formatDistance(ev.distanceMeters)}</span>
        </div>
        <h3 class="card-title">${ev.title}</h3>
        <p class="card-desc">${ev.description}</p>
        <div class="card-event-meta">
          <span class="meta-tag">受阻車道：${ev.blockedLanes}</span>
          <span class="meta-tag">路段：${ev.roadName || "公路主線"} ${ev.direction || ""}</span>
        </div>
        <div class="card-footer-row card-actions-flex">
          <button class="btn btn-secondary btn-sm locate-marker-btn" data-id="event-${ev.id}">
            <span>📍 查看位置</span>
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${ev.lat},${ev.lon}" target="_blank" class="btn btn-outline btn-sm nav-link-btn" onclick="event.stopPropagation()">
            <span>🧭 Google 導航</span>
          </a>
        </div>
      `;
      card.addEventListener("click", () => {
        panToMarker(`event-${ev.id}`, ev.lat, ev.lon);
      });
      const locBtn = card.querySelector(".locate-marker-btn");
      if (locBtn) {
        locBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          panToMarker(`event-${ev.id}`, ev.lat, ev.lon);
        });
      }
      container.appendChild(card);
    });
  }

  // 3. Render CCTVs
  if (mode === "all" || mode === "cctv") {
    data.cctvs.forEach((cctv) => {
      const card = document.createElement("div");
      card.className = "radar-card card-cctv interactive-card";
      card.innerHTML = `
        <div class="card-header-row">
          <div class="card-badge-box">
            <span class="badge-cctv-live">LIVE 監視器</span>
            <span class="badge-cctv-road">${cctv.roadName}</span>
          </div>
          <span class="card-distance">${formatDistance(cctv.distanceMeters)}</span>
        </div>
        <div class="cctv-card-hero">
          <div class="cctv-hero-left">
            <span class="cctv-hero-icon">📹</span>
            <div class="cctv-hero-info">
              <div class="cctv-online-indicator">
                <span class="pulse-beacon"></span>
                <span>${cctv.status === "online" ? "即時鏡頭在線 (點擊調閱)" : "監視器待命"}</span>
              </div>
              <span class="cctv-hero-sub">${cctv.locationName || cctv.roadName} ${cctv.mileage ? `(${cctv.mileage})` : ""}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm cctv-hero-btn open-cctv-btn" data-cctv-id="${cctv.id}">
            <span>▶️ 直擊畫面</span>
          </button>
        </div>
        <div class="card-footer-row card-actions-flex">
          <button class="btn btn-secondary btn-sm locate-marker-btn" data-id="cctv-${cctv.id}">
            <span>📍 查看位置</span>
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${cctv.lat},${cctv.lon}" target="_blank" class="btn btn-outline btn-sm nav-link-btn" onclick="event.stopPropagation()">
            <span>🧭 Google 導航</span>
          </a>
        </div>
      `;
      const btn = card.querySelector(".open-cctv-btn");
      if (btn) {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          openCctvModal(cctv);
        });
      }
      const hero = card.querySelector(".cctv-card-hero");
      if (hero) {
        hero.addEventListener("click", (e) => {
          e.stopPropagation();
          openCctvModal(cctv);
        });
      }
      const locBtn = card.querySelector(".locate-marker-btn");
      if (locBtn) {
        locBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          panToMarker(`cctv-${cctv.id}`, cctv.lat, cctv.lon);
        });
      }
      card.addEventListener("click", () => {
        panToMarker(`cctv-${cctv.id}`, cctv.lat, cctv.lon);
      });
      container.appendChild(card);
    });
  }

  // 4. Render Metro Stations
  if (mode === "all" || mode === "metro") {
    state.nearbyMetros.forEach((metro) => {
      const card = document.createElement("div");
      card.className = "radar-card card-metro interactive-card";
      card.innerHTML = `
        <div class="card-header-row">
          <div class="card-badge-box">
            <span class="badge-metro-tag">🚇 ${metro.op}</span>
            <span class="badge-metro-id">${metro.id}</span>
          </div>
          <span class="card-distance">${formatDistance(metro.distanceMeters)}</span>
        </div>
        <h3 class="card-title">${metro.name} 站</h3>
        <p class="card-address">📍 捷運重要地標 • 徒步約 ${Math.max(1, Math.round(metro.distanceMeters / 80))} 分鐘 (${metro.city})</p>
        <div class="card-tip-box" style="background: rgba(16, 185, 129, 0.08); border-color: rgba(16, 185, 129, 0.25);">
          <span class="tip-icon">🗺️</span>
          <p class="tip-text" style="color: var(--text-secondary);">附近有顯著捷運標誌牌、出入口與知名大樓，可作為辨識您目前所在地的核心基準點。</p>
        </div>
        <div class="card-footer-row card-actions-flex">
          <button class="btn btn-secondary btn-sm locate-marker-btn" data-id="metro-${metro.id}">
            <span>📍 查看地圖位置</span>
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${metro.lat},${metro.lon}" target="_blank" class="btn btn-outline btn-sm nav-link-btn" onclick="event.stopPropagation()">
            <span>🧭 導航前往</span>
          </a>
        </div>
      `;
      card.addEventListener("click", () => {
        panToMarker(`metro-${metro.id}`, metro.lat, metro.lon);
      });
      const locBtn = card.querySelector(".locate-marker-btn");
      if (locBtn) {
        locBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          panToMarker(`metro-${metro.id}`, metro.lat, metro.lon);
        });
      }
      container.appendChild(card);
    });
  }

  if (container.children.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <p class="empty-title">目前分類無相關資料</p>
        <p class="empty-desc">請切換其他類別或擴大搜尋半徑。</p>
      </div>
    `;
  }
}

function updateTabCounts(data: EagleEyeApiResponse): void {
  DOM.countHotspot.textContent = String(data.dangerHotspots.length);
  DOM.countEvent.textContent = String(data.liveEvents.length);
  DOM.countCctv.textContent = String(data.cctvs.length);
  if (DOM.countMetro) {
    DOM.countMetro.textContent = String(state.nearbyMetros.length);
  }
  DOM.countAll.textContent = String(
    data.dangerHotspots.length + data.liveEvents.length + data.cctvs.length + state.nearbyMetros.length
  );
}

// ==========================================
// CCTV Modal & Player
// ==========================================

function openCctvModal(cctv: CCTVItem): void {
  DOM.cctvModalTitle.textContent = cctv.name;
  DOM.cctvPlayerLoader.style.display = "block";
  DOM.cctvImagePlayer.style.display = "none";

  DOM.cctvNavBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${cctv.lat},${cctv.lon}`;
  if (DOM.cctvDirectStreamBtn) {
    DOM.cctvDirectStreamBtn.href = cctv.videoUrl;
  }

  // Start image stream refresh
  const refreshSnapshot = () => {
    const freshUrl = `${cctv.snapshotUrl}${cctv.snapshotUrl.includes("?") ? "&" : "?"}_t=${Date.now()}`;
    DOM.cctvImagePlayer.src = freshUrl;
  };

  DOM.cctvImagePlayer.onload = () => {
    DOM.cctvPlayerLoader.style.display = "none";
    DOM.cctvImagePlayer.style.display = "block";
  };

  DOM.cctvImagePlayer.onerror = () => {
    DOM.cctvPlayerLoader.innerHTML = `
      <div style="text-align:center; padding: 16px;">
        <p style="color:#f59e0b; margin:0 0 8px 0; font-size:12px;">⚠️ 該路段串流受到安全策略或跨域限制</p>
        <a href="${cctv.videoUrl}" target="_blank" class="btn btn-outline btn-sm" style="display:inline-flex;">
          <span>🔗 點此在外部瀏覽器開啟</span>
        </a>
      </div>
    `;
    DOM.cctvPlayerLoader.style.display = "block";
  };

  refreshSnapshot();

  // Clear prior
  if (state.activeCctvInterval) {
    clearInterval(state.activeCctvInterval);
  }

  // Refresh every 3 seconds
  state.activeCctvInterval = window.setInterval(refreshSnapshot, 3000);

  DOM.cctvModal.style.display = "flex";
}

function closeCctvModal(): void {
  if (state.activeCctvInterval) {
    clearInterval(state.activeCctvInterval);
    state.activeCctvInterval = null;
  }
  DOM.cctvModal.style.display = "none";
  DOM.cctvImagePlayer.src = "";
}

// ==========================================
// Toast Notifications & Radar Map Lock
// ==========================================

let toastTimer: number | null = null;

function showToast(message: string): void {
  if (!DOM.toast || !DOM.toastMsg) return;
  DOM.toastMsg.textContent = message;
  DOM.toast.style.display = "flex";
  // Force reflow for transition
  void DOM.toast.offsetHeight;
  DOM.toast.classList.add("toast-show");

  if (toastTimer) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    DOM.toast?.classList.remove("toast-show");
    window.setTimeout(() => {
      if (DOM.toast) DOM.toast.style.display = "none";
    }, 250);
  }, 2200);
}

function setRadarMapLocked(locked: boolean, notify = true): void {
  state.isMapLocked = locked;
  if (!state.map) return;

  if (locked) {
    state.map.dragging.disable();
    state.map.touchZoom.disable();
    state.map.doubleClickZoom.disable();
    state.map.scrollWheelZoom.disable();
    state.map.boxZoom.disable();
    state.map.keyboard.disable();

    if (DOM.lockRadarMapBtn) {
      DOM.lockRadarMapBtn.innerHTML = "🔒";
      DOM.lockRadarMapBtn.classList.add("locked");
      DOM.lockRadarMapBtn.title = "雷達地圖已鎖定防誤觸 (點擊解鎖)";
      DOM.lockRadarMapBtn.setAttribute("aria-label", "雷達地圖已鎖定防誤觸 (點擊解鎖)");
    }
    if (DOM.radarMapWrapper) {
      DOM.radarMapWrapper.classList.add("is-locked");
    }
    if (notify) {
      showToast("🔒 雷達視角已固定，滑動頁面不誤觸");
    }
  } else {
    state.map.dragging.enable();
    state.map.touchZoom.enable();
    state.map.doubleClickZoom.enable();
    state.map.scrollWheelZoom.enable();
    state.map.boxZoom.enable();
    state.map.keyboard.enable();

    if (DOM.lockRadarMapBtn) {
      DOM.lockRadarMapBtn.innerHTML = "🔓";
      DOM.lockRadarMapBtn.classList.remove("locked");
      DOM.lockRadarMapBtn.title = "點擊鎖定雷達地圖 (防止滑動誤觸)";
      DOM.lockRadarMapBtn.setAttribute("aria-label", "點擊鎖定雷達地圖 (防止滑動誤觸)");
    }
    if (DOM.radarMapWrapper) {
      DOM.radarMapWrapper.classList.remove("is-locked");
    }
    if (notify) {
      showToast("🔓 雷達地圖已解鎖，可自由移動縮放");
    }
  }
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners(): void {
  // Basemap Switcher
  document.querySelectorAll(".basemap-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      const type = (pill.getAttribute("data-basemap") || pill.getAttribute("data-layer")) as BasemapType;
      if (type) {
        switchBasemap(type);
      }
    });
  });

  // Lock Map Button
  DOM.lockRadarMapBtn?.addEventListener("click", () => {
    setRadarMapLocked(!state.isMapLocked);
  });

  // Center Radar Location Button
  DOM.centerRadarMeBtn?.addEventListener("click", () => {
    if (state.map) {
      state.map.flyTo([state.currentLat, state.currentLon], 15, { duration: 0.8 });
    }
  });
  // Mode Tabs
  document.querySelectorAll(".tabs-segmented .tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tabs-segmented .tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = (btn.getAttribute("data-mode") as FilterMode) || "all";
      state.activeMode = mode;
      if (state.data) {
        renderCards(state.data, mode);
      }
    });
  });

  // Locate Button
  DOM.locateBtn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("您的瀏覽器或設備不支援 GPS 定位");
      return;
    }
    DOM.locateBtn.disabled = true;
    DOM.locateBtn.innerHTML = `<span>⏳ 定位中...</span>`;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.currentLat = pos.coords.latitude;
        state.currentLon = pos.coords.longitude;
        if (state.map) {
          state.map.setView([state.currentLat, state.currentLon], 15);
        }
        DOM.locateBtn.disabled = false;
        DOM.locateBtn.innerHTML = `<span class="btn-icon">🎯</span><span class="btn-text">GPS 定位</span>`;
        loadRadarData();
      },
      (err) => {
        console.warn("[GPS] Location error:", err);
        alert("無法取得 GPS 定位，已維持預設位置。");
        DOM.locateBtn.disabled = false;
        DOM.locateBtn.innerHTML = `<span class="btn-icon">🎯</span><span class="btn-text">GPS 定位</span>`;
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  });

  // Refresh Button
  DOM.refreshBtn.addEventListener("click", () => {
    loadRadarData();
  });

  // Voice Alert Toggle
  DOM.voiceAlertBtn.addEventListener("click", () => {
    state.voiceAlertEnabled = !state.voiceAlertEnabled;
    DOM.voiceAlertIcon.textContent = state.voiceAlertEnabled ? "🔊" : "🔇";
    DOM.voiceAlertBtn.classList.toggle("disabled", !state.voiceAlertEnabled);
  });

  // Share to LINE
  DOM.shareBtn.addEventListener("click", async () => {
    if (!state.data) return;
    const headline = state.data.radarAlert.headline;
    const shareText = `🛡️【路安鷹眼 • 即時路況回報】\n${headline}\n📍 座標：${state.currentLat.toFixed(4)}, ${state.currentLon.toFixed(4)}\n👉 立即開啟鷹眼雷達直擊：https://miniapp.line.me/2011551329-VWljb6fv`;

    if (liff.isApiAvailable("shareTargetPicker")) {
      try {
        await liff.shareTargetPicker([
          {
            type: "text",
            text: shareText,
          },
        ]);
      } catch (err) {
        console.warn("[LIFF Share] Cancelled or failed:", err);
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);
      alert("路況警示資訊已複製到剪貼簿，可直接貼到 LINE 聊天室！");
    }
  });

  // CCTV Modal Close
  DOM.closeCctvModalBtn.addEventListener("click", closeCctvModal);
  DOM.cctvModalOverlay.addEventListener("click", closeCctvModal);
}

// ==========================================
// Speech Synthesis
// ==========================================

function speakAlert(text: string): void {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[🚨⚠️💡【】]/g, "").trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "zh-TW";
    utter.rate = 1.0;
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn("[Speech] Utterance error:", err);
  }
}

// ==========================================
// Helpers
// ==========================================

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}
