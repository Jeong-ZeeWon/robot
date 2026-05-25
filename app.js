const STORAGE_KEY = "sioni-v7-state";
const LEGACY_STORAGE_KEYS = ["sioni-v41-state", "sioni-v4-state", "sioni-v3-state", "sioni-v2-state", "sioni-v1-state"];
const BOT_NAME = "시오니";
const COOLDOWN_MS = 10 * 1000;

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
  growthXp: 0,
  memoryCards: [],
  memoryEngine: null,
  personalityStats: {
    kindness: 28,
    curiosity: 24,
    bravery: 18,
    sparkle: 22,
  },
  favoriteMood: "아직 몰라요",
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
  v6PersonaName: document.querySelector("#v6PersonaName"),
  v6PersonaText: document.querySelector("#v6PersonaText"),
  v6GrowthBadge: document.querySelector("#v6GrowthBadge"),
  v6GrowthBar: document.querySelector("#v6GrowthBar"),
  v6GrowthText: document.querySelector("#v6GrowthText"),
  v6MemoryList: document.querySelector("#v6MemoryList"),
  v6Insight: document.querySelector("#v6Insight"),
  v6Kindness: document.querySelector("#v6Kindness"),
  v6Curiosity: document.querySelector("#v6Curiosity"),
  v6Bravery: document.querySelector("#v6Bravery"),
  v6Sparkle: document.querySelector("#v6Sparkle"),
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
    if (saved) {
      return {
        ...defaultState,
        ...saved,
        memoryCards: Array.isArray(saved.memoryCards) ? saved.memoryCards : [],
        memoryEngine: window.SioniMemoryEngine?.ensure(saved.memoryEngine) || saved.memoryEngine || null,
        personalityStats: { ...defaultState.personalityStats, ...(saved.personalityStats || {}) },
      };
    }
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
          growthXp: legacy.growthXp ?? 0,
          memoryCards: Array.isArray(legacy.memoryCards) ? legacy.memoryCards : [],
          memoryEngine: window.SioniMemoryEngine?.ensure(legacy.memoryEngine) || null,
          personalityStats: { ...defaultState.personalityStats, ...(legacy.personalityStats || {}) },
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

function clampPersonality() {
  state.personalityStats = { ...defaultState.personalityStats, ...(state.personalityStats || {}) };
  Object.keys(defaultState.personalityStats).forEach((key) => {
    state.personalityStats[key] = clamp(state.personalityStats[key]);
  });
}

function tunePersonality(delta = {}) {
  clampPersonality();
  Object.entries(delta).forEach(([key, value]) => {
    if (!(key in state.personalityStats)) return;
    state.personalityStats[key] = clamp(state.personalityStats[key] + value);
  });
}

function growthInfo() {
  const xp = Math.max(0, state.growthXp || 0);
  const level = Math.min(12, Math.floor(xp / 40) + 1);
  const current = xp % 40;
  const title = level >= 10 ? "별빛 로봇" : level >= 7 ? "마음 탐험가" : level >= 4 ? "기억 친구" : "새싹 로봇";
  return { level, title, current, next: 40, percent: Math.round((current / 40) * 100) };
}

function personaInfo() {
  return {
    name: "다정한 시오니",
    text: "하나의 말투를 유지하면서, 최근 기억과 현재 게이지에 맞춰 더 조용하거나 더 밝게 반응해요.",
  };
}

function rememberMoment(kind, detail) {
  const label = {
    greeting: "인사",
    mood: "기분",
    care: "돌봄",
    play: "놀이",
    feed: "간식",
    sleep: "휴식",
    reward: "보상",
    talk: "대화",
  }[kind] || "기억";

  state.memoryCards = Array.isArray(state.memoryCards) ? state.memoryCards : [];
  state.memoryCards.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    date: todayKey(),
    label,
    detail,
  });
  state.memoryCards = state.memoryCards.slice(0, 6);
}

function gainGrowth(amount, reason) {
  state.growthXp = Math.max(0, (state.growthXp || 0) + amount);
  if (reason) rememberMoment("talk", reason);
}

function memoryEngine() {
  state.memoryEngine = window.SioniMemoryEngine?.ensure(state.memoryEngine) || state.memoryEngine || {
    moodCounts: {},
    careCounts: {},
    recentSignals: [],
    favoriteWords: [],
    highlights: [],
    lastSummary: "",
  };
  return state.memoryEngine;
}

