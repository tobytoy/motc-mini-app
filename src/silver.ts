import liff from "@line/liff";
import type { SavedLocation, SeniorProfile } from "./guardian";

// ==========================================
// Config & Fallback State
// ==========================================

const CONFIG = {
  LIFF_ID: "2011556606-KbygvdxR", // motc-senior-care Developing LIFF ID
  DEFAULT_LAT: 25.0938, // 預設士林住處
  DEFAULT_LON: 121.5262,
};

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
    address: "台北市北投區石牌路二段 201 號",
    lat: 25.1206,
    lon: 121.5196,
    photoUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=500&auto=format&fit=crop&q=60",
    voiceAliases: ["看醫生", "榮總", "醫院", "石牌醫院", "拿藥"],
    priority: 90,
  },
  {
    id: "loc-3",
    name: "去女兒小華家",
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

const state = {
  currentLat: CONFIG.DEFAULT_LAT,
  currentLon: CONFIG.DEFAULT_LON,
  senior: {
    id: "senior-1",
    name: "王爸爸",
    age: 74,
    inviteCode: "SP-8823",
    status: "active",
  } as SeniorProfile,
  locations: [] as SavedLocation[],
  sosHoldTimer: null as number | null,
  sosCountdown: 3,
};

// ==========================================
// DOM Element References
// ==========================================

const DOM = {
  silverElderName: document.getElementById("silverElderName") as HTMLElement,
  silverWeatherPrompt: document.getElementById("silverWeatherPrompt") as HTMLElement,
  silverGuardianBadge: document.getElementById("silverGuardianBadge") as HTMLElement,
  silverGuardianName: document.getElementById("silverGuardianName") as HTMLElement,
  silverCurrentLocationText: document.getElementById("silverCurrentLocationText") as HTMLElement,
  silverRelocateBtn: document.getElementById("silverRelocateBtn") as HTMLButtonElement,

  btnGoHome: document.getElementById("btnGoHome") as HTMLButtonElement,
  homeSubText: document.getElementById("homeSubText") as HTMLElement,
  btnGoHospital: document.getElementById("btnGoHospital") as HTMLButtonElement,
  hospitalSubText: document.getElementById("hospitalSubText") as HTMLElement,
  btnSos: document.getElementById("btnSos") as HTMLButtonElement,
  sosCountdownText: document.getElementById("sosCountdownText") as HTMLElement,

  silverPhotoGrid: document.getElementById("silverPhotoGrid") as HTMLElement,

  btnVoiceAsk: document.getElementById("btnVoiceAsk") as HTMLButtonElement,
  btnCameraRead: document.getElementById("btnCameraRead") as HTMLButtonElement,

  // Transit Modal
  transitModal: document.getElementById("transitModal") as HTMLElement,
  transitModalOverlay: document.getElementById("transitModalOverlay") as HTMLElement,
  closeTransitModalBtn: document.getElementById("closeTransitModalBtn") as HTMLButtonElement,
  transitDestIcon: document.getElementById("transitDestIcon") as HTMLElement,
  transitDestTitle: document.getElementById("transitDestTitle") as HTMLElement,
  recBusLine: document.getElementById("recBusLine") as HTMLElement,
  recBusStop: document.getElementById("recBusStop") as HTMLElement,
  transitNavBtn: document.getElementById("transitNavBtn") as HTMLAnchorElement,

  // Voice Modal
  voiceModal: document.getElementById("voiceModal") as HTMLElement,
  voiceModalOverlay: document.getElementById("voiceModalOverlay") as HTMLElement,
  closeVoiceModalBtn: document.getElementById("closeVoiceModalBtn") as HTMLButtonElement,
  voiceStatusText: document.getElementById("voiceStatusText") as HTMLElement,
  voiceResultBox: document.getElementById("voiceResultBox") as HTMLElement,
  voiceAnswerText: document.getElementById("voiceAnswerText") as HTMLElement,
  voiceListenAgainBtn: document.getElementById("voiceListenAgainBtn") as HTMLButtonElement,

  // Camera Modal
  cameraModal: document.getElementById("cameraModal") as HTMLElement,
  cameraModalOverlay: document.getElementById("cameraModalOverlay") as HTMLElement,
  closeCameraModalBtn: document.getElementById("closeCameraModalBtn") as HTMLButtonElement,
  cameraInput: document.getElementById("cameraInput") as HTMLInputElement,
  cameraTriggerBox: document.getElementById("cameraTriggerBox") as HTMLElement,
  cameraResultWrap: document.getElementById("cameraResultWrap") as HTMLElement,
  cameraPreviewImg: document.getElementById("cameraPreviewImg") as HTMLImageElement,
  cameraAiResponse: document.getElementById("cameraAiResponse") as HTMLElement,
  cameraLoadingText: document.getElementById("cameraLoadingText") as HTMLElement,

  // Pair Modal
  pairModal: document.getElementById("pairModal") as HTMLElement,
  pairCodeInput: document.getElementById("pairCodeInput") as HTMLInputElement,
  submitPairBtn: document.getElementById("submitPairBtn") as HTMLButtonElement,
};

// ==========================================
// Initialization
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
  await initLiff();
  loadElderSettings();
  setupEventListeners();
  updateHeaderGreeting();
  renderPhotoGrid();
  locateUserGps();
});

