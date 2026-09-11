import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ==========================================
// Config & Interfaces
// ==========================================

const SUPABASE_CONFIG = {
  URL: "https://gkttoczebvhpqgcuwhtd.supabase.co",
  ANON_KEY: "sb_publishable_vsBNsY0zmLn8qKhvgaHrHQ_W0e9qtzm",
};

export interface SavedLocation {
  id: string;
  name: string;
  category: "home" | "hospital" | "family" | "market" | "custom";
  address: string;
  lat: number;
  lon: number;
  photoUrl: string;
  voiceAliases: string[];
  priority: number;
}

export interface SeniorProfile {
  id: string;
  name: string;
  age: number;
  lineUserId?: string;
  inviteCode: string;
  status: "active" | "pending_bind";
  avoidStairs: boolean;
  preferElevator: boolean;
  maxWalkingMeters: number;
  requireLowFloorBus: boolean;
}

export interface TripLogItem {
  id: string;
  eventType: "depart" | "arrive" | "sos" | "stay_alert";
  locationName: string;
  message: string;
  timestamp: string;
}

// ==========================================
// Local Mock Fallback Data (Offline/Dev First)
// ==========================================

const DEFAULT_LOCATIONS: SavedLocation[] = [
  {
    id: "loc-1",
    name: "家 (士林住處)",
    category: "home",
    address: "台北市士林區中正路 247 號",
    lat: 25.0938,
    lon: 121.5262,
    photoUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60",
    voiceAliases: ["家", "回家", "士林住處"],
    priority: 100,
  },
  {
    id: "loc-2",
    name: "看醫生 (台北榮總)",
    category: "hospital",
    address: "台北市北投區石牌路二段 201 號 (第一門診)",
    lat: 25.1206,
    lon: 121.5196,
    photoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&auto=format&fit=crop&q=60",
    voiceAliases: ["看醫生", "榮總", "醫院", "石牌醫院", "拿藥"],
    priority: 90,
  },
  {
    id: "loc-3",
    name: "女兒小華家",
    category: "family",
    address: "台北市大安區新生南路二段 86 號",
    lat: 25.0298,
    lon: 121.5338,
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60",
    voiceAliases: ["女兒家", "小華家", "大安家"],
    priority: 80,
  },
  {
    id: "loc-4",
    name: "士東市場 (買菜)",
    category: "market",
    address: "台北市士林區士東路 100 號",
    lat: 25.1118,
    lon: 121.5312,
    photoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60",
    voiceAliases: ["買菜", "市場", "菜市場", "士東"],
    priority: 70,
  },
];

const DEFAULT_TRIP_LOGS: TripLogItem[] = [
  {
    id: "log-1",
    eventType: "arrive",
    locationName: "台北榮民總醫院 (看醫生)",
    message: "王爸爸已順利抵達台北榮總第一門診大樓，行程耗時 22 分鐘 (搭乘 508 路低地板公車)。",
    timestamp: "今天 09:42",
  },
  {
    id: "log-2",
    eventType: "depart",
    locationName: "家 (士林住處)",
    message: "長輩點擊「看醫生」出發，系統已自動規劃步行 120m 避階梯平緩動線至公車站牌。",
    timestamp: "今天 09:20",
  },
  {
    id: "log-3",
    eventType: "arrive",
    locationName: "家 (士林住處)",
    message: "長輩平安返家，已進入地理圍欄住家範圍。",
    timestamp: "昨天 16:15",
  },
];

// ==========================================
// App State
// ==========================================

let supabase: SupabaseClient | null = null;

try {
  supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
} catch (e) {
  console.warn("[Guardian] Supabase client init offline:", e);
}

const state = {
  user: null as { email: string; id: string } | null,
  senior: {
    id: "senior-1",
    name: "王爸爸",
    age: 74,
    lineUserId: "U4b5e0d89e7e372b2fb2cf6fb61a62ec7",
    inviteCode: "SP-8823",
    status: "active",
    avoidStairs: true,
    preferElevator: true,
    maxWalkingMeters: 300,
    requireLowFloorBus: true,
  } as SeniorProfile,
  locations: [] as SavedLocation[],
  tripLogs: [] as TripLogItem[],
  geminiKey: localStorage.getItem("guardian_gemini_api_key") || "",
  geminiModel: localStorage.getItem("guardian_gemini_model") || "gemini-3.1-flash-lite",
};

