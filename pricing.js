// Full JavaScript — Pricing slider with JSON config, input-driven max expansion,
// TRUE reset, checkbox dependency logic, and explanatory toasts.
// NOTE: Slider NO LONGER expands the max when dragged to the end.
//       Instead, it shows a toast prompting the user to type a larger number.
//       Typing a value above max in the input STILL expands max to typed+10.

// ====== CONFIG ======
const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

// ====== TOAST MODULE (lightweight, modular) ======
const Toast = (() => {
  let container, stylesInjected = false;

  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    const css = `
      .toast-container{
        position:fixed;right:16px;bottom:16px;z-index:9999;
        display:flex;flex-direction:column;gap:8px;pointer-events:none;
      }
      .toast{
        pointer-events:auto;min-width:240px;max-width:420px;padding:12px 14px;border-radius:10px;
        box-shadow:0 6px 18px rgba(0,0,0,.18);background:#111;color:#fff;
        font:500 14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
        display:grid;grid-template-columns:20px 1fr auto;gap:10px;align-items:start;
        opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease;
      }
      .toast.show{opacity:1;transform:translateY(0)}
      .toast__icon{width:20px;height:20px;margin-top:1px}
      .toast__close{border:0;background:transparent;color:#fff;opacity:.7;cursor:pointer;font-size:16px}
      .toast--info{background:#111}
      .toast--warn{background:#6b3a00}
      .toast--error{background:#6b0000}
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

  const iconFor = (type) => (type === "warn" ? "⚠️" : type === "error" ? "⛔" : "ℹ️");

  function show(message, { type = "info", duration = 2800 } = {}) {
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
    requestAnimationFrame(() => el.classList.add("show"));
    if (duration > 0) setTimeout(close, duration);
    return { close };
  }

  return { show };
})();

// ====== APP ======
document.addEventListener("DOMContentLoaded", async () => {
  // --- DOM refs ---
  const sliderEl       = document.getElementById("slider");
  const empInputEl     = document.getElementById("empInput");
  const grandTotalEl   = document.getElementById("grandTotal");
  const perEmployeeEl  = document.getElementById("perEmployee");
  const resetBtn       = document.getElementById("toZero");

  const cbHasInserts   = document.getElementById("hasInserts");
  const cbSingleMail   = document.getElementById("isSingleMail");
  const cbHomeMail     = document.getElementById("isHomeMail");

  // Optional labels
  const labelBaseFee             = document.getElementById("baseFee");
  const labelStatementFee        = document.getElementById("statementFee");
  const labelSingleMailFee       = document.getElementById("singleAddressMailFee");
  const labelHomeMailFee         = document.getElementById("homeAddressMailFee");
  const labelCanadaMailFee       = document.getElementById("singleAddressCanadaMailFee");
  const labelInsertCost          = document.getElementById("insertCost");

  // --- Utils ---
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const fmtInt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

  const formatK = (v) => {
    const abs = Math.abs(v);
    if (abs >= 1000) {
      const k = v / 1000;
      const label = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, "");
      return `${label}k`;
    }
    return String(v);
  };

  const makePips = (min, max) => {
    const steps = 10;
    const span = max - min;
    return span <= 0
      ? [min]
      : Array.from({ length: steps + 1 }, (_, i) => Math.round(min + (span * i) / steps));
  };

  const renderPips = () => {
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.dataset.value);
      pip.textContent = formatK(v);
      pip.style.cursor = "pointer";
      pip.onclick = () => sliderEl.noUiSlider.set(v);
    });
  };

  // --- Fetch JSON ---
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    console.error("Error loading JSON:", e);
    data = {};
  }

  // --- Extract values ---
  const baseFee             = toNum(data.baseFee);
  const statementFee        = toNum(data.statementFee);
  const mailSingleFee       = toNum(data.singleAddressMailFee);
  const mailHomeFee         = toNum(data.homeAddressMailFee);
  const insertCost          = toNum(data.insertCost);
  const canadaMailFee       = toNum(data.singleAddressCanadaMailFee);

  // Original (factory) state for full reset
  const ORIG = {
    hasInserts:   !!data.hasInserts,
    isSingleMail: !!data.isSingleMail,
    isHomeMail:   !!data.isHomeMail,
    sliderMin:     toNum(data.sliderMin),
    sliderMax:     toNum(data.sliderMax),
    statementCount: toNum(data.statementCount),
  };
  if (ORIG.sliderMax < ORIG.sliderMin) [ORIG.sliderMin, ORIG.sliderMax] = [ORIG.sliderMax, ORIG.sliderMin];
  ORIG.statementCount = clamp(ORIG.statementCount, ORIG.sliderMin, ORIG.sliderMax);

  // Mutable runtime state
  let hasInserts   = ORIG.hasInserts;
  let isSingleMail = ORIG.isSingleMail;
  let isHomeMail   = ORIG.isHomeMail;
  let SLIDER_MIN   = ORIG.sliderMin;
  let SLIDER_MAX   = ORIG.sliderMax;

  // Normalize initial state by rules:
  // - Inserts requires Home Mail; cannot coexist with Single Mail.
  if (hasInserts) {
    isHomeMail = true;
    isSingleMail = false;
  }
  // - If both mail types off, inserts off.
  if (!isSingleMail && !isHomeMail) {
    hasInserts = false;
  }

  // --- Optional labels ---
  if (labelBaseFee)       labelBaseFee.textContent = fmtUSD(baseFee);
  if (labelStatementFee)  labelStatementFee.textContent = fmtUSD(statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(mailSingleFee);
  if (labelHomeMailFee)   labelHomeMailFee.textContent = fmtUSD(mailHomeFee);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(canadaMailFee);
  if (labelInsertCost)    labelInsertCost.textContent = fmtUSD(insertCost);

  // --- Initialize checkboxes from normalized state ---
  if (cbHasInserts) cbHasInserts.checked = hasInserts;
  if (cbSingleMail) cbSingleMail.checked = isSingleMail;
  if (cbHomeMail)   cbHomeMail.checked   = isHomeMail;

  // --- Create slider ---
  noUiSlider.create(sliderEl, {
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
    start: ORIG.statementCount,
    step: 1,
    connect: [true, false],
    pips: { mode: "values", values: makePips(SLIDER_MIN, SLIDER_MAX), density: 10 },
  });
  renderPips();

  // Input bounds/value
  if (empInputEl) {
    empInputEl.min = SLIDER_MIN;
    empInputEl.max = SLIDER_MAX;
    empInputEl.value = ORIG.statementCount;
  }

  // --- Pricing helpers ---
  const currentMailingFee = () => (isHomeMail ? mailHomeFee : isSingleMail ? mailSingleFee : 0);
  const perStatementCost  = () => statementFee + currentMailingFee() + (hasInserts ? insertCost : 0);

  function recalc(rawCount) {
    const n = clamp(Math.round(toNum(rawCount)), SLIDER_MIN, SLIDER_MAX);
    const perEmp = (n > 0) ? (perStatementCost() + baseFee / n) : perStatementCost();
    const grand  = baseFee + perStatementCost() * n;

    if (perEmployeeEl) perEmployeeEl.textContent = fmtUSD(perEmp);
    if (grandTotalEl)  grandTotalEl.textContent  = fmtUSD(grand);
    if (empInputEl && empInputEl.value !== String(n)) empInputEl.value = n;
  }

  // --- Update slider range/pips; optionally set a value to reflect handle ---
  function updateSliderRange(min, max, setVal = null) {
    SLIDER_MIN = min;
    SLIDER_MAX = max;
    if (empInputEl) {
      empInputEl.min = String(min);
      empInputEl.max = String(max);
    }
    sliderEl.noUiSlider.updateOptions(
      {
        range: { min, max },
        pips: { mode: "values", values: makePips(min, max), density: 10 },
      },
      true // fire 'set'
    );
    renderPips();
    if (setVal != null) sliderEl.noUiSlider.set(setVal);
  }

  // --- Auto-expand max ONLY via input ---
  function expandMaxTo(newMax, targetValue = null) {
    updateSliderRange(SLIDER_MIN, newMax, targetValue);
  }

  // --- Initial paint ---
  recalc(ORIG.statementCount);

  // --- Slider → recalc + (NO EXPAND). Show toast when hitting max. ---
  let maxToastShown = false;
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = toNum(vals[0]);

    // When user drags handle to max, show a one-time toast (reset once below max)
    if (val >= SLIDER_MAX) {
      if (!maxToastShown) {
        Toast.show(
          `If your employee count is more than ${fmtInt(SLIDER_MAX)} then type the size in the input.`,
          { type: "info", duration: 3800 }
        );
        maxToastShown = true;
      }
    } else {
      // reset flag once the user moves below max again
      maxToastShown = false;
    }

    recalc(val);
  });

  // --- Input → slider + expand when typing above max (newMax = typed+10) ---
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(SLIDER_MIN);
        return;
      }
      let v = Math.floor(toNum(empInputEl.value));
      if (v > SLIDER_MAX) {
        expandMaxTo(v + 10, v); // input still drives expansion
      } else {
        v = clamp(v, SLIDER_MIN, SLIDER_MAX);
        sliderEl.noUiSlider.set(v);
      }
    });
  }

  // --- RESET: restore EXACT JSON defaults (min/max, count, booleans) ---
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();

      // Restore factory booleans
      hasInserts   = ORIG.hasInserts;
      isSingleMail = ORIG.isSingleMail;
      isHomeMail   = ORIG.isHomeMail;

      // Normalize by rules
      if (hasInserts) {
        isHomeMail = true;
        isSingleMail = false;
      }
      if (!isSingleMail && !isHomeMail) {
        hasInserts = false;
      }

      // Reflect in checkboxes
      if (cbHasInserts) cbHasInserts.checked = hasInserts;
      if (cbSingleMail) cbSingleMail.checked = isSingleMail;
      if (cbHomeMail)   cbHomeMail.checked   = isHomeMail;

      // Restore slider range & value
      updateSliderRange(ORIG.sliderMin, ORIG.sliderMax, ORIG.statementCount);

      // Reset the one-time toast flag
      maxToastShown = false;

      // Input reflect
      if (empInputEl) empInputEl.value = ORIG.statementCount;

      // Recalc
      recalc(ORIG.statementCount);
    });
  }

  // ===== CHECKBOXES with explanatory toasts =====
  // Rules enforced:
  // - Inserts requires Home Mail and cannot coexist with Single Mail.
  // - Single Mail is exclusive with Home Mail and disables Inserts.
  // - If both mail types are off, Inserts must be off.
  // - If Inserts is turned on, ensure Home Mail is on and Single Mail off.

  if (cbHasInserts) {
    cbHasInserts.addEventListener("change", () => {
      hasInserts = cbHasInserts.checked;

      if (hasInserts) {
        if (!isHomeMail) {
          isHomeMail = true;
          if (cbHomeMail) cbHomeMail.checked = true;
          Toast.show("Inserts require Home Address mailing, so Home Address Mail was enabled.", { type: "info" });
        }
        if (isSingleMail) {
          isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
          Toast.show("Inserts can’t be used with Single Address Mail, so Single Address Mail was turned off.", { type: "warn" });
        }
      } else {
        if (!isSingleMail && !isHomeMail && cbHasInserts.checked) {
          cbHasInserts.checked = false;
        }
      }

      recalc(sliderEl.noUiSlider.get());
    });
  }

  if (cbSingleMail) {
    cbSingleMail.addEventListener("change", () => {
      if (cbSingleMail.checked) {
        isSingleMail = true;

        if (isHomeMail) {
          isHomeMail = false;
          if (cbHomeMail) cbHomeMail.checked = false;
          Toast.show("Single Address Mail is exclusive, so Home Address Mail was turned off.", { type: "info" });
        }
        if (hasInserts) {
          hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("Inserts aren’t supported with Single Address Mail, so Inserts were turned off.", { type: "warn" });
        }
      } else {
        isSingleMail = false;
        if (!isHomeMail && hasInserts) {
          hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("No mailing method is selected, so Inserts were turned off.", { type: "info" });
        }
      }

      recalc(sliderEl.noUiSlider.get());
    });
  }

  if (cbHomeMail) {
    cbHomeMail.addEventListener("change", () => {
      if (cbHomeMail.checked) {
        if (isSingleMail) {
          isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
          Toast.show("Home Address Mail is exclusive with Single Address Mail, so Single Address Mail was turned off.", { type: "info" });
        }
        isHomeMail = true;
      } else {
        isHomeMail = false;
        if (!isSingleMail && hasInserts) {
          hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("No mailing method is selected, so Inserts were turned off.", { type: "info" });
        }
      }

      recalc(sliderEl.noUiSlider.get());
    });
  }
});