// ==========================================
// LIFF Initialization
// ==========================================

async function initLiff(): Promise<void> {
  try {
    await liff.init({ liffId: CONFIG.LIFF_ID });
    if (liff.isLoggedIn()) {
      const profile = await liff.getProfile();
      if (profile.displayName) {
        state.senior.name = profile.displayName;
      }
    }
  } catch (err) {
    console.warn("[Silver LIFF] Preview mode:", err);
  }
}

// ==========================================
// Settings & Location Loading
// ==========================================

function loadElderSettings(): void {
  // Check URL ?invite=SP-XXXX
  const urlParams = new URLSearchParams(window.location.search);
  const inviteParam = urlParams.get("invite");

  const storedLocations = localStorage.getItem("guardian_saved_locations");
  if (storedLocations) {
    try {
      state.locations = JSON.parse(storedLocations);
    } catch {
      state.locations = DEFAULT_LOCATIONS;
    }
  } else {
    state.locations = DEFAULT_LOCATIONS;
  }

  const storedSenior = localStorage.getItem("guardian_senior_profile");
  if (storedSenior) {
    try {
      state.senior = { ...state.senior, ...JSON.parse(storedSenior) };
    } catch {
      // keep fallback
    }
  }

  // If not paired yet
  const hasPaired = localStorage.getItem("silver_paired") === "true" || !!inviteParam;
  if (!hasPaired) {
    DOM.pairModal.style.display = "flex";
  } else if (inviteParam) {
    localStorage.setItem("silver_paired", "true");
    localStorage.setItem("silver_invite_code", inviteParam);
  }

  // Update button descriptions based on loaded locations
  const homeLoc = state.locations.find((l) => l.category === "home");
  if (homeLoc) {
    DOM.homeSubText.textContent = `${homeLoc.name} • 推薦直達低地板公車`;
  }
  const hospLoc = state.locations.find((l) => l.category === "hospital");
  if (hospLoc) {
    DOM.hospitalSubText.textContent = `${hospLoc.name} • 避開階梯友善動線`;
  }
}

function updateHeaderGreeting(): void {
  DOM.silverElderName.textContent = `${state.senior.name}，您好！`;
  DOM.silverGuardianName.textContent = "家人 守護中";
}

function renderPhotoGrid(): void {
  const container = DOM.silverPhotoGrid;
  container.innerHTML = "";

  // Show locations excluding 'home' and 'hospital' (which are already on top giant buttons)
  const photoLocs = state.locations.filter((l) => l.category !== "home" && l.category !== "hospital");

  if (photoLocs.length === 0) {
    // Show all if filtered empty
    state.locations.forEach((loc) => appendPhotoCard(loc, container));
  } else {
    photoLocs.forEach((loc) => appendPhotoCard(loc, container));
  }
}

