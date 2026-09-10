import liff from "@line/liff";
import metadataData from "./data/apiMetadata.json";
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
const ALL_APIS: ApiMetadataItem[] = metadataData as ApiMetadataItem[];

const CONFIG = {
  LIFF_ID: "2011521041-JnfPdXhF",
  THEME_STORAGE_KEY: "motc_app_theme",
  TDX_BASE: "https://tdx.transportdata.tw/data-service/basic"
};

// DOM references
const DOM = {
  searchInput: document.getElementById("searchInput") as HTMLInputElement,
  clearSearchBtn: document.getElementById("clearSearchBtn") as HTMLButtonElement,
  voiceSearchBtn: document.getElementById("voiceSearchBtn") as HTMLButtonElement,
  citySelect: document.getElementById("citySelect") as unknown as HTMLSelectElement,
  restrictedSelect: document.getElementById("restrictedSelect") as unknown as HTMLSelectElement,
  categoryTabs: document.querySelectorAll<HTMLButtonElement>(".category-scroll-tabs .tab-btn"),
  resultsCountText: document.getElementById("resultsCountText") as HTMLElement,
  apiCardsGrid: document.getElementById("apiCardsGrid") as HTMLElement,
  emptyState: document.getElementById("emptyState") as HTMLElement,
  listLoader: document.getElementById("listLoader") as HTMLElement,
  themeToggleBtn: document.getElementById("themeToggleBtn") as HTMLButtonElement,
  themeIcon: document.getElementById("themeIcon") as HTMLElement,
  userName: document.getElementById("userName") as HTMLElement,
  userAvatar: document.getElementById("userAvatar") as HTMLElement,
  toast: document.getElementById("toast") as HTMLElement,
  toastMsg: document.getElementById("toastMsg") as HTMLElement
};

// State
const state = {
  query: "",
  selectedCity: "",
  selectedCategory: "",
  selectedRestricted: "" as "" | "true" | "false",
  specialFilter: "" as "" | "hot" | "new",
  filteredList: [...ALL_APIS],
  debounceTimer: null as number | null
};

// ==========================================
// 1. Search & Filter Engine
// ==========================================

function filterAndRender(): void {
  const q = state.query.trim().toLowerCase();
  const qNorm = q.replace(/台/g, "臺");
  const city = state.selectedCity.toLowerCase();
  const category = state.selectedCategory;
  const restricted = state.selectedRestricted;

  state.filteredList = ALL_APIS.filter((item) => {
    // Special filters: Hot or New
    if (state.specialFilter === "hot" && !item.isHot) return false;
    if (state.specialFilter === "new" && !item.isNew) return false;

    // 1. Category filter
    if (category && item.category !== category) {
      return false;
    }
    // 2. Restricted filter
    if (restricted === "true" && !item.restricted) return false;
    if (restricted === "false" && item.restricted) return false;

    // 3. City filter
    if (city) {
      const pLower = item.path.toLowerCase();
      const nLower = item.name.toLowerCase();
      const dLower = item.desc.toLowerCase();
      const nNorm = nLower.replace(/台/g, "臺");

      const codeMap: Record<string, string> = {
        taipei: "tpe",
        newtaipei: "nwt",
        taoyuan: "tao",
        taichung: "txg",
        tainan: "tnn",
        kaohsiung: "khh",
        keelung: "kee",
        hsinchu: "hsz",
        hsinchucounty: "hsq",
        miaolicounty: "mia",
        changhuacounty: "cha",
        nantoucounty: "nan",
        yunlincounty: "yun",
        chiayi: "cyi",
        chiayicounty: "cyq",
        pingtungcounty: "pif",
        yilancounty: "ila",
        hualiencounty: "hua",
        taitungcounty: "ttt",
        penghucounty: "pen",
        kinmencounty: "kin",
        lienchiangcounty: "lie",
      };
      const code = codeMap[city] || "";

      const matchCity =
        pLower.includes(city) ||
        (code && pLower.includes(`/${code}/`)) ||
        (code && pLower.endsWith(`/${code}`)) ||
        (code && nLower.includes(code)) ||
        nLower.includes(city) ||
        dLower.includes(city) ||
        nNorm.includes(city);
      if (!matchCity) return false;
    }

    // 4. Keyword query filter
    if (q.length > 0) {
      const nLower = item.name.toLowerCase();
      const dLower = item.desc.toLowerCase();
      const pLower = item.path.toLowerCase();
      const tLower = item.theme.toLowerCase();
      const nNorm = nLower.replace(/台/g, "臺");

      // Match query or normalized form
      const matched =
        nLower.includes(q) ||
        nNorm.includes(qNorm) ||
        dLower.includes(q) ||
        pLower.includes(q) ||
        tLower.includes(q);

      if (!matched) {
        // If compound word >= 4 chars, test bigrams
        if (q.length >= 4) {
          const w1 = q.slice(0, 2);
          const w2 = q.slice(2);
          if (!nLower.includes(w1) && !nLower.includes(w2) && !dLower.includes(w1) && !dLower.includes(w2)) {
            return false;
          }
        } else {
          return false;
        }
      }
    }

    return true;
  });

  renderCards();
}

