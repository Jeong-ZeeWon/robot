const STORAGE_KEY = "sioni-v41-state";
const LEGACY_STORAGE_KEYS = ["sioni-v4-state", "sioni-v3-state", "sioni-v2-state", "sioni-v1-state"];
const BOT_NAME = "시오니";

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const defaultState = {
  mood: 72,
  affection: 30,
  energy: 70,
  hunger: 38,
  loneliness: 20,
  firstSeen: null,
  lastVisit: null,
  lastVisitDate: null,
  visits: 0,
  streak: 1,
  bestStreak: 1,
  totalTalks: 0,
  voiceEnabled: true,
  completedMissions: {},
  missionDate: todayKey(),
  lastTopic: "첫 만남",
  recentResponseIds: [],
  lastFedAt: null,
  lastPlayedAt: null,
  lastSleptAt: null,
  sleepStartedAt: null,
  idleCount: 0,
};

const COOLDOWNS = {
  feed: 3 * 60 * 1000,
  play: 60 * 1000,
  sleep: 5 * 60 * 1000,
};

const el = {
  robot: document.querySelector("#robot"),
  face: document.querySelector("#face"),
  message: document.querySelector("#message"),
  microHint: document.querySelector("#microHint"),
  form: document.querySelector("#talkForm"),
  input: document.querySelector("#userInput"),
  voiceToggle: document.querySelector("#voiceToggle"),
  resetButton: document.querySelector("#resetButton"),
  moodLabel: document.querySelector("#moodLabel"),
  levelLabel: document.querySelector("#levelLabel"),
  levelBadge: document.querySelector("#levelBadge"),
  streakBadge: document.querySelector("#streakBadge"),
  lastSeen: document.querySelector("#lastSeen"),
  timeGreeting: document.querySelector("#timeGreeting"),
  missionList: document.querySelector("#missionList"),
  missionCount: document.querySelector("#missionCount"),
  memoryLine: document.querySelector("#memoryLine"),
  bars: {
    mood: document.querySelector("#moodBar"),
    affection: document.querySelector("#affectionBar"),
    energy: document.querySelector("#energyBar"),
    hunger: document.querySelector("#hungerBar"),
    loneliness: document.querySelector("#lonelinessBar"),
  },
  values: {
    mood: document.querySelector("#moodValue"),
    affection: document.querySelector("#affectionValue"),
    energy: document.querySelector("#energyValue"),
    hunger: document.querySelector("#hungerValue"),
    loneliness: document.querySelector("#lonelinessValue"),
  },
};

const missions = [
  { key: "greet", label: `${BOT_NAME}에게 인사하기` },
  { key: "pet", label: "한 번 쓰다듬기" },
  { key: "feed", label: "간식 주기" },
  { key: "mood", label: "오늘 기분 말하기" },
  { key: "sleep", label: "쉬게 하기" },
];

let state = loadState();
let tapCount = 0;
let tapTimer = null;
let holdTimer = null;
let idleTimer = null;
let longPressHandled = false;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { ...defaultState, ...saved };
  } catch {}

  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      const legacy = JSON.parse(localStorage.getItem(key));
      if (legacy) {
        return {
          ...defaultState,
          mood: legacy.mood ?? defaultState.mood,
          affection: legacy.affection ?? defaultState.affection,
          energy: legacy.energy ?? defaultState.energy,
          hunger: legacy.hunger ?? defaultState.hunger,
          loneliness: legacy.loneliness ?? defaultState.loneliness,
          firstSeen: legacy.firstSeen ?? null,
          lastVisit: legacy.lastVisit ?? null,
          lastVisitDate: legacy.lastVisitDate ?? null,
          visits: legacy.visits ?? 0,
          streak: legacy.streak ?? 1,
          bestStreak: legacy.bestStreak ?? 1,
          totalTalks: legacy.totalTalks ?? 0,
          voiceEnabled: legacy.voiceEnabled ?? true,
          completedMissions: legacy.completedMissions ?? {},
          missionDate: legacy.missionDate ?? todayKey(),
          lastTopic: legacy.lastTopic ?? "이전 기억",
          recentResponseIds: legacy.recentResponseIds ?? [],
          lastFedAt: legacy.lastFedAt ?? null,
          lastPlayedAt: legacy.lastPlayedAt ?? null,
          lastSleptAt: legacy.lastSleptAt ?? null,
          sleepStartedAt: legacy.sleepStartedAt ?? null,
        };
      }
    } catch {}
  }

  return { ...defaultState };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampAll() {
  ["mood", "affection", "energy", "hunger", "loneliness"].forEach((key) => {
    state[key] = clamp(state[key] ?? defaultState[key]);
  });
}

