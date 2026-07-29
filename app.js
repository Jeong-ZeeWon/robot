(() => {
  "use strict";

  const VERSION = 20;
  const STORE_KEY = "sioni-english-v20";
  const OLD_STORE_KEY = "sioni-english-v15";
  const API_ENDPOINT = window.SIONI_API_ENDPOINT || "/api/chat";
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const dateKey = (date = new Date()) => {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  };

  const WORLDS = [
    { id: "sunny", name: "Sunny Town", ko: "햇살 마을", icon: "☀️", range: [0, 3] },
    { id: "forest", name: "Whisper Forest", ko: "속삭임 숲", icon: "🌳", range: [4, 7] },
    { id: "space", name: "Star Lab", ko: "별빛 연구소", icon: "🚀", range: [8, 11] }
  ];

  const MISSIONS = [
    {
      id: "breakfast", world: 0, title: "시오니의 아침 식탁", kicker: "MISSION 01", art: "🥞",
      description: "좋아하는 아침 메뉴를 영어로 골라 줘!", phrase: "I like pancakes!", ko: "나는 팬케이크를 좋아해!",
      words: ["pancakes", "milk", "apple"], choices: [["🥞", "pancakes"], ["🥛", "milk"], ["🍎", "apple"]],
      answer: "🥞", question: "What does Sioni like?", reward: "🥞", color: "#ffd96d"
    },
    {
      id: "hello", world: 0, title: "새 친구를 만났어!", kicker: "MISSION 02", art: "👋",
      description: "먼저 다정하게 인사해 볼까?", phrase: "Hi! I am Sioni.", ko: "안녕! 나는 시오니야.",
      words: ["hi", "friend", "name"], choices: [["👋", "Hi"], ["😴", "Good night"], ["🍽️", "Eat"]],
      answer: "👋", question: "How do we say hello?", reward: "👋", color: "#8edcc5"
    },
    {
      id: "colors", world: 0, title: "무지개 페인트 소동", kicker: "MISSION 03", art: "🎨",
      description: "시오니가 잃어버린 색을 찾아 줘!", phrase: "It is bright yellow.", ko: "그것은 밝은 노란색이야.",
      words: ["yellow", "purple", "green"], choices: [["🟡", "yellow"], ["🟣", "purple"], ["🟢", "green"]],
      answer: "🟡", question: "Which one is yellow?", reward: "🖍️", color: "#ffbb70"
    },
    {
      id: "feelings", world: 0, title: "마음 날씨 방송", kicker: "MISSION 04", art: "😊",
      description: "오늘 마음의 날씨를 알려 줘!", phrase: "I feel happy today.", ko: "나는 오늘 기분이 좋아.",
      words: ["happy", "sad", "sleepy"], choices: [["😊", "happy"], ["😢", "sad"], ["😴", "sleepy"]],
      answer: "😊", question: "Which face is happy?", reward: "🌈", color: "#ffaaa8"
    },
    {
      id: "animals", world: 1, title: "숲속 발자국 탐정", kicker: "MISSION 05", art: "🐾",
      description: "누구의 발자국인지 영어로 말해 봐!", phrase: "I see a little fox.", ko: "작은 여우가 보여.",
      words: ["fox", "rabbit", "bear"], choices: [["🦊", "fox"], ["🐰", "rabbit"], ["🐻", "bear"]],
      answer: "🦊", question: "What does Sioni see?", reward: "🦊", color: "#8ed6a7"
    },
    {
      id: "picnic", world: 1, title: "비밀 소풍 바구니", kicker: "MISSION 06", art: "🧺",
      description: "소풍에 가져갈 간식을 골라 보자!", phrase: "Can I have an apple?", ko: "사과 하나 먹어도 될까요?",
      words: ["apple", "juice", "sandwich"], choices: [["🍎", "apple"], ["🧃", "juice"], ["🥪", "sandwich"]],
      answer: "🍎", question: "What did you ask for?", reward: "🧺", color: "#f2c875"
    },
    {
      id: "weather", world: 1, title: "구름 우체국", kicker: "MISSION 07", art: "☁️",
      description: "오늘 날씨 편지를 배달해 줘!", phrase: "It is cloudy today.", ko: "오늘은 흐린 날이야.",
      words: ["cloudy", "sunny", "rainy"], choices: [["☁️", "cloudy"], ["☀️", "sunny"], ["🌧️", "rainy"]],
      answer: "☁️", question: "How is the weather?", reward: "☂️", color: "#a9d5e8"
    },
    {
      id: "movement", world: 1, title: "동물 체조 시간", kicker: "MISSION 08", art: "🕺",
      description: "영어를 듣고 몸으로 표현해 봐!", phrase: "I can jump high!", ko: "나는 높이 뛸 수 있어!",
      words: ["jump", "run", "dance"], choices: [["🦘", "jump"], ["🏃", "run"], ["💃", "dance"]],
      answer: "🦘", question: "Which one can jump?", reward: "🏅", color: "#b2dfa0"
    },
    {
      id: "moon", world: 2, title: "달나라 첫 착륙", kicker: "MISSION 09", art: "🌙",
      description: "우주에서 보이는 것을 말해 보자!", phrase: "I can see the moon.", ko: "달이 보여.",
      words: ["moon", "star", "rocket"], choices: [["🌙", "moon"], ["⭐", "star"], ["🚀", "rocket"]],
      answer: "🌙", question: "What can you see?", reward: "🌙", color: "#b9b2ec"
    },
    {
      id: "alien", world: 2, title: "외계인과 하이파이브", kicker: "MISSION 10", art: "👽",
      description: "새로운 우주 친구를 소개해 줘!", phrase: "This is my new friend.", ko: "이 친구는 나의 새 친구야.",
      words: ["this", "new", "friend"], choices: [["🤝", "friend"], ["🚪", "door"], ["🍕", "pizza"]],
      answer: "🤝", question: "Which picture means friend?", reward: "👽", color: "#a8e5cc"
    },
    {
      id: "numbers", world: 2, title: "별 조각 세기", kicker: "MISSION 11", art: "✨",
      description: "반짝이는 별을 영어로 세어 보자!", phrase: "I see five stars.", ko: "별 다섯 개가 보여.",
      words: ["three", "four", "five"], choices: [["⭐⭐⭐", "three"], ["⭐⭐⭐⭐", "four"], ["⭐⭐⭐⭐⭐", "five"]],
      answer: "⭐⭐⭐⭐⭐", question: "Which group has five stars?", reward: "🔭", color: "#ffdc74"
    },
    {
      id: "home", world: 2, title: "지구로 돌아가는 날", kicker: "MISSION 12", art: "🌍",
      description: "친구들에게 따뜻하게 작별 인사해!", phrase: "See you again, friends!", ko: "친구들아, 다음에 또 만나!",
      words: ["see you", "again", "friends"], choices: [["👋", "See you"], ["😴", "Sleep"], ["🍴", "Eat"]],
      answer: "👋", question: "How do we say goodbye?", reward: "🚀", color: "#78c9dd"
    }
  ];

  const BADGES = [
    { id: "hello", icon: "🌱", name: "첫 영어", desc: "첫 활동 완료", test: s => s.completedMissions.length >= 1 },
    { id: "listener", icon: "🎧", name: "귀 쫑긋", desc: "5번 듣기", test: s => s.listens >= 5 },
    { id: "speaker", icon: "🦁", name: "용감한 입", desc: "5번 말하기", test: s => s.speaks >= 5 },
    { id: "explorer", icon: "🧭", name: "탐험가", desc: "모험 4개 완료", test: s => s.completedMissions.length >= 4 },
    { id: "chatter", icon: "💬", name: "수다 친구", desc: "AI 대화 5번", test: s => s.chatTurns >= 5 },
    { id: "star", icon: "🏆", name: "별빛 영웅", desc: "별 50개", test: s => s.stars >= 50 }
  ];

  const FEELINGS = {
    happy: { en: "I feel happy!", ko: "기분이 좋구나! 나도 신나!", mood: "happy", action: "jump" },
    excited: { en: "I am excited!", ko: "신나는 에너지가 팡팡!", mood: "surprised", action: "dance" },
    okay: { en: "I feel okay.", ko: "편안한 하루구나. 같이 천천히 해보자.", mood: "happy", action: "wave" },
    sleepy: { en: "I feel sleepy.", ko: "졸린 날엔 짧고 재미있게 해보자.", mood: "sleepy", action: "shy" }
  };

  const TOPICS = {
    food: { prompt: "Let's talk about food! What food do you like?", ko: "음식 이야기하자! 어떤 음식을 좋아해?", chips: ["I like pizza.", "I like strawberries.", "I like rice."] },
    animal: { prompt: "What animal do you want to meet?", ko: "어떤 동물을 만나고 싶어?", chips: ["I like dogs.", "I want to see a whale.", "A fox is cute."] },
    play: { prompt: "What was fun today?", ko: "오늘 무엇이 재미있었어?", chips: ["I played soccer.", "I drew a picture.", "I played with blocks."] },
    dream: { prompt: "Where shall we fly in our imagination?", ko: "상상 속에서 어디로 날아갈까?", chips: ["Let's go to the moon!", "I want to see dinosaurs.", "Let's visit a candy town."] }
  };

  const fallbackReplies = [
    { test: /pizza|rice|apple|food|eat|strawberry/i, reply: "Yum! That sounds tasty. What color is it?", korean: "맛있겠다! 그것은 무슨 색이야?", suggestions: ["It is red.", "It is yellow.", "It is brown."], emotion: "happy", action: "nod" },
    { test: /dog|cat|fox|whale|animal/i, reply: "What a lovely animal! Is it big or small?", korean: "정말 멋진 동물이야! 크니, 작니?", suggestions: ["It is big.", "It is small.", "It is cute."], emotion: "curious", action: "wave" },
    { test: /soccer|draw|block|play|game/i, reply: "That sounds fun! Who did you play with?", korean: "재미있었겠다! 누구와 같이 놀았어?", suggestions: ["With my friend.", "With my family.", "By myself."], emotion: "happy", action: "highfive" },
    { test: /moon|dinosaur|candy|space|rocket/i, reply: "Wow, what an adventure! What can you see there?", korean: "와, 멋진 모험이야! 거기에서 무엇이 보여?", suggestions: ["I see stars.", "I see a dinosaur.", "I see candy."], emotion: "surprised", action: "jump" },
    { test: /sad|angry|bad|tired/i, reply: "I hear you. You can say, “I feel sad.”", korean: "네 마음을 듣고 있어. ‘I feel sad.’라고 말해도 좋아.", suggestions: ["I feel sad.", "I feel tired.", "I want a hug."], emotion: "calm", action: "shy" }
  ];

  const defaults = {
    version: VERSION, stars: 0, streak: 1, lastVisit: null, activeDays: [], completedMissions: [],
    missionSteps: {}, listens: 0, speaks: 0, quizzes: 0, chatTurns: 0, games: 0,
    voice: true, koreanHelp: true, aiEnabled: true, currentMission: 0, selectedWorld: 0,
    collection: [], feeling: null, learnerId: crypto.randomUUID?.() || `kid-${Date.now()}`
  };

  let state = loadState();
  let recognition = null;
  let currentMissionIndex = state.currentMission;
  let missionStep = 0;
  let chatStarted = false;
  let toastTimer;

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY));
      if (stored) return { ...defaults, ...stored };
      const old = JSON.parse(localStorage.getItem(OLD_STORE_KEY));
      if (old) {
        return {
          ...defaults,
          stars: old.stars || 0, streak: old.streak || 1, lastVisit: old.lastVisit,
          activeDays: old.activeDays || [], listens: old.listens || 0, speaks: old.speaks || 0,
          voice: old.voice !== false, koreanHelp: old.koreanHelp !== false, aiEnabled: old.aiEnabled !== false,
          currentMission: Math.min(Math.max((old.lessonDay || 1) - 1, 0), MISSIONS.length - 1),
          collection: old.collections || []
        };
      }
    } catch {}
    return { ...defaults };
  }

  function saveState() {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function registerVisit() {
    const today = dateKey();
    if (state.lastVisit && state.lastVisit !== today) {
      const diff = Math.round((new Date(today) - new Date(state.lastVisit)) / 86400000);
      state.streak = diff === 1 ? state.streak + 1 : 1;
    }
    if (!state.activeDays.includes(today)) state.activeDays = [...state.activeDays, today].slice(-60);
    state.lastVisit = today;
    saveState();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2300);
  }

  function speak(text, onend) {
    if (!state.voice || !("speechSynthesis" in window)) {
      if (onend) onend();
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = .78;
    utterance.pitch = 1.12;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => /^en-(US|GB)/.test(v.lang) && /female|samantha|ava|zira/i.test(v.name))
      || voices.find(v => /^en/.test(v.lang)) || null;
    utterance.onend = () => onend?.();
    utterance.onerror = () => onend?.();
    speechSynthesis.speak(utterance);
  }

  function setRobot(mood = "happy", action = "wave") {
    const robot = $("#robot");
    const moodClasses = ["is-happy", "is-surprised", "is-sleepy", "is-thinking"];
    const actionClasses = ["action-wave", "action-highfive", "action-dance", "action-jump", "action-shy"];
    robot.classList.remove(...moodClasses, ...actionClasses);
    const moodMap = { happy: "is-happy", encouraging: "is-happy", surprised: "is-surprised", curious: "is-thinking", thinking: "is-thinking", sleepy: "is-sleepy", calm: "is-happy" };
    const actionMap = { nod: "action-jump", wave: "action-wave", highfive: "action-highfive", dance: "action-dance", jump: "action-jump", shy: "action-shy", surprise: "action-jump", pet: "action-shy" };
    void robot.offsetWidth;
    if (moodMap[mood]) robot.classList.add(moodMap[mood]);
    if (actionMap[action]) robot.classList.add(actionMap[action]);
    $("#robotScene")?.classList.add("is-celebrating");
    setTimeout(() => {
      robot.classList.remove(...actionClasses);
      $("#robotScene")?.classList.remove("is-celebrating");
    }, 1800);
  }

  function sparkle(symbol = "✦") {
    const container = $("#emotionSparkles");
    for (let i = 0; i < 9; i++) {
      const bit = document.createElement("i");
      bit.textContent = symbol;
      bit.style.left = `${35 + Math.random() * 40}%`;
      bit.style.top = `${35 + Math.random() * 35}%`;
      bit.style.setProperty("--x", `${-90 + Math.random() * 180}px`);
      bit.style.setProperty("--y", `${-70 - Math.random() * 120}px`);
      bit.style.color = ["#fff6a8", "#ff916c", "#8ff2d3"][i % 3];
      container.append(bit);
      setTimeout(() => bit.remove(), 1400);
    }
  }

  function celebrate() {
    const layer = $("#celebrationLayer");
    const colors = ["#ff7953", "#ffd85c", "#62d4b0", "#5aa9e8", "#8977de"];
    for (let i = 0; i < 42; i++) {
      const confetti = document.createElement("i");
      confetti.className = "confetti";
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.background = colors[i % colors.length];
      confetti.style.animationDelay = `${Math.random() * .5}s`;
      confetti.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
      layer.append(confetti);
      setTimeout(() => confetti.remove(), 3000);
    }
  }

  function currentMission() {
    return MISSIONS[Math.min(Math.max(state.currentMission, 0), MISSIONS.length - 1)];
  }

  function missionDoneSteps(index = state.currentMission) {
    return state.missionSteps[MISSIONS[index].id] || [];
  }

  function renderHome() {
    const mission = currentMission();
    const world = WORLDS[mission.world];
    const done = missionDoneSteps();
    $("#streakCount").textContent = state.streak;
    $("#starCount").textContent = state.stars;
    $("#worldName").textContent = `WORLD ${mission.world + 1} · ${world.name.toUpperCase()}`;
    $("#missionKicker").textContent = mission.kicker;
    $("#missionTitle").textContent = mission.title;
    $("#missionDesc").textContent = mission.description;
    $("#missionPhrase").textContent = mission.phrase;
    $("#missionArt span").textContent = mission.art;
    $("#missionArt").style.background = `linear-gradient(155deg,${mission.color},#ffad73)`;
    $("#missionProgressLabel").textContent = `${done.length} / 4`;
    $$(".segmented-progress i").forEach((bar, index) => bar.classList.toggle("is-done", index < done.length));
    $("#missionButtonHint").textContent = done.length ? "이어서 다음 활동" : "첫 활동부터 시작";
    $("#missionButtonText").textContent = done.length ? "모험 이어하기" : "모험 시작하기";
    const hour = new Date().getHours();
    const greeting = hour < 12
      ? ["GOOD MORNING, FRIEND!", "Ready for a tiny adventure?", "작은 영어 모험을 떠날 준비됐어?"]
      : hour < 18
        ? ["HELLO, MY FRIEND!", "I was waiting for you!", "시오니가 널 기다리고 있었어!"]
        : ["GOOD EVENING, FRIEND!", "Let's end today with a smile!", "오늘을 영어 한마디로 즐겁게 마무리하자!"];
    $("#greetingEyebrow").textContent = greeting[0];
    $("#greetingTitle").textContent = state.feeling ? FEELINGS[state.feeling].en : greeting[1];
    $("#greetingKorean").textContent = state.feeling ? FEELINGS[state.feeling].ko : greeting[2];
    $("#dayLabel").textContent = `오늘의 모험 · ${world.ko}`;
    $$(".emotion-dock button").forEach(button => button.classList.toggle("is-selected", button.dataset.feeling === state.feeling));
  }

  function goTo(view) {
    $$(".view").forEach(item => item.classList.toggle("is-active", item.dataset.view === view));
    $$(".bottom-nav button").forEach(item => item.classList.toggle("is-active", item.dataset.nav === view));
    if (view === "journey") renderJourney();
    if (view === "treasure") renderTreasure();
    if (view === "talk") beginTalk();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderJourney() {
    $("#journeyPercent").textContent = `${Math.round(state.completedMissions.length / MISSIONS.length * 100)}%`;
    $("#completedCount").textContent = state.completedMissions.length;
    $("#spokenCount").textContent = state.speaks;
    $("#rewardProgress").style.width = `${Math.min(100, state.completedMissions.length / 4 * 100)}%`;
    $("#nextRewardName").textContent = state.completedMissions.length >= 8 ? "별빛 망원경" : state.completedMissions.length >= 4 ? "우주 헬멧" : "탐험가 가방";
    $("#worldTabs").innerHTML = WORLDS.map((world, index) => `
      <button type="button" role="tab" aria-selected="${state.selectedWorld === index}" class="${state.selectedWorld === index ? "is-active" : ""}" data-world="${index}">
        ${world.icon} ${world.ko} <small>${world.name}</small>
      </button>`).join("");
    const world = WORLDS[state.selectedWorld];
    const missionIndexes = MISSIONS.map((_, i) => i).slice(world.range[0], world.range[1] + 1);
    const positions = [[20, 75], [42, 48], [68, 68], [82, 29]];
    $("#missionMap").innerHTML = missionIndexes.map((missionIndex, localIndex) => {
      const mission = MISSIONS[missionIndex];
      const done = state.completedMissions.includes(mission.id);
      const current = missionIndex === state.currentMission;
      const locked = missionIndex > state.currentMission && !done;
      return `<button type="button" class="map-node ${done ? "is-done" : ""} ${current ? "is-current" : ""} ${locked ? "is-locked" : ""}"
        style="left:${positions[localIndex][0]}%;top:${positions[localIndex][1]}%" data-mission="${missionIndex}" ${locked ? "disabled" : ""}>
        <span>${locked ? "🔒" : mission.art}</span><b>${mission.kicker.replace("MISSION ", "")} · ${mission.title}</b>
      </button>`;
    }).join("");
  }

  function renderTreasure() {
    $("#bigStarCount").textContent = state.stars;
    const today = new Date();
    const week = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - today.getDay() + index);
      return day;
    });
    const names = ["일", "월", "화", "수", "목", "금", "토"];
    $("#weekDays").innerHTML = week.map((day, index) => {
      const key = dateKey(day);
      const done = state.activeDays.includes(key);
      return `<div class="week-day ${done ? "is-done" : ""} ${key === dateKey() ? "is-today" : ""}"><small>${names[index]}</small><span>${done ? "★" : day.getDate()}</span></div>`;
    }).join("");
    const activeThisWeek = week.filter(day => state.activeDays.includes(dateKey(day))).length;
    $("#weekSummary").textContent = `${activeThisWeek}일 함께했어요`;
    $("#weeklyTitle").textContent = activeThisWeek >= 5 ? "꾸준함이 반짝반짝!" : activeThisWeek >= 2 ? "멋지게 이어가고 있어!" : "오늘 한 문장부터!";
    $("#weeklyCopy").textContent = activeThisWeek >= 5 ? "영어가 매일 조금씩 네 것이 되고 있어." : "짧게 자주 만나는 영어가 오래 기억돼.";
    const skills = [
      ["👂", "듣기", state.listens, "#62d4b0"],
      ["🎙️", "말하기", state.speaks, "#ff7953"],
      ["🎯", "이해하기", state.quizzes, "#5aa9e8"],
      ["💬", "대화하기", state.chatTurns, "#8977de"]
    ];
    $("#skillBars").innerHTML = skills.map(([icon, name, value, color]) => {
      const percent = Math.min(100, value / 12 * 100);
      return `<div class="skill-row"><span>${icon}</span><b>${name}</b><i><em style="width:${percent}%;background:${color}"></em></i><small>${value}번</small></div>`;
    }).join("");
    const earned = BADGES.filter(badge => badge.test(state));
    $("#badgeCount").textContent = `${earned.length} / ${BADGES.length}`;
    $("#badgeGrid").innerHTML = BADGES.map(badge => `<div class="badge ${badge.test(state) ? "is-earned" : ""}"><span>${badge.test(state) ? badge.icon : "🔒"}</span><b>${badge.name}</b><small>${badge.desc}</small></div>`).join("");
    $("#collectionRoom").innerHTML = MISSIONS.slice(0, 8).map((mission, index) => {
      const positions = [[12, 27], [34, 27], [58, 27], [82, 27], [12, 64], [34, 64], [58, 64], [82, 64]];
      return `<span class="collectible ${state.collection.includes(mission.reward) ? "" : "locked"}" style="left:${positions[index][0]}%;top:${positions[index][1]}%">${state.collection.includes(mission.reward) ? mission.reward : "?"}</span>`;
    }).join("");
  }

  function openMission(index = state.currentMission) {
    currentMissionIndex = index;
    const done = missionDoneSteps(index);
    missionStep = Math.min(done.length, 3);
    renderMissionPlayer();
    $("#missionDialog").showModal();
  }

  function renderMissionPlayer() {
    const mission = MISSIONS[currentMissionIndex];
    const stepNames = ["듣기", "말하기", "찾기", "보상"];
    $("#missionPlayer").innerHTML = `
      <div class="mission-shell">
        <aside class="mission-story-side">
          <button class="mission-close" type="button" data-close-mission aria-label="미션 닫기">×</button>
          <div class="mission-side-copy"><small>${mission.kicker} · ${stepNames[missionStep]}</small><h2>${mission.title}</h2><p>${mission.description}</p></div>
          <span class="side-robot">${mission.art}</span>
        </aside>
        <section class="mission-main">
          <div class="mission-stepper">${[0,1,2,3].map(index => `<i class="${index < missionStep ? "is-done" : index === missionStep ? "is-active" : ""}"></i>`).join("")}</div>
          <div id="missionStepContent" class="mission-content"></div>
        </section>
      </div>`;
    renderMissionStep();
  }

  function renderMissionStep() {
    const mission = MISSIONS[currentMissionIndex];
    const content = $("#missionStepContent");
    if (missionStep === 0) {
      content.innerHTML = `
        <small class="step-kicker">STEP 1 · LISTEN</small><h2>시오니의 말을 들어 봐!</h2><p>귀를 쫑긋하고 영어 리듬을 느껴 봐.</p>
        <button class="listen-orb" type="button" data-listen-phrase aria-label="${mission.phrase} 듣기">👂</button>
        <strong class="big-phrase">${mission.phrase}</strong><span class="big-translation">${state.koreanHelp ? mission.ko : ""}</span>
        <button class="mission-next" type="button" data-mission-next disabled>들었어요 · 다음으로</button>`;
    } else if (missionStep === 1) {
      content.innerHTML = `
        <small class="step-kicker">STEP 2 · SPEAK</small><h2>이제 네 목소리로 말해 봐!</h2><p>완벽하지 않아도 괜찮아. 용기가 가장 중요해.</p>
        <div class="speak-orb"><i class="sound-ring"></i><button type="button" data-record-phrase aria-label="영어 말하기">🎙️</button></div>
        <strong class="big-phrase">${mission.phrase}</strong><span class="big-translation" id="speechFeedback">버튼을 누르고 말해 보세요</span>
        <button class="mission-next" type="button" data-mission-next>말했어요 · 다음으로</button>`;
    } else if (missionStep === 2) {
      content.innerHTML = `
        <small class="step-kicker">STEP 3 · FIND IT</small><h2>${mission.question}</h2><p>맞는 그림을 골라 보세요.</p>
        <div class="choice-grid">${mission.choices.map(([emoji, word]) => `<button type="button" data-answer="${emoji}">${emoji}<small>${word}</small></button>`).join("")}</div>
        <span class="big-translation" id="quizFeedback">천천히 생각해도 좋아요.</span>
        <button class="mission-next" type="button" data-mission-next disabled>정답이에요 · 보상 보기</button>`;
    } else {
      const alreadyDone = state.completedMissions.includes(mission.id);
      content.innerHTML = `
        <small class="step-kicker">MISSION COMPLETE</small><div class="reward-burst">${mission.reward}</div>
        <h2>${alreadyDone ? "다시 해내서 더 단단해졌어!" : "와! 오늘의 모험 성공!"}</h2>
        <div class="earned-stars">★★★</div><p>${alreadyDone ? "복습하는 습관도 멋진 실력이야." : "새 보물이 시오니의 방에 도착했어."}</p>
        <div class="mission-actions"><button class="secondary" type="button" data-close-mission>나중에 보기</button><button class="primary" type="button" data-finish-mission>${currentMissionIndex < MISSIONS.length - 1 ? "다음 모험 확인" : "보물함 보기"}</button></div>`;
      if (!alreadyDone) completeMission(mission);
    }
  }

  function markMissionStep(step) {
    const mission = MISSIONS[currentMissionIndex];
    const done = new Set(state.missionSteps[mission.id] || []);
    done.add(step);
    state.missionSteps[mission.id] = [...done];
    saveState();
  }

  function completeMission(mission) {
    if (state.completedMissions.includes(mission.id)) return;
    state.completedMissions.push(mission.id);
    state.collection.push(mission.reward);
    state.stars += 8;
    if (currentMissionIndex === state.currentMission && state.currentMission < MISSIONS.length - 1) state.currentMission++;
    saveState();
    celebrate();
    setRobot("happy", "dance");
  }

  function nextMissionStep() {
    markMissionStep(missionStep);
    missionStep = Math.min(3, missionStep + 1);
    renderMissionPlayer();
  }

  function listenMission(button) {
    const mission = MISSIONS[currentMissionIndex];
    button.classList.add("is-playing");
    state.listens++;
    state.stars++;
    markMissionStep(0);
    saveState();
    const next = $("[data-mission-next]", $("#missionPlayer"));
    if (next) next.disabled = false;
    speak(mission.phrase, () => {
      button.classList.remove("is-playing");
    });
    setTimeout(() => button.classList.remove("is-playing"), 3500);
  }

  function listenWithRecognition(callback) {
    if (!SpeechRecognition) {
      showToast("이 브라우저에서는 음성 인식을 지원하지 않아요. 말한 뒤 다음을 눌러 주세요.");
      callback?.("");
      return;
    }
    if (recognition) recognition.abort();
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => callback?.(event.results[0][0].transcript);
    recognition.onerror = () => callback?.("");
    recognition.onend = () => { recognition = null; };
    recognition.start();
  }

  function recordMission(button) {
    const wrap = button.closest(".speak-orb");
    const feedback = $("#speechFeedback");
    wrap.classList.add("is-listening");
    feedback.textContent = "듣고 있어요… 천천히 말해 봐!";
    listenWithRecognition(transcript => {
      wrap.classList.remove("is-listening");
      state.speaks++;
      state.stars += 2;
      markMissionStep(1);
      saveState();
      feedback.textContent = transcript ? `“${transcript}” — 멋진 용기야!` : "말해 줘서 고마워! 목소리에 별 두 개!";
      setRobot("happy", "highfive");
      sparkle("★");
    });
  }

  function checkAnswer(button) {
    const mission = MISSIONS[currentMissionIndex];
    if (button.dataset.answer === mission.answer) {
      button.classList.add("is-right");
      $("#quizFeedback").textContent = `Yes! ${button.querySelector("small").textContent}! 정말 잘 찾았어.`;
      $$(".choice-grid button").forEach(item => item.disabled = true);
      $("[data-mission-next]", $("#missionPlayer")).disabled = false;
      state.quizzes++;
      state.stars += 2;
      markMissionStep(2);
      saveState();
      speak(`Yes! ${button.querySelector("small").textContent}!`);
    } else {
      button.classList.add("is-wrong");
      $("#quizFeedback").textContent = "거의 다 왔어! 다른 그림을 한 번 볼까?";
      setTimeout(() => button.classList.remove("is-wrong"), 650);
    }
  }

  function finishMission() {
    $("#missionDialog").close();
    renderHome();
    renderJourney();
    renderTreasure();
    if (currentMissionIndex < MISSIONS.length - 1) {
      state.selectedWorld = MISSIONS[state.currentMission].world;
      saveState();
      goTo("journey");
    } else {
      goTo("treasure");
    }
  }

  function beginTalk() {
    if (chatStarted) return;
    chatStarted = true;
    $("#chatLog").innerHTML = "";
    addChatMessage("sioni", "Hi! I’m Sioni. What shall we talk about?", "안녕! 난 시오니야. 무슨 이야기를 해볼까?");
    setSuggestions(["I like food.", "I like animals.", "Let's imagine!"]);
    updateTalkMeter();
  }

  function addChatMessage(role, english, korean = "", loading = false) {
    const empty = $(".chat-empty", $("#chatLog"));
    if (empty) empty.remove();
    const message = document.createElement("article");
    message.className = `chat-message ${role}${loading ? " is-loading" : ""}`;
    message.innerHTML = role === "sioni"
      ? `<span class="message-avatar">S</span><div class="message-body">${loading ? `<span class="typing-dots"><i></i><i></i><i></i></span>` : `<p>${escapeHtml(english)}</p>${state.koreanHelp && korean ? `<small>${escapeHtml(korean)}</small>` : ""}<button type="button" data-speak="${escapeHtml(english)}">🔊 다시 듣기</button>`}</div>`
      : `<div class="message-body"><p>${escapeHtml(english)}</p><small>내가 말한 문장</small></div>`;
    $("#chatLog").append(message);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
    return message;
  }

  function setSuggestions(items = []) {
    $("#suggestionChips").innerHTML = items.slice(0, 3).map(item => `<button type="button" data-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join("");
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }

  function isPrivate(text) {
    return /(?:\b\d{2,3}[- ]?\d{3,4}[- ]?\d{4}\b)|(?:https?:\/\/)|(?:@[\w.-]+)|(?:학교|주소|전화번호|휴대폰|사는 곳|school|address|phone number)/i.test(text);
  }

  async function sendChat(text) {
    const message = text.trim().slice(0, 160);
    if (!message) return;
    $("#chatInput").value = "";
    addChatMessage("user", message);
    setSuggestions([]);
    state.chatTurns++;
    state.speaks++;
    state.stars++;
    saveState();
    updateTalkMeter();
    if (isPrivate(message)) {
      addChatMessage("sioni", "Let’s keep private information secret.", "이름, 학교, 주소 같은 개인정보는 말하지 않기로 해요.");
      setSuggestions(["I like drawing.", "I like my friends.", "Let's talk about food."]);
      return;
    }
    const loading = addChatMessage("sioni", "", "", true);
    try {
      let data;
      if (!state.aiEnabled) throw new Error("AI disabled");
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          learnerId: state.learnerId,
          level: state.completedMissions.length < 4 ? "Pre-A1" : "A1",
          mission: currentMission().title,
          knownWords: currentMission().words,
          conversationTurn: state.chatTurns
        })
      });
      if (!response.ok) throw new Error(`AI ${response.status}`);
      data = await response.json();
      if (!data.reply) throw new Error("Empty AI response");
      loading.remove();
      addChatMessage("sioni", data.reply, data.korean);
      setSuggestions(data.suggestions?.length ? data.suggestions : makeSuggestions(data.reply));
      setRobot(data.emotion || "happy", data.action || "nod");
      speak(data.reply);
      $("#aiStatus").innerHTML = "<i></i> AI 친구 연결됨";
    } catch {
      const fallback = fallbackReplies.find(item => item.test.test(message)) || {
        reply: "That is interesting! Tell me one more thing.",
        korean: "재미있는 이야기야! 한 가지 더 말해 줄래?",
        suggestions: ["I like it.", "It is fun.", "It is my favorite."],
        emotion: "curious", action: "wave"
      };
      loading.remove();
      addChatMessage("sioni", fallback.reply, fallback.korean);
      setSuggestions(fallback.suggestions);
      setRobot(fallback.emotion, fallback.action);
      speak(fallback.reply);
      $("#aiStatus").innerHTML = "<i></i> 안전 대화 모드";
    }
  }

  function makeSuggestions(reply) {
    if (/color/i.test(reply)) return ["It is red.", "It is yellow.", "It is blue."];
    if (/big or small/i.test(reply)) return ["It is big.", "It is small.", "It is cute."];
    if (/what.*like/i.test(reply)) return ["I like pizza.", "I like dogs.", "I like soccer."];
    return ["Yes, I do!", "It is fun.", "I like it!"];
  }

  function updateTalkMeter() {
    const todayTurns = Math.min(5, state.chatTurns);
    $("#talkMeterFill").style.width = `${todayTurns / 5 * 100}%`;
    $("#talkMeterText").textContent = todayTurns === 0 ? "첫 문장을 기다리고 있어요" : todayTurns >= 5 ? "오늘의 말하기 꽃이 피었어요!" : `${todayTurns}문장 말했어요 · ${5 - todayTurns}문장 더!`;
  }

  function chooseTopic(topicId) {
    const topic = TOPICS[topicId];
    addChatMessage("sioni", topic.prompt, topic.ko);
    setSuggestions(topic.chips);
    speak(topic.prompt);
  }

  function startChatMic() {
    const button = $("#micButton");
    button.classList.add("is-listening");
    $("#inputCoach").textContent = "듣고 있어요… 영어로 말해 보세요!";
    listenWithRecognition(transcript => {
      button.classList.remove("is-listening");
      $("#inputCoach").textContent = transcript ? `들린 문장: ${transcript}` : "잘 안 들렸어요. 다시 말하거나 써 주세요.";
      if (transcript) sendChat(transcript);
    });
  }

  function openGame(type) {
    const games = {
      word: {
        emoji: "🍎", title: "단어 팡팡", copy: "시오니가 말하는 단어를 듣고 그림을 골라 봐!",
        options: [["Apple", "🍎"], ["Banana", "🍌"], ["Grape", "🍇"]]
      },
      role: {
        emoji: "🥤", title: "간식 가게 역할 놀이", copy: "시오니에게 원하는 음료를 주문해 봐!",
        options: [["Milk, please.", "🥛"], ["Juice, please.", "🧃"], ["Water, please.", "💧"]]
      },
      rhythm: {
        emoji: "🎧", title: "리듬 영어", copy: "박자를 느끼며 한 문장을 골라 따라 해 봐!",
        options: [["Clap, clap, hello!", "👏"], ["Jump up high!", "🦘"], ["Turn around!", "💫"]]
      }
    };
    const game = games[type] || games.word;
    $("#gameContent").innerHTML = `<div class="game-emoji">${game.emoji}</div><small class="dialog-eyebrow">QUICK PLAY</small><h2>${game.title}</h2><p>${game.copy}</p><div class="game-options">${game.options.map(([line, icon]) => `<button type="button" data-game-line="${escapeHtml(line)}">${icon} ${line}</button>`).join("")}</div>`;
    $("#gameDialog").showModal();
    speak(game.options[0][0]);
  }

  function playGameLine(line, button) {
    speak(line);
    state.games++;
    state.speaks++;
    state.stars += 2;
    saveState();
    button.textContent = `★ +2 · ${line}`;
    button.parentElement.querySelectorAll("button").forEach(item => item.disabled = true);
    setTimeout(() => {
      $("#gameDialog").close();
      showToast("영어 놀이 성공! 별 2개를 받았어요 ★");
      renderHome();
    }, 1200);
  }

  function openParent() {
    $("#parentGate").hidden = false;
    $("#parentReport").hidden = true;
    $("#parentAnswer").value = "";
    $("#parentDialog").showModal();
    setTimeout(() => $("#parentAnswer").focus(), 100);
  }

  function renderParentReport() {
    $("#parentGate").hidden = true;
    const report = $("#parentReport");
    report.hidden = false;
    const earned = BADGES.filter(b => b.test(state)).length;
    const totalActivities = state.listens + state.speaks + state.quizzes + state.games;
    const recommendation = state.speaks < state.listens
      ? "듣기는 충분히 즐기고 있어요. 다음에는 아이가 고른 짧은 문장을 말해보도록 격려해 주세요."
      : state.chatTurns < 3
        ? "정해진 문장은 잘하고 있어요. AI 수다에서 관심 있는 주제로 자유롭게 한두 문장 말해보면 좋아요."
        : "듣기와 말하기가 고르게 자라고 있어요. 지금처럼 짧고 즐겁게 이어가는 것이 가장 좋습니다.";
    report.innerHTML = `
      <header class="report-header"><p class="dialog-eyebrow">SIONI PARENT REPORT</p><h2>이번 학습 리포트</h2><p>점수보다 아이가 시도한 횟수와 관심을 보여드려요.</p></header>
      <div class="report-grid">
        <div class="report-stat"><b>${state.activeDays.length}</b><small>함께한 날</small></div>
        <div class="report-stat"><b>${state.speaks}</b><small>말한 횟수</small></div>
        <div class="report-stat"><b>${earned}</b><small>얻은 배지</small></div>
      </div>
      <section class="report-section"><h3>지금까지의 성장</h3><p>총 ${totalActivities}번의 학습 행동을 했고, ${state.completedMissions.length}개의 이야기 미션을 완료했습니다. 현재 별은 ${state.stars}개입니다.</p></section>
      <section class="report-section"><h3>시오니의 다음 제안</h3><p>${recommendation}</p></section>
      <section class="report-section"><h3>아이와 이렇게 이야기해 보세요</h3><ul><li>“오늘 어떤 영어가 제일 재미있었어?”</li><li>“틀려도 말해 본 네 용기가 정말 멋져.”</li></ul></section>
      <section class="report-section"><h3>학습 설정</h3>
        <label class="setting-row">영어 음성 사용 <input id="reportVoiceToggle" type="checkbox" ${state.voice ? "checked" : ""}></label>
        <label class="setting-row">한국어 도움말 <input id="reportKoreanToggle" type="checkbox" ${state.koreanHelp ? "checked" : ""}></label>
        <label class="setting-row">AI 대화 사용 <input id="reportAiToggle" type="checkbox" ${state.aiEnabled ? "checked" : ""}></label>
        <button id="resetProgress" class="danger-button" type="button">모든 학습 기록 초기화</button>
      </section>`;
  }

  function bindEvents() {
    document.addEventListener("click", event => {
      const go = event.target.closest("[data-go],[data-nav]");
      if (go) goTo(go.dataset.go || go.dataset.nav);

      const feeling = event.target.closest("[data-feeling]");
      if (feeling) {
        state.feeling = feeling.dataset.feeling;
        saveState();
        const item = FEELINGS[state.feeling];
        renderHome();
        setRobot(item.mood, item.action);
        sparkle(state.feeling === "sleepy" ? "☁" : "★");
        speak(item.en);
      }

      if (event.target.closest("#robot")) {
        setRobot("happy", "shy");
        sparkle("♥");
        const lines = [["That tickles!", "간지러워!"], ["You are my best buddy!", "넌 정말 좋은 친구야!"], ["My heart is sparkling!", "내 마음의 별이 반짝여!"]];
        const line = lines[Math.floor(Math.random() * lines.length)];
        $("#greetingTitle").textContent = line[0];
        $("#greetingKorean").textContent = line[1];
        speak(line[0]);
      }

      if (event.target.closest("#greetingSpeak")) speak($("#greetingTitle").textContent);
      if (event.target.closest("#startMission")) openMission();
      const mapNode = event.target.closest("[data-mission]");
      if (mapNode) openMission(Number(mapNode.dataset.mission));
      const world = event.target.closest("[data-world]");
      if (world) { state.selectedWorld = Number(world.dataset.world); saveState(); renderJourney(); }
      const closeMission = event.target.closest("[data-close-mission]");
      if (closeMission) $("#missionDialog").close();
      const listenButton = event.target.closest("[data-listen-phrase]");
      if (listenButton) listenMission(listenButton);
      const recordButton = event.target.closest("[data-record-phrase]");
      if (recordButton) recordMission(recordButton);
      const answer = event.target.closest("[data-answer]");
      if (answer) checkAnswer(answer);
      const next = event.target.closest("[data-mission-next]");
      if (next && !next.disabled) nextMissionStep();
      if (event.target.closest("[data-finish-mission]")) finishMission();
      const topic = event.target.closest("[data-topic]");
      if (topic) chooseTopic(topic.dataset.topic);
      const suggestion = event.target.closest("[data-suggestion]");
      if (suggestion) sendChat(suggestion.dataset.suggestion);
      const speakButton = event.target.closest("[data-speak]");
      if (speakButton) speak(speakButton.dataset.speak);
      const quickGame = event.target.closest("[data-quick-game]");
      if (quickGame) openGame(quickGame.dataset.quickGame);
      const gameLine = event.target.closest("[data-game-line]");
      if (gameLine) playGameLine(gameLine.dataset.gameLine, gameLine);
      const close = event.target.closest("[data-close]");
      if (close) $(`#${close.dataset.close}`).close();
      if (event.target.closest("#parentButton")) openParent();
      if (event.target.closest("#parentUnlock")) {
        if ($("#parentAnswer").value === "16") renderParentReport();
        else { showToast("계산 결과를 다시 확인해 주세요."); $("#parentAnswer").select(); }
      }
      if (event.target.closest("#micButton")) startChatMic();
      if (event.target.closest("#soundButton")) {
        state.voice = !state.voice;
        saveState();
        renderSound();
        if (state.voice) speak("Sound on!");
      }
      if (event.target.closest("#resetProgress")) {
        if (confirm("시오니와 함께한 모든 학습 기록을 정말 지울까요?")) {
          localStorage.removeItem(STORE_KEY);
          state = { ...defaults, learnerId: crypto.randomUUID?.() || `kid-${Date.now()}` };
          saveState();
          location.reload();
        }
      }
    });

    $("#chatForm").addEventListener("submit", event => {
      event.preventDefault();
      sendChat($("#chatInput").value);
    });
    $("#parentDialog").addEventListener("change", event => {
      if (event.target.id === "reportVoiceToggle") state.voice = event.target.checked;
      if (event.target.id === "reportKoreanToggle") state.koreanHelp = event.target.checked;
      if (event.target.id === "reportAiToggle") state.aiEnabled = event.target.checked;
      saveState();
      renderSound();
    });
  }

  function renderSound() {
    $("#soundButton").classList.toggle("is-muted", !state.voice);
    $("#soundButton").setAttribute("aria-pressed", String(state.voice));
    $("#soundButton").setAttribute("aria-label", state.voice ? "소리 끄기" : "소리 켜기");
  }

  function init() {
    registerVisit();
    renderHome();
    renderJourney();
    renderTreasure();
    renderSound();
    bindEvents();
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
  }

  init();
})();
