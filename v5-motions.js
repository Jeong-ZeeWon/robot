(() => {
  const actionMotionMap = {
    pet: ["heartpop", "pulse", "sway", "headnod", "headturn"],
    feed: ["munch", "charge", "tinyshake", "headnod"],
    play: ["dance", "hop", "spin", "twirl", "celebrate", "headshake"],
    sleep: ["doze", "sleepy", "slow", "headnod"],
    study: ["headnod", "peek", "nod", "slow"],
    exercise: ["hop", "bounce", "wiggle", "pop"],
    music: ["wiggle", "sway", "twirl", "tippy"],
    outdoor: ["bounce", "headturn", "peek", "reach"],
  };

  const moodMotionMap = [
    { match: ["안녕", "하이"], motions: ["peek", "hop", "headturn"] },
    { match: ["힘들", "슬퍼", "우울"], motions: ["sway", "slow", "nod", "headnod"] },
    { match: ["기뻐", "좋은", "신나"], motions: ["celebrate", "dance", "hop", "twirl"] },
    { match: ["불안", "걱정", "두려"], motions: ["tinyshake", "sway", "headshake"] },
    { match: ["심심", "놀자"], motions: ["wiggle", "dance", "spin", "twirl", "headshake"] },
    { match: ["상태", "게이지"], motions: ["peek", "nod", "headturn"] },
    { match: ["고마워", "감사", "고맙"], motions: ["glow", "pulse", "nod", "bow"] },
  ];

  const emojiMap = {
    pet: ["💚", "💕", "✨"],
    feed: ["🍪", "냠", "✨"],
    play: ["🎈", "⭐", "빙글"],
    sleep: ["🌙", "Zzz", "💤"],
    study: ["📚", "집중", "✍️"],
    exercise: ["🏃", "💪", "⭐"],
    music: ["🎵", "♪", "✨"],
    outdoor: ["🌿", "☀️", "✨"],
    grateful: ["🙏", "💕", "✨"],
    moodHappy: ["✨", "😊", "⭐"],
    moodSad: ["💚", "괜찮아", "☁️"],
    moodAnxious: ["토닥", "💚", "숨"],
    moodBored: ["🎈", "놀자", "✨"],
    moodHello: ["👋", "삐빅", "😊"],
  };

  let lastMotion = "";

  function $(selector) {
    return document.querySelector(selector);
  }

  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function pick(list) {
    const candidates = list.filter((item) => item !== lastMotion);
    const pool = candidates.length ? candidates : list;
    const selected = pool[Math.floor(Math.random() * pool.length)];
    lastMotion = selected;
    return selected;
  }

  function runMotion(motion) {
    const robot = $("#robot");
    if (!robot || !motion) return;
    Array.from(robot.classList)
      .filter((name) => name.startsWith("is-motion-") || name === "is-bouncing" || name === "is-wiggling")
      .forEach((name) => robot.classList.remove(name));
    void robot.offsetWidth;
    robot.classList.add(`is-motion-${motion}`);
  }

  function setFaceByMood(text) {
    const face = $("#face");
    if (!face) return;
    const t = text || "";
    if (t.includes("기뻐") || t.includes("신나")) face.className = "face excited";
    else if (t.includes("힘들") || t.includes("슬퍼") || t.includes("우울")) face.className = "face sad";
    else if (t.includes("불안") || t.includes("걱정")) face.className = "face thinking";
    else if (t.includes("심심")) face.className = "face curious";
    else if (t.includes("안녕")) face.className = "face happy";
    else if (t.includes("고마워") || t.includes("감사")) face.className = "face happy";
  }

  function moodMotions(text) {
    const found = moodMotionMap.find((item) => item.match.some((word) => text.includes(word)));
    return found ? found.motions : ["peek", "nod", "float", "headturn", "headnod"];
  }

  function emojiKindFromText(text) {
    if (text.includes("기뻐") || text.includes("신나")) return "moodHappy";
    if (text.includes("힘들") || text.includes("슬퍼") || text.includes("우울")) return "moodSad";
    if (text.includes("불안") || text.includes("걱정")) return "moodAnxious";
    if (text.includes("심심")) return "moodBored";
    if (text.includes("고마워") || text.includes("감사")) return "grateful";
    return "moodHello";
  }

  function burst(kind = "pet") {
    const room = $("#sioniRoom");
    if (!room) return;
    const wrap = document.createElement("div");
    wrap.className = "v5-mini-fx";
    const items = emojiMap[kind] || ["✨", "⭐", "💚"];
    for (let i = 0; i < 6; i += 1) {
      const span = document.createElement("span");
      span.textContent = items[i % items.length];
      span.style.setProperty("--x", `${-34 + Math.random() * 68}px`);
      span.style.setProperty("--y", `${-52 - Math.random() * 46}px`);
      span.style.setProperty("--r", `${-22 + Math.random() * 44}deg`);
      span.style.animationDelay = `${i * 0.035}s`;
      wrap.appendChild(span);
    }
    room.appendChild(wrap);
    setTimeout(() => wrap.remove(), 1050);
  }

  function bind() {
    $all("[data-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        const motions = actionMotionMap[action] || ["bounce", "wiggle"];
        setTimeout(() => {
          runMotion(pick(motions));
          burst(action);
        }, 40);
      });
    });

    $all("[data-say]").forEach((button) => {
      button.addEventListener("click", () => {
        const text = button.dataset.say || "";
        setTimeout(() => {
          setFaceByMood(text);
          runMotion(pick(moodMotions(text)));
          burst(emojiKindFromText(text));
        }, 40);
      });
    });

    const claim = $("#claimAdventure");
    if (claim) {
      claim.addEventListener("click", () => {
        setTimeout(() => {
          runMotion("celebrate");
          burst("play");
        }, 40);
      });
    }

    const soundTest = $("#soundTest");
    if (soundTest) {
      soundTest.addEventListener("click", () => {
        setTimeout(() => {
          runMotion("startle");
          burst("moodHello");
        }, 40);
      });
    }
  }

  document.addEventListener("DOMContentLoaded", bind);
})();