function renderCards(): void {
  DOM.resultsCountText.textContent = `共找到 ${state.filteredList.length} 支 API 資料集`;

  if (state.filteredList.length === 0) {
    DOM.emptyState.style.display = "block";
    DOM.apiCardsGrid.innerHTML = "";
    return;
  }

  DOM.emptyState.style.display = "none";
  DOM.apiCardsGrid.innerHTML = "";

  // Render top 50 to maintain smooth scrolling performance
  const displayItems = state.filteredList.slice(0, 50);

  const fragment = document.createDocumentFragment();

  for (const api of displayItems) {
    const isPublic = !api.restricted;
    const badgeText = isPublic ? "🟢 免審核" : "🔒 專案審查";
    const badgeClass = isPublic ? "badge-public" : "badge-restricted";

    const card = document.createElement("div");
    card.className = "api-card";
    card.innerHTML = `
      <div class="api-card-badge-strip">
        <div class="badge-strip-left">
          <span class="api-method-badge method-${api.method.toLowerCase()}">${api.method}</span>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="badge-strip-right">
          ${api.isHot ? `<span class="badge badge-hot">${escapeHtml(api.hotBadge || "🔥 HOT")}</span>` : ""}
          ${api.isNew ? `<span class="badge badge-new">${escapeHtml(api.newBadge || "🆕 NEW")}</span>` : ""}
        </div>
      </div>
      <div class="api-title-wrap">
        <h3 class="api-name">${escapeHtml(api.name)}</h3>
      </div>
      ${api.desc && api.desc !== api.name ? `<p class="api-desc">${escapeHtml(api.desc)}</p>` : ""}

      <div class="api-path-box" data-copy="${escapeHtml(api.fullUrl)}" title="點擊複製完整 API 網址">
        <span class="path-code">${escapeHtml(api.fullUrl)}</span>
        <button class="copy-btn" data-copy="${escapeHtml(api.fullUrl)}" title="複製完整網址">📋</button>
      </div>

      <div class="api-meta-strip">
        <span class="meta-item">🏷️ <strong>${escapeHtml(api.category)}</strong></span>
        <span class="meta-item">📁 ${escapeHtml(api.domain || api.theme)}</span>
        ${api.publishedDate ? `<span class="meta-item">📅 ${escapeHtml(api.publishedDate)}</span>` : ""}
        <span class="meta-item">⏱️ ${escapeHtml(api.updateFreq)}</span>
        <span class="meta-item">📦 ${escapeHtml(api.format)}</span>
      </div>
      <div class="api-card-actions">
        <button class="btn-card btn-copy-action" data-copy="${escapeHtml(api.fullUrl)}" title="複製完整 API 請求網址">
          📋 複製完整網址
        </button>
        <button class="btn-card" data-copy="${escapeHtml(api.curlCmd)}" title="複製 cURL 呼叫語法">
          💻 複製 cURL
        </button>
        <button class="btn-card btn-portal-action" data-external-url="${CONFIG.TDX_BASE}" title="前往 TDX 官網資料服務說明">
          🌐 前往 TDX 官網
        </button>
      </div>
    `;
    fragment.appendChild(card);
  }

  DOM.apiCardsGrid.appendChild(fragment);

  // Bind copy handlers
  DOM.apiCardsGrid.querySelectorAll<HTMLElement>("[data-copy]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const text = el.getAttribute("data-copy") || "";
      const isCurl = text.startsWith("curl");
      copyToClipboard(text);
      showToast(isCurl ? "💻 已複製 cURL 語法！" : "📋 已複製完整 API 網址！");
    });
  });

  // Bind external URL handlers (using LIFF openWindow)
  DOM.apiCardsGrid.querySelectorAll<HTMLElement>("[data-external-url]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = el.getAttribute("data-external-url") || CONFIG.TDX_BASE;
      openExternalUrl(url);
    });
  });
}

