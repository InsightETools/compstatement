// Pricing Slider — full JavaScript with conditional fees from JSON
// IDs expected on the page (create any you want to display):
// #slider, #empInput, #grandTotal, #perEmployee, #perEmployeeNote, #toZero
// Optional labels (values auto-filled if present, matched by JSON keys):
// #baseFee, #statementFee, #singleAddressMailFee, #homeAddressMailFee, #singleAddressCanadaMailFee,
// #insertCost, #statementCount, #isSingleMail, #isHomeMail, #hasInserts, #pricingLocked, #sliderMin, #sliderMax
//
// Requires noUiSlider (CSS+JS) loaded.

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {
  // ------- DOM refs -------
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  // Matching-id value labels (populate if they exist)
  const ids = {
    baseFee: document.getElementById("baseFee"),
    statementFee: document.getElementById("statementFee"),
    singleAddressMailFee: document.getElementById("singleAddressMailFee"),
    homeAddressMailFee: document.getElementById("homeAddressMailFee"),
    singleAddressCanadaMailFee: document.getElementById("singleAddressCanadaMailFee"),
    insertCost: document.getElementById("insertCost"),
    statementCount: document.getElementById("statementCount"),
    isSingleMail: document.getElementById("isSingleMail"),
    isHomeMail: document.getElementById("isHomeMail"),
    hasInserts: document.getElementById("hasInserts"),
    pricingLocked: document.getElementById("pricingLocked"),
    sliderMin: document.getElementById("sliderMin"),
    sliderMax: document.getElementById("sliderMax"),
  };

  // ------- Utils -------
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
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
    // 11 evenly spaced pips from min..max
    const steps = 10;
    const span = max - min;
    if (span <= 0) return [min];
    return Array.from({ length: steps + 1 }, (_, i) =>
      Math.round(min + (span * i) / steps)
    );
  };

  // ------- Load JSON -------
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("Failed to fetch JSON:", err);
    data = {};
  }

  // ------- Map values from JSON -------
  const baseFee = toNum(data.baseFee);
  const statementFee = toNum(data.statementFee);
  const singleAddressMailFee = toNum(data.singleAddressMailFee);
  const homeAddressMailFee = toNum(data.homeAddressMailFee);
  const singleAddressCanadaMailFee = toNum(data.singleAddressCanadaMailFee); // not used in math unless you add a flag
  const insertCost = toNum(data.insertCost);

  const isSingleMail = !!data.isSingleMail;
  const isHomeMail = !!data.isHomeMail;
  const hasInserts = !!data.hasInserts;
  const pricingLocked = !!data.pricingLocked;

  // dynamic slider bounds + initial count
  let SLIDER_MIN = toNum(data.sliderMin);
  let SLIDER_MAX = toNum(data.sliderMax);
  if (SLIDER_MAX < SLIDER_MIN) {
    const t = SLIDER_MIN;
    SLIDER_MIN = SLIDER_MAX;
    SLIDER_MAX = t;
  }
  const JSON_COUNT = clamp(Math.floor(toNum(data.statementCount)), SLIDER_MIN, SLIDER_MAX);

  // ------- Populate matching-id elements (if present) -------
  if (ids.baseFee) ids.baseFee.textContent = fmtUSD(baseFee);
  if (ids.statementFee) ids.statementFee.textContent = fmtUSD(statementFee);
  if (ids.singleAddressMailFee) ids.singleAddressMailFee.textContent = fmtUSD(singleAddressMailFee);
  if (ids.homeAddressMailFee) ids.homeAddressMailFee.textContent = fmtUSD(homeAddressMailFee);
  if (ids.singleAddressCanadaMailFee) ids.singleAddressCanadaMailFee.textContent = fmtUSD(singleAddressCanadaMailFee);
  if (ids.insertCost) ids.insertCost.textContent = fmtUSD(insertCost);

  if (ids.statementCount) ids.statementCount.textContent = String(JSON_COUNT);
  if (ids.isSingleMail) ids.isSingleMail.textContent = String(isSingleMail);
  if (ids.isHomeMail) ids.isHomeMail.textContent = String(isHomeMail);
  if (ids.hasInserts) ids.hasInserts.textContent = String(hasInserts);
  if (ids.pricingLocked) ids.pricingLocked.textContent = String(pricingLocked);
  if (ids.sliderMin) ids.sliderMin.textContent = String(SLIDER_MIN);
  if (ids.sliderMax) ids.sliderMax.textContent = String(SLIDER_MAX);

  // ------- Determine conditional per-statement fees -------
  // Mailing fee rule:
  // - if isHomeMail === true -> use homeAddressMailFee
  // - else if isSingleMail === true -> use singleAddressMailFee
  // - else 0
  const mailingFee =
    isHomeMail ? homeAddressMailFee :
    isSingleMail ? singleAddressMailFee : 0;

  // Insert cost rule:
  // - add insertCost if hasInserts === true
  const perStatement = statementFee + mailingFee + (hasInserts ? insertCost : 0);

  // ------- Slider init (using JSON min/max and count) -------
  noUiSlider.create(sliderEl, {
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
    start: JSON_COUNT,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      values: makePips(SLIDER_MIN, SLIDER_MAX),
      density: 10,
    },
  });

  // Pip labels + click
  sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.textContent = formatK(v);
    pip.style.cursor = "pointer";
    pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
  });

  // Keep input bounds aligned & set starting value
  if (empInputEl) {
    empInputEl.min = String(SLIDER_MIN);
    empInputEl.max = String(SLIDER_MAX);
    empInputEl.value = String(JSON_COUNT);
  }

  // ------- Calculation -------
  function recalc(rawCount) {
    const n = clamp(Math.round(toNum(rawCount)), SLIDER_MIN, SLIDER_MAX);

    // Grand total = employees * perStatement + baseFee
    const grandTotal = n * perStatement + baseFee;

    // Per-employee price = perStatement + (baseFee / n) when n > 0, else "—"
    if (n > 0) {
      const perEmployee = perStatement + baseFee / n;
      perEmployeeEl.textContent = fmtUSD(perEmployee);
      if (perEmployeeNoteEl) perEmployeeNoteEl.style.display = "none";
    } else {
      perEmployeeEl.textContent = "—";
      if (perEmployeeNoteEl) {
        perEmployeeNoteEl.style.display = "block";
        perEmployeeNoteEl.textContent = fmtUSD(baseFee);
      }
    }

    grandTotalEl.textContent = fmtUSD(grandTotal);

    // Keep the input synced
    if (empInputEl && empInputEl.value !== String(n)) {
      empInputEl.value = String(n);
    }
  }

  // Initial paint
  recalc(JSON_COUNT);

  // Slider -> totals
  sliderEl.noUiSlider.on("update", (vals) => recalc(vals[0]));

  // Input -> slider (live)
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(SLIDER_MIN);
        return;
      }
      const v = clamp(Math.floor(toNum(empInputEl.value)), SLIDER_MIN, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    });
  }

  // Reset -> JSON statementCount
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(JSON_COUNT);
    });
  }
});
