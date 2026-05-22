(() => {
  const EMOTION_WORDS = {
    tired: ["힘들", "피곤", "지쳤", "아파", "고단", "녹초"],
    sad: ["슬퍼", "우울", "속상", "눈물", "외로", "허전"],
    joy: ["기뻐", "좋은 일", "성공", "잘됐", "행복", "신나"],
    angry: ["화나", "짜증", "열받", "분해", "억울"],
    anxious: ["불안", "걱정", "두려", "무서", "염려"],
    bored: ["심심", "놀자", "재미", "지루"],
  };

  const CARE_LABELS = {
    pet: "쓰담",
    feed: "간식",
    play: "놀이",
    sleep: "휴식",
    talk: "대화",
  };

  const emptyMemory = () => ({
    version: 7,
    moodCounts: {},
    careCounts: {},
    recentSignals: [],
    favoriteWords: [],
    highlights: [],
    lastSummary: "",
  });

  const clampList = (items, size) => items.slice(0, size);

  function includesAny(text, words) {
    return words.some((word) => text.includes(word));
  }

  function ensure(memory) {
    return {
      ...emptyMemory(),
      ...(memory || {}),
      moodCounts: { ...((memory && memory.moodCounts) || {}) },
      careCounts: { ...((memory && memory.careCounts) || {}) },
      recentSignals: Array.isArray(memory?.recentSignals) ? memory.recentSignals : [],
      favoriteWords: Array.isArray(memory?.favoriteWords) ? memory.favoriteWords : [],
      highlights: Array.isArray(memory?.highlights) ? memory.highlights : [],
    };
  }

  function strongestMood(memory) {
    const entries = Object.entries(memory.moodCounts || {}).sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  }

  function favoriteCare(memory) {
    const entries = Object.entries(memory.careCounts || {}).sort((a, b) => b[1] - a[1]);
    return entries[0] || null;
  }

  function recordTalk(memory, rawText, category) {
    const next = ensure(memory);
    const text = String(rawText || "").trim().toLowerCase();
    const moodKey = Object.keys(EMOTION_WORDS).find((key) => key === category || includesAny(text, EMOTION_WORDS[key]));

    if (moodKey) next.moodCounts[moodKey] = (next.moodCounts[moodKey] || 0) + 1;
    next.careCounts.talk = (next.careCounts.talk || 0) + 1;

    const usefulWords = text
      .replace(/[^\w가-힣\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 2 && !["시오니", "오늘", "그냥", "너는"].includes(word));

    next.favoriteWords = clampList([...usefulWords, ...next.favoriteWords], 10);
    next.recentSignals = clampList([
      {
        type: moodKey || category || "talk",
        text: rawText,
        at: new Date().toISOString(),
      },
      ...next.recentSignals,
    ], 8);

    return summarize(next);
  }

  function recordCare(memory, careType) {
    const next = ensure(memory);
    const key = careType || "care";
    next.careCounts[key] = (next.careCounts[key] || 0) + 1;
    next.recentSignals = clampList([
      {
        type: key,
        text: CARE_LABELS[key] || "돌봄",
        at: new Date().toISOString(),
      },
      ...next.recentSignals,
    ], 8);
    return summarize(next);
  }

  function summarize(memory) {
    const next = ensure(memory);
    const mood = strongestMood(next);
    const care = favoriteCare(next);
    const parts = [];

    if (mood) {
      const moodLabel = {
        tired: "힘든 날",
        sad: "속상한 마음",
        joy: "기쁜 이야기",
        angry: "화난 마음",
        anxious: "불안한 마음",
        bored: "심심한 순간",
      }[mood[0]] || "감정";
      parts.push(`${moodLabel}을 ${mood[1]}번 기억했어요`);
    }

    if (care) parts.push(`${CARE_LABELS[care[0]] || "돌봄"} 반응이 가장 많아요`);

    next.lastSummary = parts.length ? parts.join(" · ") : "아직 기억을 모으는 중이에요";
    next.highlights = clampList([next.lastSummary, ...next.highlights.filter((item) => item !== next.lastSummary)], 5);
    return next;
  }

  function contextLine(memory, state) {
    const next = ensure(memory);
    const mood = strongestMood(next);
    if (state?.loneliness >= 70) return "외로움이 높아서 먼저 곁에 있는 반응을 해요.";
    if (state?.hunger >= 75) return "배고픔이 높아서 간식이나 쉬운 반응을 먼저 떠올려요.";
    if (state?.energy <= 25) return "에너지가 낮아서 차분한 반응을 더 잘해요.";
    if (mood && mood[1] >= 3) return `최근 ${next.lastSummary}`;
    return next.lastSummary || "오늘의 대화를 천천히 기억하고 있어요.";
  }

  window.SioniMemoryEngine = {
    emptyMemory,
    ensure,
    recordTalk,
    recordCare,
    summarize,
    contextLine,
  };
})();
