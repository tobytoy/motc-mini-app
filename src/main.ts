import liff from "@line/liff";
import L from "leaflet";
import type { NearbyResponse } from "../functions/api/nearby";

// ==========================================
// Types & State
// ==========================================

interface AppState {
  currentLat: number;
  currentLon: number;
  locationName: string;
  activeFilter: "all" | "bike" | "parking" | "bus";
  data: NearbyResponse | null;
  map: L.Map | null;
  userMarker: L.Marker | null;
  facilityLayerGroup: L.LayerGroup | null;
  markersMap: Map<string, L.Marker>;
}

const DEFAULT_CONFIG = {
  LIFF_ID: "2011479506-1DIDNGJQ", // Developing LIFF ID
  DEFAULT_LAT: 25.0478, // 台北車站
  DEFAULT_LON: 121.5170,
  DEFAULT_LOCATION_NAME: "台北車站周邊 (預設位置)",
};

const state: AppState = {
  currentLat: DEFAULT_CONFIG.DEFAULT_LAT,
  currentLon: DEFAULT_CONFIG.DEFAULT_LON,
  locationName: DEFAULT_CONFIG.DEFAULT_LOCATION_NAME,
  activeFilter: "all",
  data: null,
  map: null,
  userMarker: null,
  facilityLayerGroup: null,
  markersMap: new Map(),
};

// ==========================================
// DOM Element References
// ==========================================

const DOM = {
  userName: document.getElementById("userName") as HTMLElement,
  userAvatar: document.getElementById("userAvatar") as HTMLElement,
  locAddress: document.getElementById("locAddress") as HTMLElement,
  locCoords: document.getElementById("locCoords") as HTMLElement,
  weatherPill: document.getElementById("weatherPill") as HTMLElement,
  weatherIcon: document.getElementById("weatherIcon") as HTMLElement,
  weatherText: document.getElementById("weatherText") as HTMLElement,
  locateBtn: document.getElementById("locateBtn") as HTMLButtonElement,
  refreshBtn: document.getElementById("refreshBtn") as HTMLButtonElement,
  updateTimeText: document.getElementById("updateTimeText") as HTMLElement,
  adviceSection: document.getElementById("adviceSection") as HTMLElement,
  adviceIcon: document.getElementById("adviceIcon") as HTMLElement,
  adviceTitle: document.getElementById("adviceTitle") as HTMLElement,
  adviceSummary: document.getElementById("adviceSummary") as HTMLElement,
  adviceDetail: document.getElementById("adviceDetail") as HTMLElement,
  adviceTypeBadge: document.getElementById("adviceTypeBadge") as HTMLElement,
  mapLoader: document.getElementById("mapLoader") as HTMLElement,
  centerMeBtn: document.getElementById("centerMeBtn") as HTMLButtonElement,
  countAll: document.getElementById("countAll") as HTMLElement,
  countBike: document.getElementById("countBike") as HTMLElement,
  countParking: document.getElementById("countParking") as HTMLElement,
  countBus: document.getElementById("countBus") as HTMLElement,
  themeToggleBtn: document.getElementById("themeToggleBtn") as HTMLButtonElement,
  themeIcon: document.getElementById("themeIcon") as HTMLElement,
  listLoader: document.getElementById("listLoader") as HTMLElement,
  emptyState: document.getElementById("emptyState") as HTMLElement,
  cardsGrid: document.getElementById("cardsGrid") as HTMLElement,
  tabButtons: document.querySelectorAll<HTMLButtonElement>(".tab-btn"),
};

// ==========================================
// 1. LIFF Initialization
// ==========================================

async function initLiffApp(): Promise<void> {
  const urlParams = new URLSearchParams(window.location.search);
  const liffId = urlParams.get("liffId") || DEFAULT_CONFIG.LIFF_ID;

  try {
    await liff.init({ liffId });

    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      DOM.userName.textContent = profile.displayName || "LINE 使用者";
      if (profile.pictureUrl) {
        DOM.userAvatar.innerHTML = `<img src="${profile.pictureUrl}" alt="${profile.displayName}" class="avatar-img" />`;
      }
    } else if (liff.isInClient()) {
      DOM.userName.textContent = "LINE 訪客";
    } else {
      DOM.userName.textContent = "開發測試模式";
    }
  } catch (err: unknown) {
    console.warn("[LIFF] Init notice:", err);
    DOM.userName.textContent = "Web 測試模式";
  }
}

// ==========================================
// 2. Leaflet Map Initialization
// ==========================================

