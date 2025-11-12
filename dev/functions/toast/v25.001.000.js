const Toast = (() => {
  let container, stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const css = `
      .toast-container{
        position:fixed;left:50%;bottom:24px;transform:translateX(-50%);
        z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;
        width:auto;max-width:calc(100% - 40px);
      }
      .toast{
        pointer-events:auto;min-width:240px;max-width:420px;padding:25px 20px;border-radius:10px;
        box-shadow:0 6px 18px rgba(0,0,0,.18);background:#111;color:#fff;
        font:500 16px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
        display:grid;grid-template-columns:20px 1fr auto;gap:0px;align-items:start;
        opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease;
      }
      .toast.show{opacity:1;transform:translateY(0)}
      .toast__icon{width:0px;height:0px;margin-top:0px}
      .toast__close{border:0;background:transparent;color:#fff;opacity:.7;cursor:pointer;font-size:16px}
      .toast--info{background:#14d273}
      .toast--warn{background:#14d273}
      .toast--error{background:#14d273}
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  }
  function ensureContainer() {
    if (container) return container;
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
    return container;
  }

  function show(message, { type = "info", duration = 6000, onShow = null } = {}) {
    const iconFor = () => "";
    injectStyles();
    const parent = ensureContainer();
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `
      <div class="toast__icon" aria-hidden="true">${iconFor(type)}</div>
      <div class="toast__content">${message}</div>
      <button class="toast__close" aria-label="Dismiss">✕</button>
    `;
    const close = () => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 180);
    };
    el.querySelector(".toast__close").addEventListener("click", close);
    parent.appendChild(el);
    requestAnimationFrame(() => {
      el.classList.add("show");
      if (typeof onShow === "function") onShow();
    });
    if (duration > 0) setTimeout(close, duration);
    return { close };
  }
  return { show };
})();
