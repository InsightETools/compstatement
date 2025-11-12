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

function buildFetchUrlFromParams() {
  const p = getParams();
  const key    = p.get("key");
  const cpid   = p.get("cpid");
  const yr     = p.get("yr");
  const ck     = p.get("ck");
  const ek     = p.get("ek") || "EmployeeA";
  const layout = p.get("layout");

  const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";

  if (!key) {
    return `https://compstatementdemo.netlify.app/data/${ek}.json`;
  }

  const qp = new URLSearchParams({
    usecors: "1",
    key, cpid, yr, ck, ek, layout,
  });

  return `${baseUrl}?${qp.toString()}`;
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
