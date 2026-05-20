window.addEventListener("pagehide", () => {
  try {
    saveState();
  } catch {}
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    try {
      saveState();
    } catch {}
  }
});

setInterval(() => {
  try {
    saveState();
  } catch {}
}, 2500);