function rememberTalk(rawText, category) {
  if (window.SioniMemoryEngine) state.memoryEngine = window.SioniMemoryEngine.recordTalk(memoryEngine(), rawText, category);
}

function rememberCare(careType) {
  if (window.SioniMemoryEngine) state.memoryEngine = window.SioniMemoryEngine.recordCare(memoryEngine(), careType);
}

function memoryContextLine() {
  if (window.SioniMemoryEngine) return window.SioniMemoryEngine.contextLine(memoryEngine(), state);
  return "오늘의 대화를 천천히 기억하고 있어요.";
}

function v6InsightText() {
  const mood = moodInfo().label;
  if (state.loneliness >= 70) return `10살 시오니 기억: ${memoryContextLine()} 지금 상태는 ${mood}.`;
  if (state.hunger >= 75) return `10살 시오니 기억: ${memoryContextLine()} 간식 반응을 더 크게 받아요.`;
  if (state.energy <= 25) return `10살 시오니 기억: ${memoryContextLine()} 차분한 표정을 우선해요.`;
  return `10살 시오니 기억: ${memoryContextLine()} 현재 상태는 ${mood}.`;
}

function tune(delta = {}) {
  ["mood", "affection", "energy", "hunger", "loneliness"].forEach((key) => {
    const current = state[key] ?? defaultState[key];
    const change = delta[key] ?? 0;
    let adjusted = change;
    if (change > 0 && current >= 95) adjusted = Math.min(change, 1);
    else if (change > 0 && current >= 88) adjusted = Math.ceil(change * 0.5);
    state[key] = clamp(current + adjusted);
  });
  saveState();
  render(false);
}

