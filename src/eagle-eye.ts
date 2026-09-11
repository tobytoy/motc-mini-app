import liff from "@line/liff";
import L from "leaflet";

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
  roadName: string;
  locationName: string;
  lat: number;
  lon: number;
  distanceMeters: number;
  videoUrl: string;
  snapshotUrl: string;
  status: string;
  region: string;
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

function getCartoTileUrl(theme: string): string {
  return theme === "dark"
    ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CONFIG.CARTO_KEY}`
    : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CONFIG.CARTO_KEY}`;
}
type FilterMode = "all" | "hotspot" | "event" | "cctv";

interface AppState {
  currentLat: number;
  currentLon: number;
  activeMode: FilterMode;
  data: EagleEyeApiResponse | null;
  map: L.Map | null;
  userMarker: L.Marker | null;
  layers: {
    hotspots: L.LayerGroup;
    events: L.LayerGroup;
    cctvs: L.LayerGroup;
  } | null;
  voiceAlertEnabled: boolean;
  activeCctvInterval: number | null;
  tileLayer: L.TileLayer | null;
}

const state: AppState = {
  currentLat: CONFIG.DEFAULT_LAT,
  currentLon: CONFIG.DEFAULT_LON,
  activeMode: "all",
  data: null,
  map: null,
  userMarker: null,
  layers: null,
  voiceAlertEnabled: true,
  activeCctvInterval: null,
  tileLayer: null,
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
  radarLoader: document.getElementById("radarLoader") as HTMLElement,
  radarCardsGrid: document.getElementById("radarCardsGrid") as HTMLElement,
  countAll: document.getElementById("countAll") as HTMLElement,
  countHotspot: document.getElementById("countHotspot") as HTMLElement,
  countEvent: document.getElementById("countEvent") as HTMLElement,
  countCctv: document.getElementById("countCctv") as HTMLElement,
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
  const saved = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  DOM.themeToggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
    updateThemeIcon(next);
    if (state.tileLayer) {
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
  }).setView([state.currentLat, state.currentLon], 14);

  L.control.zoom({ position: "bottomright" }).addTo(state.map);
  const initialTheme = document.documentElement.getAttribute("data-theme") || "dark";
  state.tileLayer = L.tileLayer(getCartoTileUrl(initialTheme), {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
    maxZoom: 19,
    subdomains: "abcd",
  }).addTo(state.map);

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
  };
}

// ==========================================
// Data Fetching & Rendering
// ==========================================

async function loadRadarData(): Promise<void> {
  DOM.radarLoader.style.display = "flex";
  DOM.radarCardsGrid.innerHTML = "";

  DOM.locCoordsText.textContent = `${state.currentLat.toFixed(4)}° N, ${state.currentLon.toFixed(4)}° E`;

  try {
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

// ==========================================
// Leaflet Map Markers Rendering
// ==========================================

function renderMapMarkers(data: EagleEyeApiResponse): void {
  if (!state.map || !state.layers) return;

  // Clear existing
  state.layers.hotspots.clearLayers();
  state.layers.events.clearLayers();
  state.layers.cctvs.clearLayers();

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

    L.marker([spot.lat, spot.lng], { icon }).bindPopup(popupHtml).addTo(state.layers!.hotspots);
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

    L.marker([ev.lat, ev.lon], { icon }).bindPopup(popupHtml).addTo(state.layers!.events);
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

    marker.on("popupopen", () => {
      const btn = document.querySelector(`.popup-cctv-btn[data-cctv-id="${cctv.id}"]`);
      if (btn) {
        btn.addEventListener("click", () => openCctvModal(cctv));
      }
    });
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
      card.className = `radar-card card-${spot.alertLevel}`;
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
        <div class="card-footer-row">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}" target="_blank" class="btn btn-outline btn-sm">
            <span>🧭 導航至該路段</span>
          </a>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 2. Render Live Events
  if (mode === "all" || mode === "event") {
    data.liveEvents.forEach((ev) => {
      const card = document.createElement("div");
      card.className = "radar-card card-event";
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
      `;
      container.appendChild(card);
    });
  }

  // 3. Render CCTVs
  if (mode === "all" || mode === "cctv") {
    data.cctvs.forEach((cctv) => {
      const card = document.createElement("div");
      card.className = "radar-card card-cctv";
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
        <div class="card-footer-row">
          <span class="card-address">區域：${cctv.region} • 距離約 ${formatDistance(cctv.distanceMeters)}</span>
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
        hero.addEventListener("click", () => openCctvModal(cctv));
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
  DOM.countAll.textContent = String(data.dangerHotspots.length + data.liveEvents.length + data.cctvs.length);
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
// Event Listeners
// ==========================================

function setupEventListeners(): void {
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
