const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

/* ============================== Toast (centered) ============================== */
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
        display:grid;grid-template-columns:20px 1fr auto;gap:10px;align-items:start;
        opacity:0;transform:translateY(8px);transition:opacity .2s ease,transform .2s ease;
      }
      .toast.show{opacity:1;transform:translateY(0)}
      .toast__icon{width:20px;height:20px;margin-top:1px}
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
  //const iconFor = (type) => (type === "warn" ? "⚠️" : type === "error" ? "⛔" : "ℹ️");
  const iconFor = (type) => (type === "warn" ? "⚠️" : type === "error" ? "⚠️" : "⚠️");
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

/* ===================== JSON -> DOM field binder (protected) =================== */
/** For protected fields: blank -> "Unknown"; null -> hide wrapper */
function applyJsonFieldsStrict(json, fields) {
  const isBlank = (v) => typeof v === "string" && v.trim() === "";
  const isNullishByRule = (v) =>
    v === null || (typeof v === "string" && v.trim().toLowerCase() === "null");

  const sliderEl = document.getElementById("slider");

  fields.forEach((key) => {
    const el = document.getElementById(key);
    const wrapper = document.getElementById(`${key}Wrapper`);
    if (!el) return;

    const val = json?.[key];

    // Nullish => hide wrapper/element UNLESS it would also hide the slider
    if (isNullishByRule(val)) {
      if (wrapper) {
        if (sliderEl && wrapper.contains(sliderEl)) {
          // Safety: don't hide the slider's container
          wrapper.style.display = "";
          el.style.display = "";
          el.textContent = "Unknown";
        } else {
          wrapper.style.display = "none";
        }
      } else {
        if (sliderEl && el.contains(sliderEl)) {
          el.style.display = "";
          el.textContent = "Unknown";
        } else {
          el.style.display = "none";
        }
      }
      return;
    }

    // Not null => ensure visible
    if (wrapper) wrapper.style.display = "";
    el.style.display = "";

    // Blank => Unknown
    el.textContent = isBlank(val) ? "Unknown" : String(val);
  });
}

/* ======================= Short Share Param Codec (1 param) ====================*/

const K = {
  baseFee:               "bf",
  statementFee:          "sf",
  singleAddressMailFee:  "sm",
  homeAddressMailFee:    "hm",
  insertCost:            "ic",
  sliderMin:             "mn",
  sliderMax:             "mx",
  statementCount:        "n",
  flags:                 "f",
  version:               "v"
};

const FLAG_BITS = {
  isSingleMail:  1 << 0, // 1
  isHomeMail:    1 << 1, // 2
  hasInserts:    1 << 2, // 4
  pricingLocked: 1 << 3  // 8
};

function numTo36(n){ return Math.round(Number(n)).toString(36); }
function from36(s, def=0){ const n = parseInt(s, 36); return Number.isFinite(n) ? n : def; }

