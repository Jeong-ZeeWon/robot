(() => {
  function normalize(text) {
    return text
      .replace(/v3/g, "v5")
      .replace(/v4\.1/g, "v7")
      .replace(/v6/g, "v7")
      .replace(/v5/g, "v7")
      .replace(/v4(?!\.1)/g, "v7")
      .replace(/v7/g, "v8")
      .replace(/v8/g, "v9");
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
    document.title = "시오니 v9";
    const main = document.querySelector("main");
    if (main) main.setAttribute("aria-label", "시오니 v9");
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