function openExternalUrl(url: string): void {
  try {
    if (liff && typeof liff.isInClient === "function" && liff.isInClient()) {
      liff.openWindow({ url, external: true });
      return;
    }
  } catch (e) {
    console.warn("[LIFF] openWindow error:", e);
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message: string): void {
  DOM.toastMsg.textContent = message;
  DOM.toast.style.display = "flex";
  DOM.toast.classList.add("toast-show");
  setTimeout(() => {
    DOM.toast.classList.remove("toast-show");
    setTimeout(() => {
      DOM.toast.style.display = "none";
    }, 200);
  }, 2000);
}

function copyToClipboard(text: string): void {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      () => showToast(`已複製路徑：${text.slice(0, 30)}...`),
      () => fallbackCopy(text)
    );
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand("copy");
    showToast(`已複製路徑！`);
  } catch {
    alert("複製失敗，請手動複製路徑。");
  }
  document.body.removeChild(ta);
}

// ==========================================
// 2. Theme Handling
// ==========================================

function initTheme(): void {
  const saved = localStorage.getItem(CONFIG.THEME_STORAGE_KEY) || "light";
  applyTheme(saved);
}

function applyTheme(theme: string): void {
  document.documentElement.setAttribute("data-theme", theme);
  DOM.themeIcon.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem(CONFIG.THEME_STORAGE_KEY, theme);
}

function toggleTheme(): void {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

// ==========================================
// 3. Event Handlers & URL Query Support
// ==========================================

function parseUrlParams(): void {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const city = params.get("city") || "";
  const category = params.get("category") || "";

  if (q) {
    state.query = q;
    DOM.searchInput.value = q;
    DOM.clearSearchBtn.style.display = "block";
  }

  if (city) {
    state.selectedCity = city;
    DOM.citySelect.value = city;
  }

  if (category) {
    state.selectedCategory = category;
    DOM.categoryTabs.forEach((btn) => {
      if (btn.getAttribute("data-cat") === category) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }
}

function setupEventListeners(): void {
  // Search input
  DOM.searchInput.addEventListener("input", () => {
    state.query = DOM.searchInput.value;
    DOM.clearSearchBtn.style.display = state.query.length > 0 ? "block" : "none";

    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => {
      filterAndRender();
    }, 150);
  });

  // Clear button
  DOM.clearSearchBtn.addEventListener("click", () => {
    state.query = "";
    DOM.searchInput.value = "";
    DOM.clearSearchBtn.style.display = "none";
    filterAndRender();
  });

  // City dropdown
  DOM.citySelect.addEventListener("change", () => {
    state.selectedCity = DOM.citySelect.value;
    filterAndRender();
  });

  // Restricted dropdown
  DOM.restrictedSelect.addEventListener("change", () => {
    state.selectedRestricted = DOM.restrictedSelect.value as "" | "true" | "false";
    filterAndRender();
  });

  // Category tabs
  DOM.categoryTabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      DOM.categoryTabs.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const special = btn.getAttribute("data-special");
      if (special === "hot" || special === "new") {
        state.specialFilter = special;
        state.selectedCategory = "";
      } else {
        state.selectedCategory = btn.getAttribute("data-cat") || "";
        state.specialFilter = "";
      }
      filterAndRender();
    });
  });

  // Theme toggle
  DOM.themeToggleBtn.addEventListener("click", toggleTheme);
  setupVoiceSearch();
}

