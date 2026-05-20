(() => {
  const STORAGE_KEY = "sioni-v5-adventure-state";
  const todayKey = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const steps = [
    { key: "greet", label: "시오니에게 안녕 인사하기", icon: "😊" },
    { key: "pet", label: "시오니 쓰담해주기", icon: "💚" },
    { key: "feed", label: "간식 주기", icon: "🍪" },
    { key: "mood", label: "오늘 기분 고르기", icon: "🌈" },
    { key: "play", label: "시오니와 놀기", icon: "🎈" },
  ];

  const stickers = [
    { key: "first-star", icon: "⭐", label: "첫 별" },
    { key: "warm-hand", icon: "💚", label: "따뜻한 손" },
    { key: "cookie-pal", icon: "🍪", label: "쿠키 친구" },
    { key: "play-hero", icon: "🎈", label: "놀이왕" },
    { key: "sleep-guard", icon: "🌙", label: "꿈 경비대" },
    { key: "three-stars", icon: "🌟", label: "별 수집가" },
    { key: "rainbow-room", icon: "🌈", label: "무지개 방" },
    { key: "robot-friend", icon: "🤖", label: "로봇 친구" },
  ];

  const defaultState = {
    date: todayKey(),
    completed: {},
    claimedToday: false,
    stars: 0,
    badges: [],
    stickers: [],
    counts: { pet: 0, feed: 0, play: 0, sleep: 0, mood: 0, greet: 0, adventure: 0 },
    soundEnabled: true,
    soundMode: "beep",
  };

  let state = load();
  let audioContext = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return {
        ...defaultState,
        ...saved,
        soundMode: saved?.soundMode || "beep",
        counts: { ...defaultState.counts, ...(saved?.counts || {}) },
      };
    } catch {
      return { ...defaultState };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function resetDailyIfNeeded() {
    const today = todayKey();
    if (state.date !== today) {
      state.date = today;
      state.completed = {};
      state.claimedToday = false;
      save();
    }
  }

  function getAudioContext() {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    return audioContext;
  }

  function oneTone({ frequency = 700, endFrequency = null, duration = 0.08, delay = 0, type = "sine", volume = 0.08 }) {
    const ctx = getAudioContext();
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function soundPlan(kind = "tap") {
    const mode = state.soundMode || "beep";

    if (mode === "beep") {
      const base = kind === "star" ? 1040 : kind === "reward" ? 880 : kind === "soft" ? 520 : 720;
      return [
        { frequency: base, duration: 0.055, delay: 0, type: "square", volume: 0.055 },
        { frequency: base * 1.28, duration: 0.06, delay: 0.085, type: "square", volume: 0.045 },
      ];
    }

    if (mode === "soft") {
      const base = kind === "star" ? 620 : kind === "reward" ? 520 : kind === "soft" ? 360 : 440;
      return [{ frequency: base, endFrequency: base * 1.22, duration: 0.16, type: "triangle", volume: 0.06 }];
    }

    if (mode === "sparkle") {
      const base = kind === "star" ? 880 : kind === "reward" ? 760 : 620;
      return [
        { frequency: base, duration: 0.055, delay: 0, type: "sine", volume: 0.055 },
        { frequency: base * 1.5, duration: 0.07, delay: 0.07, type: "sine", volume: 0.05 },
        { frequency: base * 2, duration: 0.09, delay: 0.15, type: "sine", volume: 0.04 },
      ];
    }

    const base = kind === "star" ? 880 : kind === "reward" ? 720 : kind === "soft" ? 420 : 640;
    const end = kind === "star" ? 1320 : kind === "reward" ? 1020 : kind === "soft" ? 560 : 820;
    return [{ frequency: base, endFrequency: end, duration: kind === "star" ? 0.18 : kind === "reward" ? 0.14 : 0.08, type: "sine", volume: 0.08 }];
  }

  function playTone(kind = "tap") {
    if (!state.soundEnabled) return;
    try {
      soundPlan(kind).forEach(oneTone);
    } catch {}
  }

  function toast(message) {
    const node = $("#v5Toast");
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-visible");
    clearTimeout(node._timer);
    node._timer = setTimeout(() => node.classList.remove("is-visible"), 1800);
  }

  function confetti() {
    const wrap = document.createElement("div");
    wrap.className = "v5-confetti";
    const items = ["⭐", "✨", "💚", "🌈", "🎈"];
    for (let i = 0; i < 18; i += 1) {
      const span = document.createElement("span");
      span.textContent = items[i % items.length];
      span.style.left = `${Math.random() * 100}%`;
      span.style.animationDelay = `${Math.random() * 0.35}s`;
      wrap.appendChild(span);
    }
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1800);
  }

  function completeStep(key, silent = false) {
    resetDailyIfNeeded();
    if (!key) return;
    state.counts[key] = (state.counts[key] || 0) + 1;
    if (!state.completed[key]) {
      state.completed[key] = true;
      if (!silent) {
        playTone("reward");
        toast(`모험 완료! ${stepLabel(key)}`);
      }
    } else if (!silent) {
      playTone("tap");
    }
    unlockMilestones();
    save();
    render();
  }

  function stepLabel(key) {
    return steps.find((step) => step.key === key)?.label || "작은 미션";
  }

  function isAdventureDone() {
    return steps.every((step) => state.completed[step.key]);
  }

  function addSticker(key) {
    if (!state.stickers.includes(key)) {
      state.stickers.push(key);
      return true;
    }
    return false;
  }

  function addBadge(key) {
    if (!state.badges.includes(key)) {
      state.badges.push(key);
      return true;
    }
    return false;
  }

  function unlockMilestones() {
    let unlocked = [];
    if (state.stars >= 1 && addSticker("first-star")) unlocked.push("첫 별 스티커");
    if ((state.counts.pet || 0) >= 3 && addSticker("warm-hand")) unlocked.push("따뜻한 손 스티커");
    if ((state.counts.feed || 0) >= 3 && addSticker("cookie-pal")) unlocked.push("쿠키 친구 스티커");
    if ((state.counts.play || 0) >= 3 && addSticker("play-hero")) unlocked.push("놀이왕 스티커");
    if ((state.counts.sleep || 0) >= 2 && addSticker("sleep-guard")) unlocked.push("꿈 경비대 스티커");
    if (state.stars >= 3 && addSticker("three-stars")) unlocked.push("별 수집가 스티커");
    if (state.stars >= 5 && addSticker("rainbow-room")) unlocked.push("무지개 방 스티커");
    if ((state.counts.greet || 0) >= 5 && addSticker("robot-friend")) unlocked.push("로봇 친구 스티커");

    if (state.stars >= 1 && addBadge("adventurer")) unlocked.push("첫 모험 배지");
    if (state.stars >= 3 && addBadge("star-finder")) unlocked.push("별 찾기 배지");
    if (state.stars >= 7 && addBadge("room-master")) unlocked.push("방 꾸미기 배지");

    if (unlocked.length) {
      playTone("star");
      toast(`새 보물 발견! ${unlocked[0]}`);
    }
  }

  function claimAdventure() {
    resetDailyIfNeeded();
    if (!isAdventureDone()) {
      toast("아직 모험이 남아 있어요!");
      playTone("soft");
      return;
    }
    if (state.claimedToday) {
      toast("오늘 별 조각은 이미 받았어요.");
      playTone("tap");
      return;
    }
    state.claimedToday = true;
    state.stars += 1;
    state.counts.adventure = (state.counts.adventure || 0) + 1;
    unlockMilestones();
    save();
    render();
    playTone("star");
    confetti();
    toast("별 조각 1개 획득! ⭐");
    const message = $("#message");
    const hint = $("#microHint");
    if (message) message.textContent = "와! 오늘의 별 조각을 찾았어요. 정말 멋진 친구예요!";
    if (hint) hint.textContent = "내일 다시 오면 새로운 별 조각 모험을 할 수 있어요.";
  }

  function roomClass() {
    if (state.stars >= 5) return "room-rainbow";
    if (state.stars >= 3) return "room-stars";
    if (state.stars >= 1) return "room-cloud";
    return "room-basic";
  }

  function renderAdventure() {
    const list = $("#adventureList");
    if (!list) return;
    list.innerHTML = steps.map((step) => {
      const done = Boolean(state.completed[step.key]);
      return `<li class="${done ? "done" : ""}"><span class="v5-check">${done ? "✓" : ""}</span>${step.icon} ${step.label}</li>`;
    }).join("");

    const claim = $("#claimAdventure");
    if (claim) {
      claim.disabled = !isAdventureDone() || state.claimedToday;
      claim.textContent = state.claimedToday ? "오늘 별 조각 받음" : isAdventureDone() ? "별 조각 받기 ⭐" : "모험을 완료하면 받을 수 있어요";
    }
  }

  function renderTreasure() {
    const star = $("#starCount");
    const badge = $("#badgeCount");
    const sticker = $("#stickerCount");
    const starBadge = $("#starBadge");
    if (star) star.textContent = state.stars;
    if (badge) badge.textContent = state.badges.length;
    if (sticker) sticker.textContent = state.stickers.length;
    if (starBadge) starBadge.textContent = `⭐ 별 ${state.stars}개`;

    const book = $("#stickerBook");
    if (book) {
      book.innerHTML = stickers.map((item) => {
        const unlocked = state.stickers.includes(item.key);
        return `<span class="v5-sticker ${unlocked ? "" : "locked"}" title="${item.label}">${unlocked ? item.icon : "?"}</span>`;
      }).join("");
    }
  }

  function renderRoom() {
    const room = $("#sioniRoom");
    if (!room) return;
    room.classList.remove("room-basic", "room-cloud", "room-stars", "room-rainbow");
    room.classList.add(roomClass());
    const toy = room.querySelector(".room-toy");
    const windowItem = room.querySelector(".room-window");
    if (toy) toy.textContent = state.stars >= 3 ? "🦖" : state.stars >= 1 ? "🧸" : "🪀";
    if (windowItem) windowItem.textContent = state.stars >= 5 ? "🌈" : state.stars >= 3 ? "⭐" : "☁️";
  }

  function renderStory() {
    const story = $("#adventureStory");
    const reward = $("#adventureReward");
    if (story) {
      if (state.claimedToday) story.textContent = "오늘의 별 조각을 찾았어요. 내일 또 모험해요!";
      else if (isAdventureDone()) story.textContent = "모험 완료! 이제 별 조각을 받을 수 있어요.";
      else story.textContent = "시오니가 잃어버린 별 조각을 찾고 있어요.";
    }
    if (reward) reward.textContent = "보상 ⭐ 1";
  }

  function renderSoundControls() {
    const toggle = $("#soundToggle");
    if (toggle) {
      toggle.textContent = state.soundEnabled ? "🔔" : "🔕";
      toggle.setAttribute("aria-pressed", String(state.soundEnabled));
    }
    const mode = $("#soundMode");
    if (mode) mode.value = state.soundMode || "beep";
  }

  function render() {
    resetDailyIfNeeded();
    renderAdventure();
    renderTreasure();
    renderRoom();
    renderStory();
    renderSoundControls();
  }

  function bind() {
    $all("[data-v5-step]").forEach((button) => {
      button.addEventListener("click", () => {
        completeStep(button.dataset.v5Step, false);
      });
    });

    const claim = $("#claimAdventure");
    if (claim) claim.addEventListener("click", claimAdventure);

    const sound = $("#soundToggle");
    if (sound) {
      sound.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        save();
        render();
        if (state.soundEnabled) playTone("reward");
        toast(state.soundEnabled ? "효과음 켜짐" : "효과음 꺼짐");
      });
    }

    const soundMode = $("#soundMode");
    if (soundMode) {
      soundMode.addEventListener("change", () => {
        state.soundMode = soundMode.value;
        state.soundEnabled = true;
        save();
        render();
        playTone("reward");
        toast(soundMode.options[soundMode.selectedIndex]?.textContent || "효과음 모드 변경");
      });
    }

    const soundTest = $("#soundTest");
    if (soundTest) {
      soundTest.addEventListener("click", () => {
        state.soundEnabled = true;
        save();
        render();
        playTone("tap");
        setTimeout(() => playTone("reward"), 220);
        toast("효과음 테스트");
      });
    }

    const robot = $("#robot");
    if (robot) {
      robot.addEventListener("click", () => playTone("tap"));
      robot.addEventListener("pointerdown", () => playTone("soft"));
    }

    $all("[data-action], [data-say]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!button.dataset.v5Step) playTone("tap");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    resetDailyIfNeeded();
    bind();
    unlockMilestones();
    render();
  });
})();
