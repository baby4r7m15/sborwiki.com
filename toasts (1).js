/* =====================================================
   SBORWIKI TOAST SYSTEM
   - Auto close + progress timing
   - Manual close
   - Mobile offset under sticky header (.hud-top or .wiki-header)
===================================================== */

(() => {
  const BASE_TIME = 7000;   // 7 seconds
  const STAGGER = 1500;     // 1.5 seconds apart

  function setToastOffset() {
    const toastStack = document.getElementById("sao-toast-stack");
    if (!toastStack) return;

    const header =
      document.querySelector(".hud-top") ||
      document.querySelector(".wiki-header");

    if (!header) return;

    if (window.innerWidth <= 768) {
      const headerHeight = header.getBoundingClientRect().height;
      toastStack.style.top = `${headerHeight + 12}px`;
      toastStack.style.bottom = "auto";
    } else {
      // Desktop: let CSS position it (usually bottom-right)
      toastStack.style.top = "";
      toastStack.style.bottom = "";
    }
  }

  function initToasts() {
    const toasts = document.querySelectorAll(".sao-toast");
    if (!toasts.length) return;

    toasts.forEach((toast, index) => {
      const progress = toast.querySelector(".sao-toast-progress");
      const totalTime = BASE_TIME + (index * STAGGER);

      // Animate progress bar
      if (progress) {
        progress.style.animation = `toastTimer ${totalTime / 1000}s linear forwards`;
      }

      // Auto close
      const autoClose = setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 220);
      }, totalTime);

      // Manual close
      const closeBtn = toast.querySelector(".sao-toast-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          clearTimeout(autoClose);
          if (progress) progress.style.animation = "none";
          toast.classList.remove("show");
          setTimeout(() => toast.remove(), 220);
        });
      }
    });
  }

  function init() {
    initToasts();
    setToastOffset();

    window.addEventListener("resize", setToastOffset);
    // If your header height changes after nav opens, you can call setToastOffset() manually.
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
