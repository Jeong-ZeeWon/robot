(() => {
  function normalize(text) {
    return text
      .replace(/v3/g, "v5")
      .replace(/v4\.1/g, "v7")
      .replace(/v6/g, "v7")
      .replace(/v5/g, "v7")
      .replace(/v4(?!\.1)/g, "v7");
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
    document.title = "시오니 v7";
    const main = document.querySelector("main");
    if (main) main.setAttribute("aria-label", "시오니 v7");
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
  document.addEventListener("DOMContentLoaded", () => {
    patchAll();
    setTimeout(patchAll, 300);
  });
})();
