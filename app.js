(() => {
  "use strict";

  const STORE_KEY = "sioni-english-v15";
  const API_ENDPOINT = window.SIONI_API_ENDPOINT || "/api/chat";
  const today = () => new Date().toISOString().slice(0, 10);
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  const defaultState = {
    stars: 0, streak: 1, lastVisit: null, activeDays: [], completed: {},
    listens: 0, speaks: 0, voice: true, koreanHelp: true, aiEnabled: true,
    lessonDay: 1, collections: ["seed"], actionHistory: [],
    learnerId: crypto.randomUUID?.() || `kid-${Date.now()}`
  };

  const lessonPlan = [
    { world:"아침 방", icon:"👋", phrase:"Hello, Sioni!", ko:"안녕, 시오니!", words:["hello","hi","bye","friend"], quiz:["👋","😴","🍎"], answer:"👋", question:"Which means hello?", reward:"🌞" },
    { world:"아침 방", icon:"😄", phrase:"I am happy.", ko:"나는 기뻐.", words:["happy","sad","good","okay"], quiz:["😄","😢","😴"], answer:"😄", question:"Which face is happy?", reward:"🌈" },
    { world:"아침 방", icon:"😴", phrase:"I am sleepy.", ko:"나는 졸려.", words:["sleepy","awake","bed","morning"], quiz:["😴","🤩","😡"], answer:"😴", question:"Which face is sleepy?", reward:"🌙" },
    { world:"아침 방", icon:"☀️", phrase:"Good morning!", ko:"좋은 아침!", words:["morning","sun","wake","hello"], quiz:["☀️","🌙","⭐"], answer:"☀️", question:"What do we see in the morning?", reward:"⏰" },
    { world:"아침 방", icon:"🎨", phrase:"It is purple.", ko:"그것은 보라색이야.", words:["purple","yellow","green","red"], quiz:["🟣","🟡","🟢"], answer:"🟣", question:"Which one is purple?", reward:"🖍️" },
    { world:"아침 방", icon:"🤖", phrase:"You are my friend.", ko:"너는 나의 친구야.", words:["you","my","friend","robot"], quiz:["🤝","🏃","🍽️"], answer:"🤝", question:"Which picture means friend?", reward:"💜" },
    { world:"아침 방", icon:"🏆", phrase:"Hello! I am happy.", ko:"안녕! 나는 기뻐.", words:["hello","happy","morning","friend"], quiz:["😄","😴","😢"], answer:"😄", question:"Show Sioni a happy face!", reward:"🏅" },
    { world:"간식 연구소", icon:"🍎", phrase:"I like apples.", ko:"나는 사과를 좋아해.", words:["apple","banana","grape","like"], quiz:["🍎","🍌","🍇"], answer:"🍎", question:"Which one is an apple?", reward:"🍎" },
    { world:"간식 연구소", icon:"🥛", phrase:"I want milk.", ko:"나는 우유를 원해.", words:["milk","water","juice","want"], quiz:["🥛","🧃","🍎"], answer:"🥛", question:"Which one is milk?", reward:"🥛" },
    { world:"간식 연구소", icon:"🍌", phrase:"It is yellow.", ko:"그것은 노란색이야.", words:["yellow","banana","color","bright"], quiz:["🍌","🍎","🍇"], answer:"🍌", question:"Which food is yellow?", reward:"🍌" },
    { world:"간식 연구소", icon:"😋", phrase:"It is yummy!", ko:"맛있어!", words:["yummy","sweet","snack","eat"], quiz:["😋","😴","😢"], answer:"😋", question:"Which face says yummy?", reward:"🧁" },
    { world:"간식 연구소", icon:"🙏", phrase:"An apple, please.", ko:"사과 하나 주세요.", words:["please","apple","give","one"], quiz:["🍎","🥛","🍪"], answer:"🍎", question:"What did you ask for?", reward:"🛒" },
    { world:"간식 연구소", icon:"💛", phrase:"Thank you!", ko:"고마워!", words:["thank","you","please","welcome"], quiz:["🙏","👋","😴"], answer:"🙏", question:"Which picture means thank you?", reward:"🎀" },
    { world:"간식 연구소", icon:"🎉", phrase:"I like yummy apples!", ko:"나는 맛있는 사과를 좋아해!", words:["like","yummy","apple","thank"], quiz:["🍎","🥦","🥛"], answer:"🍎", question:"Pick your apple!", reward:"🏆" }
  ];
  const currentLesson = () => lessonPlan[(Math.max(1, state.lessonDay) - 1) % lessonPlan.length];

  const demoReplies = [
    { test: /pizza|food|eat/i, en: "Yum! I like pizza, too. What color is your favorite food?", ko: "맛있겠다! 나도 피자를 좋아해. 네가 좋아하는 음식은 무슨 색이니?" },
    { test: /cat|dog|animal/i, en: "Cute! I like animals. Is it big or small?", ko: "귀엽다! 나도 동물을 좋아해. 크니, 작니?" },
    { test: /soccer|game|play/i, en: "That sounds fun! Who do you play with?", ko: "재미있겠다! 누구와 함께 하니?" },
    { test: /happy|good|great/i, en: "I am happy to hear that! What made you happy?", ko: "그 말을 들으니 나도 기뻐! 무엇 때문에 기뻤니?" },
    { test: /sad|bad|angry/i, en: "I hear you. You can say, “I feel sad.” Would you like to try?", ko: "네 마음을 듣고 있어. ‘I feel sad.’라고 말해볼까?" },
    { test: /like|love/i, en: "Great sentence! Tell me one more thing you like.", ko: "멋진 문장이야! 좋아하는 것을 하나 더 말해줘." }
  ];

  const actionLines = {
    pet: [
      ["That tickles!","간지러워!","pet"],["Aww, thank you!","쓰다듬어 줘서 고마워!","shy"],["My star feels warm!","가슴의 별이 따뜻해졌어!","nod"]
    ],
    highfive: [
      ["High five!","하이파이브!","highfive"],["Up high! Great job!","위로 높이! 잘했어!","celebrate"],["Five sparkles for you!","반짝이 다섯 개를 줄게!","highfive"]
    ],
    dance: [
      ["Dance with me!","나와 같이 춤추자!","dance"],["One, two, wiggle!","하나, 둘, 흔들흔들!","dance"],["This is my robot groove!","이게 나의 로봇 춤이야!","spin"]
    ],
    surprise: [
      ["Ta-da! A tiny surprise!","짜잔! 작은 깜짝 선물이야!","surprise"],["Guess what is in the box!","상자 안에 무엇이 있을까?","surprise"],["A star for brave English!","용감한 영어에 별 하나!","celebrate"]
    ]
  };
  const propLines = {
    lamp:["Light on! It is bright.","불이 켜졌어! 밝다."],
    book:["Let's open our English book.","영어책을 펼쳐 보자."],
    plant:["Grow, little plant!","작은 화분아, 쑥쑥 자라라!"],
    ball:["Roll, purple ball!","보라색 공아, 데굴데굴!"]
  };

  let state = load();
  let toastTimer;
  let recognition;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  function load() {
    try { return { ...defaultState, ...(JSON.parse(localStorage.getItem(STORE_KEY)) || {}) }; }
    catch { return { ...defaultState }; }
  }
  function save() { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }

  function markVisit() {
    const key = today();
    const last = state.lastVisit;
    if (last && last !== key) {
      const difference = Math.round((new Date(key) - new Date(last)) / 86400000);
      state.streak = difference === 1 ? state.streak + 1 : 1;
      if (difference > 0) state.lessonDay = Math.min(14, (state.lessonDay || 1) + 1);
    }
    if (!state.activeDays.includes(key)) state.activeDays = [...state.activeDays, key].slice(-30);
    state.lastVisit = key;
    save();
  }

  function showToast(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function speak(text, onEnd) {
    if (!state.voice || !("speechSynthesis" in window)) { onEnd?.(); return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = .82;
    utterance.pitch = 1.08;
    const englishVoice = speechSynthesis.getVoices().find(v => /^en(-|_)/i.test(v.lang));
    if (englishVoice) utterance.voice = englishVoice;
    $("#robot").classList.add("speaking");
    utterance.onend = () => { $("#robot").classList.remove("speaking"); onEnd?.(); };
    utterance.onerror = () => $("#robot").classList.remove("speaking");
    speechSynthesis.speak(utterance);
  }

  function celebrate(message, stars = 1) {
    state.stars += stars;
    $("#robot").classList.remove("celebrate");
    requestAnimationFrame(() => $("#robot").classList.add("celebrate"));
    showToast(`⭐ +${stars} ${message}`);
    save();
    render();
  }

  function completeStep(step) {
    const key = `${today()}:${step}`;
    if (!state.completed[key]) {
      state.completed[key] = true;
      celebrate("참 잘했어요!", step === "quiz" ? 3 : 1);
    }
    render();
  }

  function openLesson(step) {
    const lessons = currentLesson();
    const dialog = $("#activityDialog");
    const content = $("#activityContent");
    if (step === "listen") {
      content.innerHTML = `<div class="activity-emoji">👂</div><p class="dialog-kicker">LISTEN</p><h2>${lessons.phrase}</h2><p>${lessons.ko}<br>시오니의 말을 잘 들어보세요.</p><div class="activity-options"><button data-do-listen>🔊 보통 속도로 듣기</button><button class="secondary" data-slow-speak="${lessons.phrase}">🐢 천천히 듣기</button></div>`;
    } else if (step === "speak") {
      content.innerHTML = `<div class="activity-emoji">🎙️</div><p class="dialog-kicker">SAY IT</p><h2>${lessons.phrase}</h2><p>천천히 따라 말해 보세요.<br>완벽하지 않아도 괜찮아요!</p><div class="activity-options"><button data-do-speak>🎙️ 말해 보기</button><button class="secondary" data-speak="${lessons.phrase}">🔊 먼저 듣기</button></div>`;
    } else {
      content.innerHTML = `<div class="activity-emoji">🧩</div><p class="dialog-kicker">PICTURE QUIZ</p><h2>${lessons.question}</h2><p>잘 듣고 알맞은 그림을 골라 보세요.</p><div class="activity-options">${lessons.quiz.map(choice => `<button class="secondary" data-quiz="${choice}">${choice}</button>`).join("")}</div>`;
    }
    dialog.showModal();
  }

  function runRecognition(onResult) {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      showToast("이 브라우저에서는 마이크 대신 글자로 입력해 주세요.");
      return;
    }
    recognition?.abort();
    recognition = new Recognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    $("#micButton").classList.add("is-listening");
    showToast("듣고 있어요. 영어로 말해 보세요!");
    recognition.onresult = event => onResult(event.results[0][0].transcript);
    recognition.onerror = () => showToast("잘 듣지 못했어요. 다시 해볼까요?");
    recognition.onend = () => $("#micButton").classList.remove("is-listening");
    recognition.start();
  }

  function demoReply(input) {
    const found = demoReplies.find(item => item.test.test(input));
    return found || { en: "Nice try! Can you tell me what you like?", ko: "멋진 시도야! 네가 좋아하는 것을 말해줄래?" };
  }

  async function getAiReply(message) {
    if (!state.aiEnabled) return { ...demoReply(message), action: "nod", source: "local" };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, learnerId: state.learnerId }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error("AI unavailable");
      const data = await response.json();
      if (!data.reply || typeof data.reply !== "string") throw new Error("Invalid AI reply");
      return { en: data.reply, ko: data.korean || "", action: data.action || "nod", source: "ai" };
    } catch {
      return { ...demoReply(message), action: "nod", source: "local" };
    } finally { clearTimeout(timer); }
  }

  function addChat(role, english, korean = "") {
    const article = document.createElement("article");
    article.className = `chat-message ${role}`;
    article.innerHTML = role === "sioni"
      ? `<span class="mini-bot">S</span><div><p></p><small></small><button type="button">🔊</button></div>`
      : `<div><p></p></div>`;
    $("p", article).textContent = english;
    const small = $("small", article);
    if (small) { small.textContent = state.koreanHelp ? korean : ""; small.hidden = !state.koreanHelp || !korean; }
    const button = $("button", article);
    if (button) button.addEventListener("click", () => speak(english));
    $("#chatLog").append(article);
    $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
  }

  async function sendChat(message) {
    const clean = message.trim().slice(0, 160);
    if (!clean) return;
    addChat("user", clean);
    $("#chatInput").value = "";
    state.speaks += 1;
    if (state.speaks <= 5) celebrate("용감하게 말했어요!", 1);
    $("#aiStatus").textContent = "생각 중…";
    $("#robot").classList.add("thinking");
    const reply = await getAiReply(clean);
    $("#robot").classList.remove("thinking");
    $("#aiStatus").textContent = reply.source === "ai" ? "AI 친구" : "안전 대화";
    addChat("sioni", reply.en, reply.ko);
    if (reply.action) {
      const robot = $("#robot");
      [...robot.classList].filter(name => name.startsWith("action-")).forEach(name => robot.classList.remove(name));
      void robot.offsetWidth;
      robot.classList.add(`action-${reply.action}`);
    }
    speak(reply.en);
  }

  function openActivity(kind) {
    const lesson = currentLesson();
    if (kind === "words") {
      $("#activityContent").innerHTML = `<div class="activity-emoji">${lesson.icon}</div><p class="dialog-kicker">WORD PLAY</p><h2>Tap and listen!</h2><p>오늘의 영어 단어를 눌러 들어요.</p><div class="activity-options">${lesson.words.map((word,index)=>`<button class="${index ? "secondary" : ""}" data-word="${word}">${word}</button>`).join("")}</div>`;
    } else if (kind === "roleplay") {
      $("#activityContent").innerHTML = `<div class="activity-emoji">🎭</div><p class="dialog-kicker">ROLE PLAY</p><h2>At the snack shop</h2><p>시오니에게 먹고 싶은 것을 영어로 말해요.</p><div class="activity-options"><button data-roleplay="Can I have an apple, please?">Can I have an apple, please?</button><button class="secondary" data-speak="Can I have an apple, please?">🔊 먼저 듣기</button></div>`;
    } else {
      $("#activityContent").innerHTML = `<div class="activity-emoji">🏆</div><p class="dialog-kicker">REVIEW</p><h2>What do you like?</h2><p>I like ___ 문장을 완성해 보세요.</p><div class="activity-options"><button data-roleplay="I like apples!">I like apples!</button><button class="secondary" data-roleplay="I like soccer!">I like soccer!</button></div>`;
    }
    $("#activityDialog").showModal();
  }

  function sioniReact(action) {
    const options = actionLines[action] || actionLines.pet;
    const recent = state.actionHistory.slice(-2);
    const available = options.filter((_, index) => !recent.includes(`${action}:${index}`));
    const picked = available[Math.floor(Math.random() * available.length)] || options[0];
    const index = options.indexOf(picked);
    state.actionHistory = [...state.actionHistory, `${action}:${index}`].slice(-8);
    const [english, korean, motion] = picked;
    const robot = $("#robot");
    [...robot.classList].filter(name => name.startsWith("action-")).forEach(name => robot.classList.remove(name));
    void robot.offsetWidth;
    robot.classList.add(`action-${motion}`);
    $("#helloTitle").textContent = english;
    $("#helloKorean").textContent = korean;
    speak(english);
    if (action === "surprise" && !state.completed[`${today()}:surprise`]) {
      state.completed[`${today()}:surprise`] = true;
      celebrate("깜짝 별을 찾았어요!", 1);
    }
    save();
  }

  function propReact(button) {
    const prop = button.dataset.prop;
    const [english, korean] = propLines[prop];
    button.classList.remove("is-active");
    void button.offsetWidth;
    button.classList.add("is-active");
    $("#helloTitle").textContent = english;
    $("#helloKorean").textContent = korean;
    speak(english);
  }

  function openGame(kind) {
    const lesson = currentLesson();
    const game = {
      wordPop: `<div class="activity-emoji">🫧</div><p class="dialog-kicker">WORD POP</p><h2>Pop a word!</h2><p>단어를 누르면 시오니가 읽어 줘요.</p><div class="activity-options">${lesson.words.map(w=>`<button class="secondary" data-word="${w}" data-game-done="2">${w}</button>`).join("")}</div>`,
      roleplay: `<div class="activity-emoji">🛍️</div><p class="dialog-kicker">ROLE PLAY</p><h2>Say it to Sioni!</h2><p>오늘 문장으로 시오니와 역할 놀이를 해요.</p><div class="activity-options"><button data-roleplay="${lesson.phrase}" data-game-done="3">${lesson.phrase}</button><button class="secondary" data-speak="${lesson.phrase}">🔊 먼저 듣기</button></div>`,
      soundHunt: `<div class="activity-emoji">👂</div><p class="dialog-kicker">SOUND HUNT</p><h2>Listen and find it!</h2><p>문장을 듣고 알맞은 그림을 골라요.</p><div class="activity-options"><button data-speak="${lesson.phrase}">🔊 문장 듣기</button>${lesson.quiz.map(q=>`<button class="secondary" data-quiz="${q}" data-game-done="2">${q}</button>`).join("")}</div>`,
      emotion: `<div class="activity-emoji">🪞</div><p class="dialog-kicker">EMOTION MIRROR</p><h2>How are you?</h2><p>내 기분을 골라 영어로 말해요.</p><div class="activity-options"><button data-roleplay="I am happy." data-game-done="2">😄 I am happy.</button><button class="secondary" data-roleplay="I am okay." data-game-done="2">🙂 I am okay.</button><button class="secondary" data-roleplay="I am sad." data-game-done="2">😢 I am sad.</button></div>`
    }[kind];
    $("#activityContent").innerHTML = game;
    $("#activityDialog").showModal();
  }

  function navigate(view) {
    $$(".view").forEach(el => el.classList.toggle("is-active", el.dataset.view === view));
    $$("[data-nav]").forEach(el => el.classList.toggle("is-active", el.dataset.nav === view));
    scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderWeek() {
    const wrap = $("#weekDays");
    wrap.innerHTML = "";
    for (let offset = 6; offset >= 0; offset--) {
      const date = new Date();
      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);
      const key = date.toISOString().slice(0, 10);
      const item = document.createElement("div");
      item.className = `week-day ${state.activeDays.includes(key) ? "is-done" : ""}`;
      item.innerHTML = `<small>${dayNames[date.getDay()]}</small><span>${state.activeDays.includes(key) ? "⭐" : date.getDate()}</span>`;
      wrap.append(item);
    }
  }

  function render() {
    const lesson = currentLesson();
    $("#starCount").textContent = state.stars;
    $("#bigStarCount").textContent = state.stars;
    $("#streakCount").textContent = state.streak;
    const done = ["listen", "speak", "quiz"].filter(step => state.completed[`${today()}:${step}`]);
    $("#lessonProgressText").textContent = `${done.length}/3`;
    $("#lessonProgress").style.width = `${done.length / 3 * 100}%`;
    $$(".lesson-step").forEach(button => button.classList.toggle("is-done", done.includes(button.dataset.step)));
    $("#soundButton").textContent = state.voice ? "🔊" : "🔇";
    $("#soundButton").setAttribute("aria-pressed", String(state.voice));
    $("#soundButton").setAttribute("aria-label", `시오니 목소리 ${state.voice ? "끄기" : "켜기"}`);
    $("#koreanToggle").checked = state.koreanHelp;
    $("#aiToggle").checked = state.aiEnabled;
    $("#lessonDaySelect").value = String(state.lessonDay);
    $("#badgeFirst").classList.toggle("is-earned", state.speaks >= 1);
    $("#badgeListener").classList.toggle("is-earned", state.listens >= 3);
    $("#badgeBrave").classList.toggle("is-earned", state.speaks >= 5);
    $("#lessonTitle").textContent = lesson.phrase;
    $(".lesson-icon").textContent = lesson.icon;
    $(".bubble-kicker").textContent = `DAY ${state.lessonDay} · ${lesson.world.toUpperCase()}`;
    $("#collectionShelf").innerHTML = ["seed","sun","rainbow","apple","milk","trophy"].map((item,index) => {
      const icons = ["🌱","🌞","🌈","🍎","🥛","🏆"];
      const unlocked = index === 0 || state.stars >= index * 5;
      return `<span class="${unlocked ? "" : "locked"}">${unlocked ? icons[index] : "?"}</span>`;
    }).join("");
    $("#sioniRoom").classList.toggle("room-snack", state.lessonDay > 7);
    renderWeek();
  }

  function bind() {
    $$("[data-nav]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.nav)));
    $$("[data-jump]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.jump)));
    $$(".lesson-step").forEach(button => button.addEventListener("click", () => openLesson(button.dataset.step)));
    $$("[data-sioni-action]").forEach(button => button.addEventListener("click", () => sioniReact(button.dataset.sioniAction)));
    $$("[data-prop]").forEach(button => button.addEventListener("click", () => propReact(button)));
    $$("[data-game]").forEach(button => button.addEventListener("click", () => openGame(button.dataset.game)));
    $("#robot").addEventListener("click", () => sioniReact("pet"));
    $$("[data-activity]").forEach(button => button.addEventListener("click", () => openActivity(button.dataset.activity)));
    $("#listenGreeting").addEventListener("click", () => speak("Hi! Ready to play?"));
    $("#soundButton").addEventListener("click", () => { state.voice = !state.voice; save(); render(); if (state.voice) speak("Hello!"); });
    $("#parentButton").addEventListener("click", () => { $("#parentAnswer").value = ""; $("#parentSettings").hidden = true; $("#parentDialog").showModal(); });
    $("#parentUnlock").addEventListener("click", () => {
      if ($("#parentAnswer").value === "13") $("#parentSettings").hidden = false;
      else showToast("보호자와 함께 다시 풀어 보세요.");
    });
    $("#koreanToggle").addEventListener("change", event => { state.koreanHelp = event.target.checked; save(); });
    $("#aiToggle").addEventListener("change", event => { state.aiEnabled = event.target.checked; save(); });
    $("#lessonDaySelect").innerHTML = lessonPlan.map((lesson,index) => `<option value="${index + 1}">${index + 1}일 · ${lesson.phrase}</option>`).join("");
    $("#lessonDaySelect").addEventListener("change", event => { state.lessonDay = Number(event.target.value); save(); render(); });
    $("#resetProgress").addEventListener("click", () => {
      if (!confirm("별과 학습 기록을 모두 지울까요?")) return;
      state = { ...defaultState, learnerId: state.learnerId };
      save(); render(); $("#parentDialog").close(); showToast("학습 기록을 새로 시작해요.");
    });
    $("#chatForm").addEventListener("submit", event => { event.preventDefault(); sendChat($("#chatInput").value); });
    $("#micButton").addEventListener("click", () => runRecognition(text => { $("#chatInput").value = text; sendChat(text); }));
    $$("[data-prompt]").forEach(button => button.addEventListener("click", () => sendChat(button.dataset.prompt)));
    document.addEventListener("click", event => {
      const speakButton = event.target.closest("[data-speak]");
      if (speakButton) speak(speakButton.dataset.speak);
      const slowSpeakButton = event.target.closest("[data-slow-speak]");
      if (slowSpeakButton) {
        const wasVoice = state.voice;
        if (!wasVoice) state.voice = true;
        if ("speechSynthesis" in window) {
          speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(slowSpeakButton.dataset.slowSpeak);
          utterance.lang = "en-US"; utterance.rate = .58; utterance.pitch = 1.05;
          speechSynthesis.speak(utterance);
        }
        state.voice = wasVoice;
      }
      if (event.target.closest("[data-close-dialog]")) $("#activityDialog").close();
      const listen = event.target.closest("[data-do-listen]");
      if (listen) { state.listens += 1; speak(currentLesson().phrase, () => completeStep("listen")); save(); }
      const say = event.target.closest("[data-do-speak]");
      if (say) runRecognition(text => {
        state.speaks += 1;
        const heard = text.toLowerCase();
        const keyWords = currentLesson().phrase.toLowerCase().replace(/[!.?]/g,"").split(" ").filter(word => word.length > 2);
        const okay = keyWords.some(word => heard.includes(word));
        showToast(okay ? `들린 말: “${text}” · 아주 좋아요!` : `들린 말: “${text}” · 한 번 더 해봐요!`);
        if (okay) { completeStep("speak"); $("#activityDialog").close(); }
        save();
      });
      const quiz = event.target.closest("[data-quiz]");
      if (quiz) {
        if (quiz.dataset.quiz === currentLesson().answer) {
          completeStep("quiz");
          const bonus = Number(quiz.dataset.gameDone || 0);
          if (bonus) celebrate("놀이 성공!", bonus);
          $("#activityDialog").close();
        }
        else showToast("한 번 더 생각해 볼까요?");
      }
      const word = event.target.closest("[data-word]");
      if (word) {
        speak(word.dataset.word);
        const bonus = Number(word.dataset.gameDone || 0);
        const gameKey = `${today()}:game:${word.dataset.word}`;
        if (bonus && !state.completed[gameKey]) { state.completed[gameKey] = true; celebrate("단어를 발견했어요!", bonus); }
        else showToast(`🔊 ${word.dataset.word}`);
      }
      const role = event.target.closest("[data-roleplay]");
      if (role) {
        const bonus = Number(role.dataset.gameDone || 0);
        if (bonus) celebrate("역할 놀이 성공!", bonus);
        $("#activityDialog").close(); navigate("chat"); sendChat(role.dataset.roleplay);
      }
    });
  }

  markVisit();
  bind();
  render();
  setTimeout(() => speak("Hi! Ready to play?"), 500);
})();