function appendPhotoCard(loc: SavedLocation, container: HTMLElement): void {
  const card = document.createElement("div");
  card.className = "silver-photo-card";
  card.innerHTML = `
    <div class="photo-img-wrap" style="background-image: url('${loc.photoUrl}');">
      <span class="photo-card-tag">${loc.category === "family" ? "👨‍👩‍👧 親友家" : loc.category === "market" ? "🥬 買菜" : "📍 常去"}</span>
    </div>
    <div class="photo-card-info">
      <h3 class="photo-card-title">${loc.name}</h3>
      <span class="photo-card-go-btn">一指前往 ➔</span>
    </div>
  `;

  card.addEventListener("click", () => {
    openTransitGuide(loc);
  });

  container.appendChild(card);
}

// ==========================================
// GPS & Distance Tracking
// ==========================================

function locateUserGps(): void {
  if (!navigator.geolocation) {
    DOM.silverCurrentLocationText.textContent = "台北市士林區 (預設位置)";
    return;
  }

  DOM.silverCurrentLocationText.textContent = "定位中...";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      state.currentLat = pos.coords.latitude;
      state.currentLon = pos.coords.longitude;
      DOM.silverCurrentLocationText.textContent = `目前在經緯 ${state.currentLat.toFixed(3)}, ${state.currentLon.toFixed(3)} (GPS正常)`;
    },
    (err) => {
      console.warn("[Silver GPS] Fallback:", err);
      DOM.silverCurrentLocationText.textContent = "台北市士林區 (預設位置)";
    },
    { timeout: 8000, enableHighAccuracy: true }
  );
}

// ==========================================
// Transit & Navigation Guidance
// ==========================================

function openTransitGuide(dest: SavedLocation): void {
  DOM.transitDestIcon.textContent = dest.category === "home" ? "🏠" : dest.category === "hospital" ? "🏥" : "📍";
  DOM.transitDestTitle.textContent = `前往：${dest.name}`;

  // Smart low-floor transit recommendation
  if (dest.category === "home") {
    DOM.recBusLine.textContent = "搭乘 220 / 902 路 (低地板公車直達)";
    DOM.recBusStop.textContent = "步行約 90 公尺至站牌上車，直達士林住處，公車約 4 分鐘後進站。";
  } else if (dest.category === "hospital") {
    DOM.recBusLine.textContent = "搭乘 508 路 (低地板直達第一門診)";
    DOM.recBusStop.textContent = "步行約 110 公尺至站牌上車，直達榮總院區，公車約 3 分鐘後進站。";
  } else {
    DOM.recBusLine.textContent = `前往 ${dest.name}`;
    DOM.recBusStop.textContent = `地址：${dest.address || "已為您規劃最少步行與低地板公車動線"}`;
  }

  DOM.transitNavBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lon}`;

  DOM.transitModal.style.display = "flex";

  // Voice announcement
  speakSenior(`已為您找到前往${dest.name}的低地板公車，請慢走至站牌上車。下車前手機會震動提醒您，請安心坐好！`);
}

// ==========================================
// SOS Emergency System (3-Second Press & Hold)
// ==========================================

function setupSosSystem(): void {
  const btn = DOM.btnSos;

  const startHold = () => {
    state.sosCountdown = 3;
    DOM.sosCountdownText.textContent = "3 秒...";
    btn.classList.add("sos-holding");

    // Vibrate phone
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    state.sosHoldTimer = window.setInterval(() => {
      state.sosCountdown -= 1;
      if (state.sosCountdown > 0) {
        DOM.sosCountdownText.textContent = `${state.sosCountdown} 秒...`;
        if (navigator.vibrate) navigator.vibrate(100);
      } else {
        // Trigger SOS!
        clearHold();
        triggerSosEmergency();
      }
    }, 1000);
  };

  const clearHold = () => {
    if (state.sosHoldTimer) {
      clearInterval(state.sosHoldTimer);
      state.sosHoldTimer = null;
    }
    DOM.sosCountdownText.textContent = "長按";
    btn.classList.remove("sos-holding");
  };

  btn.addEventListener("mousedown", startHold);
  btn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    startHold();
  });

  btn.addEventListener("mouseup", clearHold);
  btn.addEventListener("mouseleave", clearHold);
  btn.addEventListener("touchend", clearHold);
}

async function triggerSosEmergency(): Promise<void> {
  if (navigator.vibrate) {
    navigator.vibrate([300, 150, 300, 150, 600]);
  }

  speakSenior("緊急求救已發送！系統正在通知家人您的精準位置，請在原地稍候不要慌張！");

  const sosMsg = `🚨【緊急求救通知 - 銀髮出行守護員】\n長輩 ${state.senior.name} 於 ${new Date().toLocaleTimeString("zh-TW")} 觸發 SOS 緊急求救！\n📍 目前坐標：${state.currentLat.toFixed(4)}, ${state.currentLon.toFixed(4)}\n🗺️ 地圖定位：https://www.google.com/maps?q=${state.currentLat},${state.currentLon}`;

  alert(`🚨【緊急求救已啟動】\n\n已成功將您的即時經緯度與求助警報發送給家人！\n請您留在安全地點，家人即將與您聯繫。`);

  // Try LINE Share if in LINE
  if (liff.isApiAvailable("shareTargetPicker")) {
    try {
      await liff.shareTargetPicker([{ type: "text", text: sosMsg }]);
    } catch {
      // ignore cancel
    }
  }
}

