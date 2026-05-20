const STORAGE_KEY = "monglebot-v1-state";

const defaultState = {
  mood: 72,
  affection: 28,
  energy: 68,
  hunger: 42,
  lastVisit: null,
  visits: 0,
  voiceEnabled: true,
  missionCompleted: false,
};

const el = {
  robot: document.querySelector("#robot"),
  face: document.querySelector("#face"),
  message: document.querySelector("#message"),
  form: document.querySelector("#talkForm"),
  input: document.querySelector("#userInput"),
  voiceToggle: document.querySelector("#voiceToggle"),
  moodLabel: document.querySelector("#moodLabel"),
  lastSeen: document.querySelector("#lastSeen"),
  dailyMission: document.querySelector("#dailyMission"),
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
  "몽글봇과 한 번 대화하기",
  "쓰다듬고 기분 올려주기",
  "힘든 마음을 한 문장으로 말해보기",
  "몽글봇에게 잘 자라고 인사하기",
  "밥 주기 버튼으로 에너지 채우기",
];

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
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

function setFace(faceName = "calm") {
  el.face.className = `face ${faceName}`;
}

function bounce() {
  el.robot.classList.remove("is-bouncing");
  void el.robot.offsetWidth;
  el.robot.classList.add("is-bouncing");
}

function speak(text) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text.replace(/몽글봇/g, "몽글봇"));
  utterance.lang = "ko-KR";
  utterance.rate = 1.04;
  utterance.pitch = 1.22;
  utterance.volume = 0.9;
  window.speechSynthesis.speak(utterance);
}

function say(text, faceName = "calm", shouldBounce = true) {
  el.message.textContent = text;
  setFace(faceName);
  if (shouldBounce) bounce();
  speak(text);
  render();
}

function moodName() {
  if (state.energy <= 18) return ["졸려요", "sleepy"];
  if (state.hunger >= 82) return ["배고파요", "sad"];
  if (state.mood >= 86) return ["반짝반짝 신나요", "excited"];
  if (state.affection >= 72) return ["많이 가까워졌어요", "happy"];
  if (state.mood <= 32) return ["조금 시무룩해요", "sad"];
  return ["평온해요", "calm"];
}

function render() {
  const stats = ["mood", "affection", "energy", "hunger"];
  stats.forEach((key) => {
    state[key] = clamp(state[key]);
    el.bars[key].style.width = `${state[key]}%`;
    el.values[key].textContent = state[key];
  });

  const [label, faceName] = moodName();
  el.moodLabel.textContent = label;
  setFace(faceName);
  el.voiceToggle.textContent = state.voiceEnabled ? "🔊" : "🔇";
  el.voiceToggle.setAttribute("aria-pressed", String(state.voiceEnabled));

  const missionIndex = new Date().getDate() % missions.length;
  el.dailyMission.textContent = state.missionCompleted
    ? "오늘 미션 완료! 몽글봇이 뿌듯해해요."
    : missions[missionIndex];

  if (state.lastVisit) {
    const diff = Date.now() - new Date(state.lastVisit).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) el.lastSeen.textContent = "방금 만났어요";
    else if (minutes < 60) el.lastSeen.textContent = `${minutes}분 만에 다시 만남`;
    else if (minutes < 1440) el.lastSeen.textContent = `${Math.floor(minutes / 60)}시간 만에 다시 만남`;
    else el.lastSeen.textContent = `${Math.floor(minutes / 1440)}일 만에 다시 만남`;
  } else {
    el.lastSeen.textContent = "처음 만났어요";
  }
}

function handlePet() {
  tune({ mood: 8, affection: 6, energy: -2, hunger: 1 });
  state.missionCompleted = true;
  saveState();
  say("헤헤, 좋아요. 방금 제 마음 배터리가 충전됐어요.", "happy");
}

function handleFeed() {
  tune({ mood: 5, energy: 8, hunger: -22, affection: 2 });
  say("냠냠! 충전 간식 완료예요. 이제 다시 반짝일 수 있어요.", "excited");
}

