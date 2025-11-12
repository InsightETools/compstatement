// Full JavaScript — pricing slider, checkbox rules, centered toasts with autofocus,
// JSON->DOM mapping (with "Unknown" and wrapper-hide on null), URL param sync + share mode,
// and with these FINAL rules:
//   • The fields payrollSystem, payrollDataMethod, supplementalCostMethod, targetDate
//     ALWAYS come from JSON (no URL parameter support).
//   • If ?share=true: use ONLY URL params as data EXCEPT the 4 protected fields above.
//   • If ?share is missing or false: use JSON and reset URL params to mirror JSON (share=false).
//   • When slider hits max, DO NOT expand automatically. Show toast & focus input.
//   • When input > max, expand max to typed+10 and set the value.
//   • pricingLocked: hide [lock="pricingLock"]; if locked and a toggle is false, hide its wrapper.

// ----------------------------- Config -----------------------------------------
const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

// ----------------------------- Toast (centered) -------------------------------
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
  function show(message, { type = "info", duration = 2800, onShow = null } = {}) {
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

// ---------------------- JSON -> DOM field binder ------------------------------
function applyJsonFields(json, fields) {
  const isBlank = (v) => typeof v === "string" && v.trim() === "";

  fields.forEach((key) => {
    const el = document.getElementById(key);
    const wrapper = document.getElementById(`${key}Wrapper`);

    // Missing element → skip
    if (!el) return;

    const val = json[key];

    // ✅ If null → hide wrapper (preferred) or element
    if (val === null) {
      if (wrapper) wrapper.style.display = "none";
      else el.style.display = "none";
      return;
    }

    // ✅ Value exists → ensure wrapper is visible
    if (wrapper) wrapper.style.display = "";
    el.style.display = "";

    // ✅ Blank string → "Unknown"
    const output = isBlank(val) ? "Unknown" : String(val);

    // ✅ Write text (these 4 fields are always text)
    el.textContent = output;
  });
}


// -------------------------- URL params helpers -------------------------------
const PROTECTED_JSON_ONLY = new Set([
  "payrollSystem",
  "payrollDataMethod",
  "supplementalCostMethod",
  "targetDate"
]);

// All keys we sync in URL (EXCLUDING protected fields)
const PARAM_KEYS = [
  "share",
  "baseFee", "statementFee", "singleAddressMailFee", "homeAddressMailFee", "insertCost",
  "sliderMin", "sliderMax", "statementCount",
  "isSingleMail", "isHomeMail", "hasInserts", "pricingLocked"
];

const qs = () => new URLSearchParams(window.location.search);

function setParamsBulk(obj) {
  const p = qs();
  for (const k of PARAM_KEYS) {
    if (obj[k] === undefined) continue;
    const v = obj[k];
    if (v === null || v === undefined) p.delete(k);
    else p.set(k, String(v));
  }
  history.replaceState(null, "", `${location.pathname}?${p.toString()}${location.hash}`);
}

function getParamBool(name, def = false) {
  const v = qs().get(name);
  if (v === null) return def;
  return v === "true" || v === "1";
}
function getParamNum(name, def = 0) {
  const v = Number(qs().get(name));
  return Number.isFinite(v) ? v : def;
}

// Build state from URL params (for share=true), with defaults fallback
function stateFromParams(defaults = {}) {
  return {
    share: getParamBool("share", false),
    baseFee: getParamNum("baseFee", defaults.baseFee ?? 0),
    statementFee: getParamNum("statementFee", defaults.statementFee ?? 0),
    singleAddressMailFee: getParamNum("singleAddressMailFee", defaults.singleAddressMailFee ?? 0),
    homeAddressMailFee: getParamNum("homeAddressMailFee", defaults.homeAddressMailFee ?? 0),
    insertCost: getParamNum("insertCost", defaults.insertCost ?? 0),
    sliderMin: getParamNum("sliderMin", defaults.sliderMin ?? 0),
    sliderMax: getParamNum("sliderMax", defaults.sliderMax ?? 100),
    statementCount: getParamNum("statementCount", defaults.statementCount ?? 0),
    isSingleMail: getParamBool("isSingleMail", !!defaults.isSingleMail),
    isHomeMail: getParamBool("isHomeMail", !!defaults.isHomeMail),
    hasInserts: getParamBool("hasInserts", !!defaults.hasInserts),
    pricingLocked: getParamBool("pricingLocked", !!defaults.pricingLocked),
    // PROTECTED FIELDS ARE NOT READ FROM PARAMS
    payrollSystem: defaults.payrollSystem ?? "",
    payrollDataMethod: defaults.payrollDataMethod ?? "",
    supplementalCostMethod: defaults.supplementalCostMethod ?? "",
    targetDate: defaults.targetDate ?? ""
  };
}

function paramsFromState(s) {
  // Only include PARAM_KEYS
  return {
    share: s.share,
    baseFee: s.baseFee,
    statementFee: s.statementFee,
    singleAddressMailFee: s.singleAddressMailFee,
    homeAddressMailFee: s.homeAddressMailFee,
    insertCost: s.insertCost,
    sliderMin: s.sliderMin,
    sliderMax: s.sliderMax,
    statementCount: s.statementCount,
    isSingleMail: s.isSingleMail,
    isHomeMail: s.isHomeMail,
    hasInserts: s.hasInserts,
    pricingLocked: s.pricingLocked
  };
}

// --------------------------------- App ---------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // DOM refs
  const sliderEl       = document.getElementById("slider");
  const empInputEl     = document.getElementById("empInput");
  const grandTotalEl   = document.getElementById("grandTotal");
  const perEmployeeEl  = document.getElementById("perEmployee");
  const resetBtn       = document.getElementById("toZero");
  const cbHasInserts   = document.getElementById("hasInserts");
  const cbSingleMail   = document.getElementById("isSingleMail");
  const cbHomeMail     = document.getElementById("isHomeMail");

  // Optional display labels
  const labelBaseFee             = document.getElementById("baseFee");
  const labelStatementFee        = document.getElementById("statementFee");
  const labelSingleMailFee       = document.getElementById("singleAddressMailFee");
  const labelHomeMailFee         = document.getElementById("homeAddressMailFee");
  const labelCanadaMailFee       = document.getElementById("singleAddressCanadaMailFee");
  const labelInsertCost          = document.getElementById("insertCost");

  // Utils
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtUSD = (n) => Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
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

  // Fetch JSON
  let json = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    json = await res.json();
  } catch (e) {
    console.error("Error loading JSON:", e);
    json = {};
  }

  // Defaults from JSON
  const defaults = {
    baseFee: toNum(json.baseFee),
    statementFee: toNum(json.statementFee),
    singleAddressMailFee: toNum(json.singleAddressMailFee),
    homeAddressMailFee: toNum(json.homeAddressMailFee),
    insertCost: toNum(json.insertCost),
    sliderMin: toNum(json.sliderMin),
    sliderMax: toNum(json.sliderMax),
    statementCount: toNum(json.statementCount),
    isSingleMail: !!json.isSingleMail,
    isHomeMail: !!json.isHomeMail,
    hasInserts: !!json.hasInserts,
    pricingLocked: !!json.pricingLocked,
    // Protected: ALWAYS from JSON
    payrollSystem: json.payrollSystem ?? "",
    payrollDataMethod: json.payrollDataMethod ?? "",
    supplementalCostMethod: json.supplementalCostMethod ?? "",
    targetDate: json.targetDate ?? ""
  };

  // share logic
  const urlShare = getParamBool("share", false);
  // If share=true: use params (with defaults fallback) but keep protected fields from JSON.
  // If share missing/false: use JSON defaults and reset params to match JSON (share=false).
  let state = urlShare ? stateFromParams(defaults) : { ...defaults, share: false };

  // Normalize slider range and count
  if (state.sliderMax < state.sliderMin) {
    const t = state.sliderMin;
    state.sliderMin = state.sliderMax;
    state.sliderMax = t;
  }
  state.statementCount = clamp(state.statementCount, state.sliderMin, state.sliderMax);

  // Business rules
  if (state.hasInserts) {
    state.isHomeMail = true;
    state.isSingleMail = false;
  }
  if (!state.isSingleMail && !state.isHomeMail) {
    state.hasInserts = false;
  }

  // Sync URL to initial state (respecting protected fields exclusion)
  setParamsBulk(paramsFromState(state));

  // Immutable for reset
  const ORIG = { ...state };

  // Apply protected JSON-only fields to DOM (never from params)
  applyJsonFields(defaults, [
    "payrollSystem",
    "payrollDataMethod",
    "supplementalCostMethod",
    "targetDate"
  ]);

  // pricingLocked visibility via lock attribute
  document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
    el.style.display = state.pricingLocked ? "none" : "";
  });
  // When locked, hide wrappers for false toggles
  if (state.pricingLocked) {
    const singleW = document.getElementById("isSingleMailWrapper");
    const homeW   = document.getElementById("isHomeMailWrapper");
    const insW    = document.getElementById("hasInsertsWrapper");
    if (singleW && state.isSingleMail === false) singleW.style.display = "none";
    if (homeW   && state.isHomeMail   === false) homeW.style.display   = "none";
    if (insW    && state.hasInserts   === false) insW.style.display    = "none";
  }

  // Optional labels
  if (labelBaseFee)       labelBaseFee.textContent = fmtUSD(state.baseFee);
  if (labelStatementFee)  labelStatementFee.textContent = fmtUSD(state.statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(state.singleAddressMailFee);
  if (labelHomeMailFee)   labelHomeMailFee.textContent = fmtUSD(state.homeAddressMailFee);
  if (labelInsertCost)    labelInsertCost.textContent = fmtUSD(state.insertCost);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(json.singleAddressCanadaMailFee));

  // Init checkboxes
  if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
  if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
  if (cbHomeMail)   cbHomeMail.checked   = state.isHomeMail;

  // Create slider
  noUiSlider.create(sliderEl, {
    range: { min: state.sliderMin, max: state.sliderMax },
    start: state.statementCount,
    step: 1,
    connect: [true, false],
    pips: { mode: "values", values: makePips(state.sliderMin, state.sliderMax), density: 10 },
  });
  renderPips();

  // Input bounds/value
  if (empInputEl) {
    empInputEl.min = state.sliderMin;
    empInputEl.max = state.sliderMax;
    empInputEl.value = state.statementCount;
  }

  // Pricing helpers
  const currentMailingFee = () =>
    state.isHomeMail ? state.homeAddressMailFee :
    state.isSingleMail ? state.singleAddressMailFee : 0;

  const perStatementCost = () =>
    state.statementFee + currentMailingFee() + (state.hasInserts ? state.insertCost : 0);

  function recalc(rawCount) {
    const n = clamp(Math.round(Number(rawCount)), state.sliderMin, state.sliderMax);
    const perEmp = (n > 0) ? (perStatementCost() + state.baseFee / n) : perStatementCost();
    const grand  = state.baseFee + perStatementCost() * n;

    if (perEmployeeEl) perEmployeeEl.textContent = fmtUSD(perEmp);
    if (grandTotalEl)  grandTotalEl.textContent  = fmtUSD(grand);
    if (empInputEl && empInputEl.value !== String(n)) empInputEl.value = n;

    state.statementCount = n;
    setParamsBulk(paramsFromState(state));
  }

  function updateSliderRange(min, max, setVal = null) {
    state.sliderMin = min;
    state.sliderMax = max;
    if (empInputEl) {
      empInputEl.min = String(min);
      empInputEl.max = String(max);
    }
    sliderEl.noUiSlider.updateOptions(
      {
        range: { min, max },
        pips: { mode: "values", values: makePips(min, max), density: 10 },
      },
      true
    );
    renderPips();
    if (setVal != null) sliderEl.noUiSlider.set(setVal);

    setParamsBulk(paramsFromState(state));
  }

  // Initial paint
  recalc(state.statementCount);

  // Slider update (no expand; show toast at max)
  let maxToastShown = false;
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = Number(vals[0]);
    if (val >= state.sliderMax) {
      if (!maxToastShown) {
        Toast.show(
          `If your employee count is more than ${fmtInt(state.sliderMax)} then type the size in the input.`,
          {
            type: "info",
            duration: 3800,
            onShow: () => {
              if (empInputEl) {
                setTimeout(() => {
                  empInputEl.focus();
                  const v = empInputEl.value;
                  empInputEl.value = "";
                  empInputEl.value = v;
                }, 50);
              }
            }
          }
        );
        maxToastShown = true;
      }
    } else {
      maxToastShown = false;
    }
    recalc(val);
  });

  // Input change -> expand if above max
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(state.sliderMin);
        return;
      }
      let v = Math.floor(Number(empInputEl.value));
      if (!Number.isFinite(v)) return;

      if (v > state.sliderMax) {
        updateSliderRange(state.sliderMin, v + 10, v);
      } else {
        v = clamp(v, state.sliderMin, state.sliderMax);
        sliderEl.noUiSlider.set(v);
      }
    });
  }

  // Reset to initial state (from JSON or params per share at load time)
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      state = { ...ORIG };

      // pricingLocked visuals
      document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
        el.style.display = state.pricingLocked ? "none" : "";
      });
      if (state.pricingLocked) {
        const singleW = document.getElementById("isSingleMailWrapper");
        const homeW   = document.getElementById("isHomeMailWrapper");
        const insW    = document.getElementById("hasInsertsWrapper");
        if (singleW) singleW.style.display = state.isSingleMail ? "" : "none";
        if (homeW)   homeW.style.display   = state.isHomeMail   ? "" : "none";
        if (insW)    insW.style.display    = state.hasInserts   ? "" : "none";
      } else {
        ["isSingleMailWrapper","isHomeMailWrapper","hasInsertsWrapper"]
          .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ""; });
      }

      // checkboxes
      if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
      if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
      if (cbHomeMail)   cbHomeMail.checked   = state.isHomeMail;

      // slider range & value
      updateSliderRange(state.sliderMin, state.sliderMax, state.statementCount);

      // input reflect
      if (empInputEl) {
        empInputEl.min = state.sliderMin;
        empInputEl.max = state.sliderMax;
        empInputEl.value = state.statementCount;
      }

      maxToastShown = false;
      recalc(state.statementCount);
    });
  }

  // Checkbox interactions + URL sync
  const onStateChanged = () => setParamsBulk(paramsFromState(state));

  if (cbHasInserts) {
    cbHasInserts.addEventListener("change", () => {
      state.hasInserts = cbHasInserts.checked;
      if (state.hasInserts) {
        if (!state.isHomeMail) {
          state.isHomeMail = true;
          if (cbHomeMail) cbHomeMail.checked = true;
          Toast.show("Inserts require Home Address mailing, so Home Address Mail was enabled.", { type: "info" });
        }
        if (state.isSingleMail) {
          state.isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
          Toast.show("Inserts can’t be used with Single Address Mail, so Single Address Mail was turned off.", { type: "warn" });
        }
      } else {
        if (!state.isSingleMail && !state.isHomeMail && cbHasInserts.checked) {
          cbHasInserts.checked = false;
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }

  if (cbSingleMail) {
    cbSingleMail.addEventListener("change", () => {
      if (cbSingleMail.checked) {
        state.isSingleMail = true;
        if (state.isHomeMail) {
          state.isHomeMail = false;
          if (cbHomeMail) cbHomeMail.checked = false;
          Toast.show("Single Address Mail is exclusive, so Home Address Mail was turned off.", { type: "info" });
        }
        if (state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("Inserts aren’t supported with Single Address Mail, so Inserts were turned off.", { type: "warn" });
        }
      } else {
        state.isSingleMail = false;
        if (!state.isHomeMail && state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("No mailing method is selected, so Inserts were turned off.", { type: "info" });
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }

  if (cbHomeMail) {
    cbHomeMail.addEventListener("change", () => {
      if (cbHomeMail.checked) {
        if (state.isSingleMail) {
          state.isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
          Toast.show("Home Address Mail is exclusive with Single Address Mail, so Single Address Mail was turned off.", { type: "info" });
        }
        state.isHomeMail = true;
      } else {
        state.isHomeMail = false;
        if (!state.isSingleMail && state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
          Toast.show("No mailing method is selected, so Inserts were turned off.", { type: "info" });
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }
});