function tune(delta = {}) {
  ["mood", "affection", "energy", "hunger", "loneliness"].forEach((key) => {
    state[key] = clamp((state[key] ?? defaultState[key]) + (delta[key] ?? 0));
  });
  saveState();
  render(false);
}

function levelInfo() {
  const value = state.affection;
  if (value >= 85) return { level: 5, name: "특별한 사람", next: "이미 아주 가까워요" };
  if (value >= 65) return { level: 4, name: "단짝", next: `${85 - value}만큼 더 친해지면 특별한 사람` };
  if (value >= 45) return { level: 3, name: "포켓 친구", next: `${65 - value}만큼 더 친해지면 단짝` };
  if (value >= 25) return { level: 2, name: "아는 사이", next: `${45 - value}만큼 더 친해지면 포켓 친구` };
  return { level: 1, name: "처음 만난 사이", next: `${25 - value}만큼 더 친해지면 아는 사이` };
}

function moodInfo() {
  if (state.energy <= 18) return { label: "졸려요", face: "sleepy", theme: "sleepy" };
  if (state.hunger >= 82) return { label: "배고파요", face: "hungry", theme: "hungry" };
  if (state.loneliness >= 78) return { label: "조금 외로워요", face: "sad", theme: "sad" };
  if (state.mood >= 88) return { label: "반짝반짝 신나요", face: "excited", theme: "excited" };
  if (state.affection >= 78) return { label: "마음이 가까워요", face: "happy", theme: "happy" };
  if (state.mood <= 30) return { label: "조금 시무룩해요", face: "sad", theme: "sad" };
  return { label: "평온해요", face: "calm", theme: "calm" };
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "아직 깨어 있네요. 조용히 곁에 있을게요.";
  if (hour < 10) return "좋은 아침이에요. 오늘도 같이 시작해요.";
  if (hour < 13) return "점심 전의 시오니는 살짝 출출해요.";
  if (hour < 18) return "오후도 잘 버티고 있나요? 잠깐 쉬어가요.";
  if (hour < 22) return "오늘 하루 어땠어요? 시오니가 들어줄게요.";
  return "늦은 시간이네요. 오늘도 수고 많았어요.";
}

