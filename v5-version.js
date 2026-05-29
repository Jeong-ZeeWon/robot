(() => {
  // 나이 표현을 버전 표기로 통일합니다. 남아 있던 "12살" 텍스트를 v13 기준으로 정리해요.
  function normalize(text) {
    return text
      .replace(/Pocket Robot v?\d+(?:\.\d+)*/gi, "포켓 로봇 AI")
      .replace(/12살 포켓 로봇 ?AI/g, "포켓 로봇 AI")
      .replace(/12살 시오니/g, "시오니")
      .replace(/12살이 되면서/g, "버전이 올라가면서")
      .replace(/12살이라/g, "버전이 올라가서")
      .replace(/12살/g, "시오니");
  }

  function patchTextNode(node) {
    if (!node) return;
    const next = normalize(node.textContent || "");
    if (next !== node.textContent) node.textContent = next;
  }

  function patchAll() {
    patchTextNode(document.querySelector("#message"));
    patchTextNode(document.querySelector("#microHint"));
    patchTextNode(document.querySelector("#timeGreeting"));
    patchTextNode(document.querySelector(".eyebrow"));
    patchTextNode(document.querySelector(".v6-title-row span"));
    document.title = "시오니 v13";
    const main = document.querySelector("main");
    if (main) main.setAttribute("aria-label", "시오니 v13");
  }

  function observe(selector) {
    const node = document.querySelector(selector);
    if (!node) return;
    new MutationObserver(() => patchTextNode(node)).observe(node, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  patchAll();
  observe("#message");
  observe("#microHint");
  observe("#timeGreeting");
  observe("#v6Insight");
  observe(".eyebrow");
  observe(".v6-title-row span");
  document.addEventListener("DOMContentLoaded", () => {
    patchAll();
    setTimeout(patchAll, 300);
  });
})();
