(() => {
  const VOICE_KEY = "sioni-v4-voice-settings";

  const presets = {
    cute: { pitch: 1.45, rate: 1.08, volume: 0.9 },
    tiny: { pitch: 1.75, rate: 1.12, volume: 0.82 },
    calm: { pitch: 1.18, rate: 0.92, volume: 0.88 },
    sleepy: { pitch: 0.98, rate: 0.82, volume: 0.72 },
    excited: { pitch: 1.58, rate: 1.22, volume: 0.95 },
  };

  const defaultSettings = {
    preset: "cute",
    voiceURI: "",
    pitch: presets.cute.pitch,
    rate: presets.cute.rate,
    volume: presets.cute.volume,
  };

  let settings = loadVoiceSettings();

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

    if (preset) preset.value = settings.preset;
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
    const preferred = korean.find((voice) => /Yuna|유나|Siri|Female|여성/i.test(voice.name));
    return preferred || korean[0] || voices[0] || null;
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
    const preset = presets[name] || presets.cute;
    settings.preset = name;
    settings.pitch = preset.pitch;
    settings.rate = preset.rate;
    settings.volume = preset.volume;
    saveVoiceSettings();
    syncControls();
  }

  function speakWithSioniVoice(text, emotion = "calm") {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = getVoices();
    const selected = voices.find((voice) => voice.voiceURI === settings.voiceURI) || chooseDefaultVoice(voices);
    if (selected) utterance.voice = selected;

    const emotionShift = {
      excited: { pitch: 0.13, rate: 0.08, volume: 0.03 },
      happy: { pitch: 0.08, rate: 0.04, volume: 0.02 },
      shy: { pitch: 0.12, rate: -0.02, volume: -0.08 },
      sad: { pitch: -0.08, rate: -0.08, volume: -0.06 },
      sleepy: { pitch: -0.22, rate: -0.18, volume: -0.12 },
      hungry: { pitch: -0.04, rate: -0.04, volume: -0.02 },
      surprised: { pitch: 0.18, rate: 0.12, volume: 0.04 },
      thinking: { pitch: 0.02, rate: -0.04, volume: -0.02 },
      lonely: { pitch: -0.12, rate: -0.09, volume: -0.08 },
    }[emotion] || { pitch: 0, rate: 0, volume: 0 };

    utterance.lang = "ko-KR";
    utterance.pitch = Math.max(0.5, Math.min(2, Number(settings.pitch) + emotionShift.pitch));
    utterance.rate = Math.max(0.5, Math.min(1.6, Number(settings.rate) + emotionShift.rate));
    utterance.volume = Math.max(0.1, Math.min(1, Number(settings.volume) + emotionShift.volume));
    window.speechSynthesis.speak(utterance);
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
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (rate) rate.addEventListener("input", () => {
      settings.rate = Number(rate.value);
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (volume) volume.addEventListener("input", () => {
      settings.volume = Number(volume.value);
      saveVoiceSettings();
      updateNumberLabels();
    });
    if (test) test.addEventListener("click", () => {
      speakWithSioniVoice("안녕하세요. 저는 시오니예요. 이 목소리가 더 귀엽게 들리나요?", settings.preset === "sleepy" ? "sleepy" : "happy");
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

  function updateRecommendation() {
    const text = $("#recommendationText");
    if (!text || !window.sioniStateSnapshot) return;
    const s = window.sioniStateSnapshot();
    if (s.hunger >= 78 && s.fullness < 68) text.textContent = "배고픔이 높아요. 간식을 조금 주는 게 좋아요.";
    else if (s.energy <= 24) text.textContent = "에너지가 낮아요. 잠깐 쉬게 해주세요.";
    else if (s.loneliness >= 68) text.textContent = "외로움이 올라갔어요. 쓰담하거나 인사해 주세요.";
    else if (s.mood <= 34) text.textContent = "기분이 낮아요. 감정 버튼으로 위로 모드를 켜보세요.";
    else if (s.fullness >= 76) text.textContent = "아직 배불러요. 지금은 밥보다 쉬기나 쓰담이 좋아요.";
    else text.textContent = "상태가 괜찮아요. 오늘의 미션을 하나 눌러보세요.";
  }

  function patchGlobalSpeech() {
    window.sioniSpeak = speakWithSioniVoice;
    window.sioniShowEffect = showEffect;
    window.sioniUpdateRecommendation = updateRecommendation;
    window.sioniVoiceSettings = () => ({ ...settings });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupTabs();
    setupVoiceControls();
    patchGlobalSpeech();
    updateRecommendation();
    setInterval(updateRecommendation, 3000);
  });
})();