function daysBetween(dateA, dateB) {
  const a = new Date(`${dateA}T00:00:00`);
  const b = new Date(`${dateB}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

function minutesSince(iso) {
  if (!iso) return Infinity;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function cooldownLeft(action) {
  const key = action === "feed" ? "lastFedAt" : action === "play" ? "lastPlayedAt" : "lastSleptAt";
  const last = state[key];
  if (!last) return 0;
  const left = COOLDOWNS[action] - (Date.now() - new Date(last).getTime());
  return Math.max(0, left);
}

function cooldownText(ms) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds}초`;
  return `${Math.ceil(seconds / 60)}분`;
}

function resetDailyIfNeeded() {
  const today = todayKey();
  if (state.missionDate !== today) {
    state.missionDate = today;
    state.completedMissions = {};
  }
}

function applyTimeDrift(previousVisit) {
  if (!previousVisit) return;
  const awayMinutes = Math.max(0, Math.floor((Date.now() - new Date(previousVisit).getTime()) / 60000));
  if (awayMinutes < 2) return;

  const hungerGain = Math.min(34, Math.floor(awayMinutes / 30) * 2);
  const baseEnergyGain = Math.min(16, Math.floor(awayMinutes / 30) * 2);
  const lonelinessGain = awayMinutes >= 1440 ? 18 : awayMinutes >= 720 ? 10 : awayMinutes >= 180 ? 5 : 1;
  const moodLoss = awayMinutes >= 1440 ? 8 : awayMinutes >= 720 ? 4 : awayMinutes >= 180 ? 2 : 0;

  let sleepBonus = 0;
  if (state.sleepStartedAt) {
    const sleepMinutes = minutesSince(state.sleepStartedAt);
    sleepBonus = Math.min(24, Math.floor(sleepMinutes / 5) * 3);
    if (sleepMinutes > 60) state.sleepStartedAt = null;
  }

  state.hunger = clamp(state.hunger + hungerGain);
  state.energy = clamp(state.energy + baseEnergyGain + sleepBonus);
  state.loneliness = clamp(state.loneliness + lonelinessGain);
  state.mood = clamp(state.mood - moodLoss);
}

function updateVisitHistory() {
  const now = new Date();
  const today = todayKey();

  if (!state.firstSeen) state.firstSeen = now.toISOString();

  if (state.lastVisitDate && state.lastVisitDate !== today) {
    const diff = daysBetween(state.lastVisitDate, today);
    if (diff === 1) state.streak += 1;
    else state.streak = 1;
    state.bestStreak = Math.max(state.bestStreak || 1, state.streak);
  }

  if (!state.lastVisitDate) {
    state.streak = state.streak || 1;
    state.bestStreak = state.bestStreak || 1;
  }

  state.visits += 1;
  state.lastVisitDate = today;
  state.lastVisit = now.toISOString();
  saveState();
}

function setFace(faceName = "calm", themeName = faceName) {
  el.face.className = `face ${faceName}`;
  document.body.dataset.theme = themeName;
}

function animateRobot(type = "bounce") {
  const classes = Array.from(el.robot.classList).filter((name) => name.startsWith("is-motion-") || name === "is-bouncing" || name === "is-wiggling");
  classes.forEach((name) => el.robot.classList.remove(name));
  void el.robot.offsetWidth;
  el.robot.classList.add(`is-motion-${type || "bounce"}`);
}

function speak(text) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 0.96;
  utterance.pitch = 1.08;
  utterance.volume = 0.85;
  window.speechSynthesis.speak(utterance);
}

function rememberResponse(id) {
  state.recentResponseIds = Array.isArray(state.recentResponseIds) ? state.recentResponseIds : [];
  state.recentResponseIds.push(id);
  state.recentResponseIds = state.recentResponseIds.slice(-8);
}

function getResponse(category, replacements = {}) {
  const bank = window.SIONI_RESPONSES || {};
  const list = bank[category] || bank.unknown || [];
  if (!list.length) return { id: "fallback", text: "시오니가 잠깐 생각 중이에요.", face: "thinking", motion: "peek", delta: {} };

  const recent = new Set(state.recentResponseIds || []);
  let candidates = list.filter((item) => !recent.has(item.id));
  if (!candidates.length) candidates = list;
  const picked = candidates[Math.floor(Math.random() * candidates.length)];
  let text = picked.text;
  Object.entries(replacements).forEach(([key, value]) => {
    text = text.replaceAll(`{${key}}`, value);
  });
  rememberResponse(picked.id);
  return { ...picked, text };
}

function say(text, faceName = "calm", motion = "bounce", hint = "") {
  el.message.textContent = text.replaceAll("v3", "v4.1").replaceAll("포만감", "소화 상태");
  el.microHint.textContent = hint || "배고픔은 간식으로, 에너지는 쉬기로, 외로움은 쓰담과 인사로 돌봐주세요.";
  render(false);
  setFace(faceName, faceName);
  animateRobot(motion);
  speak(el.message.textContent);
  resetIdleTimer();
}

function respond(category, options = {}) {
  const response = getResponse(category, options.replacements || {});
  const delta = { ...(response.delta || {}), ...(options.delta || {}) };
  delete delta.fullness;
  if (Object.keys(delta).length) tune(delta);
  if (options.topic) state.lastTopic = options.topic;
  saveState();
  say(response.text, options.face || response.face || "calm", options.motion || response.motion || "bounce", options.hint || response.hint || "");
}

function completeMission(key) {
  resetDailyIfNeeded();
  state.completedMissions[key] = true;
  saveState();
  render(false);
}