// ==========================================
// DOM References
// ==========================================

const DOM = {
  authUserInfo: document.getElementById("authUserInfo") as HTMLElement,
  authGuestInfo: document.getElementById("authGuestInfo") as HTMLElement,
  userEmailText: document.getElementById("userEmailText") as HTMLElement,
  logoutBtn: document.getElementById("logoutBtn") as HTMLButtonElement,
  openAuthModalBtn: document.getElementById("openAuthModalBtn") as HTMLButtonElement,

  seniorNameText: document.getElementById("seniorNameText") as HTMLElement,
  seniorAgeText: document.getElementById("seniorAgeText") as HTMLElement,
  seniorStatusBadge: document.getElementById("seniorStatusBadge") as HTMLElement,
  seniorLineBindingText: document.getElementById("seniorLineBindingText") as HTMLElement,
  editSeniorBtn: document.getElementById("editSeniorBtn") as HTMLButtonElement,

  pairingQrcodeImg: document.getElementById("pairingQrcodeImg") as HTMLImageElement,
  inviteCodeDisplay: document.getElementById("inviteCodeDisplay") as HTMLElement,
  copyInviteBtn: document.getElementById("copyInviteBtn") as HTMLButtonElement,
  regenInviteBtn: document.getElementById("regenInviteBtn") as HTMLButtonElement,

  geminiApiKeyInput: document.getElementById("geminiApiKeyInput") as HTMLInputElement,
  testGeminiBtn: document.getElementById("testGeminiBtn") as HTMLButtonElement,
  saveGeminiBtn: document.getElementById("saveGeminiBtn") as HTMLButtonElement,
  geminiStatusPill: document.getElementById("geminiStatusPill") as HTMLElement,
  geminiModelSelect: document.getElementById("geminiModelSelect") as HTMLSelectElement,
  refreshModelsBtn: document.getElementById("refreshModelsBtn") as HTMLButtonElement,

  locationsGrid: document.getElementById("locationsGrid") as HTMLElement,
  addLocationBtn: document.getElementById("addLocationBtn") as HTMLButtonElement,

  tripLogsTimeline: document.getElementById("tripLogsTimeline") as HTMLElement,
  refreshLogsBtn: document.getElementById("refreshLogsBtn") as HTMLButtonElement,

  // Auth Modal
  authModal: document.getElementById("authModal") as HTMLElement,
  authModalOverlay: document.getElementById("authModalOverlay") as HTMLElement,
  closeAuthModalBtn: document.getElementById("closeAuthModalBtn") as HTMLButtonElement,
  tabLogin: document.getElementById("tabLogin") as HTMLButtonElement,
  tabRegister: document.getElementById("tabRegister") as HTMLButtonElement,
  authForm: document.getElementById("authForm") as HTMLFormElement,
  authEmailInput: document.getElementById("authEmailInput") as HTMLInputElement,
  authPasswordInput: document.getElementById("authPasswordInput") as HTMLInputElement,
  authNameInput: document.getElementById("authNameInput") as HTMLInputElement,
  registerNameField: document.getElementById("registerNameField") as HTMLElement,
  authSubmitBtn: document.getElementById("authSubmitBtn") as HTMLButtonElement,

  // Loc Modal
  locModal: document.getElementById("locModal") as HTMLElement,
  locModalOverlay: document.getElementById("locModalOverlay") as HTMLElement,
  closeLocModalBtn: document.getElementById("closeLocModalBtn") as HTMLButtonElement,
  cancelLocBtn: document.getElementById("cancelLocBtn") as HTMLButtonElement,
  locForm: document.getElementById("locForm") as HTMLFormElement,
  locCategorySelect: document.getElementById("locCategorySelect") as HTMLSelectElement,
  locNameInput: document.getElementById("locNameInput") as HTMLInputElement,
  locAddressInput: document.getElementById("locAddressInput") as HTMLInputElement,
  locLatInput: document.getElementById("locLatInput") as HTMLInputElement,
  locLonInput: document.getElementById("locLonInput") as HTMLInputElement,
  locPhotoUrlInput: document.getElementById("locPhotoUrlInput") as HTMLInputElement,
  locAliasesInput: document.getElementById("locAliasesInput") as HTMLInputElement,
};

