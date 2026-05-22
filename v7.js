(() => {
  const STORAGE_KEY = "sioni-v7-memory";
  const $ = (selector) => document.querySelector(selector);

  function loadMemory() {
    try {
      return window.SioniMemoryEngine?.ensure(JSON.parse(localStorage.getItem(STORAGE_KEY))) || window.SioniMemoryEngine?.emptyMemory() || {};
    } catch {
      return window.SioniMemoryEngine?.emptyMemory() || {};
    }
  }

  function saveMemory(memory) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }

  function stateSnapshot() {
    const read = (selector) => Number($(selector)?.textContent || 0);
    return {
      mood: read("#moodValue"),
      affection: read("#affectionValue"),
      energy: read("#energyValue"),
      hunger: read("#hungerValue"),
      loneliness: read("#lonelinessValue"),
    };
  }

  function classify(text) {
    const value = String(text || "").toLowerCase();
    if (["힘들", "피곤", "지쳤", "아파"].some((word) => value.includes(word))) return "tired";
    if (["슬퍼", "우울", "속상", "외로"].some((word) => value.includes(word))) return "sad";
    if (["기뻐", "성공", "행복", "신나"].some((word) => value.includes(word))) return "joy";
    if (["화나", "짜증", "억울"].some((word) => value.includes(word))) return "angry";
    if (["불안", "걱정", "무서"].some((word) => value.includes(word))) return "anxious";
    if (["심심", "놀자", "지루"].some((word) => value.includes(word))) return "bored";
    return "talk";
  }

  function patchResponses() {
    const bank = window.SIONI_RESPONSES;
    if (!bank) return;
    delete bank.mission;
    Object.values(bank).forEach((list) => {
      if (!Array.isArray(list)) return;
      list.forEach((item) => {
        item.text = item.text
          .replaceAll("반짝 스티커", "반짝 표시")
          .replaceAll("작은 미션", "작은 놀이")
          .replaceAll("오늘의 미션", "오늘의 놀이")
          .replaceAll("v3", "v7")
          .replaceAll("v6", "v7");
      });
    });
  }

  function renderMemory(memory = loadMemory()) {
    const summary = window.SioniMemoryEngine?.contextLine(memory, stateSnapshot()) || "오늘의 대화를 천천히 기억하고 있어요.";
    const insight = $("#v6Insight");
    const memoryLine = $("#memoryLine");
    const list = $("#v6MemoryList");
    const talkCount = $("#v6Kindness");
    const memoryCount = $("#v6Curiosity");
    const careCount = $("#v6Bravery");
    const idleCount = $("#v6Sparkle");
    const personaName = $("#v6PersonaName");
    const personaText = $("#v6PersonaText");

    if (insight) insight.textContent = `v7 기억 엔진: ${summary}`;
    if (memoryLine) memoryLine.textContent = summary;
    if (personaName) personaName.textContent = "다정한 시오니";
    if (personaText) personaText.textContent = "하나의 말투를 유지하면서, 최근 기억과 현재 게이지에 맞춰 더 조용하거나 더 밝게 반응해요.";

    const careTotal = Object.entries(memory.careCounts || {}).reduce((sum, [key, value]) => key === "talk" ? sum : sum + Number(value || 0), 0);
    if (talkCount) talkCount.textContent = memory.careCounts?.talk || 0;
    if (memoryCount) memoryCount.textContent = memory.recentSignals?.length || 0;
    if (careCount) careCount.textContent = careTotal;
    if (idleCount) idleCount.textContent = sessionStorage.getItem("sioni-v7-idle-count") || "0";

    if (list) {
      const items = [memory.lastSummary, ...(memory.highlights || [])].filter(Boolean).slice(0, 5);
      list.innerHTML = items.length
        ? items.map((item, index) => `<li><strong>${index === 0 ? "요약" : "기억"}</strong><span>${item}</span></li>`).join("")
        : `<li><strong>첫 기억</strong><span>아직 새 기억을 기다리고 있어요.</span></li>`;
    }
  }

  function rememberTalk(text) {
    if (!window.SioniMemoryEngine) return;
    const memory = window.SioniMemoryEngine.recordTalk(loadMemory(), text, classify(text));
    saveMemory(memory);
    renderMemory(memory);
  }

  function rememberCare(type) {
    if (!window.SioniMemoryEngine) return;
    const memory = window.SioniMemoryEngine.recordCare(loadMemory(), type);
    saveMemory(memory);
    renderMemory(memory);
  }

  function patchVisibleVersion() {
    document.title = "시오니 v7";
    const main = $("main");
    if (main) main.setAttribute("aria-label", "시오니 v7");
    const eyebrow = $(".eyebrow");
    if (eyebrow) eyebrow.textContent = "Pocket Robot v7.0.0";
    const title = $(".v6-title-row span");
    if (title) title.textContent = "v7 기억 엔진";
    document.querySelectorAll(".v6-stat-grid span").forEach((node, index) => {
      node.textContent = ["대화", "기억", "돌봄", "반응"][index] || node.textContent;
    });
  }

  function bind() {
    document.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      const sayButton = event.target.closest("[data-say]");
      if (actionButton) rememberCare(actionButton.dataset.action);
      if (sayButton) rememberTalk(sayButton.dataset.say);
    }, true);

    document.addEventListener("submit", (event) => {
      if (event.target?.id !== "talkForm") return;
      rememberTalk($("#userInput")?.value || "");
    }, true);
  }

  window.SioniV7 = {
    markIdle() {
      const next = Number(sessionStorage.getItem("sioni-v7-idle-count") || 0) + 1;
      sessionStorage.setItem("sioni-v7-idle-count", String(next));
      renderMemory();
    },
  };

  patchResponses();
  window.addEventListener("DOMContentLoaded", () => {
    patchVisibleVersion();
    renderMemory();
    bind();
  });
})();