function statusSentence() {
  const level = levelInfo();
  return `Lv.${level.level} ${level.name}, 기분 ${state.mood}, 친밀도 ${state.affection}, 에너지 ${state.energy}, 배고픔 ${state.hunger}, 외로움 ${state.loneliness}이에요.`;
}

function getUndoneMission() {
  return missions.find((mission) => !state.completedMissions[mission.key]);
}

function render(updateFaceFromMood = true) {
  resetDailyIfNeeded();
  clampAll();

  Object.keys(el.bars).forEach((key) => {
    if (!el.bars[key] || !el.values[key]) return;
    el.bars[key].style.width = `${state[key]}%`;
    el.values[key].textContent = state[key];
  });

  const mood = moodInfo();
  const level = levelInfo();
  el.moodLabel.textContent = mood.label;
  el.levelLabel.textContent = `Lv.${level.level} ${level.name} · ${level.next}`;
  el.levelBadge.textContent = `Lv.${level.level} ${level.name}`;
  el.streakBadge.textContent = `연속 ${state.streak || 1}일 · 최고 ${state.bestStreak || 1}일`;
  el.timeGreeting.textContent = timeGreeting();
  el.voiceToggle.textContent = state.voiceEnabled ? "🔊" : "🔇";
  el.voiceToggle.setAttribute("aria-pressed", String(state.voiceEnabled));

  if (updateFaceFromMood) setFace(mood.face, mood.theme);

  const completed = missions.filter((mission) => state.completedMissions[mission.key]).length;
  el.missionCount.textContent = `${completed}/${missions.length}`;
  el.missionList.innerHTML = missions
    .map((mission) => {
      const done = Boolean(state.completedMissions[mission.key]);
      return `<li class="${done ? "done" : ""}"><span class="check-dot">${done ? "✓" : ""}</span>${mission.label}</li>`;
    })
    .join("");

  const feedLeft = cooldownLeft("feed");
  const playLeft = cooldownLeft("play");
  const cooldownLine = [
    feedLeft ? `간식 ${cooldownText(feedLeft)}` : "간식 가능",
    playLeft ? `놀이 ${cooldownText(playLeft)}` : "놀이 가능",
  ].join(" · ");

  el.memoryLine.textContent = `총 ${state.visits || 0}번 만났고, ${state.totalTalks || 0}번 이야기했어요. 최근 기억: ${state.lastTopic || "아직 없음"}. ${cooldownLine}`;

  if (state.lastVisit) {
    const diff = Date.now() - new Date(state.lastVisit).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) el.lastSeen.textContent = "방금 만났어요";
    else if (minutes < 60) el.lastSeen.textContent = `${minutes}분 전 만남`;
    else if (minutes < 1440) el.lastSeen.textContent = `${Math.floor(minutes / 60)}시간 전 만남`;
    else el.lastSeen.textContent = `${Math.floor(minutes / 1440)}일 전 만남`;
  } else {
    el.lastSeen.textContent = "처음 만났어요";
  }
}

function classify(text) {
  if (includesAny(text, ["안녕", "하이", "hello", "ㅎㅇ"])) return "greeting";
  if (includesAny(text, ["힘들", "피곤", "지쳤", "아파", "고단", "녹초"])) return "tired";
  if (includesAny(text, ["슬퍼", "우울", "속상", "눈물", "외로", "허전"])) return "sad";
  if (includesAny(text, ["기뻐", "좋은 일", "성공", "잘됐", "행복", "신나"])) return "joy";
  if (includesAny(text, ["화나", "짜증", "열받", "분해", "억울"])) return "angry";
  if (includesAny(text, ["불안", "걱정", "두려", "무서", "염려"])) return "anxious";
  if (includesAny(text, ["심심", "놀자", "재미", "지루"])) return "bored";
  if (includesAny(text, ["사랑", "좋아", "귀여", "고마워", "최고", "잘했"])) return "praise";
  if (includesAny(text, ["잘자", "자자", "졸려", "잠", "자러"])) return "sleep";
  if (includesAny(text, ["배고", "밥", "간식", "먹"])) return "hungry";
  if (includesAny(text, ["기도", "교회", "말씀", "예배", "찬양"])) return "faith";
  if (includesAny(text, ["오늘 뭐", "뭐하지", "미션", "할 일"])) return "mission";
  if (includesAny(text, ["레벨", "상태", "친밀", "몇 번", "기억", "게이지"])) return "status";
  if (includesAny(text, ["이름", "누구", "너는", "소개"])) return "intro";
  if (includesAny(text, ["깜짝", "놀라", "어?"])) return "surprise";
  return "unknown";
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function handlePet() {
  if (longPressHandled) {
    longPressHandled = false;
    return;
  }

  tapCount += 1;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => (tapCount = 0), 1100);

  if (tapCount >= 4) {
    tapCount = 0;
    completeMission("pet");
    respond("surprise", { delta: { mood: 2, affection: 1, energy: -2, loneliness: -2 }, topic: "연속 터치", hint: "빠르게 여러 번 누르면 놀라는 반응이 나와요." });
    return;
  }

  const effect = tapCount === 1 ? { mood: 2, affection: 2, loneliness: -3 } : { mood: 1, affection: 1, loneliness: -2 };
  completeMission("pet");
  respond("pet", { delta: effect, topic: "쓰다듬기" });
}

