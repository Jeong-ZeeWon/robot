(() => {
  const VOICE_KEY = "sioni-v41-voice-settings";

  const presets = {
    soft: { pitch: 1.08, rate: 0.96, volume: 0.85 },
    clear: { pitch: 1.0, rate: 1.0, volume: 0.9 },
    calm: { pitch: 0.96, rate: 0.9, volume: 0.82 },
    sleepy: { pitch: 0.88, rate: 0.82, volume: 0.72 },
    bright: { pitch: 1.16, rate: 1.04, volume: 0.88 },
  };

  const defaultSettings = {
    preset: "soft",
    voiceURI: "",
    pitch: presets.soft.pitch,
    rate: presets.soft.rate,
    volume: presets.soft.volume,
  };

  let settings = loadVoiceSettings();
  let originalSpeak = null;
  let lastEffectFace = "";

  function loadVoiceSettings() {
    try {
      return { ...defaultSettings, ...JSON.parse(localStorage.getItem(VOICE_KEY)) };
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveVoiceSettings() {
    localStorage.setItem(VOICE_KEY, JSON.stringify(settings));
  }

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function updateNumberLabels() {
    const pitch = $("#pitchValue");
    const rate = $("#rateValue");
    const volume = $("#volumeValue");
    if (pitch) pitch.textContent = Number(settings.pitch).toFixed(2);
    if (rate) rate.textContent = Number(settings.rate).toFixed(2);
    if (volume) volume.textContent = Number(settings.volume).toFixed(2);
  }

  function syncControls() {
    const preset = $("#voicePreset");
    const voice = $("#voiceSelect");
    const pitch = $("#voicePitch");
    const rate = $("#voiceRate");
    const volume = $("#voiceVolume");

    if (preset && presets[settings.preset]) preset.value = settings.preset;
    if (voice) voice.value = settings.voiceURI;
    if (pitch) pitch.value = settings.pitch;
    if (rate) rate.value = settings.rate;
    if (volume) volume.value = settings.volume;
    updateNumberLabels();
  }

  function getVoices() {
    if (!("speechSynthesis" in window)) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  function chooseDefaultVoice(voices) {
    const korean = voices.filter((voice) => /ko|Korean|한국/i.test(`${voice.lang} ${voice.name}`));
    const preferred = korean.find((voice) => /Yuna|유나|Siri|Sora|Nara|여성/i.test(voice.name));
    return preferred || korean[0] || voices[0] || null;
  }

  function currentFace() {
    const face = $("#face");
    if (!face) return "calm";
    return Array.from(face.classList).find((name) => name !== "face") || document.body.dataset.theme || "calm";
  }

  function emotionShiftFor(emotion = currentFace()) {
    return {
      excited: { pitch: 0.06, rate: 0.05, volume: 0.03 },
      happy: { pitch: 0.04, rate: 0.03, volume: 0.02 },
      shy: { pitch: 0.03, rate: -0.02, volume: -0.08 },
      sad: { pitch: -0.05, rate: -0.07, volume: -0.06 },
      sleepy: { pitch: -0.1, rate: -0.12, volume: -0.12 },
      hungry: { pitch: -0.03, rate: -0.03, volume: -0.02 },
      surprised: { pitch: 0.08, rate: 0.08, volume: 0.04 },
      thinking: { pitch: 0, rate: -0.03, volume: -0.02 },
      lonely: { pitch: -0.06, rate: -0.07, volume: -0.08 },
      curious: { pitch: 0.03, rate: 0.02, volume: 0 },
    }[emotion] || { pitch: 0, rate: 0, volume: 0 };
  }

  function applyVoiceToUtterance(utterance, emotion = currentFace()) {
    const voices = getVoices();
    const selected = voices.find((voice) => voice.voiceURI === settings.voiceURI) || chooseDefaultVoice(voices);
    if (selected) utterance.voice = selected;

    const shift = emotionShiftFor(emotion);
    utterance.lang = "ko-KR";
    utterance.pitch = Math.max(0.7, Math.min(1.5, Number(settings.pitch) + shift.pitch));
    utterance.rate = Math.max(0.65, Math.min(1.25, Number(settings.rate) + shift.rate));
    utterance.volume = Math.max(0.1, Math.min(1, Number(settings.volume) + shift.volume));
    utterance.__sioniVoiceApplied = true;
  }

  function patchSpeechSynthesis() {
    if (!("speechSynthesis" in window) || originalSpeak) return;
    originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (utterance) => {
      if (utterance && !utterance.__sioniVoiceApplied) {
        try {
          applyVoiceToUtterance(utterance, currentFace());
        } catch {}
      }
      return originalSpeak(utterance);
    };
  }

  function speakWithSioniVoice(text, emotion = currentFace()) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    applyVoiceToUtterance(utterance, emotion);
    window.speechSynthesis.speak(utterance);
  }

  function populateVoiceSelect() {
    const select = $("#voiceSelect");
    if (!select) return;

    const voices = getVoices();
    const current = settings.voiceURI;
    select.innerHTML = `<option value="">자동 선택</option>`;

    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      select.appendChild(option);
    });

    settings.voiceURI = current;
    select.value = current;
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.soft;
    settings.preset = name;
    settings.pitch = preset.pitch;
    settings.rate = preset.rate;
    settings.volume = preset.volume;
    saveVoiceSettings();
    syncControls();
  }

  function setupTabs() {
    $all(".v4-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const target = tab.dataset.tab;
        $all(".v4-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
        $all(".v4-tab-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === target));
      });
    });
  }

  function setupVoiceControls() {
    populateVoiceSelect();
    syncControls();

    const preset = $("#voicePreset");
    const voice = $("#voiceSelect");
    const pitch = $("#voicePitch");
    const rate = $("#voiceRate");
    const volume = $("#voiceVolume");
    const test = $("#voiceTest");

    if (preset) preset.addEventListener("change", () => applyPreset(preset.value));
    if (voice) voice.addEventListener("change", () => {
      settings.voiceURI = voice.value;
      saveVoiceSettings();
    });
    if (pitch) pitch.addEventListener("input", () => {
      settings.pitch = Number(pitch.value);
      settings.preset = "custom";
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (rate) rate.addEventListener("input", () => {
      settings.rate = Number(rate.value);
      settings.preset = "custom";
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (volume) volume.addEventListener("input", () => {
      settings.volume = Number(volume.value);
      settings.preset = "custom";
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (test) test.addEventListener("click", () => {
      speakWithSioniVoice("안녕하세요. 저는 시오니예요. 이제 너무 높은 목소리 대신 부드러운 톤으로 말해요.", settings.preset === "sleepy" ? "sleepy" : "happy");
      showEffect("heart");
    });

    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        populateVoiceSelect();
        syncControls();
      };
    }
  }

  function effectForFace(face) {
    return {
      happy: "heart",
      shy: "heart",
      excited: "star",
      sad: "tear",
      sleepy: "zzz",
      hungry: "cookie",
      thinking: "question",
      curious: "question",
      surprised: "star",
      lonely: "tear",
    }[face] || "";
  }

  function showEffect(effectName) {
    const fx = $("#reactionFx");
    if (!fx || !effectName) return;
    fx.className = "reaction-fx";
    void fx.offsetWidth;
    fx.classList.add(`fx-${effectName}`);
    setTimeout(() => fx.classList.remove(`fx-${effectName}`), 1400);
  }

  function getMetric(id) {
    const node = $(`#${id}`);
    const value = Number(node?.textContent || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function updateRecommendation() {
    const text = $("#recommendationText");
    if (!text) return;
    const s = {
      mood: getMetric("moodValue"),
      energy: getMetric("energyValue"),
      hunger: getMetric("hungerValue"),
      loneliness: getMetric("lonelinessValue"),
    };

    if (s.hunger >= 78) text.textContent = "배고픔이 높아요. 간식을 조금 주는 게 좋아요.";
    else if (s.energy <= 24) text.textContent = "에너지가 낮아요. 쉬기 버튼으로 잠깐 쉬게 해주세요.";
    else if (s.loneliness >= 68) text.textContent = "외로움이 올라갔어요. 쓰담하거나 인사해 주세요.";
    else if (s.mood <= 34) text.textContent = "기분이 낮아요. 감정 버튼으로 위로 모드를 켜보세요.";
    else text.textContent = "상태가 괜찮아요. 오늘의 미션을 하나 눌러보세요.";
  }

  function observeReactions() {
    const face = $("#face");
    const message = $("#message");
    if (face) {
      new MutationObserver(() => {
        const faceName = currentFace();
        if (faceName !== lastEffectFace) {
          lastEffectFace = faceName;
          showEffect(effectForFace(faceName));
        }
      }).observe(face, { attributes: true, attributeFilter: ["class"] });
    }
    if (message) {
      new MutationObserver(() => {
        const faceName = currentFace();
        showEffect(effectForFace(faceName));
        if (message.textContent.includes("v3") || message.textContent.includes("v4")) {
          message.textContent = message.textContent.replaceAll("v3", "v4.1").replaceAll("v4", "v4.1");
        }
      }).observe(message, { childList: true, characterData: true, subtree: true });
    }
  }

  function patchGlobalSpeech() {
    window.sioniSpeak = speakWithSioniVoice;
    window.sioniShowEffect = showEffect;
    window.sioniUpdateRecommendation = updateRecommendation;
    window.sioniVoiceSettings = () => ({ ...settings });
  }

  patchSpeechSynthesis();
  patchGlobalSpeech();

  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupVoiceControls();
    patchGlobalSpeech();
    observeReactions();
    updateRecommendation();
    setInterval(updateRecommendation, 3000);
  });
})();