function initLeafletMap(): void {
  const map = L.map("map", {
    center: [state.currentLat, state.currentLon],
    zoom: 16,
    zoomControl: false,
  });

  L.control.zoom({ position: "topright" }).addTo(map);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const facilityGroup = L.layerGroup().addTo(map);

  const userIcon = L.divIcon({
    className: "user-marker-pulse",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  const userMarker = L.marker([state.currentLat, state.currentLon], {
    icon: userIcon,
    title: "您的位置",
  }).addTo(map);

  state.map = map;
  state.userMarker = userMarker;
  state.facilityLayerGroup = facilityGroup;

  // Map ready
  setTimeout(() => {
    map.invalidateSize();
    if (DOM.mapLoader) DOM.mapLoader.style.display = "none";
  }, 200);
}

// ==========================================
// 3. Markers & Popups
// ==========================================

function updateMapMarkers(): void {
  if (!state.map || !state.facilityLayerGroup || !state.data) return;

  state.facilityLayerGroup.clearLayers();
  state.markersMap.clear();

  const { youbikes, parkingLots, busStops = [] } = state.data;
  const showBikes = state.activeFilter === "all" || state.activeFilter === "bike";
  const showParking = state.activeFilter === "all" || state.activeFilter === "parking";
  const showBus = state.activeFilter === "all" || state.activeFilter === "bus";
  if (showBikes) {
    for (const b of youbikes) {
      const bikeIcon = L.divIcon({
        className: "bike-marker-pin",
        html: `🚲 ${b.availableBikes}`,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}&travelmode=walking`;
      const popupHtml = `
        <div class="custom-popup">
          <div class="popup-title">🚲 ${b.name}</div>
          <div class="popup-stats">
            <span>可借: <strong>${b.availableBikes}</strong> 台</span>
            <span>可還: <strong>${b.emptySpaces}</strong> 格</span>
          </div>
          <div class="popup-actions">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="popup-btn popup-btn-nav">開啟步行導航</a>
          </div>
        </div>
      `;

      const marker = L.marker([b.lat, b.lon], { icon: bikeIcon }).bindPopup(popupHtml);
      marker.addTo(state.facilityLayerGroup);
      state.markersMap.set(b.id, marker);
    }
  }

  if (showParking) {
    for (const p of parkingLots) {
      const parkingIcon = L.divIcon({
        className: "parking-marker-pin",
        html: `🅿 ${p.availableSpaces}`,
        iconSize: [44, 24],
        iconAnchor: [22, 12],
      });

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving`;
      const popupHtml = `
        <div class="custom-popup">
          <div class="popup-title">🅿 ${p.name}</div>
          <div class="popup-stats">
            <span>剩餘車位: <strong>${p.availableSpaces}</strong> / ${p.totalSpaces}</span>
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">費率: ${p.hourlyRate}</div>
          <div class="popup-actions">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="popup-btn popup-btn-nav">開啟開車導航</a>
          </div>
        </div>
      `;

      const marker = L.marker([p.lat, p.lon], { icon: parkingIcon }).bindPopup(popupHtml);
      marker.addTo(state.facilityLayerGroup);
      state.markersMap.set(p.id, marker);
    }
  }

  if (showBus) {
    for (const b of busStops) {
      const busIcon = L.divIcon({
        className: "bus-marker-pin",
        html: `🚌 ${b.name}`,
        iconSize: [60, 24],
        iconAnchor: [30, 12],
      });

      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}&travelmode=walking`;
      const routesSnippet = b.routes
        .slice(0, 4)
        .map((r) => `<div style="display:flex;justify-content:space-between;gap:8px;"><strong>${r.routeName}</strong><span>${r.statusText}</span></div>`)
        .join("");

      const popupHtml = `
        <div class="custom-popup">
          <div class="popup-title">🚌 ${b.name}</div>
          <div class="popup-stats" style="flex-direction:column;gap:3px;font-size:11px;">
            ${routesSnippet || "<div>暫無即時班次</div>"}
          </div>
          <div class="popup-actions" style="margin-top:6px;">
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="popup-btn popup-btn-nav">開啟步行導航</a>
          </div>
        </div>
      `;

      const marker = L.marker([b.lat, b.lon], { icon: busIcon }).bindPopup(popupHtml);
      marker.addTo(state.facilityLayerGroup);
      state.markersMap.set(b.id, marker);
    }
  }
}

function panToMarker(id: string, lat: number, lon: number): void {
  if (!state.map) return;

  state.map.flyTo([lat, lon], 17, { duration: 0.8 });
  const marker = state.markersMap.get(id);
  if (marker) {
    setTimeout(() => {
      marker.openPopup();
    }, 850);
  }

  // Smooth scroll to map on mobile
  const mapElem = document.getElementById("mapContainer");
  if (mapElem) {
    mapElem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// ==========================================
// 4. Data Fetching & UI Rendering
// ==========================================

async function fetchNearbyData(lat: number, lon: number): Promise<void> {
  DOM.listLoader.style.display = "flex";
  DOM.cardsGrid.innerHTML = "";
  DOM.emptyState.style.display = "none";
  DOM.refreshBtn.disabled = true;

  try {
    const res = await fetch(`/api/nearby?lat=${lat}&lon=${lon}&radius=1000`);
    if (!res.ok) {
      throw new Error(`API HTTP ${res.status}`);
    }

    const json = (await res.json()) as NearbyResponse;
    if (!json.success) {
      throw new Error(json.smartAdvice?.detail || "無法取得資料");
    }

    state.data = json;
    state.locationName = `${json.location.cityName} (${lat.toFixed(4)}, ${lon.toFixed(4)})`;

    // 1. Update Header Location & Weather
    DOM.locAddress.textContent = json.location.cityName;
    DOM.locCoords.textContent = `${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E`;

    const w = json.weather;
    DOM.weatherText.textContent = `${w.condition} ${w.minTemp}°~${w.maxTemp}°C • 降雨 ${w.rainProbability}%`;
    DOM.weatherIcon.textContent = w.rainProbability >= 50 ? "🌧️" : w.condition.includes("晴") ? "☀️" : "⛅";

    const updateTime = new Date(json.timestamp);
    DOM.updateTimeText.textContent = `最後更新：${updateTime.toLocaleTimeString("zh-TW", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })}`;

    // 2. Update Smart Advice Card
    const sa = json.smartAdvice;
    DOM.adviceTitle.textContent = sa.title;
    DOM.adviceSummary.textContent = sa.summary;
    DOM.adviceDetail.textContent = sa.detail;

    DOM.adviceSection.className = `advice-card advice-${sa.type}`;
    if (sa.type === "bike") {
      DOM.adviceIcon.textContent = "🚲";
      DOM.adviceTypeBadge.textContent = "單車推薦";
    } else if (sa.type === "parking") {
      DOM.adviceIcon.textContent = "🅿";
      DOM.adviceTypeBadge.textContent = "泊車推薦";
    } else if (sa.type === "weather") {
      DOM.adviceIcon.textContent = "☔";
      DOM.adviceTypeBadge.textContent = "天候提醒";
    } else {
      DOM.adviceIcon.textContent = "💡";
      DOM.adviceTypeBadge.textContent = "出行建議";
    }

    // 3. Update Counts
    const totalCount = json.youbikes.length + json.parkingLots.length + (json.busStops?.length || 0);
    DOM.countAll.textContent = String(totalCount);
    DOM.countBike.textContent = String(json.youbikes.length);
    DOM.countParking.textContent = String(json.parkingLots.length);
    DOM.countBus.textContent = String(json.busStops?.length || 0);
    // 4. Update Map & Markers
    if (state.userMarker) {
      state.userMarker.setLatLng([lat, lon]);
    }
    if (state.map) {
      state.map.panTo([lat, lon]);
    }
    updateMapMarkers();

    // 5. Render Cards List
    renderCardsList();
  } catch (err: unknown) {
    console.error("[fetchNearbyData] Error:", err);
    DOM.adviceSummary.textContent = "資料連線逾時或暫時無法連線 TDX 服務";
    DOM.adviceDetail.textContent = "請檢查網路連線或稍後再試。";
    DOM.emptyState.style.display = "block";
  } finally {
    DOM.listLoader.style.display = "none";
    DOM.refreshBtn.disabled = false;
  }
}

function renderCardsList(): void {
  if (!state.data) return;

  DOM.cardsGrid.innerHTML = "";
  const { youbikes, parkingLots, busStops = [] } = state.data;

  const showBikes = state.activeFilter === "all" || state.activeFilter === "bike";
  const showParking = state.activeFilter === "all" || state.activeFilter === "parking";
  const showBus = state.activeFilter === "all" || state.activeFilter === "bus";

  type CombinedItem =
    | { kind: "bike"; data: (typeof youbikes)[number] }
    | { kind: "parking"; data: (typeof parkingLots)[number] }
    | { kind: "bus"; data: (typeof busStops)[number] };

  const items: CombinedItem[] = [];
  if (showBikes) {
    for (const b of youbikes) items.push({ kind: "bike", data: b });
  }
  if (showParking) {
    for (const p of parkingLots) items.push({ kind: "parking", data: p });
  }
  if (showBus) {
    for (const b of busStops) items.push({ kind: "bus", data: b });
  }
  // Sort unified list by distance ascending
  items.sort((a, b) => a.data.distanceMeters - b.data.distanceMeters);

  if (items.length === 0) {
    DOM.emptyState.style.display = "block";
    return;
  }
  DOM.emptyState.style.display = "none";

  for (const item of items) {
    if (item.kind === "bike") {
      const b = item.data;
      const walkMins = Math.max(1, Math.round(b.distanceMeters / 80));
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}&travelmode=walking`;

      const card = document.createElement("div");
      card.className = "facility-card";
      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <span class="card-type-icon">🚲</span>
            <div class="card-name">${b.name}</div>
          </div>
          <span class="distance-tag">${b.distanceMeters}m • 步行 ${walkMins} 分</span>
        </div>
        <div class="card-metrics">
          <span class="metric-pill pill-rent">
            可借 <span class="metric-val">${b.availableBikes}</span> 台
          </span>
          <span class="metric-pill pill-return">
            可還 <span class="metric-val">${b.emptySpaces}</span> 格
          </span>
        </div>
        <div class="card-bottom">
          <span class="card-address" title="${b.address}">${b.address || "捷運/商圈周邊"}</span>
          <div class="card-actions">
            <button class="btn-card" data-action="locate" data-id="${b.id}" data-lat="${b.lat}" data-lon="${b.lon}">
              📍 查看
            </button>
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="btn-card btn-nav-action">
              🧭 導航
            </a>
          </div>
        </div>
      `;
      DOM.cardsGrid.appendChild(card);
    } else if (item.kind === "parking") {
      const p = item.data;
      const driveMins = Math.max(1, Math.round(p.distanceMeters / 300));
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}&travelmode=driving`;

      const card = document.createElement("div");
      card.className = "facility-card";
      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <span class="card-type-icon">🅿</span>
            <div class="card-name">${p.name}</div>
          </div>
          <span class="distance-tag">${p.distanceMeters}m • 車程 ${driveMins} 分</span>
        </div>
        <div class="card-metrics">
          <span class="metric-pill pill-parking-avail">
            剩餘 <span class="metric-val">${p.availableSpaces}</span> 格
          </span>
          <span class="metric-pill pill-rate">
            費率 ${p.hourlyRate}
          </span>
        </div>
        <div class="card-bottom">
          <span class="card-address" title="${p.address}">${p.address || p.description}</span>
          <div class="card-actions">
            <button class="btn-card" data-action="locate" data-id="${p.id}" data-lat="${p.lat}" data-lon="${p.lon}">
              📍 查看
            </button>
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="btn-card btn-nav-action">
              🧭 導航
            </a>
          </div>
        </div>
      `;
      DOM.cardsGrid.appendChild(card);
    } else if (item.kind === "bus") {
      const b = item.data;
      const walkMins = Math.max(1, Math.round(b.distanceMeters / 80));
      const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lon}&travelmode=walking`;

      const routePills = b.routes.map((r) => {
        const arrivingClass = r.isArrivingSoon ? "bus-route-arriving" : "";
        return `
          <span class="bus-route-pill ${arrivingClass}">
            <span class="bus-route-name">${r.routeName}</span>
            <span class="bus-route-eta">${r.statusText}</span>
          </span>
        `;
      }).join("");

      const card = document.createElement("div");
      card.className = "facility-card";
      card.innerHTML = `
        <div class="card-top">
          <div class="card-title-group">
            <span class="card-type-icon">🚌</span>
            <div class="card-name">${b.name}</div>
          </div>
          <span class="distance-tag">${b.distanceMeters}m • 步行 ${walkMins} 分</span>
        </div>
        <div class="bus-routes-wrap">
          ${routePills || '<span style="font-size:12px;color:var(--text-muted);">目前無即時到站路線</span>'}
        </div>
        <div class="card-bottom">
          <span class="card-address" title="${b.address}">${b.address || "幹道公車站牌"}</span>
          <div class="card-actions">
            <button class="btn-card" data-action="locate" data-id="${b.id}" data-lat="${b.lat}" data-lon="${b.lon}">
              📍 查看
            </button>
            <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="btn-card btn-nav-action">
              🧭 導航
            </a>
          </div>
        </div>
      `;
      DOM.cardsGrid.appendChild(card);
    }
  }
  // Bind view position buttons
  const locateButtons = DOM.cardsGrid.querySelectorAll<HTMLButtonElement>('button[data-action="locate"]');
  locateButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id") || "";
      const lat = parseFloat(btn.getAttribute("data-lat") || "0");
      const lon = parseFloat(btn.getAttribute("data-lon") || "0");
      if (lat && lon) {
        panToMarker(id, lat, lon);
      }
    });
  });
}

