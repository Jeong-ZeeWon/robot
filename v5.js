(() => {
  const STORAGE_KEY = "sioni-sound-state";
  const defaultState = {
    soundEnabled: true,
    soundMode: "beep",
  };

  let state = load();
  let audioContext = null;

  function $(selector) {
    return document.querySelector(selector);
  }

  function load() {
    try {
      return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    } catch {
      return { ...defaultState };
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      const base = kind === "reward" ? 880 : kind === "soft" ? 520 : 720;
      return [
        { frequency: base, duration: 0.055, delay: 0, type: "square", volume: 0.055 },
        { frequency: base * 1.28, duration: 0.06, delay: 0.085, type: "square", volume: 0.045 },
      ];
    }

    if (mode === "soft") {
      const base = kind === "reward" ? 520 : kind === "soft" ? 360 : 440;
      return [{ frequency: base, endFrequency: base * 1.22, duration: 0.16, type: "triangle", volume: 0.06 }];
    }

    if (mode === "sparkle") {
      const base = kind === "reward" ? 760 : 620;
      return [
        { frequency: base, duration: 0.055, delay: 0, type: "sine", volume: 0.055 },
        { frequency: base * 1.5, duration: 0.07, delay: 0.07, type: "sine", volume: 0.05 },
        { frequency: base * 2, duration: 0.09, delay: 0.15, type: "sine", volume: 0.04 },
      ];
    }

    const base = kind === "reward" ? 720 : kind === "soft" ? 420 : 640;
    const end = kind === "reward" ? 1020 : kind === "soft" ? 560 : 820;
    return [{ frequency: base, endFrequency: end, duration: kind === "reward" ? 0.14 : 0.08, type: "sine", volume: 0.08 }];
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
    const sound = $("#soundToggle");
    if (sound) {
      sound.addEventListener("click", () => {
        state.soundEnabled = !state.soundEnabled;
        save();
        renderSoundControls();
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
        toast("효과음 테스트");
      });
    }

    const robot = $("#robot");
    if (robot) {
      robot.addEventListener("click", () => playTone("tap"));
      robot.addEventListener("pointerdown", () => playTone("soft"));
    }

    document.querySelectorAll("[data-action], [data-say]").forEach((button) => {
      button.addEventListener("click", () => playTone("tap"));
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    bind();
    renderSoundControls();
  });
})();
