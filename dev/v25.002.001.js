//------LIBRARY------//

console.log("Library v25.002.001");

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

    if (isNullishByRule(val)) {
      if (wrapper) {
        if (sliderEl && wrapper.contains(sliderEl)) {
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

    if (wrapper) wrapper.style.display = "";
    el.style.display = "";
    el.textContent = isBlank(val) ? "Unknown" : String(val);
  });
}

function _collectButtons() {
  document.querySelectorAll('button[id], [role="button"][id], a.button[id], .btn[id]').forEach(el => {
    _allKnownButtons.add(el.id);
  });
  [
    "design1","design2","layout1","layout2","header1","header2",
    "cover0","cover1","cover2","cover3","noCover","benefitsPage","companyPage"
  ].forEach(id => { if (document.getElementById(id)) _allKnownButtons.add(id); });
}

function _setBtnDisabled(id, disabled) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("disabled", !!disabled);
  el.toggleAttribute("disabled", !!disabled);
  el.setAttribute("aria-disabled", String(!!disabled));
}

function _applyEffectiveButtonStates() {
  _allKnownButtons.forEach((id) => {
    const jsonDis = !!_jsonDisabled.get(id);
    const desDis  = !!_designDisabled.get(id);
    _setBtnDisabled(id, jsonDis || desDis);
  });
}

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

  if (st.sliderMax < st.sliderMin){ const t = st.sliderMin; st.sliderMin = st.sliderMax; st.sliderMax = t; }
  st.statementCount = Math.min(Math.max(st.statementCount, st.sliderMin), st.sliderMax);

  return st;
}

function numTo36(n){ return Math.round(Number(n)).toString(36); }
function from36(s, def=0){ const n = parseInt(s, 36); return Number.isFinite(n) ? n : def; }

