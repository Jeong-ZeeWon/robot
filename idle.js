(() => {
  const DELAY_MS = 3200;
  const INTERVAL_MS = 4800;
  const CLEAR_MS = 1650;
  const IDLE_CLASSES = [
    "is-idle-blink",
    "is-idle-look",
    "is-idle-happy",
    "is-idle-sleepy",
    "is-idle-lonely",
    "is-idle-hungry",
    "is-idle-curious",
    "is-idle-scan",
    "is-idle-doze",
    "is-idle-stretch",
    "is-idle-nibble",
    "is-idle-wave",
    "is-idle-drift",
  ];

  const $ = (selector) => document.querySelector(selector);
  let lastInteractionAt = Date.now();
  let clearTimer = null;

  function numberFrom(selector) {
    const value = Number($(selector)?.textContent || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function clearIdleMotion(robot) {
    clearTimeout(clearTimer);
    IDLE_CLASSES.forEach((name) => robot.classList.remove(name));
  }

  function setFace(faceName) {
    const face = $("#face");
    if (!face || !faceName) return;
    face.className = `face ${faceName}`;
  }

  function moodFace() {
    const energy = numberFrom("#energyValue");
    const hunger = numberFrom("#hungerValue");
    const loneliness = numberFrom("#lonelinessValue");
    const mood = numberFrom("#moodValue");
    const affection = numberFrom("#affectionValue");
    if (energy <= 18) return "sleepy";
    if (hunger >= 82) return "hungry";
    if (loneliness >= 78 || mood <= 30) return "sad";
    if (mood >= 88) return "excited";
    if (affection >= 78) return "happy";
    return "calm";
  }

  function idleOptions() {
    const energy = numberFrom("#energyValue");
    const hunger = numberFrom("#hungerValue");
    const loneliness = numberFrom("#lonelinessValue");
    const mood = numberFrom("#moodValue");
    const affection = numberFrom("#affectionValue");

    if (energy <= 24) {
      return [
        ["is-idle-sleepy", "sleepy", "시오니가 잠깐 꾸벅꾸벅 졸고 있어요.", "에너지가 낮으면 대기 중 졸린 움직임이 더 자주 나와요."],
        ["is-idle-doze", "sleepy", "시오니가 아주 느리게 고개를 떨궈요.", "시간이 지나 에너지가 낮아지면 졸린 모션이 섞여요."],
        ["is-idle-drift", "sleepy"],
        ["is-idle-blink", "sleepy"],
        ["is-idle-stretch", "sleepy"],
      ];
    }

    if (hunger >= 76) {
      return [
        ["is-idle-hungry", "hungry", "시오니가 간식 버튼 쪽을 슬쩍 보고 있어요.", "배고픔이 높으면 대기 중 간식 반응이 늘어나요."],
        ["is-idle-nibble", "hungry", "시오니가 작은 간식 생각을 하는 것 같아요.", "접속한 채 시간이 지나면 배고픔이 서서히 올라가요."],
        ["is-idle-scan", "hungry"],
        ["is-idle-blink", "hungry"],
        ["is-idle-look", "hungry"],
      ];
    }

    if (loneliness >= 68) {
      return [
        ["is-idle-lonely", "sad", "시오니가 조용히 손길을 기다리고 있어요.", "외로움이 높으면 먼저 눈치를 보거나 작게 흔들려요."],
        ["is-idle-wave", "sad", "시오니가 아주 작게 손짓하며 기다려요.", "오래 가만히 있으면 외로움이 조금씩 올라가요."],
        ["is-idle-drift", "sad"],
        ["is-idle-blink", "sad"],
        ["is-idle-look", "sad"],
      ];
    }

    if (mood >= 86 || affection >= 80) {
      return [
        ["is-idle-happy", "excited", "시오니가 혼자 반짝반짝 신나 하고 있어요.", "기분과 친밀도가 높으면 대기 중에도 작은 축하 움직임이 나와요."],
        ["is-idle-wave", "happy"],
        ["is-idle-stretch", "happy"],
        ["is-idle-blink", "happy"],
        ["is-idle-curious", "happy"],
      ];
    }

    return [
      ["is-idle-blink", moodFace()],
      ["is-idle-blink", moodFace()],
      ["is-idle-look", "thinking"],
      ["is-idle-scan", "thinking"],
      ["is-idle-stretch", "calm"],
      ["is-idle-drift", "calm"],
      ["is-idle-curious", "calm", "시오니가 주변을 살피며 다음 이야기를 기다려요.", "아무것도 누르지 않아도 가끔 스스로 움직여요."],
    ];
  }

  function markInteraction() {
    lastInteractionAt = Date.now();
    const robot = $("#robot");
    if (robot) clearIdleMotion(robot);
  }

  function runIdleReaction() {
    const robot = $("#robot");
    if (!robot || document.hidden) return;
    if (Date.now() - lastInteractionAt < DELAY_MS) return;

    const options = idleOptions();
    const [motion, faceName, message, hint] = options[Math.floor(Math.random() * options.length)];
    window.SioniV7?.markIdle?.();
    clearIdleMotion(robot);
    setFace(faceName);
    void robot.offsetWidth;
    robot.classList.add(motion);

    if (message && Math.random() < 0.24) {
      const messageNode = $("#message");
      const hintNode = $("#microHint");
      if (messageNode) messageNode.textContent = message;
      if (hintNode) hintNode.textContent = hint || "대기 중에는 시오니가 상태에 맞춰 조용히 반응해요.";
    }

    clearTimer = setTimeout(() => {
      clearIdleMotion(robot);
      setFace(moodFace());
    }, CLEAR_MS);
  }

  document.addEventListener("pointerdown", markInteraction, true);
  document.addEventListener("keydown", markInteraction, true);
  document.addEventListener("submit", markInteraction, true);
  window.addEventListener("focus", markInteraction);
  window.addEventListener("load", markInteraction);
  setInterval(runIdleReaction, INTERVAL_MS);
  window.setTimeout(runIdleReaction, DELAY_MS + 600);
})();
