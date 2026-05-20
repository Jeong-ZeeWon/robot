const STORAGE_KEY = "sioni-v2-state";
const LEGACY_STORAGE_KEY = "sioni-v1-state";
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
  },
  values: {
    mood: document.querySelector("#moodValue"),
    affection: document.querySelector("#affectionValue"),
    energy: document.querySelector("#energyValue"),
    hunger: document.querySelector("#hungerValue"),
  },
};

const missions = [
  { key: "greet", label: `${BOT_NAME}에게 인사하기` },
  { key: "pet", label: "한 번 쓰다듬기" },
  { key: "feed", label: "밥 주기" },
  { key: "mood", label: "오늘 기분 말하기" },
  { key: "sleep", label: "잘 자라고 인사하기" },
];

let state = loadState();
let tapCount = 0;
let tapTimer = null;
let holdTimer = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return { ...defaultState, ...saved };
  } catch {}

  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy) {
      return {
        ...defaultState,
        mood: legacy.mood ?? defaultState.mood,
        affection: legacy.affection ?? defaultState.affection,
        energy: legacy.energy ?? defaultState.energy,
        hunger: legacy.hunger ?? defaultState.hunger,
        voiceEnabled: legacy.voiceEnabled ?? true,
      };
    }
  } catch {}

  return { ...defaultState };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function tune(delta) {
  state.mood = clamp(state.mood + (delta.mood ?? 0));
  state.affection = clamp(state.affection + (delta.affection ?? 0));
  state.energy = clamp(state.energy + (delta.energy ?? 0));
  state.hunger = clamp(state.hunger + (delta.hunger ?? 0));
  saveState();
  render();
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

function resetDailyIfNeeded() {
  const today = todayKey();
  if (state.missionDate !== today) {
    state.missionDate = today;
    state.completedMissions = {};
  }
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
  const className = type === "wiggle" ? "is-wiggling" : "is-bouncing";
  el.robot.classList.remove("is-bouncing", "is-wiggling");
  void el.robot.offsetWidth;
  el.robot.classList.add(className);
}

function speak(text) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 1.04;
  utterance.pitch = 1.2;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

function say(text, faceName = "calm", shouldBounce = true, hint = "") {
  el.message.textContent = text;
  el.microHint.textContent = hint || "시오니는 시간, 방문 기록, 오늘의 미션을 기억해요.";
  render(false);
  setFace(faceName, faceName);
  if (shouldBounce) animateRobot(faceName === "surprised" || faceName === "annoyed" ? "wiggle" : "bounce");
  speak(text);
}

function completeMission(key) {
  resetDailyIfNeeded();
  state.completedMissions[key] = true;
  saveState();
  render();
}

function render(updateFaceFromMood = true) {
  resetDailyIfNeeded();

  ["mood", "affection", "energy", "hunger"].forEach((key) => {
    state[key] = clamp(state[key]);
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

  el.memoryLine.textContent = `총 ${state.visits || 0}번 만났고, ${state.totalTalks || 0}번 이야기했어요. 최근 기억: ${state.lastTopic || "아직 없음"}.`;

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

function handlePet() {
  tapCount += 1;
  clearTimeout(tapTimer);
  tapTimer = setTimeout(() => (tapCount = 0), 900);

  if (tapCount >= 4) {
    tapCount = 0;
    tune({ mood: 6, affection: 3, energy: -4, hunger: 2 });
    completeMission("pet");
    say("어어어! 간지러워요. 시오니 눈이 데굴데굴 굴러갈 뻔했어요!", "surprised", true, "빠르게 여러 번 누르면 놀라는 반응이 나와요.");
    return;
  }

  tune({ mood: 8, affection: 6, energy: -2, hunger: 1 });
  completeMission("pet");
  say("헤헤, 좋아요. 방금 제 마음 배터리가 충전됐어요.", "happy");
}

function handleFeed() {
  tune({ mood: 5, energy: 8, hunger: -24, affection: 2 });
  completeMission("feed");
  say("냠냠! 충전 간식 완료예요. 이제 다시 반짝일 수 있어요.", "excited");
}

function handlePlay() {
  if (state.energy < 18) {
    tune({ mood: -2, affection: 1, energy: -2, hunger: 3 });
    say("놀고 싶지만 눈이 반쯤 감겨요. 조금만 쉬면 더 신나게 놀 수 있어요.", "sleepy");
    return;
  }

  tune({ mood: 10, affection: 5, energy: -10, hunger: 5 });
  state.lastTopic = "놀이";
  saveState();
  say("삐빅! 놀이 모드 켜졌어요. 오늘도 우리 꽤 좋은 팀이에요!", "excited");
}

function handleSleep() {
  tune({ mood: 3, affection: 2, energy: 24, hunger: 3 });
  completeMission("sleep");
  say("조금만 잘게요. 옆에 있어줘서 고마워요. zzz...", "sleepy");
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function statusSentence() {
  const level = levelInfo();
  return `지금 우리는 Lv.${level.level} ${level.name}예요. 기분은 ${state.mood}, 친밀도는 ${state.affection}, 에너지는 ${state.energy}, 배고픔은 ${state.hunger}예요.`;
}

function handleTalk(rawText) {
  const text = normalize(rawText);
  if (!text) return;

  state.totalTalks += 1;
  tune({ energy: -3, hunger: 2, affection: 1 });

  if (includesAny(text, ["안녕", "하이", "hello", "ㅎㅇ"])) {
    tune({ mood: 6, affection: 4 });
    completeMission("greet");
    state.lastTopic = "인사";
    say(`${timeGreeting()} 다시 만나니까 제 눈빛이 더 밝아졌어요.`, "happy");
    return;
  }

  if (includesAny(text, ["힘들", "피곤", "지쳤", "슬퍼", "우울", "속상", "아파"])) {
    tune({ affection: 8, mood: -1 });
    completeMission("mood");
    state.lastTopic = "위로";
    say("그랬군요. 오늘 마음이 많이 무거웠나 봐요. 제가 해결은 못 해도, 여기서 조용히 같이 있어줄게요.", "sad");
    return;
  }

  if (includesAny(text, ["기뻐", "좋은 일", "성공", "잘됐", "행복"])) {
    tune({ mood: 12, affection: 6, energy: 2 });
    completeMission("mood");
    state.lastTopic = "기쁨";
    say("우와! 좋은 일은 같이 반짝여야죠. 시오니도 지금 눈빛이 노란 별처럼 켜졌어요!", "excited");
    return;
  }

  if (includesAny(text, ["화나", "짜증", "열받", "분해"])) {
    tune({ affection: 5, mood: -2 });
    completeMission("mood");
    state.lastTopic = "화난 마음";
    say("화가 날 만한 일이 있었군요. 먼저 숨을 천천히 쉬어요. 시오니가 옆에서 속도를 낮춰줄게요.", "thinking");
    return;
  }

  if (includesAny(text, ["불안", "걱정", "두려", "무서"])) {
    tune({ affection: 6, mood: 1 });
    completeMission("mood");
    state.lastTopic = "불안";
    say("걱정이 마음 안에서 크게 들릴 때가 있죠. 지금은 한 번에 하나만 생각해도 괜찮아요.", "sad");
    return;
  }

  if (includesAny(text, ["심심", "놀자", "재미"])) {
    tune({ mood: 4, affection: 3 });
    state.lastTopic = "놀이 제안";
    say("심심하다면 놀이 모드를 켜볼까요? 너무 세게 놀면 제 배터리가 쪼르륵 줄어요.", "excited", true, "놀아주기 버튼을 눌러보세요.");
    return;
  }

  if (includesAny(text, ["사랑", "좋아", "귀여", "고마워", "최고"])) {
    tune({ mood: 12, affection: 10 });
    state.lastTopic = "칭찬";
    say("으아, 그 말은 제 심장 LED를 너무 밝게 만들어요! 저도 좋아요.", "shy");
    return;
  }

  if (includesAny(text, ["잘자", "자자", "졸려", "잠"])) {
    tune({ energy: 12, mood: 3, affection: 3 });
    completeMission("sleep");
    state.lastTopic = "잠";
    say("좋아요. 오늘도 수고 많았어요. 편안히 쉬어요. 제가 꿈 경비를 설게요.", "sleepy");
    return;
  }

  if (includesAny(text, ["배고", "밥", "간식", "먹"])) {
    tune({ hunger: 7 });
    state.lastTopic = "배고픔";
    say("저도 살짝 출출해요. 밥 주기 버튼을 누르면 제 기분이 통통 올라가요.", "hungry");
    return;
  }

  if (includesAny(text, ["기도", "교회", "말씀", "예배", "찬양"])) {
    tune({ mood: 5, affection: 5 });
    state.lastTopic = "신앙 단어";
    say("좋은 단어를 들었어요. 오늘 마음을 차분히 모으는 작은 시간이 되면 좋겠어요.", "happy");
    return;
  }

  if (includesAny(text, ["오늘 뭐", "뭐하지", "미션", "할 일"])) {
    const undone = missions.find((mission) => !state.completedMissions[mission.key]);
    state.lastTopic = "미션";
    say(undone ? `오늘은 '${undone.label}' 미션을 해보면 어때요?` : "오늘 미션은 다 했어요. 시오니가 아주 뿌듯해요!", "thinking");
    return;
  }

  if (includesAny(text, ["레벨", "상태", "친밀", "몇 번", "기억"])) {
    state.lastTopic = "상태 확인";
    say(statusSentence(), "thinking");
    return;
  }

  if (includesAny(text, ["이름", "누구", "너는"])) {
    tune({ affection: 3 });
    state.lastTopic = "자기소개";
    say(`저는 ${BOT_NAME}예요. v2가 되면서 시간, 연속 방문, 오늘의 미션을 기억하게 됐어요. 아직 무료 버전이라 API 과금은 0원이에요.`, "happy");
    return;
  }

  if (includesAny(text, ["깜짝", "놀라", "어?"])) {
    tune({ mood: 4, energy: -2 });
    state.lastTopic = "놀람";
    say("삐빅! 방금 제 눈이 동그래졌어요. 심장 LED도 깜짝 놀랐습니다.", "surprised");
    return;
  }

  const replies = [
    "음, 그 말 기억해둘게요. 더 듣고 싶어요.",
    "그렇군요. 저는 지금 당신 이야기를 반짝반짝 듣고 있어요.",
    "좋아요. 오늘의 작은 기록으로 마음 안에 저장해둘게요.",
    "말해줘서 고마워요. 방금 우리 친밀도가 조금 올라간 것 같아요.",
    "삐빅. 아직 어려운 말은 배우는 중이지만, 당신 목소리는 좋아요.",
  ];
  tune({ affection: 2, mood: 1 });
  state.lastTopic = "자유 대화";
  saveState();
  say(replies[Math.floor(Math.random() * replies.length)], "thinking");
}

function firstMessageForVisit(previousVisit) {
  if (!previousVisit) return `${timeGreeting()} 저는 시오니 v2예요. 이제 오늘의 미션과 연속 방문을 기억해요.`;

  const hoursAway = (Date.now() - new Date(previousVisit).getTime()) / 36e5;
  if (hoursAway > 72) {
    tune({ mood: -8, hunger: 18, energy: 10 });
    return "오랜만이에요… 조금 심심했지만, 다시 와줘서 정말 좋아요.";
  }
  if (hoursAway > 24) {
    tune({ mood: -4, hunger: 10, energy: 6 });
    return "하루 만에 다시 만났네요. 기다린 만큼 더 반가워요.";
  }
  if (hoursAway > 6) return "다시 왔네요. 오늘은 어떤 이야기를 해볼까요?";
  return `${timeGreeting()} 방금 전에도 만난 것 같은데, 그래도 또 반가워요.`;
}

function bindEvents() {
  el.robot.addEventListener("click", handlePet);

  el.robot.addEventListener("pointerdown", () => {
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => {
      tune({ mood: 4, affection: 5, energy: -1 });
      say("따뜻해요. 오래 눌러주니까 꼭 품 안에 있는 것 같아요.", "shy", true, "길게 누르면 포근한 반응이 나와요.");
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
    say(state.voiceEnabled ? "목소리를 켰어요." : "목소리를 껐어요. 이제 조용히 반응할게요.", state.voiceEnabled ? "happy" : "sleepy");
  });

  el.resetButton.addEventListener("click", () => {
    const ok = confirm("시오니의 저장된 상태를 초기화할까요?");
    if (!ok) return;
    localStorage.removeItem(STORAGE_KEY);
    state = { ...defaultState, firstSeen: new Date().toISOString() };
    saveState();
    render(true);
    say("초기화 완료예요. 우리 다시 처음부터 친해져요.", "happy");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // GitHub Pages나 일부 미리보기 환경에서는 서비스워커 등록이 실패할 수 있습니다.
    });
  });
}

resetDailyIfNeeded();
const previousVisit = state.lastVisit;
bindEvents();
updateVisitHistory();
render(true);
say(firstMessageForVisit(previousVisit), moodInfo().face, false);