// ==========================================
// 5. Geolocation Handling
// ==========================================

function handleGetLocation(): void {
  DOM.locateBtn.disabled = true;
  DOM.locateBtn.querySelector(".btn-text")!.textContent = "定位中...";

  if (!navigator.geolocation) {
    alert("您的瀏覽器或裝置不支援 GPS 定位服務，將使用台北車站作為預設中心點。");
    fetchNearbyData(state.currentLat, state.currentLon);
    DOM.locateBtn.disabled = false;
    DOM.locateBtn.querySelector(".btn-text")!.textContent = "分享目前位置";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.currentLat = pos.coords.latitude;
      state.currentLon = pos.coords.longitude;
      fetchNearbyData(state.currentLat, state.currentLon);
      DOM.locateBtn.disabled = false;
      DOM.locateBtn.querySelector(".btn-text")!.textContent = "分享目前位置";
    },
    (err) => {
      console.warn("[Geolocation] Error:", err.message);
      alert("無法取得精確位置權限，已為您載入台北車站周邊即時交通資訊。");
      state.currentLat = DEFAULT_CONFIG.DEFAULT_LAT;
      state.currentLon = DEFAULT_CONFIG.DEFAULT_LON;
      fetchNearbyData(state.currentLat, state.currentLon);
      DOM.locateBtn.disabled = false;
      DOM.locateBtn.querySelector(".btn-text")!.textContent = "分享目前位置";
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000,
    }
  );
}