function handleFeed() {
  const left = cooldownLeft("feed");
  if (left > 0) {
    respond("fedCooldown", { topic: "간식 쿨타임", hint: `간식은 ${cooldownText(left)} 뒤에 다시 효과가 좋아져요.` });
    return;
  }

  state.lastFedAt = new Date().toISOString();
  completeMission("feed");
  respond("fedSuccess", {
    delta: { hunger: -10, mood: 2, affection: 1, energy: 1 },
    topic: "간식 주기",
    motion: "charge",
    hint: "간식은 배고픔을 조금 낮춰요. 너무 자주 주면 쿨타임이 걸려요.",
  });
}

function handlePlay() {
  const left = cooldownLeft("play");
  if (state.energy <= 20) {
    respond("lowEnergy", { topic: "에너지 부족" });
    return;
  }
  if (state.hunger >= 86) {
    respond("tooHungry", { topic: "배고픔" });
    return;
  }
  if (left > 0) {
    respond("playCooldown", { topic: "놀이 쿨타임", hint: `놀이는 ${cooldownText(left)} 뒤에 다시 좋아져요.` });
    return;
  }

  const hungerPenalty = state.hunger >= 70 ? 0.6 : 1;
  state.lastPlayedAt = new Date().toISOString();
  respond("bored", {
    delta: { mood: Math.round(8 * hungerPenalty), affection: 3, energy: -12, hunger: 6, loneliness: -10 },
    topic: "놀이",
    motion: "bounce",
    hint: "놀이는 기분을 올리지만 에너지와 배고픔을 함께 소모해요.",
  });
}

function handleSleep() {
  const left = cooldownLeft("sleep");
  if (state.energy >= 86) {
    respond("rested", { delta: { mood: 1 }, topic: "충분한 에너지", hint: "에너지가 높을 때는 쉬기 효과가 작아요." });
    return;
  }
  if (left > 0) {
    respond("rested", { delta: { energy: 1, mood: 1 }, topic: "수면 쿨타임", hint: `쉬기는 ${cooldownText(left)} 뒤에 다시 효과가 좋아져요.` });
    return;
  }

  state.lastSleptAt = new Date().toISOString();
  state.sleepStartedAt = state.lastSleptAt;
  completeMission("sleep");
  respond("rested", {
    delta: { energy: 5, mood: 2, loneliness: -3 },
    topic: "쉬기",
    motion: "sleepy",
    hint: "쉬기는 즉시 조금만 회복되고, 시간이 지나며 추가 회복돼요.",
  });
}

function handleTalk(rawText) {
  const text = normalize(rawText);
  if (!text) return;

  state.totalTalks += 1;
  tune({ energy: -2, hunger: 1, loneliness: -3, affection: 1 });

  const category = classify(text);
  const missionCategory = ["tired", "sad", "joy", "angry", "anxious"].includes(category) ? "mood" : null;
  if (category === "greeting") completeMission("greet");
  if (category === "sleep") completeMission("sleep");
  if (missionCategory) completeMission("mood");

  if (category === "mission") {
    const undone = getUndoneMission();
    respond("mission", {
      replacements: { mission: undone ? undone.label : "오늘 미션 완료" },
      topic: "미션",
      hint: undone ? "미션을 완료하면 체크리스트가 채워져요." : "오늘 미션은 모두 완료했어요.",
    });
    return;
  }

  if (category === "status") {
    respond("status", { replacements: { status: statusSentence() }, topic: "상태 확인" });
    return;
  }

  respond(category, { topic: categoryToTopic(category) });
}