function tuneForCategory(category) {
  const plans = {
    greeting: { xp: 4, stats: { kindness: 2, sparkle: 1 }, memory: ["greeting", "오늘 반갑게 인사했어요"] },
    tired: { xp: 6, stats: { kindness: 3, bravery: 1 }, memory: ["mood", "힘든 마음을 말해줬어요"] },
    sad: { xp: 6, stats: { kindness: 3 }, memory: ["mood", "속상한 마음을 나눴어요"] },
    joy: { xp: 6, stats: { sparkle: 3, curiosity: 1 }, memory: ["mood", "기쁜 일을 함께 기억했어요"] },
    angry: { xp: 5, stats: { bravery: 2, kindness: 1 }, memory: ["mood", "화난 마음을 조심히 맡겼어요"] },
    anxious: { xp: 6, stats: { bravery: 3, kindness: 1 }, memory: ["mood", "불안한 마음을 말해줬어요"] },
    bored: { xp: 5, stats: { curiosity: 2, sparkle: 2 }, memory: ["play", "심심함을 함께 바꿔보기로 했어요"] },
    praise: { xp: 5, stats: { sparkle: 3, kindness: 1 }, memory: ["talk", "칭찬을 받아서 마음등이 반짝였어요"] },
    sleep: { xp: 4, stats: { kindness: 1, bravery: 1 }, memory: ["sleep", "쉬는 시간을 챙겼어요"] },
    hungry: { xp: 4, stats: { curiosity: 1 }, memory: ["feed", "먹는 이야기를 했어요"] },
    faith: { xp: 5, stats: { kindness: 2, bravery: 1 }, memory: ["talk", "소중한 단어를 조용히 기억했어요"] },
    status: { xp: 3, stats: { curiosity: 2 }, memory: ["talk", "상태를 함께 확인했어요"] },
    intro: { xp: 3, stats: { kindness: 1, curiosity: 1 }, memory: ["talk", "시오니를 다시 소개했어요"] },
    unknown: { xp: 2, stats: { curiosity: 1 }, memory: ["talk", "새로운 말을 들었어요"] },
  };
  const plan = plans[category] || plans.unknown;
  state.favoriteMood = categoryToTopic(category);
  tunePersonality(plan.stats);
  gainGrowth(plan.xp);
  rememberMoment(plan.memory[0], plan.memory[1]);
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

function cooldownLeft(lastIso) {
  if (!lastIso) return 0;
  return Math.max(0, COOLDOWN_MS - (Date.now() - new Date(lastIso).getTime()));
}

function cooldownText(ms) {
  const seconds = Math.ceil(ms / 1000);
  return `${seconds}초`;
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

  const hungerGain = Math.min(34, Math.floor(awayMinutes / 25) * 2);
  const energyLoss = Math.min(26, Math.floor(awayMinutes / 30) * 2);
  const lonelinessGain = awayMinutes >= 1440 ? 22 : awayMinutes >= 720 ? 13 : awayMinutes >= 180 ? 7 : 1;
  const moodLoss = awayMinutes >= 1440 ? 12 : awayMinutes >= 720 ? 7 : awayMinutes >= 180 ? 4 : 1;

  let sleepBonus = 0;
  if (state.sleepStartedAt) {
    const sleepMinutes = Math.max(0, Math.floor((Date.now() - new Date(state.sleepStartedAt).getTime()) / 60000));
    sleepBonus = Math.min(30, Math.floor(sleepMinutes / 2) * 4);
    if (sleepMinutes > 30) state.sleepStartedAt = null;
  }

  state.hunger = clamp(state.hunger + hungerGain);
  state.energy = clamp(state.energy - energyLoss + sleepBonus);
  state.loneliness = clamp(state.loneliness + lonelinessGain);
  state.mood = clamp(state.mood - moodLoss);
  state.affection = clamp(state.affection - (awayMinutes >= 1440 ? 3 : awayMinutes >= 360 ? 1 : 0));
}

function updateVisitHistory() {
  const now = new Date();
  const today = todayKey();

  if (!state.firstSeen) state.firstSeen = now.toISOString();

  if (state.lastVisitDate && state.lastVisitDate !== today) {
    const diff = daysBetween(state.lastVisitDate, today);
    state.streak = diff === 1 ? (state.streak || 1) + 1 : 1;
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

const faceVariants = {
  calm: ["calm", "calm-soft", "calm-scan", "calm-dim"],
  happy: ["happy", "happy-smile", "happy-spark", "happy-heart"],
  excited: ["excited", "excited-star", "excited-flash", "excited-wide"],
  sad: ["sad", "sad-tear", "sad-rain", "sad-small"],
  sleepy: ["sleepy", "sleepy-doze", "sleepy-z", "sleepy-low"],
  hungry: ["hungry", "hungry-drool", "hungry-bite", "hungry-empty"],
  thinking: ["thinking", "thinking-dots", "thinking-scan"],
  shy: ["shy"],
  surprised: ["surprised"],
  annoyed: ["annoyed"],
};

let lastFaceVariant = "";

function pickFaceVariant(faceName = "calm") {
  const variants = faceVariants[faceName] || [faceName || "calm"];
  const choices = variants.length > 1 ? variants.filter((name) => name !== lastFaceVariant) : variants;
  const picked = choices[Math.floor(Math.random() * choices.length)] || variants[0];
  lastFaceVariant = picked;
  return picked;
}

function setFace(faceName = "calm", themeName = faceName) {
  const variant = pickFaceVariant(faceName);
  el.face.className = `face ${faceName} ${variant}`;
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
  el.message.textContent = text
    .replace(/Pocket Robot v?\d+(?:\.\d+)*/gi, "10살 포켓 로봇")
    .replace(/시오니 v?\d+(?:\.\d+)*/g, "10살 시오니")
    .replace(/v\d+(?:\.\d+)*/gi, "10살")
    .replaceAll("포만감", "소화 상태");
  el.microHint.textContent = hint || "10살 시오니는 짧은 말과 얼굴 표정으로 바로 반응해요.";
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
  const contextHint = options.hint || response.hint || memoryContextLine();
  say(response.text, options.face || response.face || "calm", options.motion || response.motion || "bounce", contextHint);
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
  clampPersonality();

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

  if (el.missionCount && el.missionList) {
    const completed = missions.filter((mission) => state.completedMissions[mission.key]).length;
    el.missionCount.textContent = `${completed}/${missions.length}`;
    el.missionList.innerHTML = missions
      .map((mission) => {
        const done = Boolean(state.completedMissions[mission.key]);
        return `<li class="${done ? "done" : ""}"><span class="check-dot">${done ? "✓" : ""}</span>${mission.label}</li>`;
      })
      .join("");
  }

  const feedLeft = cooldownLeft(state.lastFedAt);
  const playLeft = cooldownLeft(state.lastPlayedAt);
  const sleepLeft = cooldownLeft(state.lastSleptAt);
  const cooldownLine = [
    feedLeft ? `간식 ${cooldownText(feedLeft)}` : "간식 가능",
    playLeft ? `놀이 ${cooldownText(playLeft)}` : "놀이 가능",
    sleepLeft ? `쉬기 ${cooldownText(sleepLeft)}` : "쉬기 가능",
  ].join(" · ");

  el.memoryLine.textContent = `총 ${state.visits || 0}번 만났고, ${state.totalTalks || 0}번 이야기했어요. ${memoryContextLine()} ${cooldownLine}`;

  const growth = growthInfo();
  const persona = personaInfo();
  if (el.v6PersonaName) el.v6PersonaName.textContent = persona.name;
  if (el.v6PersonaText) el.v6PersonaText.textContent = persona.text;
  if (el.v6GrowthBadge) el.v6GrowthBadge.textContent = `Lv.${growth.level} ${growth.title}`;
  if (el.v6GrowthBar) el.v6GrowthBar.style.width = `${growth.percent}%`;
  if (el.v6GrowthText) el.v6GrowthText.textContent = `${growth.current}/${growth.next} XP · 최근 주제: ${state.favoriteMood || "아직 몰라요"}`;
  if (el.v6Insight) el.v6Insight.textContent = v6InsightText();
  const engine = memoryEngine();
  const careCounts = engine.careCounts || {};
  const careTotal = Object.entries(careCounts).reduce((sum, [key, value]) => key === "talk" ? sum : sum + Number(value || 0), 0);
  if (el.v6Kindness) el.v6Kindness.textContent = state.totalTalks || 0;
  if (el.v6Curiosity) el.v6Curiosity.textContent = Array.isArray(engine.recentSignals) ? engine.recentSignals.length : 0;
  if (el.v6Bravery) el.v6Bravery.textContent = careTotal;
  if (el.v6Sparkle) el.v6Sparkle.textContent = state.idleCount || 0;
  if (el.v6MemoryList) {
    const cards = Array.isArray(state.memoryCards) ? state.memoryCards : [];
    const summaryCard = engine.lastSummary ? [{ label: "요약", detail: engine.lastSummary }] : null;
    const displayCards = summaryCard ? [...summaryCard, ...cards].slice(0, 6) : cards;
    el.v6MemoryList.innerHTML = displayCards.length
      ? displayCards.map((card) => `<li><strong>${card.label}</strong><span>${card.detail}</span></li>`).join("")
      : `<li><strong>첫 기억</strong><span>아직 새 기억을 기다리고 있어요.</span></li>`;
  }

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
  if (includesAny(text, ["기도", "교회", "말씀", "예배", "찬양", "아멘", "할렐루야"])) return "faith";
  if (includesAny(text, ["오늘 뭐", "뭐하지", "할 일"])) return "status";
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
    tunePersonality({ sparkle: 3, kindness: 1 });
    gainGrowth(6);
    rememberMoment("care", "연속 쓰담으로 마음등이 빠르게 반짝였어요");
    rememberCare("pet");
    respond("surprise", { delta: { mood: 5, affection: 2, energy: -4, hunger: 2, loneliness: -7 }, topic: "연속 터치", hint: "빠르게 만지면 신나지만, 에너지와 배고픔도 조금 움직여요." });
    return;
  }

  const effect = tapCount === 1 ? { mood: 3, affection: 2, loneliness: -6 } : { mood: 2, affection: 2, energy: -1, loneliness: -5 };
  completeMission("pet");
  tunePersonality({ kindness: 2 });
  gainGrowth(4);
  rememberMoment("care", "쓰담을 받아서 외로움이 조금 줄었어요");
  rememberCare("pet");
  respond("pet", { delta: effect, topic: "쓰다듬기", hint: "쓰담은 친밀도와 기분을 조금 올리고, 외로움을 낮춰요." });
}

function handleFeed() {
  const left = cooldownLeft(state.lastFedAt);
  if (left > 0) {
    respond("fedCooldown", { delta: { mood: -1 }, topic: "간식 쿨타임", hint: `간식은 ${cooldownText(left)} 뒤에 다시 좋아져요. 방금 먹어서 지금은 소화 중이에요.` });
    return;
  }

  state.lastFedAt = new Date().toISOString();
  completeMission("feed");
  tunePersonality({ kindness: 1, curiosity: 1 });
  gainGrowth(4);
  rememberMoment("feed", "간식을 먹고 배고픔이 내려갔어요");
  rememberCare("feed");
  respond("fedSuccess", {
    delta: { hunger: -18, mood: 2, affection: 1, energy: 1, loneliness: -2 },
    topic: "간식 주기",
    motion: "charge",
    hint: "간식은 배고픔을 낮추지만, 너무 자주 주면 쿨타임이 있어요.",
  });
}

function handlePlay() {
  const left = cooldownLeft(state.lastPlayedAt);
  if (state.energy <= 10) {
    respond("lowEnergy", { delta: { mood: 1, loneliness: -2 }, topic: "에너지 부족", hint: "에너지가 아주 낮을 때는 먼저 쉬게 해주세요." });
    return;
  }
  if (state.hunger >= 94) {
    respond("tooHungry", { delta: { affection: 1 }, topic: "배고픔", hint: "너무 배고플 때는 간식부터 주면 좋아요." });
    return;
  }
  if (left > 0) {
    respond("playCooldown", { delta: { energy: -1, hunger: 1 }, topic: "놀이 쿨타임", hint: `놀이는 ${cooldownText(left)} 뒤에 다시 좋아져요. 지금은 살짝 쉬는 중이에요.` });
    return;
  }

  const hungerPenalty = state.hunger >= 76 ? 0.75 : 1;
  state.lastPlayedAt = new Date().toISOString();
  completeMission("play");
  tunePersonality({ sparkle: 3, curiosity: 2 });
  gainGrowth(5);
  rememberMoment("play", "함께 놀면서 반짝 에너지를 모았어요");
  rememberCare("play");
  respond("bored", {
    delta: { mood: Math.round(8 * hungerPenalty), affection: 3, energy: -14, hunger: 12, loneliness: -12 },
    topic: "놀이",
    motion: "bounce",
    hint: "놀이는 즐겁지만 에너지를 많이 쓰고 배고픔도 올라가요.",
  });
}

function handleSleep() {
  const left = cooldownLeft(state.lastSleptAt);
  if (state.energy >= 90) {
    respond("rested", { delta: { mood: 1, hunger: 1, loneliness: -1 }, topic: "충분한 에너지", hint: "에너지가 이미 높아서 쉬기 효과는 아주 작게 들어가요." });
    return;
  }
  if (left > 0) {
    respond("rested", { delta: { energy: 2, hunger: 1, loneliness: -1 }, topic: "쉬기 쿨타임", hint: `깊은 쉬기는 ${cooldownText(left)} 뒤에 가능하지만, 잠깐 숨은 돌렸어요.` });
    return;
  }

  state.lastSleptAt = new Date().toISOString();
  state.sleepStartedAt = state.lastSleptAt;
  completeMission("sleep");
  tunePersonality({ bravery: 1, kindness: 1 });
  gainGrowth(4);
  rememberMoment("sleep", "쉬는 시간을 챙겨서 에너지를 회복했어요");
  rememberCare("sleep");
  respond("rested", {
    delta: { energy: 16, mood: 2, loneliness: -4, hunger: 4 },
    topic: "쉬기",
    motion: "sleepy",
    hint: "쉬면 에너지가 회복되지만 시간이 지나면 다시 배고프고 졸릴 수 있어요.",
  });
}

function handleTalk(rawText) {
  const text = normalize(rawText);
  if (!text) return;

  state.totalTalks += 1;
  tune({ energy: -2, hunger: 2, loneliness: -3, affection: 1, mood: 0 });

  const category = classify(text);
  rememberTalk(rawText, category);
  tuneForCategory(category);
  const missionCategory = ["tired", "sad", "joy", "angry", "anxious"].includes(category) ? "mood" : null;
  if (category === "greeting") completeMission("greet");
  if (category === "sleep") completeMission("sleep");
  if (missionCategory) completeMission("mood");

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
  if (!previousVisit) return `${timeGreeting()} 저는 이제 10살 시오니예요. 짧게 말하고, 표정은 더 크게 보여줄게요.`;

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
    if (state.idleCount === 1) respond("unknown", { delta: { loneliness: 2 }, topic: "기다림", hint: "10살 시오니는 가만히 있어도 표정과 작은 움직임으로 반응해요." });
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
      tune({ mood: 4, affection: 3, energy: -3, hunger: 1, loneliness: -8 });
      rememberCare("pet");
      respond("pet", { face: "shy", motion: "pulse", topic: "길게 누르기", hint: "길게 누르면 쓰담 효과가 더 크게 들어가요." });
    }, 750);
  });

  window.addEventListener("sioni:statechange", (event) => {
    const next = event.detail || {};
    ["mood", "affection", "energy", "hunger", "loneliness"].forEach((key) => {
      if (Number.isFinite(Number(next[key]))) state[key] = clamp(Number(next[key]));
    });
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
say(firstMessageForVisit(previousVisit), moodInfo().face, "headturn", "10살 시오니는 기억, 상태, 얼굴 표정을 함께 사용해요.");