function toBase64Url(str){
  return btoa(str).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64Url(b64u){
  const pad = b64u.length % 4 === 2 ? "==" : b64u.length % 4 === 3 ? "=" : "";
  const b64 = b64u.replace(/-/g,'+').replace(/_/g,'/') + pad;
  return atob(b64);
}

// SharedDataFetcher: Simplified data fetching
window.SharedDataFetcher = (() => {
  const getParams = () => new URLSearchParams(window.location.search);

  function buildFetchUrl() {
    const params = getParams();
    const key = params.get("key");
    const cpid = params.get("cpid");
    const yr = params.get("yr");
    const ck = params.get("ck");
    const ek = params.get("ek") || "EmployeeA";
    const layout = params.get("layout");

    const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";

    if (!key) {
      return `https://compstatementdemo.netlify.app/data/${ek}.json`;
    }

    const queryParams = new URLSearchParams({
      usecors: "1",
      key, cpid, yr, ck, ek, layout,
    });

    return `${baseUrl}?${queryParams.toString()}`;
  }

  async function fetchData(options = {}) {
    const { signal = null } = options;
    const url = buildFetchUrl();

    const fetchOptions = { method: "GET" };
    if (signal) fetchOptions.signal = signal;

    const response = await fetch(url, fetchOptions);
    const data = await response.json();
    console.log(data);
    return data;
  }

  return { buildFetchUrl, fetchData };
})();

function buildFetchUrlFromParams() {
  const p = getParams();
  const key = p.get("key");
  const cpid = p.get("cpid");
  const yr = p.get("yr");
  const ck = p.get("ck");
  const ek = p.get("ek") || "EmployeeA";
  const layout = p.get("layout");

  const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";

  if (!key) {
    return `https://compstatementdemo.netlify.app/data/${ek}.json`;
  }

  return `${baseUrl}?usecors=1&key=${key}&cpid=${cpid}&yr=${yr}&ck=${ck}&ek=${ek}&layout=${layout}`;
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

window.applyOverflow = function () {
  document.querySelectorAll('[item="page"]').forEach((page) => {
    const lineEls = page.querySelectorAll(
      ".standardtablelinelabel, .standardtablevalue, .standardtablesubtotallabel, .standardtablesubtotalvalue"
    );
    const blockEls = page.querySelectorAll(
      ".standardtablesubtotalwrapper, .standardtablecategory"
    );

    const maxFontSize = 10, minFontSize = 8;
    const maxLineHeight = 12, minLineHeight = 8;
    const maxBlockSpacing = 5, minBlockSpacing = 2;

    let fontSize = maxFontSize;
    let lineHeight = maxLineHeight;
    let blockSpacing = maxBlockSpacing;

    const applyStyles = () => {
      lineEls.forEach((el) => {
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${lineHeight}px`;
      });
      blockEls.forEach((el) => {
        el.style.paddingTop = `${blockSpacing}px`;
        el.style.paddingBottom = `${blockSpacing}px`;
      });
    };

    const isOverflowing = () => {
      const pageRect = page.getBoundingClientRect();
      return Array.from(page.children).some((child) => {
        const r = child.getBoundingClientRect();
        return r.bottom > pageRect.bottom || r.right > pageRect.right;
      });
    };

    applyStyles();
    while (
      isOverflowing() &&
      (fontSize > minFontSize || lineHeight > minLineHeight || blockSpacing > minBlockSpacing)
    ) {
      if (fontSize > minFontSize) fontSize -= 1;
      if (lineHeight > minLineHeight) lineHeight -= 1;
      if (blockSpacing > minBlockSpacing) blockSpacing -= 1;
      applyStyles();
    }
  });
};

function computeDesignConstraintsAndApply() {
  _designDisabled.clear();

  const params = getParams();
  const design = params.get("design") || "1";
  const isDesign2 = design === "2";

  const hasKey = params.has("key");
  const isPreview = params.has("preview");

  if (!hasKey && !isPreview) {
    $("#editButton")?.classList.add("hidden");
  }

  if (!hasKey) {
    $("#preparedFor")?.classList.add("hidden");
  }

  const forceOffIds = [
    "layout1","layout2",
    "cover0","cover1","cover2","cover3","noCover",
    "header1","header2"
  ];
  forceOffIds.forEach(id => { if (isDesign2) _designDisabled.set(id, true); });

  _applyEffectiveButtonStates();
}

window.reloadFromParams = async () => {
  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();

  try {
    const data = await window.SharedDataFetcher.fetchData({ 
      signal: currentFetchController.signal 
    });

    await renderAll(data);

    if (typeof window.applyOverflow === "function") window.applyOverflow();

    isLoaded = true;
    console.log("Finished");
    setTimeout(() => {
      $("#loader")?.classList.add("finished");
    }, 3000);
    
  } catch (err) {
    if (err.name !== "AbortError") {
      const errorCheck = err.message?.includes?.("Unexpected token");
      console.error("Library: Error loading data:", err);
      alert(errorCheck ? "No User Found" : err);
    } else {
      console.log("Library: Fetch request aborted");
    }
  } finally {
    currentFetchController = null;
  }
};

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function formatCurrency(value, element = null, decimalFlag = null, isCurrency = true) {
  if (value == null || isNaN(value)) return isCurrency ? "$0.00" : "0";
  const isDynamic = element?.getAttribute?.("number") === "dynamic";
  const isWhole =
    decimalFlag === false ||
    (!decimalFlag && isDynamic === false) ||
    element?.getAttribute?.("number") === "whole";
  const formatted = parseFloat(value).toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
  return isCurrency ? `$${formatted}` : formatted;
}

function getSelectionsFromParams() {
  const p = getParams();
  return {
    design: p.get("design") || "1",
    layout: p.get("layout") || "1",
    header: p.get("header") || "1",
    cover:  (p.get("cover") ?? "0"),
    benefits: p.get("benefits") === "true",
    company:  p.get("company") === "true",
  };
}

function computeStatementTotal(data, sel) {
  const pricing = data?.pricing ?? {};
  let total = 0;

  const add = (val) => total += (Number(val) || 0);

  add(pricing.base);

  if (pricing.design && sel.design in pricing.design) add(pricing.design[sel.design]);
  if (pricing.layout && sel.layout in pricing.layout) add(pricing.layout[sel.layout]);
  if (pricing.header && sel.header in pricing.header) add(pricing.header[sel.header]);

  const coverKey = sel.cover === "false" ? "false" : sel.cover;
  if (pricing.cover && coverKey in pricing.cover) add(pricing.cover[coverKey]);

  if (pricing.toggles) {
    if (sel.benefits && "benefits" in pricing.toggles) add(pricing.toggles.benefits);
    if (sel.company && "company" in pricing.toggles) add(pricing.toggles.company);
  }

  return total;
}

function renderPrice(data) {
  if (!data) return;
  const sel = getSelectionsFromParams();
  const total = computeStatementTotal(data, sel);
  document.querySelectorAll('[details="price"]').forEach((el) => {
    el.textContent = formatCurrency(total, el, true, true);
  });
}

function renderDonutChart({ chartId, categoryGroup, containerSelector }) {
  const chartContainer = document.getElementById(chartId);
  const legendContainer = document.querySelector(containerSelector);
  if (!chartContainer || !legendContainer || !Array.isArray(categoryGroup)) return;

  legendContainer.innerHTML = "";
  let start = 0;
  const gradientParts = [];

  categoryGroup.forEach((category) => {
    const value = parseFloat(category.value);
    const color = hexToRgb(category.color);
    const end = start + value;

    const itemDiv = document.createElement("div");
    itemDiv.setAttribute("category", "item");
    itemDiv.classList.add("moduledonutindex");

    const iconDiv = document.createElement("div");
    iconDiv.setAttribute("category", "icon");
    iconDiv.classList.add("moduleindexcategorywrapper");

    const chartColorDiv = document.createElement("div");
    chartColorDiv.classList.add("chart-color");
    chartColorDiv.style.backgroundColor = color;

    const nameDiv = document.createElement("div");
    nameDiv.setAttribute("category", "name");
    nameDiv.classList.add("componentsmalllabel");
    nameDiv.textContent = category.label;

    const valueDiv = document.createElement("div");
    valueDiv.setAttribute("category", "value");
    valueDiv.classList.add("moduledonutindexvalue");
    valueDiv.textContent = value + "%";

    iconDiv.appendChild(chartColorDiv);
    iconDiv.appendChild(nameDiv);
    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(valueDiv);
    legendContainer.appendChild(itemDiv);

    gradientParts.push(`${color} ${start}% ${end}%`);
    start = end;
  });

  chartContainer.style.background = `conic-gradient(${gradientParts.join(", ")})`;
}

function updateModeDisplay(mode) {
  const exploreEls = document.querySelectorAll('[mode="explore"]');
  const pricingEls = document.querySelectorAll('[mode="pricing"]');

  if (mode === "explore") {
    exploreEls.forEach(el => el.style.display = "");
    pricingEls.forEach(el => el.style.display = "none");
  } else if (mode === "pricing") {
    exploreEls.forEach(el => el.style.display = "none");
    pricingEls.forEach(el => el.style.display = "");
  }

  const params = new URLSearchParams(window.location.search);
  params.set("mode", mode);
  const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  history.replaceState(null, "", newUrl);
}

document.addEventListener("DOMContentLoaded", () => {
  const exploreToggle = document.getElementById("toggleExplore");
  const pricingToggle = document.getElementById("togglePricing");

  const params = new URLSearchParams(window.location.search);
  const urlMode = params.get("mode");
  const initialMode = urlMode === "pricing" ? "pricing" : "explore";

  if (initialMode === "pricing") {
    pricingToggle.checked = true;
  } else {
    exploreToggle.checked = true;
  }
  updateModeDisplay(initialMode);

  [exploreToggle, pricingToggle].forEach(toggle => {
    toggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        const newMode = e.target.id === "toggleExplore" ? "explore" : "pricing";
        updateModeDisplay(newMode);
      }
    });
  });
});