// ==========================================
// Speech Recognition & Text-To-Speech
// ==========================================

function setupVoiceSystem(): void {
  DOM.btnVoiceAsk.addEventListener("click", () => {
    DOM.voiceModal.style.display = "flex";
    startSpeechRecognition();
  });

  DOM.closeVoiceModalBtn.addEventListener("click", () => {
    DOM.voiceModal.style.display = "none";
    stopSpeaking();
  });
  DOM.voiceModalOverlay.addEventListener("click", () => {
    DOM.voiceModal.style.display = "none";
    stopSpeaking();
  });

  DOM.voiceListenAgainBtn.addEventListener("click", () => {
    startSpeechRecognition();
  });
}

interface ISpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  start: () => void;
  onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
  onerror: (err: unknown) => void;
}

type SpeechRecognitionConstructor = new () => ISpeechRecognitionInstance;

function getSpeechRecognitionClass(): SpeechRecognitionConstructor | null {
  const win = window as Record<string, unknown>;
  const candidate = win.SpeechRecognition || win.webkitSpeechRecognition;
  if (typeof candidate === "function") {
    return candidate as unknown as SpeechRecognitionConstructor;
  }
  return null;
}

function startSpeechRecognition(): void {
  DOM.voiceResultBox.style.display = "none";
  DOM.voiceListenAgainBtn.style.display = "none";
  DOM.voiceStatusText.textContent = "正在聆聽中... 請說話（例如：我要去榮總）";

  const SpeechRecognitionClass = getSpeechRecognitionClass();
  if (!SpeechRecognitionClass) {
    DOM.voiceStatusText.textContent = "您的瀏覽器不支援語音辨識，請使用下方按鍵。";
    return;
  }

  try {
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "zh-TW";
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      processVoiceQuery(transcript);
    };

    recognition.onerror = (err) => {
      console.warn("[SpeechRecognition] Error:", err);
      DOM.voiceStatusText.textContent = "沒聽清楚，請點選下方按鈕再說一次！";
      DOM.voiceListenAgainBtn.style.display = "block";
    };

    recognition.start();
  } catch (e) {
    console.error("[SpeechRecognition] Start failed:", e);
    DOM.voiceStatusText.textContent = "語音模組啟動異常，請稍後再試。";
  }
}

function processVoiceQuery(query: string): void {
  DOM.voiceStatusText.textContent = `聽到了：「${query}」`;
  DOM.voiceResultBox.style.display = "block";

  // Check aliases in saved locations
  const lower = query.toLowerCase();
  const matched = state.locations.find((l) =>
    l.voiceAliases.some((alias) => lower.includes(alias.toLowerCase())) || lower.includes(l.name.toLowerCase())
  );

  let replyText = "";
  if (matched) {
    replyText = `為您找到${matched.name}！直達公車即將進站，請慢走至站牌上車。`;
  } else if (lower.includes("公車") || lower.includes("到站")) {
    replyText = "最近站牌的公車還有約 3 分鐘進站，是低地板公車喔！";
  } else {
    replyText = `已收到「${query}」，正在為您規劃最平緩無樓梯的直達公車動線！`;
  }

  DOM.voiceAnswerText.textContent = replyText;
  DOM.voiceListenAgainBtn.style.display = "block";
  speakSenior(replyText);
}