function categoryToTopic(category) {
  const names = {
    greeting: "인사",
    tired: "위로",
    sad: "슬픔",
    joy: "기쁨",
    angry: "화난 마음",
    anxious: "불안",
    bored: "심심함",
    praise: "칭찬",
    sleep: "잠",
    hungry: "배고픔",
    faith: "신앙 단어",
    intro: "자기소개",
    surprise: "놀람",
    unknown: "자유 대화",
  };
  return names[category] || category;
}

function firstMessageForVisit(previousVisit) {
  if (!previousVisit) return `${timeGreeting()} 저는 시오니 v4.1이에요. 이제 각 돌봄 버튼의 역할을 한 화면에서 바로 볼 수 있어요.`;

  const hoursAway = (Date.now() - new Date(previousVisit).getTime()) / 36e5;
  if (hoursAway > 72) return "오랜만이에요… 조금 배고프고 외로웠지만, 다시 와줘서 정말 좋아요.";
  if (hoursAway > 24) return "하루 만에 다시 만났네요. 기다린 만큼 더 반가워요.";
  if (hoursAway > 6) return "다시 왔네요. 오늘은 어떤 이야기를 해볼까요?";
  return `${timeGreeting()} 방금 전에도 만난 것 같은데, 그래도 또 반가워요.`;
}

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    state.idleCount = (state.idleCount || 0) + 1;
    if (state.idleCount === 1) respond("unknown", { delta: { loneliness: 2 }, topic: "기다림", hint: "가만히 두면 시오니가 가끔 먼저 반응해요." });
    else if (state.idleCount === 2) respond("sleep", { delta: { energy: 1, loneliness: 2 }, topic: "졸림" });
  }, 90000);
}

function bindEvents() {
  el.robot.addEventListener("click", handlePet);

  el.robot.addEventListener("pointerdown", () => {
    longPressHandled = false;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      longPressHandled = true;
      tune({ mood: 2, affection: 4, energy: -1, loneliness: -5 });
      respond("pet", { face: "shy", motion: "pulse", topic: "길게 누르기", hint: "길게 누르면 포근한 반응이 나와요." });
    }, 750);
  });

  ["pointerup", "pointerleave", "pointercancel"].forEach((eventName) => {
    el.robot.addEventListener(eventName, () => clearTimeout(holdTimer));
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "pet") handlePet();
      if (action === "feed") handleFeed();
      if (action === "play") handlePlay();
      if (action === "sleep") handleSleep();
    });
  });

  document.querySelectorAll("[data-say]").forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.dataset.say;
      el.input.value = value;
      handleTalk(value);
      el.input.value = "";
    });
  });

  el.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = el.input.value;
    el.input.value = "";
    handleTalk(value);
  });

  el.voiceToggle.addEventListener("click", () => {
    state.voiceEnabled = !state.voiceEnabled;
    if (!state.voiceEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
    saveState();
    respond(state.voiceEnabled ? "greeting" : "sleep", { topic: "목소리 설정" });
  });

  el.resetButton.addEventListener("click", () => {
    const ok = confirm("시오니의 저장된 상태를 초기화할까요?");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState, firstSeen: new Date().toISOString() };
    saveState();
    render(true);
    say("초기화 완료예요. 우리 다시 처음부터 친해져요.", "happy", "bounce");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

resetDailyIfNeeded();
const previousVisit = state.lastVisit;
applyTimeDrift(previousVisit);
bindEvents();
updateVisitHistory();
render(true);
say(firstMessageForVisit(previousVisit), moodInfo().face, "peek", "v4.1 정리판: 포만감 표시를 없애고 돌봄 역할을 바로 보이게 바꿨어요.");
