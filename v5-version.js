(() => {
  function normalize(text) {
    return text
      .replace(/Pocket Robot v?\d+(?:\.\d+)*/gi, "10살 포켓 로봇")
      .replace(/시오니 v?\d+(?:\.\d+)*/g, "10살 시오니")
      .replace(/v\d+(?:\.\d+)*/gi, "10살");
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
    document.title = "10살 시오니";
    const main = document.querySelector("main");
    if (main) main.setAttribute("aria-label", "10살 시오니");
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
