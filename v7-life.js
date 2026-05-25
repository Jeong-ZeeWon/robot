(() => {
  const STATE_KEYS = ["sioni-v41-state", "sioni-v7-state"];
  const TICK_MS = 30 * 1000;
  const SAVE_MS = 45 * 1000;
  const MAX_CATCHUP_MINUTES = 180;
  const DEFAULT_STATE = {
    mood: 72,
    affection: 30,
    energy: 70,
    hunger: 38,
    loneliness: 20,
  };

  const $ = (selector) => document.querySelector(selector);
  let lastTickAt = Date.now();
  let lastSaveAt = 0;

  function clamp(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  }

  function readStoredState() {
    for (const key of STATE_KEYS) {
      try {
        const state = JSON.parse(localStorage.getItem(key));
        if (state && typeof state === "object") return { key, state };
      } catch {}
    }
    return { key: STATE_KEYS[0], state: { ...DEFAULT_STATE } };
  }

  function readDomState(fallback) {
    const read = (selector, key) => {
      const value = Number($(selector)?.textContent);
      return Number.isFinite(value) ? value : fallback[key];
    };
    return {
      mood: read("#moodValue", "mood"),
      affection: read("#affectionValue", "affection"),
      energy: read("#energyValue", "energy"),
      hunger: read("#hungerValue", "hunger"),
      loneliness: read("#lonelinessValue", "loneliness"),
    };
  }

  function moodInfo(state) {
    if (state.energy <= 18) return { label: "졸려요", face: "sleepy", theme: "sleepy" };
    if (state.hunger >= 82) return { label: "배고파요", face: "hungry", theme: "hungry" };
    if (state.loneliness >= 78 || state.mood <= 30) return { label: "조금 외로워요", face: "sad", theme: "sad" };
    if (state.mood >= 88) return { label: "반짝반짝 신나요", face: "excited", theme: "excited" };
    if (state.affection >= 78) return { label: "마음이 가까워요", face: "happy", theme: "happy" };
    return { label: "평온해요", face: "calm", theme: "calm" };
  }

  function applyTimeFlow(state, elapsedMinutes) {
    const units = Math.max(1, Math.min(MAX_CATCHUP_MINUTES, elapsedMinutes) / 0.5);
    const next = { ...state };
    next.hunger = clamp((next.hunger ?? DEFAULT_STATE.hunger) + units * 0.75);
    next.energy = clamp((next.energy ?? DEFAULT_STATE.energy) - units * 0.55);
    next.loneliness = clamp((next.loneliness ?? DEFAULT_STATE.loneliness) + units * 0.3);
    if (next.affection >= 80) next.affection = clamp(next.affection - units * 0.08);

    const strain =
      0.08 +
      (next.hunger >= 65 ? 0.3 : 0) +
      (next.energy <= 45 ? 0.25 : 0) +
      (next.loneliness >= 55 ? 0.25 : 0) +
      (next.mood >= 92 ? 0.2 : 0);
    next.mood = clamp((next.mood ?? DEFAULT_STATE.mood) - units * strain);
    next.affection = clamp(next.affection ?? DEFAULT_STATE.affection);
    return next;
  }

  function writeMeter(key, value) {
    const bars = {
      mood: "#moodBar",
      affection: "#affectionBar",
      energy: "#energyBar",
      hunger: "#hungerBar",
      loneliness: "#lonelinessBar",
    };
    const values = {
      mood: "#moodValue",
      affection: "#affectionValue",
      energy: "#energyValue",
      hunger: "#hungerValue",
      loneliness: "#lonelinessValue",
    };
    const bar = $(bars[key]);
    const node = $(values[key]);
    if (bar) bar.style.width = `${value}%`;
    if (node) node.textContent = value;
  }

  function render(state, elapsedMinutes) {
    Object.entries(state).forEach(([key, value]) => writeMeter(key, value));
    const mood = moodInfo(state);
    const face = $("#face");
    if (face) face.className = `face ${mood.face}`;
    document.body.dataset.theme = mood.theme;
    const label = $("#moodLabel");
    if (label) label.textContent = mood.label;
    const memory = $("#memoryLine");
    if (memory && elapsedMinutes >= 0.5) {
      memory.textContent = `시간이 흐르면서 상태가 변하고 있어요. 배고픔 ${state.hunger}, 에너지 ${state.energy}, 외로움 ${state.loneliness}.`;
    }
    window.dispatchEvent(new CustomEvent("sioni:statechange", { detail: state }));
  }

  function saveState(base, state) {
    const next = {
      ...base,
      ...state,
      lastLifeTickAt: new Date().toISOString(),
      lastVisit: new Date().toISOString(),
    };
    STATE_KEYS.forEach((key) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {}
    });
  }

  function tick(force = false) {
    if (document.hidden && !force) return;
    const now = Date.now();
    const elapsedMinutes = Math.max(0, (now - lastTickAt) / 60000);
    if (!force && elapsedMinutes < 0.45) return;
    lastTickAt = now;

    const stored = readStoredState();
    const domState = readDomState({ ...DEFAULT_STATE, ...stored.state });
    const next = applyTimeFlow(domState, elapsedMinutes || 0.5);
    render(next, elapsedMinutes || 0.5);

    if (force || now - lastSaveAt >= SAVE_MS) {
      lastSaveAt = now;
      saveState(stored.state, next);
    }
  }

  function catchUpFromStorage() {
    const stored = readStoredState();
    const lastIso = stored.state.lastLifeTickAt || stored.state.lastVisit;
    if (!lastIso) {
      saveState(stored.state, readDomState({ ...DEFAULT_STATE, ...stored.state }));
      return;
    }
    const elapsedMinutes = Math.max(0, (Date.now() - new Date(lastIso).getTime()) / 60000);
    if (elapsedMinutes < 1) return;
    const next = applyTimeFlow(readDomState({ ...DEFAULT_STATE, ...stored.state }), elapsedMinutes);
    render(next, elapsedMinutes);
    saveState(stored.state, next);
  }

  window.addEventListener("DOMContentLoaded", () => {
    window.setTimeout(() => {
      catchUpFromStorage();
      tick(true);
      setInterval(tick, TICK_MS);
    }, 900);
  });
})();
