(() => {
  const FACE_VARIANTS = {
    positive: [
      "joy-smile",
      "joy-big",
      "joy-happy",
      "joy-heart",
      "joy-wink",
      "joy-cheer",
      "joy-satisfied",
      "joy-relief",
      "joy-laugh",
      "joy-proud",
    ],
    negative: [
      "sad-soft",
      "sad-gloom",
      "sad-tears",
      "sad-pout",
      "sad-lonely",
      "sad-disappointed",
      "sad-regret",
      "sad-despair",
    ],
    angry: ["angry-sharp", "angry-rage", "annoyed-side", "suspicious", "jealous", "spite"],
    surprise: ["surprise-pop", "panic-sweat", "confused", "shocked", "blush", "scared"],
    robot: ["robot-loading", "robot-compute", "battery-low", "system-error", "sleep-standby", "scan-mode"],
    fun: ["playful-tongue", "bored-yawn", "cool", "tease"],
    eating: ["eating-chew", "eating-nom", "eating-full"],
  };

  const BASE_TO_GROUP = {
    calm: "robot",
    happy: "positive",
    excited: "positive",
    shy: "positive",
    sad: "negative",
    sleepy: "robot",
    hungry: "eating",
    thinking: "robot",
    surprised: "surprise",
    annoyed: "angry",
  };

  const GROUPS = Object.keys(FACE_VARIANTS);
  const APP_BASES = Object.keys(BASE_TO_GROUP);
  const ALL_VARIANTS = Object.values(FACE_VARIANTS).flat();
  let lastVariant = "";

  function textOf(selector) {
    return document.querySelector(selector)?.textContent || "";
  }

  function inferGroupFromText() {
    const text = `${textOf("#message")} ${textOf("#microHint")} ${textOf("#moodLabel")}`;
    if (/냠냠|간식|먹|밥|소화|배고|충전 간식|포만/.test(text)) return "eating";
    if (/화|짜증|분한|열받|경고|쿨타임|기다려|싫|귀찮/.test(text)) return "angry";
    if (/깜짝|놀람|예상 밖|어\\?|당황|무서|두려|불안|걱정/.test(text)) return "surprise";
    if (/오류|시스템|로딩|연산|스캔|배터리|수면|졸|자요|쉬기|대기/.test(text)) return "robot";
    if (/심심|놀|장난|메롱|웃|빵|쿨|자신감|으쓱/.test(text)) return "fun";
    if (/슬프|속상|우울|외로|허전|눈물|시무룩|실망|후회|절망|지친|피곤/.test(text)) return "negative";
    if (/좋|기뻐|축하|칭찬|고마|사랑|반가|성공|행복|최고|자랑/.test(text)) return "positive";
    return "";
  }

  function groupFromFace(face) {
    const classes = Array.from(face.classList);
    const directGroup = GROUPS.find((name) => classes.includes(name));
    if (directGroup) return directGroup;
    const appBase = APP_BASES.find((name) => classes.includes(name));
    return BASE_TO_GROUP[appBase] || "";
  }

  function pick(group) {
    const variants = FACE_VARIANTS[group] || FACE_VARIANTS.robot;
    const choices = variants.length > 1 ? variants.filter((name) => name !== lastVariant) : variants;
    const next = choices[Math.floor(Math.random() * choices.length)] || variants[0];
    lastVariant = next;
    return next;
  }

  function applyVariant(face, force = false) {
    if (!face) return;
    const textGroup = inferGroupFromText();
    const group = textGroup || groupFromFace(face) || "robot";
    const current = face.dataset.faceVariant;
    const hasVariant = current && face.classList.contains(current);
    const hasKnownVariant = ALL_VARIANTS.some((name) => face.classList.contains(name));
    if (!force && hasVariant && hasKnownVariant && face.classList.contains(group)) return;

    const variant = pick(group);
    face.dataset.faceVariant = variant;
    face.className = `face ${group} ${variant}`;
  }

  function start() {
    const face = document.querySelector("#face");
    if (!face) return;
    applyVariant(face, true);

    let locking = false;
    const refresh = (force = false) => {
      if (locking) return;
      locking = true;
      applyVariant(face, force);
      locking = false;
    };

    new MutationObserver(() => refresh()).observe(face, {
      attributes: true,
      attributeFilter: ["class"],
    });

    ["#message", "#microHint", "#moodLabel"].forEach((selector) => {
      const node = document.querySelector(selector);
      if (!node) return;
      new MutationObserver(() => refresh(true)).observe(node, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