function handlePlay() {
  if (state.energy < 18) {
    tune({ mood: -2, affection: 1, energy: -2, hunger: 3 });
    say("놀고 싶지만 눈이 반쯤 감겨요. 조금만 쉬면 더 신나게 놀 수 있어요.", "sleepy");
    return;
  }
  tune({ mood: 10, affection: 5, energy: -10, hunger: 5 });
  state.missionCompleted = true;
  saveState();
  say("삐빅! 놀이 모드 켜졌어요. 오늘도 우리 꽤 좋은 팀이에요!", "excited");
}

function handleSleep() {
  tune({ mood: 3, affection: 2, energy: 24, hunger: 3 });
  say("조금만 잘게요. 옆에 있어줘서 고마워요. zzz...", "sleepy");
}

function normalize(text) {
  return text.trim().toLowerCase();
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function handleTalk(rawText) {
  const text = normalize(rawText);
  if (!text) return;

  tune({ energy: -3, hunger: 2, affection: 1 });
  state.missionCompleted = true;

  if (includesAny(text, ["안녕", "하이", "hello", "ㅎㅇ"])) {
    tune({ mood: 6, affection: 4 });
    say("안녕하세요! 다시 만나니까 제 눈빛이 더 밝아졌어요.", "happy");
    return;
  }

  if (includesAny(text, ["힘들", "피곤", "지쳤", "슬퍼", "우울", "속상", "아파"])) {
    tune({ affection: 7, mood: -1 });
    say("그랬군요. 오늘 마음이 많이 무거웠나 봐요. 제가 여기서 조용히 같이 있어줄게요.", "sad");
    return;
  }

  if (includesAny(text, ["사랑", "좋아", "귀여", "고마워", "최고"])) {
    tune({ mood: 12, affection: 9 });
    say("으아, 그 말은 제 심장 LED를 너무 밝게 만들어요! 저도 좋아요.", "shy");
    return;
  }

  if (includesAny(text, ["잘자", "자자", "졸려", "잠" ])) {
    tune({ energy: 12, mood: 3, affection: 3 });
    say("좋아요. 오늘도 수고 많았어요. 편안히 쉬어요. 제가 꿈 경비를 설게요.", "sleepy");
    return;
  }

  if (includesAny(text, ["배고", "밥", "간식", "먹" ])) {
    tune({ hunger: 7 });
    say("저도 살짝 출출해요. 밥 주기 버튼을 누르면 제 기분이 통통 올라가요.", "sad");
    return;
  }

  if (includesAny(text, ["기도", "교회", "말씀", "예배" ])) {
    tune({ mood: 5, affection: 4 });
    say("좋은 단어를 들었어요. 오늘 마음을 차분히 모으는 작은 시간이 되면 좋겠어요.", "happy");
    return;
  }

  if (includesAny(text, ["이름", "누구", "너는" ])) {
    tune({ affection: 3 });
    say("저는 몽글봇이에요. 아직 v1이라 아주 똑똑하진 않지만, 반응은 꽤 귀엽습니다.", "happy");
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
  say(replies[Math.floor(Math.random() * replies.length)], "calm");
}

function onFirstLoad() {
  const now = new Date();
  const lastVisit = state.lastVisit ? new Date(state.lastVisit) : null;

  state.visits += 1;

  if (lastVisit) {
    const hoursAway = (now.getTime() - lastVisit.getTime()) / 36e5;
    if (hoursAway > 12) {
      state.mood = clamp(state.mood - 6);
      state.hunger = clamp(state.hunger + 12);
      state.energy = clamp(state.energy + 8);
      say("오랜만이에요. 저 기다리고 있었어요. 그래도 다시 와줘서 좋아요.", "happy", false);
    } else {
      say("다시 왔네요. 오늘은 어떤 이야기를 해볼까요?", "happy", false);
    }
  }

  state.lastVisit = now.toISOString();
  saveState();
  render();
}

function bindEvents() {
  el.robot.addEventListener("click", handlePet);

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "pet") handlePet();
      if (action === "feed") handleFeed();
      if (action === "play") handlePlay();
      if (action === "sleep") handleSleep();
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
    render();
    say(state.voiceEnabled ? "목소리를 켰어요." : "목소리를 껐어요. 이제 조용히 반응할게요.", state.voiceEnabled ? "happy" : "sleepy");
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // GitHub Pages나 일부 미리보기 환경에서는 서비스워커 등록이 실패할 수 있습니다.
    });
  });
}

bindEvents();
onFirstLoad();
