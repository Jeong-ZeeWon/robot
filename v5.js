(() => {
  const STORAGE_KEY = "sioni-sound-state";
  const defaultState = { soundEnabled: true, soundMode: "beep" };

  let state = load();
  let ctx = null;

  function $(sel) { return document.querySelector(sel); }

  function load() {
    try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) }; }
    catch { return { ...defaultState }; }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // AudioContext를 유저 제스처 안에서 동기적으로 생성·재개
  function ensureCtx() {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function oneTone(ac, { frequency = 700, endFrequency = null, duration = 0.08, delay = 0, type = "sine", volume = 0.11 }) {
    if (!ac || ac.state !== "running") return;
    const now = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ac.destination);
    osc.start(now);
    osc.stop(now + duration + 0.03);
  }

  function soundPlan(kind = "tap") {
    const mode = state.soundMode || "beep";
    if (mode === "beep") {
      const base = kind === "reward" ? 880 : kind === "soft" ? 520 : 720;
      return [
        { frequency: base,        duration: 0.065, delay: 0,    type: "square", volume: 0.12 },
        { frequency: base * 1.28, duration: 0.075, delay: 0.09, type: "square", volume: 0.10 },
      ];
    }
    if (mode === "soft") {
      const base = kind === "reward" ? 520 : kind === "soft" ? 360 : 440;
      return [{ frequency: base, endFrequency: base * 1.22, duration: 0.18, type: "triangle", volume: 0.12 }];
    }
    if (mode === "sparkle") {
      const base = kind === "reward" ? 760 : 620;
      return [
        { frequency: base,      duration: 0.06, delay: 0,    type: "sine", volume: 0.12 },
        { frequency: base * 1.5, duration: 0.08, delay: 0.075, type: "sine", volume: 0.10 },
        { frequency: base * 2,   duration: 0.10, delay: 0.16,  type: "sine", volume: 0.085 },
      ];
    }
    const base = kind === "reward" ? 720 : kind === "soft" ? 420 : 640;
    const end  = kind === "reward" ? 1020 : kind === "soft" ? 560 : 820;
    return [{ frequency: base, endFrequency: end, duration: kind === "reward" ? 0.16 : 0.10, type: "sine", volume: 0.13 }];
  }

  // 유저 제스처 안에서 동기 실행 — Promise 없음
  function playTone(kind = "tap") {
    if (!state.soundEnabled) return;
    try {
      const ac = ensureCtx();
      if (!ac) return;
      // 첫 제스처 직후 state가 running이 아닐 수 있으므로 짧게 재시도
      if (ac.state !== "running") {
        ac.resume().then(() => {
          soundPlan(kind).forEach(t => oneTone(ac, t));
        }).catch(() => {});
        return;
      }
      soundPlan(kind).forEach(t => oneTone(ac, t));
    } catch {}
  }

  function toast(msg) {
    const node = $("#v5Toast");
    if (!node) return;
    node.textContent = msg;
    node.classList.add("is-visible");
    clearTimeout(node._t);
    node._t = setTimeout(() => node.classList.remove("is-visible"), 1800);
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

  function bind() {
    // 첫 터치에 AudioContext 미리 준비
    ["pointerdown", "touchstart", "click"].forEach(ev => {
      document.addEventListener(ev, () => ensureCtx(), { once: true, passive: true, capture: true });
    });

    const soundBtn = $("#soundToggle");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        save();
        renderSoundControls();
        if (state.soundEnabled) playTone("reward");
        toast(state.soundEnabled ? "효과음 켜짐 🔔" : "효과음 꺼짐 🔕");
      });
    }

    const soundMode = $("#soundMode");
    if (soundMode) {
      soundMode.addEventListener("change", () => {
        state.soundMode = soundMode.value;
        state.soundEnabled = true;
        save();
        renderSoundControls();
        playTone("reward");
        toast(soundMode.options[soundMode.selectedIndex]?.textContent || "효과음 모드 변경");
      });
    }

    const soundTest = $("#soundTest");
    if (soundTest) {
      soundTest.addEventListener("click", () => {
        state.soundEnabled = true;
        save();
        renderSoundControls();
        playTone("tap");
        setTimeout(() => playTone("reward"), 220);
        toast("효과음 테스트 🎵");
      });
    }

    const robot = $("#robot");
    if (robot) {
      robot.addEventListener("pointerdown", () => playTone("soft"));
    }

    document.querySelectorAll("[data-action], [data-say]").forEach(btn => {
      btn.addEventListener("click", () => playTone("tap"));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    renderSoundControls();
  });

  // 전역으로 노출 (다른 스크립트에서 playTone 호출 가능하도록)
  window.sioniPlayTone = playTone;
})();
