(() => {
  const STORAGE_KEY = "sioni-app-core-v1";
  const MODE_LABELS = {
    companion: "곁에 있기",
    curious: "주변 관찰",
    playful: "장난 모드",
    rest: "조용한 휴식",
  };
  const MODE_REACTIONS = {
    companion: { tone: "다정", behavior: "가까이 듣기", face: "calm" },
    curious: { tone: "궁금", behavior: "천천히 살피기", face: "thinking" },
    playful: { tone: "활발", behavior: "먼저 장난치기", face: "excited" },
    rest: { tone: "차분", behavior: "작게 반응하기", face: "sleepy" },
  };
  const MOTION_LABELS = {
    bounce: "통통 튀는 반응",
    wiggle: "살짝 흔드는 반응",
    nod: "고개 끄덕임",
    bow: "인사",
    headturn: "주변 살피기",
    peek: "빼꼼 보기",
    pulse: "마음등 반짝임",
    sleepy: "졸린 반응",
    tippy: "갸웃하기",
    reach: "손 뻗기",
    shrug: "으쓱하기",
    pop: "팝 반응",
    squeeze: "말랑 반응",
  };

  const $ = (selector) => document.querySelector(selector);
  const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)));

  function readState() {
    try {
      return {
        mode: "companion",
        curiosity: 42,
        trust: 36,
        arousal: 48,
        lastReaction: MODE_REACTIONS.companion,
        ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}),
      };
    } catch {
      return {
        mode: "companion",
        curiosity: 42,
        trust: 36,
        arousal: 48,
        lastReaction: MODE_REACTIONS.companion,
      };
    }
  }

  let state = readState();
  const els = {};

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function meterValue(selector, fallback) {
    const value = Number($(selector)?.textContent);
    return Number.isFinite(value) ? value : fallback;
  }

  function syncFromMeters() {
    const mood = meterValue("#moodValue", 70);
    const affection = meterValue("#affectionValue", 30);
    const energy = meterValue("#energyValue", 70);
    const loneliness = meterValue("#lonelinessValue", 20);
    state.trust = clamp((state.trust * 0.6) + (affection * 0.3) + ((100 - loneliness) * 0.1));
    state.arousal = clamp((state.arousal * 0.55) + (energy * 0.25) + (mood * 0.2));
  }

  function signalLabel() {
    if (state.arousal >= 75) return "활발";
    if (state.trust >= 70) return "안정";
    if (state.curiosity >= 70) return "탐색";
    if (state.arousal <= 30) return "휴식";
    return "차분";
  }

  function render() {
    if (!els.mode) return;
    syncFromMeters();
    const reaction = state.lastReaction || MODE_REACTIONS[state.mode] || MODE_REACTIONS.companion;
    els.mode.textContent = MODE_LABELS[state.mode] || MODE_LABELS.companion;
    els.signal.textContent = signalLabel();
    els.curiosity.textContent = state.curiosity;
    els.trust.textContent = state.trust;
    els.arousal.textContent = state.arousal;
    els.line.textContent = `${reaction.tone} 모드 · ${reaction.behavior}`;
    els.signalLine.textContent = `${reaction.face} 표정과 ${reaction.tone} 말투로 다음 반응을 준비하고 있어요.`;
    document.querySelectorAll("[data-app-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.appMode === state.mode));
    });
    save();
  }

  function setMode(mode) {
    if (!MODE_LABELS[mode]) return;
    state.mode = mode;
    const delta = {
      companion: { curiosity: 0, trust: 2, arousal: -2 },
      curious: { curiosity: 4, trust: 0, arousal: 1 },
      playful: { curiosity: 2, trust: 1, arousal: 5 },
      rest: { curiosity: -1, trust: 1, arousal: -7 },
    }[mode];
    state.curiosity = clamp(state.curiosity + delta.curiosity);
    state.trust = clamp(state.trust + delta.trust);
    state.arousal = clamp(state.arousal + delta.arousal);
    state.lastReaction = MODE_REACTIONS[mode];
    render();
  }

  function reactionFromMessage(detail = {}) {
    const motion = String(detail.motion || "");
    const face = String(detail.face || "calm");
    const text = String(detail.text || "");
    const behavior = MOTION_LABELS[motion] || MODE_REACTIONS[state.mode]?.behavior || "부드럽게 반응하기";
    const tone = face === "sleepy" ? "차분" : face === "excited" || text.includes("좋") ? "밝은" : face === "thinking" ? "궁금" : "다정";
    state.curiosity = clamp(state.curiosity + (face === "thinking" || face === "surprised" ? 3 : 0));
    state.trust = clamp(state.trust + (text.includes("고마") || text.includes("괜찮") ? 2 : 0));
    state.arousal = clamp(state.arousal + (motion === "bounce" || motion === "pop" ? 3 : motion === "sleepy" ? -4 : 0));
    state.lastReaction = { tone, behavior, face };
    render();
  }

  function bind() {
    els.mode = $("#appCoreMode");
    els.signal = $("#appCoreSignal");
    els.curiosity = $("#appCuriosity");
    els.trust = $("#appTrust");
    els.arousal = $("#appArousal");
    els.line = $("#appMoodLine");
    els.signalLine = $("#appCoreSignalLine");
    document.querySelectorAll("[data-app-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.appMode));
    });
    window.addEventListener("sioni:camera-react", (event) => {
      if (event.detail?.type === "motion") {
        state.curiosity = clamp(state.curiosity + 2);
        state.lastReaction = { tone: "궁금", behavior: "움직임 살피기", face: "surprised" };
        render();
      }
    });
    render();
  }

  window.SioniAppCore = {
    setMode,
    fromReaction: reactionFromMessage,
    getSnapshot: () => ({ ...state, lastReaction: { ...state.lastReaction } }),
  };

  document.addEventListener("DOMContentLoaded", bind);
})();
