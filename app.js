const STORAGE_KEY = "sioni-v41-state";
const LEGACY_STORAGE_KEYS = ["sioni-v4-state", "sioni-v3-state", "sioni-v2-state", "sioni-v1-state"];
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
  clampPersonality();
  const stats = state.personalityStats;
  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]);
  const [topKey] = entries[0] || ["kindness"];
  const profiles = {
    kindness: {
      name: "다정한 보호형",
      text: "먼저 안부를 묻고, 힘든 말을 들으면 짧게 곁을 지켜주는 시오니예요.",
    },
    curiosity: {
      name: "호기심 탐험형",
      text: "새로운 말과 행동을 잘 기억하고, 다음에 어떤 반응을 하면 좋을지 살펴봐요.",
    },
    bravery: {
      name: "용감한 응원형",
      text: "불안하거나 지친 날에 작은 행동부터 해보자고 단단하게 응원해요.",
    },
    sparkle: {
      name: "반짝 놀이형",
      text: "칭찬과 놀이에 강하게 반응하고, 보상과 수집을 더 신나게 느껴요.",
    },
  };
  return profiles[topKey] || profiles.kindness;
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

function v6InsightText() {
  const mood = moodInfo().label;
  const persona = personaInfo().name;
  if (state.loneliness >= 70) return `${persona} 시오니는 지금 외로움을 먼저 낮추는 쓰담이나 짧은 대화를 추천해요.`;
  if (state.hunger >= 75) return `${persona} 시오니는 간식을 먹고 나면 대답이 더 밝아질 것 같아요.`;
  if (state.energy <= 25) return `${persona} 시오니는 잠깐 쉬면서 에너지를 회복하고 싶어 해요.`;
  if ((state.growthXp || 0) < 40) return `${persona} 시오니가 첫 성장 레벨을 향해 기억을 모으고 있어요. 현재 상태는 ${mood}.`;
  return `${persona} 시오니는 최근 기억과 상태를 섞어서 반응해요. 오늘 상태는 ${mood}.`;
}