// ==========================================
// 4. Web Speech API Voice Search
// ==========================================

interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
    length: number;
  };
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: Event & { error?: string }) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

let activeRecognition: SpeechRecognitionInstance | null = null;
let isListening = false;

function setupVoiceSearch(): void {
  if (!DOM.voiceSearchBtn) return;

  const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionAPI) {
    DOM.voiceSearchBtn.title = "您的瀏覽器暫不支援語音辨識";
    DOM.voiceSearchBtn.addEventListener("click", () => {
      showToast("⚠️ 您的瀏覽器或裝置暫不支援語音辨識，請使用文字輸入。");
    });
    return;
  }

  DOM.voiceSearchBtn.addEventListener("click", () => {
    if (isListening && activeRecognition) {
      activeRecognition.stop();
      return;
    }

    try {
      const recognition = new SpeechRecognitionAPI();
      activeRecognition = recognition;
      recognition.lang = "zh-TW";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        isListening = true;
        DOM.voiceSearchBtn.classList.add("listening");
        DOM.voiceSearchBtn.textContent = "🔴";
        DOM.searchInput.placeholder = "🎙️ 正在聆聽中，請說出搜尋關鍵字...";
        showToast("🎙️ 正在聆聽中，請說出想查詢的交通資料...");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (event.results.length > 0) {
          let transcript = event.results[0][0].transcript.trim();
          // Strip trailing punctuation
          transcript = transcript.replace(/[。，！？.!?]+$/, "");
          if (transcript) {
            state.query = transcript;
            DOM.searchInput.value = transcript;
            DOM.clearSearchBtn.style.display = "block";
            filterAndRender();
            showToast(`🎙️ 語音辨識成功：「${transcript}」`);
          }
        }
      };

      recognition.onerror = (err) => {
        console.warn("[SpeechRecognition] Error:", err.error);
        if (err.error === "not-allowed") {
          showToast("⚠️ 請允許瀏覽器麥克風權限以使用語音搜尋。");
        } else if (err.error !== "no-speech") {
          showToast("⚠️ 語音辨識未偵測到聲音，請再試一次。");
        }
      };

      recognition.onend = () => {
        isListening = false;
        activeRecognition = null;
        DOM.voiceSearchBtn.classList.remove("listening");
        DOM.voiceSearchBtn.textContent = "🎙️";
        DOM.searchInput.placeholder = "搜尋 API 名稱、端點或關鍵字 (例：公車動態、停車場、易肇事)";
      };

      recognition.start();
    } catch (error) {
      console.error("[SpeechRecognition] Failed to start:", error);
      showToast("⚠️ 無法啟動語音辨識，請檢查裝置權限。");
    }
  });
}

// ==========================================
// 4. LIFF Initialization
// ==========================================

async function initLiff(): Promise<void> {
  try {
    await liff.init({ liffId: CONFIG.LIFF_ID });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      DOM.userName.textContent = profile.displayName || "使用者";
      if (profile.pictureUrl) {
        DOM.userAvatar.innerHTML = `<img src="${profile.pictureUrl}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" />`;
      }
    } else {
      DOM.userName.textContent = "訪客探員";
    }
  } catch (err) {
    console.warn("[LIFF] Init error (running in standard web mode):", err);
    DOM.userName.textContent = "探員模式";
  }
}

// ==========================================
// 5. Bootstrap
// ==========================================

function init(): void {
  initTheme();
  parseUrlParams();
  setupEventListeners();
  filterAndRender();
  initLiff();
}

document.addEventListener("DOMContentLoaded", init);