// Base64URL helpers
function toBase64Url(str){
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64Url(b64u){
  const pad = b64u.length % 4 === 2 ? "==" : b64u.length % 4 === 3 ? "=" : "";
  const b64 = b64u.replace(/-/g,'+').replace(/_/g,'/') + pad;
  return atob(b64);
}

function packFlags(s){
  let f = 0;
  if (s.isSingleMail)  f |= FLAG_BITS.isSingleMail;
  if (s.isHomeMail)    f |= FLAG_BITS.isHomeMail;
  if (s.hasInserts)    f |= FLAG_BITS.hasInserts;
  if (s.pricingLocked) f |= FLAG_BITS.pricingLocked;
  return f;
}
function unpackFlags(f, s){
  s.isSingleMail  = !!(f & FLAG_BITS.isSingleMail);
  s.isHomeMail    = !!(f & FLAG_BITS.isHomeMail);
  s.hasInserts    = !!(f & FLAG_BITS.hasInserts);
  s.pricingLocked = !!(f & FLAG_BITS.pricingLocked);
  return s;
}

/** Encode only differences vs defaults into ?s= */
function encodeShare(state, defaults){
  const out = {[K.version]: 1};

  const numFields = [
    ["baseFee","bf"], ["statementFee","sf"], ["singleAddressMailFee","sm"],
    ["homeAddressMailFee","hm"], ["insertCost","ic"],
    ["sliderMin","mn"], ["sliderMax","mx"], ["statementCount","n"]
  ];
  for (const [key, sk] of numFields){
    const v = Number(state[key]);
    const dv = Number(defaults[key]);
    if (!Number.isFinite(v) || !Number.isFinite(dv)) continue;
    if (v !== dv) out[sk] = numTo36(v);
  }

  const fState = packFlags(state);
  const fDef   = packFlags(defaults);
  if (fState !== fDef) out[K.flags] = numTo36(fState);

  return toBase64Url(JSON.stringify(out));
}

/** Decode ?s= back to state merged with defaults */
function decodeShare(s, defaults){
  let obj = {};
  try {
    obj = JSON.parse(fromBase64Url(s));
  } catch(e){
    console.warn("Bad share payload; using defaults.", e);
    return {...defaults};
  }
  const st = {...defaults};

  const rd = (sk, key) => {
    if (obj[sk] !== undefined) st[key] = from36(obj[sk], defaults[key]);
  };
  rd("bf","baseFee"); rd("sf","statementFee"); rd("sm","singleAddressMailFee");
  rd("hm","homeAddressMailFee"); rd("ic","insertCost");
  rd("mn","sliderMin"); rd("mx","sliderMax"); rd("n","statementCount");

  if (obj[K.flags] !== undefined){
    const f = from36(obj[K.flags], packFlags(defaults));
    unpackFlags(f, st);
  }

  // normalize
  if (st.sliderMax < st.sliderMin){ const t = st.sliderMin; st.sliderMin = st.sliderMax; st.sliderMax = t; }
  st.statementCount = Math.min(Math.max(st.statementCount, st.sliderMin), st.sliderMax);

  return st;
}

/* =============================== App Logic ================================== */

document.addEventListener("DOMContentLoaded", async () => {
  // Basic DOM refs
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
    // PROTECTED JSON-ONLY fields (for DOM display)
    payrollSystem: json.payrollSystem ?? "",
    payrollDataMethod: json.payrollDataMethod ?? "",
    supplementalCostMethod: json.supplementalCostMethod ?? "",
    targetDate: json.targetDate ?? ""
  };

  // SHARE MODE detection (if ?s exists, use it)
  const url = new URL(location.href);
  const sharePayload = url.searchParams.get("s");
  const shareMode = !!sharePayload;

  // State from share or defaults
  let state = shareMode ? decodeShare(sharePayload, defaults) : { ...defaults };

  // Business rules
  if (state.hasInserts) {
    state.isHomeMail = true;
    state.isSingleMail = false;
  }
  if (!state.isSingleMail && !state.isHomeMail) {
    state.hasInserts = false;
  }

  // If not share mode, write a compact default s
  if (!shareMode) {
    url.searchParams.delete("s");
    url.searchParams.set("s", encodeShare(state, defaults));
    history.replaceState(null, "", url);
  }

  // Immutable for reset
  const ORIG = { ...state };

  // Apply protected fields to DOM from JSON (strict rules)
  applyJsonFieldsStrict(defaults, [
    "payrollSystem",
    "payrollDataMethod",
    "supplementalCostMethod",
    "targetDate"
  ]);

  // pricingLocked visuals
  document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
    el.style.display = state.pricingLocked ? "none" : "";
  });
  if (state.pricingLocked) {
    const singleW = document.getElementById("isSingleMailWrapper");
    const homeW   = document.getElementById("isHomeMailWrapper");
    const insW    = document.getElementById("hasInsertsWrapper");
    if (singleW && state.isSingleMail === false) singleW.style.display = "none";
    if (homeW   && state.isHomeMail   === false) homeW.style.display   = "none";
    if (insW    && state.hasInserts   === false) insW.style.display    = "none";
  }

  // Optional fees display
  if (labelBaseFee)       labelBaseFee.textContent = fmtUSD(state.baseFee);
  if (labelStatementFee)  labelStatementFee.textContent = fmtUSD(state.statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(state.singleAddressMailFee);
  if (labelHomeMailFee)   labelHomeMailFee.textContent = fmtUSD(state.homeAddressMailFee);
  if (labelInsertCost)    labelInsertCost.textContent = fmtUSD(state.insertCost);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(json.singleAddressCanadaMailFee));

  // Initialize checkboxes
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

  function syncShareParam() {
    const u = new URL(location.href);
    u.searchParams.set("s", encodeShare(state, defaults));
    history.replaceState(null, "", u);
  }

  function recalc(rawCount) {
    const n = clamp(Math.round(Number(rawCount)), state.sliderMin, state.sliderMax);
    const perEmp = (n > 0) ? (perStatementCost() + state.baseFee / n) : perStatementCost();
    const grand  = state.baseFee + perStatementCost() * n;

    if (perEmployeeEl) perEmployeeEl.textContent = fmtUSD(perEmp);
    if (grandTotalEl)  grandTotalEl.textContent  = fmtUSD(grand);
    if (empInputEl && empInputEl.value !== String(n)) empInputEl.value = n;

    state.statementCount = n;
    syncShareParam();
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
    syncShareParam();
  }

  // Initial paint
  recalc(state.statementCount);

  // Slider update (no expand; show toast at max & autofocus input)
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

  // Input -> expand if above max (typed+10)
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

  // Reset (to ORIG)
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

      // slider & input
      updateSliderRange(state.sliderMin, state.sliderMax, state.statementCount);
      if (empInputEl) {
        empInputEl.min = state.sliderMin;
        empInputEl.max = state.sliderMax;
        empInputEl.value = state.statementCount;
      }

      maxToastShown = false;
      recalc(state.statementCount);
    });
  }

  // Checkboxes + rules + share sync
  const onStateChanged = () => syncShareParam();

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
