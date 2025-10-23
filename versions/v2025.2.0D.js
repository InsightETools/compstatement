let isLoaded = false;
console.log(isLoaded === false ? "Initializing" : "Initialize Failed");

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const getParams = () => new URLSearchParams(window.location.search);

const setParam = (key, value) => {
  const p = getParams();
  if (value === null || value === undefined) p.delete(key);
  else p.set(key, value);
  history.replaceState(null, "", `${location.pathname}?${p.toString()}${location.hash}`);
};

const toggleActive = (id, isActive) => $("#" + id)?.classList.toggle("active", !!isActive);

const debounced = (fn, ms = 60) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

let currentFetchController = null;

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

const _jsonDisabled = new Map();
const _designDisabled = new Map();
const _allKnownButtons = new Set();

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

function computeDesignConstraintsAndApply() {
  _designDisabled.clear();

  const params = getParams();
  const design = params.get("design") || "1";
  const isDesign2 = design === "2";

  const forceOffIds = [
    "layout1","layout2",
    "cover0","cover1","cover2","cover3","noCover",
    "header1","header2"
  ];
  forceOffIds.forEach(id => { if (isDesign2) _designDisabled.set(id, true); });

  _applyEffectiveButtonStates();
}

const debouncedReloadFromParams = debounced(() => window.reloadFromParams(), 60);

window.reloadFromParams = async () => {
  $("#loader")?.classList.remove("finished");

  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();

  const fetchUrl = buildFetchUrlFromParams();

  try {
    const res = await fetch(fetchUrl, { signal: currentFetchController.signal });
    const data = await res.json();

//Rest of code goes here based on data
    
})();