// ==========================================
// Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  loadStoredData();
  setupEventListeners();
  updateAuthUI();
  updateSeniorUI();
  renderQrcode();
  renderGeminiKeyUI();
  renderLocations();
  renderTripLogs();
});

// ==========================================
// Data Persistence
// ==========================================

function loadStoredData(): void {
  // Load locations
  const storedLocs = localStorage.getItem("guardian_saved_locations");
  if (storedLocs) {
    try {
      state.locations = JSON.parse(storedLocs);
    } catch {
      state.locations = DEFAULT_LOCATIONS;
    }
  } else {
    state.locations = DEFAULT_LOCATIONS;
    localStorage.setItem("guardian_saved_locations", JSON.stringify(DEFAULT_LOCATIONS));
  }

  // Load senior profile
  const storedSenior = localStorage.getItem("guardian_senior_profile");
  if (storedSenior) {
    try {
      state.senior = JSON.parse(storedSenior);
    } catch {
      // keep default
    }
  }

  // Load trip logs
  state.tripLogs = DEFAULT_TRIP_LOGS;
}

function saveLocations(): void {
  localStorage.setItem("guardian_saved_locations", JSON.stringify(state.locations));
  renderLocations();
}

function saveSenior(): void {
  localStorage.setItem("guardian_senior_profile", JSON.stringify(state.senior));
  updateSeniorUI();
  renderQrcode();
}

// ==========================================
// UI Rendering Functions
// ==========================================

function updateAuthUI(): void {
  if (state.user) {
    DOM.authUserInfo.style.display = "flex";
    DOM.authGuestInfo.style.display = "none";
    DOM.userEmailText.textContent = state.user.email;
  } else {
    DOM.authUserInfo.style.display = "none";
    DOM.authGuestInfo.style.display = "block";
  }
}

function updateSeniorUI(): void {
  DOM.seniorNameText.textContent = state.senior.name;
  DOM.seniorAgeText.textContent = `${state.senior.age} 歲`;
  DOM.inviteCodeDisplay.textContent = state.senior.inviteCode;

  if (state.senior.status === "active") {
    DOM.seniorStatusBadge.className = "senior-status-badge status-active";
    DOM.seniorStatusBadge.textContent = "🟢 守護中";
    DOM.seniorLineBindingText.textContent = `LINE 帳號綁定：已綁定 (${state.senior.lineUserId ? state.senior.lineUserId.slice(0, 8) + "..." : "已配對"})`;
  } else {
    DOM.seniorStatusBadge.className = "senior-status-badge status-pending";
    DOM.seniorStatusBadge.textContent = "⏳ 等待長輩掃碼";
    DOM.seniorLineBindingText.textContent = "LINE 帳號綁定：尚未配對，請長輩掃描右側條碼";
  }
}

function renderQrcode(): void {
  const inviteUrl = `https://miniapp.line.me/2011556606-KbygvdxR?invite=${state.senior.inviteCode}`;
  // High-reliability QuickChart SVG QR code generator
  const qrUrl = `https://quickchart.io/qr?text=${encodeURIComponent(inviteUrl)}&size=200&dark=0f172a`;
  DOM.pairingQrcodeImg.src = qrUrl;
}

function renderGeminiKeyUI(): void {
  if (state.geminiKey) {
    DOM.geminiApiKeyInput.value = state.geminiKey;
    DOM.geminiStatusPill.className = "status-pill-ok";
    DOM.geminiStatusPill.textContent = "🟢 已設定金鑰";
  } else {
    DOM.geminiStatusPill.className = "status-pill-warn";
    DOM.geminiStatusPill.textContent = "⚠️ 尚未設定金鑰";
  }
  if (DOM.geminiModelSelect) {
    DOM.geminiModelSelect.value = state.geminiModel;
  }
}