// ==========================================
// 6. Event Listeners & Bootstrapping
// ==========================================

function setupEventListeners(): void {
  DOM.locateBtn.addEventListener("click", handleGetLocation);

  DOM.refreshBtn.addEventListener("click", () => {
    fetchNearbyData(state.currentLat, state.currentLon);
  });

  DOM.centerMeBtn.addEventListener("click", () => {
    if (state.map) {
      state.map.flyTo([state.currentLat, state.currentLon], 16, { duration: 0.8 });
    }
  });

  DOM.themeToggleBtn.addEventListener("click", toggleTheme);

  DOM.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      DOM.tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const filter = btn.getAttribute("data-filter") as "all" | "bike" | "parking" | "bus";
      state.activeFilter = filter;
      updateMapMarkers();
      renderCardsList();
    });
  });
}

// ==========================================
// 7. Theme Management (Dual Cookie + LocalStorage)
// ==========================================

function getStoredTheme(): "light" | "dark" | null {
  // 1. Check document.cookie first
  const cookieMatch = document.cookie.match(/(?:^|;\s*)theme=([^;]+)/);
  if (cookieMatch && (cookieMatch[1] === "light" || cookieMatch[1] === "dark")) {
    return cookieMatch[1] as "light" | "dark";
  }

  // 2. Check localStorage as fallback
  try {
    const ls = localStorage.getItem("theme");
    if (ls === "light" || ls === "dark") return ls as "light" | "dark";
  } catch (e) {
    console.warn("[Theme] Storage read error:", e);
  }

  return null;
}

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.setAttribute("data-theme", theme);
  if (DOM.themeIcon) {
    DOM.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  }

  // Persist in Cookie (1 year duration, path=/, SameSite=Lax)
  document.cookie = `theme=${theme}; max-age=31536000; path=/; SameSite=Lax`;

  // Persist in LocalStorage
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    console.warn("[Theme] Storage write error:", e);
  }
}

function initTheme(): void {
  const saved = getStoredTheme();
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = saved || (prefersDark ? "dark" : "light");
  applyTheme(theme);
}

function toggleTheme(): void {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
}

async function bootstrap(): Promise<void> {
  initTheme();
  initLeafletMap();
  setupEventListeners();
  await initLiffApp();
  // Initial fetch with default coordinates
  await fetchNearbyData(state.currentLat, state.currentLon);
}

// Start application
bootstrap();
