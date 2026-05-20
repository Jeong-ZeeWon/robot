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
      return { ...defaultState, ...saved, counts: { ...defaultState.counts, ...(saved?.counts || {}) } };
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

  function playTone(kind = "tap") {
    if (!state.soundEnabled) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const now = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const tones = {
        tap: [640, 820, 0.08],
        reward: [720, 1020, 0.14],
        star: [880, 1320, 0.18],
        soft: [420, 560, 0.12],
      }[kind] || [640, 820, 0.08];
      osc.type = "sine";
      osc.frequency.setValueAtTime(tones[0], now);
      osc.frequency.exponentialRampToValueAtTime(tones[1], now + tones[2]);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tones[2] + 0.04);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + tones[2] + 0.06);
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

  function render() {
    resetDailyIfNeeded();
    renderAdventure();
    renderTreasure();
    renderRoom();
    renderStory();
    const toggle = $("#soundToggle");
    if (toggle) {
      toggle.textContent = state.soundEnabled ? "🔔" : "🔕";
      toggle.setAttribute("aria-pressed", String(state.soundEnabled));
    }
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
