(() => {
  const FACE_VARIANTS = {
    calm: ["calm", "calm-soft", "calm-scan", "calm-dim"],
    happy: ["happy", "happy-smile", "happy-spark", "happy-heart"],
    excited: ["excited", "excited-star", "excited-flash", "excited-wide"],
    sad: ["sad", "sad-tear", "sad-rain", "sad-small"],
    sleepy: ["sleepy", "sleepy-doze", "sleepy-z", "sleepy-low"],
    hungry: ["hungry", "hungry-drool", "hungry-bite", "hungry-empty"],
    thinking: ["thinking", "thinking-dots", "thinking-scan"],
    shy: ["shy"],
    surprised: ["surprised"],
    annoyed: ["annoyed"],
  };

  const BASES = Object.keys(FACE_VARIANTS);
  let lastVariant = "";

  function baseFace(face) {
    const classes = Array.from(face.classList);
    return BASES.find((name) => classes.includes(name)) || "calm";
  }

  function pick(base) {
    const variants = FACE_VARIANTS[base] || [base];
    const choices = variants.length > 1 ? variants.filter((name) => name !== lastVariant) : variants;
    const next = choices[Math.floor(Math.random() * choices.length)] || variants[0];
    lastVariant = next;
    return next;
  }

  function applyVariant(face) {
    if (!face) return;
    const base = baseFace(face);
    const current = face.dataset.faceVariant;
    const classes = Array.from(face.classList);
    if (current && classes.includes(base) && classes.includes(current)) return;

    const variant = pick(base);
    face.dataset.faceVariant = variant;
    face.className = variant === base ? `face ${base}` : `face ${base} ${variant}`;
  }

  function start() {
    const face = document.querySelector("#face");
    if (!face) return;
    applyVariant(face);
    new MutationObserver(() => applyVariant(face)).observe(face, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