function tune(delta = {}) {
  ["mood", "affection", "energy", "hunger", "loneliness"].forEach((key) => {
    state[key] = clamp((state[key] ?? defaultState[key]) + (delta[key] ?? 0));
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

  const hungerGain = Math.min(28, Math.floor(awayMinutes / 30) * 2);
  const energyGain = Math.min(22, Math.floor(awayMinutes / 20) * 2);
  const lonelinessGain = awayMinutes >= 1440 ? 18 : awayMinutes >= 720 ? 10 : awayMinutes >= 180 ? 5 : 1;
  const moodLoss = awayMinutes >= 1440 ? 8 : awayMinutes >= 720 ? 4 : awayMinutes >= 180 ? 2 : 0;

  let sleepBonus = 0;
  if (state.sleepStartedAt) {
    const sleepMinutes = Math.max(0, Math.floor((Date.now() - new Date(state.sleepStartedAt).getTime()) / 60000));
    sleepBonus = Math.min(30, Math.floor(sleepMinutes / 2) * 4);
    if (sleepMinutes > 30) state.sleepStartedAt = null;
  }

  state.hunger = clamp(state.hunger + hungerGain);
  state.energy = clamp(state.energy + energyGain + sleepBonus);
  state.loneliness = clamp(state.loneliness + lonelinessGain);
  state.mood = clamp(state.mood - moodLoss);
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
  el.microHint.textContent = hint || "쿨타임은 모두 10초예요. 몇 번만 돌봐도 게이지가 눈에 띄게 움직여요.";
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

  el.memoryLine.textContent = `총 ${state.visits || 0}번 만났고, ${state.totalTalks || 0}번 이야기했어요. 최근 기억: ${state.lastTopic || "아직 없음"}. ${cooldownLine}`;

  const growth = growthInfo();
  const persona = personaInfo();
  if (el.v6PersonaName) el.v6PersonaName.textContent = persona.name;
  if (el.v6PersonaText) el.v6PersonaText.textContent = persona.text;
  if (el.v6GrowthBadge) el.v6GrowthBadge.textContent = `Lv.${growth.level} ${growth.title}`;
  if (el.v6GrowthBar) el.v6GrowthBar.style.width = `${growth.percent}%`;
  if (el.v6GrowthText) el.v6GrowthText.textContent = `${growth.current}/${growth.next} XP · 좋아하는 기억: ${state.favoriteMood || "아직 몰라요"}`;
  if (el.v6Insight) el.v6Insight.textContent = v6InsightText();
  if (el.v6Kindness) el.v6Kindness.textContent = state.personalityStats.kindness;
  if (el.v6Curiosity) el.v6Curiosity.textContent = state.personalityStats.curiosity;
  if (el.v6Bravery) el.v6Bravery.textContent = state.personalityStats.bravery;
  if (el.v6Sparkle) el.v6Sparkle.textContent = state.personalityStats.sparkle;
  if (el.v6MemoryList) {
    const cards = Array.isArray(state.memoryCards) ? state.memoryCards : [];
    el.v6MemoryList.innerHTML = cards.length
      ? cards.map((card) => `<li><strong>${card.label}</strong><span>${card.detail}</span></li>`).join("")
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
  if (includesAny(text, ["기도", "교회", "말씀", "예배", "찬양"])) return "faith";
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
    respond("surprise", { delta: { mood: 8, affection: 4, energy: -3, loneliness: -9 }, topic: "연속 터치", hint: "빠르게 여러 번 누르면 기분과 친밀도가 확 올라가요." });
    return;
  }

  const effect = tapCount === 1 ? { mood: 5, affection: 4, loneliness: -8 } : { mood: 4, affection: 3, loneliness: -7 };
  completeMission("pet");
  tunePersonality({ kindness: 2 });
  gainGrowth(4);
  rememberMoment("care", "쓰담을 받아서 외로움이 조금 줄었어요");
  respond("pet", { delta: effect, topic: "쓰다듬기", hint: "쓰담은 외로움을 크게 낮추고 친밀도를 올려요." });
}

function handleFeed() {
  const left = cooldownLeft(state.lastFedAt);
  if (left > 0) {
    respond("fedCooldown", { delta: { mood: 1, affection: 1 }, topic: "간식 쿨타임", hint: `간식은 ${cooldownText(left)} 뒤에 다시 효과가 좋아져요. 기다리는 동안 쓰담은 가능해요.` });
    return;
  }

  state.lastFedAt = new Date().toISOString();
  completeMission("feed");
  tunePersonality({ kindness: 1, curiosity: 1 });
  gainGrowth(4);
  rememberMoment("feed", "간식을 먹고 배고픔이 내려갔어요");
  respond("fedSuccess", {
    delta: { hunger: -22, mood: 4, affection: 2, energy: 2, loneliness: -3 },
    topic: "간식 주기",
    motion: "charge",
    hint: "간식 효과를 키웠어요. 몇 번만 줘도 배고픔이 확 내려가요.",
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
    respond("playCooldown", { delta: { mood: 2, loneliness: -2 }, topic: "놀이 쿨타임", hint: `놀이는 ${cooldownText(left)} 뒤에 다시 좋아져요.` });
    return;
  }

  const hungerPenalty = state.hunger >= 76 ? 0.75 : 1;
  state.lastPlayedAt = new Date().toISOString();
  completeMission("play");
  tunePersonality({ sparkle: 3, curiosity: 2 });
  gainGrowth(5);
  rememberMoment("play", "함께 놀면서 반짝 에너지를 모았어요");
  respond("bored", {
    delta: { mood: Math.round(14 * hungerPenalty), affection: 6, energy: -9, hunger: 8, loneliness: -16 },
    topic: "놀이",
    motion: "bounce",
    hint: "놀이는 기분과 외로움에 크게 효과가 있지만 에너지와 배고픔을 함께 소모해요.",
  });
}

function handleSleep() {
  const left = cooldownLeft(state.lastSleptAt);
  if (state.energy >= 94) {
    respond("rested", { delta: { mood: 2, loneliness: -2 }, topic: "충분한 에너지", hint: "에너지가 이미 높아서 쉬기 효과는 작게 들어가요." });
    return;
  }
  if (left > 0) {
    respond("rested", { delta: { energy: 3, mood: 1, loneliness: -2 }, topic: "쉬기 쿨타임", hint: `아직 깊은 쉬기는 ${cooldownText(left)} 뒤에 가능하지만, 살짝 회복은 돼요.` });
    return;
  }

  state.lastSleptAt = new Date().toISOString();
  state.sleepStartedAt = state.lastSleptAt;
  completeMission("sleep");
  tunePersonality({ bravery: 1, kindness: 1 });
  gainGrowth(4);
  rememberMoment("sleep", "쉬는 시간을 챙겨서 에너지를 회복했어요");
  respond("rested", {
    delta: { energy: 18, mood: 5, loneliness: -8, hunger: 2 },
    topic: "쉬기",
    motion: "sleepy",
    hint: "쉬기 효과를 키웠어요. 즉시 회복되고, 시간이 지나면 추가 회복돼요.",
  });
}

function handleTalk(rawText) {
  const text = normalize(rawText);
  if (!text) return;

  state.totalTalks += 1;
  tune({ energy: -1, hunger: 1, loneliness: -5, affection: 2, mood: 1 });

  const category = classify(text);
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
  if (!previousVisit) return `${timeGreeting()} 저는 시오니 v6예요. 이제 기억하고 성장하면서 오늘의 마음을 더 잘 따라갈게요.`;

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
      tune({ mood: 7, affection: 7, energy: -2, loneliness: -12 });
      respond("pet", { face: "shy", motion: "pulse", topic: "길게 누르기", hint: "길게 누르면 쓰담 효과가 더 크게 들어가요." });
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
say(firstMessageForVisit(previousVisit), moodInfo().face, "peek", "v6는 기억 카드, 성격 스탯, 성장 XP를 함께 저장해요.");