async function fetchAndPopulateGeminiModels(key: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!resp.ok) return false;
    const data = (await resp.json()) as {
      models?: Array<{
        name: string;
        displayName: string;
        description?: string;
        supportedGenerationMethods?: string[];
      }>;
    };

    const validModels = (data.models || []).filter((m) =>
      m.supportedGenerationMethods?.includes("generateContent")
    );

    if (validModels.length > 0 && DOM.geminiModelSelect) {
      DOM.geminiModelSelect.innerHTML = "";
      validModels.forEach((m) => {
        const id = m.name.replace("models/", "");
        const opt = document.createElement("option");
        opt.value = id;

        let badge = "🤖";
        if (id.includes("flash-lite")) badge = "⚡ [極速省額度]";
        else if (id.includes("flash")) badge = "🚀 [全能多模態]";
        else if (id.includes("pro")) badge = "🧠 [深度推理旗艦]";

        opt.textContent = `${badge} ${id} (${m.displayName || id})`;
        if (id === state.geminiModel) {
          opt.selected = true;
        }
        DOM.geminiModelSelect.appendChild(opt);
      });

      // Ensure valid selection
      if (!validModels.some((m) => m.name.replace("models/", "") === state.geminiModel)) {
        const fallback = validModels.find((m) => m.name.includes("flash-lite")) || validModels[0];
        state.geminiModel = fallback.name.replace("models/", "");
        DOM.geminiModelSelect.value = state.geminiModel;
      }

      localStorage.setItem("guardian_gemini_model", state.geminiModel);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[Gemini Models] Fetch error:", err);
    return false;
  }
}

function renderLocations(): void {
  const container = DOM.locationsGrid;
  container.innerHTML = "";

  state.locations.forEach((loc) => {
    const card = document.createElement("div");
    card.className = `location-dash-card category-${loc.category}`;
    card.innerHTML = `
      <div class="loc-card-thumb" style="background-image: url('${loc.photoUrl}');">
        <span class="loc-category-badge">${getCategoryBadge(loc.category)}</span>
      </div>
      <div class="loc-card-content">
        <div class="loc-card-header">
          <h4 class="loc-name">${loc.name}</h4>
          <span class="loc-coords">${loc.lat.toFixed(4)}, ${loc.lon.toFixed(4)}</span>
        </div>
        <p class="loc-address">📍 ${loc.address}</p>
        <div class="loc-aliases-row">
          ${loc.voiceAliases.map((a) => `<span class="alias-pill">🗣️ "${a}"</span>`).join("")}
        </div>
        <div class="loc-card-actions">
          <a href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lon}" target="_blank" class="btn btn-outline btn-xs">
            <span>🧭 預覽導航</span>
          </a>
          <button class="btn btn-outline btn-xs btn-delete-loc" data-id="${loc.id}">
            <span>🗑️ 刪除</span>
          </button>
        </div>
      </div>
    `;

    const delBtn = card.querySelector(".btn-delete-loc");
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        if (confirm(`確定要刪除常用地點「${loc.name}」嗎？長者端首頁按鍵將同步移除。`)) {
          state.locations = state.locations.filter((l) => l.id !== loc.id);
          saveLocations();
        }
      });
    }

    container.appendChild(card);
  });
}

function getCategoryBadge(cat: SavedLocation["category"]): string {
  switch (cat) {
    case "home":
      return "🏠 住家首選";
    case "hospital":
      return "🏥 醫療門診";
    case "family":
      return "👨‍👩‍👧 親友住所";
    case "market":
      return "🥬 菜市場/超市";
    default:
      return "📍 常去地點";
  }
}

function renderTripLogs(): void {
  const container = DOM.tripLogsTimeline;
  container.innerHTML = "";

  state.tripLogs.forEach((log) => {
    const item = document.createElement("div");
    item.className = `log-timeline-item type-${log.eventType}`;
    item.innerHTML = `
      <div class="log-icon-col">
        <span class="log-event-icon">${getEventIcon(log.eventType)}</span>
      </div>
      <div class="log-content-col">
        <div class="log-header-row">
          <span class="log-location-title">${log.locationName}</span>
          <span class="log-timestamp">${log.timestamp}</span>
        </div>
        <p class="log-message-text">${log.message}</p>
      </div>
    `;
    container.appendChild(item);
  });
}