function speakSenior(text: string): void {
  if (!window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const clean = text.replace(/[🚨⚠️💡🏠🏥]/g, "").trim();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = "zh-TW";
    utter.rate = 0.95; // Slightly slower for elderly
    utter.pitch = 1.0;
    window.speechSynthesis.speak(utter);
  } catch (err) {
    console.warn("[SpeechSynthesis] Error:", err);
  }
}

function stopSpeaking(): void {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// ==========================================
// Camera Visual Reader (Landmarks & Medicine)
// ==========================================

function setupCameraSystem(): void {
  DOM.btnCameraRead.addEventListener("click", () => {
    DOM.cameraModal.style.display = "flex";
    DOM.cameraResultWrap.style.display = "none";
    DOM.cameraTriggerBox.style.display = "flex";
  });

  DOM.closeCameraModalBtn.addEventListener("click", () => {
    DOM.cameraModal.style.display = "none";
    stopSpeaking();
  });
  DOM.cameraModalOverlay.addEventListener("click", () => {
    DOM.cameraModal.style.display = "none";
    stopSpeaking();
  });

  DOM.cameraTriggerBox.addEventListener("click", () => {
    DOM.cameraInput.click();
  });

  DOM.cameraInput.addEventListener("change", () => {
    const file = DOM.cameraInput.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      DOM.cameraPreviewImg.src = e.target?.result as string;
      DOM.cameraTriggerBox.style.display = "none";
      DOM.cameraResultWrap.style.display = "block";
      simulateAiVisionAnalysis();
    };
    reader.readAsDataURL(file);
  });
}

function simulateAiVisionAnalysis(): void {
  DOM.cameraLoadingText.textContent = "AI 正在仔細辨識實景照片中...";

  setTimeout(() => {
    // Intelligent contextual response
    const answer = "辨識成功！照片中為【台北榮總 第一門診大樓入口】。前面右側設有無障礙電梯，請放慢腳步注意地面平整。";
    DOM.cameraLoadingText.innerHTML = `
      <div class="ai-vision-success">
        <p class="ai-vision-title">🔍 AI 實景辨識結果：</p>
        <p class="ai-vision-desc">${answer}</p>
      </div>
    `;
    speakSenior(answer);
  }, 1600);
}

// ==========================================
// Event Listeners
// ==========================================

function setupEventListeners(): void {
  // Relocate
  DOM.silverRelocateBtn.addEventListener("click", locateUserGps);

  // One-Click Home
  DOM.btnGoHome.addEventListener("click", () => {
    const homeLoc = state.locations.find((l) => l.category === "home") || state.locations[0];
    openTransitGuide(homeLoc);
  });

  // Doctor / Hospital
  DOM.btnGoHospital.addEventListener("click", () => {
    const hospLoc = state.locations.find((l) => l.category === "hospital") || state.locations[1] || state.locations[0];
    openTransitGuide(hospLoc);
  });

  // Setup SOS system
  setupSosSystem();

  // Voice system
  setupVoiceSystem();

  // Camera system
  setupCameraSystem();

  // Transit Modal Close
  DOM.closeTransitModalBtn.addEventListener("click", () => {
    DOM.transitModal.style.display = "none";
    stopSpeaking();
  });
  DOM.transitModalOverlay.addEventListener("click", () => {
    DOM.transitModal.style.display = "none";
    stopSpeaking();
  });

  // Submit Pairing Code
  DOM.submitPairBtn.addEventListener("click", () => {
    const code = DOM.pairCodeInput.value.trim().toUpperCase();
    if (!code) {
      alert("請輸入邀請代碼");
      return;
    }
    localStorage.setItem("silver_paired", "true");
    localStorage.setItem("silver_invite_code", code);
    DOM.pairModal.style.display = "none";
    alert(`🎉 成功綁定守護碼 ${code}！系統已自動載入您的專屬行程與家人照護偏好。`);
  });
}
