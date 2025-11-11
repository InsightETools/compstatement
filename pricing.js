// Pricing Slider — full JavaScript
// Assumes the page has these elements/IDs present:
// #slider, #empInput, #grandTotal, #perEmployee, #perEmployeeNote, #toZero
// (optional display labels) #baseFee, #statementFee, #mailingFee
// Requires noUiSlider to be loaded on the page.

// === Easy slider config (change one line to set the max) ===
const SLIDER_MAX = 200; // e.g. 5000, 10000, 20000, 50000, etc.

// === Data source ===
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
    if (v === 0) return "0";
    if (Math.abs(v) >= 1000) {
      const k = v / 1000;
      const label = Number.isInteger(k) ? String(k) : k.toFixed(1).replace(/\.0$/, "");
      return `${label}k`;
    }
    return String(v);
  };

  // ----- Fetch JSON & map to fees/counters -----
  let FEES = { base: 0, statement: 0, mailing: 0 };
  let JSON_COUNT = 0; // raw count from JSON (statementCount)
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Required fees
    FEES.base = toNum(data.baseFee);
    FEES.statement = toNum(data.statementFee);

    // Mailing selection (extend if you add more modes)
    if (data.isHomeMail) FEES.mailing = toNum(data.homeAddressMailFee);
    else if (data.isSingleMail) FEES.mailing = toNum(data.singleAddressMailFee);
    else FEES.mailing = 0;

    // Employees controlled by JSON
    JSON_COUNT = clamp(Math.floor(toNum(data.statementCount)), 0, Number.MAX_SAFE_INTEGER);
  } catch (err) {
    console.error("Failed to load pricing JSON:", err);
    // Keep defaults (all zeros)
  }

  // Reflect fees in UI labels (if present)
  if (baseFeeText) baseFeeText.textContent = fmtUSD(FEES.base);
  if (statementFeeText) statementFeeText.textContent = fmtUSD(FEES.statement);
  if (mailingFeeText) mailingFeeText.textContent = fmtUSD(FEES.mailing);

  // ----- Slider init (range uses SLIDER_MAX everywhere) -----
  const startVal = clamp(JSON_COUNT, 0, SLIDER_MAX);
  noUiSlider.create(sliderEl, {
    range: { min: 0, max: SLIDER_MAX },
    start: startVal,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      // 11 evenly spaced pips: 0%, 10%, ..., 100%
      values: Array.from({ length: 11 }, (_, i) => Math.round((SLIDER_MAX / 10) * i)),
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

  // Keep the input’s max in sync with the slider
  if (empInputEl) empInputEl.max = String(SLIDER_MAX);

  // ----- Calculation -----
  function recalc(raw) {
    const n = clamp(Math.round(toNum(raw)), 0, SLIDER_MAX);
    const perStatement = FEES.statement + FEES.mailing;
    const grandTotal = n * perStatement + FEES.base;

    // Sync input (without fighting typing feedback loops)
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
  if (empInputEl) empInputEl.value = String(startVal);
  recalc(startVal);

  // Slider -> totals
  sliderEl.noUiSlider.on("update", (vals) => recalc(vals[0]));

  // Input -> slider (live)
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      // Allow empty as a transient state; treat as 0 for calc/slider
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(0);
        return;
      }
      let v = clamp(Math.floor(toNum(empInputEl.value)), 0, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    });
  }

  // Reset -> back to the JSON value (clamped within current SLIDER_MAX)
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(clamp(JSON_COUNT, 0, SLIDER_MAX));
    });
  }
});