function getEventIcon(type: TripLogItem["eventType"]): string {
  switch (type) {
    case "arrive":
      return "✅";
    case "depart":
      return "🚶‍♂️";
    case "sos":
      return "🚨";
    case "stay_alert":
      return "⏳";
    default:
      return "📍";
  }
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners(): void {
  // Copy invite code
  DOM.copyInviteBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.senior.inviteCode);
    alert(`邀請代碼 ${state.senior.inviteCode} 已複製！長輩在手機端輸入此代碼即可一鍵綁定。`);
  });

  // Regenerate invite code
  DOM.regenInviteBtn.addEventListener("click", () => {
    const randomCode = "SP-" + Math.floor(1000 + Math.random() * 9000);
    state.senior.inviteCode = randomCode;
    saveSenior();
    alert(`已為長者產生新邀請碼：${randomCode}`);
  });

  // Edit senior profile
  DOM.editSeniorBtn.addEventListener("click", () => {
    const newName = prompt("請輸入長輩姓名 (稱呼)：", state.senior.name);
    if (newName && newName.trim()) {
      state.senior.name = newName.trim();
      saveSenior();
    }
  });

  // Save Gemini Key
  // Save Gemini Key & Model
  DOM.saveGeminiBtn.addEventListener("click", () => {
    const key = DOM.geminiApiKeyInput.value.trim();
    if (!key) {
      alert("請輸入有效的 Gemini API Key");
      return;
    }
    state.geminiKey = key;
    state.geminiModel = DOM.geminiModelSelect.value;
    localStorage.setItem("guardian_gemini_api_key", key);
    localStorage.setItem("guardian_gemini_model", state.geminiModel);
    renderGeminiKeyUI();
    alert(`Gemini 設定已成功儲存！\n目前指定模型：${state.geminiModel}\n長輩端已開通自然語音問路與視覺看藥袋功能。`);
  });

  // Model selection change
  DOM.geminiModelSelect.addEventListener("change", () => {
    state.geminiModel = DOM.geminiModelSelect.value;
    localStorage.setItem("guardian_gemini_model", state.geminiModel);
  });

  // Refresh models list button
  DOM.refreshModelsBtn.addEventListener("click", async () => {
    const key = DOM.geminiApiKeyInput.value.trim() || state.geminiKey;
    if (!key) {
      alert("請先輸入您的 Gemini API Key 再更新模型清單");
      return;
    }
    DOM.refreshModelsBtn.disabled = true;
    DOM.refreshModelsBtn.textContent = "更新中...";
    const ok = await fetchAndPopulateGeminiModels(key);
    DOM.refreshModelsBtn.disabled = false;
    DOM.refreshModelsBtn.textContent = "🔄 即時更新模型清單";
    if (ok) {
      alert("🎉 已從 Google 伺服器同步您帳號的最新可用模型！");
    } else {
      alert("無法取得模型清單，請確認 API Key 是否正確。");
    }
  });

  // Test Gemini Key and populate models
  DOM.testGeminiBtn.addEventListener("click", async () => {
    const key = DOM.geminiApiKeyInput.value.trim();
    if (!key) {
      alert("請先輸入金鑰再進行測試");
      return;
    }
    DOM.testGeminiBtn.disabled = true;
    DOM.testGeminiBtn.textContent = "連線驗證中...";
    try {
      const ok = await fetchAndPopulateGeminiModels(key);
      if (ok) {
        state.geminiKey = key;
        localStorage.setItem("guardian_gemini_api_key", key);
        renderGeminiKeyUI();
        alert(`🎉 驗證成功！已成功連線 Google API 並為您載入所有授權模型！\n請直接由下方下拉選單選取您欲使用的模型（推薦 gemini-3.1-flash-lite）。`);
      } else {
        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const err = await resp.text();
        alert(`驗證失敗 (HTTP ${resp.status}):\n${err}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`連線逾時或網路錯誤: ${msg}`);
    } finally {
      DOM.testGeminiBtn.disabled = false;
      DOM.testGeminiBtn.textContent = "驗證連線並載入模型";
    }
  });

  // Add Location Modal
  DOM.addLocationBtn.addEventListener("click", () => {
    DOM.locModal.style.display = "flex";
  });

  DOM.closeLocModalBtn.addEventListener("click", () => {
    DOM.locModal.style.display = "none";
  });
  DOM.cancelLocBtn.addEventListener("click", () => {
    DOM.locModal.style.display = "none";
  });
  DOM.locModalOverlay.addEventListener("click", () => {
    DOM.locModal.style.display = "none";
  });

  // Submit Location Form
  DOM.locForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = DOM.locNameInput.value.trim();
    const category = DOM.locCategorySelect.value as SavedLocation["category"];
    const address = DOM.locAddressInput.value.trim();
    const lat = parseFloat(DOM.locLatInput.value);
    const lon = parseFloat(DOM.locLonInput.value);
    const photoUrl = DOM.locPhotoUrlInput.value.trim() || getDefaultCategoryPhoto(category);
    const aliases = DOM.locAliasesInput.value
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean);

    const newLoc: SavedLocation = {
      id: "loc-" + Date.now(),
      name,
      category,
      address,
      lat,
      lon,
      photoUrl,
      voiceAliases: aliases.length > 0 ? aliases : [name],
      priority: 50,
    };

    state.locations.push(newLoc);
    saveLocations();
    DOM.locModal.style.display = "none";
    DOM.locForm.reset();
    alert(`成功新增「${name}」！長者端首頁卡片已即刻同步。`);
  });

  // Auth Modal
  DOM.openAuthModalBtn.addEventListener("click", () => {
    DOM.authModal.style.display = "flex";
  });
  DOM.closeAuthModalBtn.addEventListener("click", () => {
    DOM.authModal.style.display = "none";
  });
  DOM.authModalOverlay.addEventListener("click", () => {
    DOM.authModal.style.display = "none";
  });

  // Auth Tabs
  DOM.tabLogin.addEventListener("click", () => {
    DOM.tabLogin.classList.add("active");
    DOM.tabRegister.classList.remove("active");
    DOM.registerNameField.style.display = "none";
    DOM.authSubmitBtn.textContent = "登入";
  });
  DOM.tabRegister.addEventListener("click", () => {
    DOM.tabRegister.classList.add("active");
    DOM.tabLogin.classList.remove("active");
    DOM.registerNameField.style.display = "block";
    DOM.authSubmitBtn.textContent = "註冊新帳號";
  });

  // Submit Auth
  DOM.authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = DOM.authEmailInput.value.trim();
    const password = DOM.authPasswordInput.value;
    const isRegister = DOM.tabRegister.classList.contains("active");

    DOM.authSubmitBtn.disabled = true;
    DOM.authSubmitBtn.textContent = isRegister ? "註冊中..." : "登入中...";

    try {
      if (supabase) {
        if (isRegister) {
          const { data, error } = await supabase.auth.signUp({ email, password });
          if (error) throw error;
          alert("註冊成功！若有收到確認信請先完成驗證。");
          if (data.user) {
            state.user = { email: data.user.email || email, id: data.user.id };
          }
        } else {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          alert("登入成功！已載入您的守護者管理資料。");
          if (data.user) {
            state.user = { email: data.user.email || email, id: data.user.id };
          }
        }
      } else {
        // Mock fallback
        state.user = { email, id: "mock-user-123" };
        alert(isRegister ? "註冊成功 (本機預覽模式)" : "登入成功 (本機預覽模式)");
      }
      updateAuthUI();
      DOM.authModal.style.display = "none";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`操作失敗: ${msg}`);
    } finally {
      DOM.authSubmitBtn.disabled = false;
      DOM.authSubmitBtn.textContent = isRegister ? "註冊新帳號" : "登入";
    }
  });

  // Logout
  DOM.logoutBtn.addEventListener("click", async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    state.user = null;
    updateAuthUI();
    alert("您已成功登出。");
  });

  // Refresh Logs
  DOM.refreshLogsBtn.addEventListener("click", () => {
    renderTripLogs();
    alert("日誌已更新至最新狀態！");
  });
}

function getDefaultCategoryPhoto(cat: SavedLocation["category"]): string {
  switch (cat) {
    case "home":
      return "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60";
    case "hospital":
      return "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&auto=format&fit=crop&q=60";
    case "family":
      return "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=60";
    case "market":
      return "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60";
    default:
      return "https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=500&auto=format&fit=crop&q=60";
  }
}
