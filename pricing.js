// Pricing Slider — full JavaScript (dynamic min/max from JSON)
// Requires noUiSlider on the page and these IDs in your markup:
// #slider, #empInput, #grandTotal, #perEmployee, #perEmployeeNote, #toZero
// Optional display labels: #baseFee, #statementFee, #mailingFee

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {
  // ----- DOM refs -----
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  const baseFeeText = document.getElementById("baseFee");
  const statementFeeText = document.getElementById("statementFee");
  const mailingFeeText = document.getElementById("mailingFee");

  // ----- Utils -----
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
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

  // ----- Fetch JSON & map to config/fees -----
  let FEES = { base: 0, statement: 0, mailing: 0 };
  let JSON_COUNT = 0;      // statementCount
  let SLIDER_MIN = 0;      // from json.sliderMin
  let SLIDER_MAX = 10000;  // from json.sliderMax

  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Dynamic slider bounds
    SLIDER_MIN = Number.isFinite(toNum(data.sliderMin)) ? toNum(data.sliderMin) : 0;
    SLIDER_MAX = Number.isFinite(toNum(data.sliderMax)) ? toNum(data.sliderMax) : 10000;
    if (SLIDER_MAX < SLIDER_MIN) {
      // swap if accidentally inverted
      const t = SLIDER_MIN;
      SLIDER_MIN = SLIDER_MAX;
      SLIDER_MAX = t;
    }

    // Fees
    FEES.base = toNum(data.baseFee);
    FEES.statement = toNum(data.statementFee);

    // Mailing choice (extend as needed)
    if (data.isHomeMail) FEES.mailing = toNum(data.homeAddressMailFee);
    else if (data.isSingleMail) FEES.mailing = toNum(data.singleAddressMailFee);
    else FEES.mailing = 0;

    // Employee count (statementCount)
    JSON_COUNT = clamp(Math.floor(toNum(data.statementCount)), SLIDER_MIN, SLIDER_MAX);
  } catch (err) {
    console.error("Failed to load pricing JSON:", err);
    // keep defaults
    JSON_COUNT = SLIDER_MIN; // safe start
  }

  // Reflect fees in UI (optional)
  if (baseFeeText) baseFeeText.textContent = fmtUSD(FEES.base);
  if (statementFeeText) statementFeeText.textContent = fmtUSD(FEES.statement);
  if (mailingFeeText) mailingFeeText.textContent = fmtUSD(FEES.mailing);

  // ----- Slider init (uses dynamic min/max) -----
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

  // Pip labels (clickable)
  sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.textContent = formatK(v);
    pip.style.cursor = "pointer";
    pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
  });

  // Keep input min/max aligned with slider bounds
  if (empInputEl) {
    empInputEl.min = String(SLIDER_MIN);
    empInputEl.max = String(SLIDER_MAX);
    empInputEl.value = String(JSON_COUNT);
  }

  // ----- Calculation -----
  function recalc(raw) {
    const n = clamp(Math.round(toNum(raw)), SLIDER_MIN, SLIDER_MAX);
    const perStatement = FEES.statement + FEES.mailing;
    const grandTotal = n * perStatement + FEES.base;

    // Sync input (without fighting typing)
    if (empInputEl && empInputEl.value !== String(n)) {
      empInputEl.value = String(n);
    }

    if (n > 0) {
      const perEmployee = perStatement + FEES.base / n;
      perEmployeeEl.textContent = fmtUSD(perEmployee);
      if (perEmployeeNoteEl) perEmployeeNoteEl.style.display = "none";
    } else {
      perEmployeeEl.textContent = "—";
      if (perEmployeeNoteEl) {
        perEmployeeNoteEl.style.display = "block";
        perEmployeeNoteEl.textContent = fmtUSD(FEES.base);
      }
    }

    grandTotalEl.textContent = fmtUSD(grandTotal);
  }

  // Initial paint from JSON count
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
      let v = clamp(Math.floor(toNum(empInputEl.value)), SLIDER_MIN, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    });
  }

  // Reset -> back to JSON statementCount (respecting current bounds)
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(clamp(JSON_COUNT, SLIDER_MIN, SLIDER_MAX));
    });
  }
});
