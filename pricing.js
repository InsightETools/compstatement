// Full JavaScript — pricing slider w/ JSON loading, conditional fees, checkboxes,
// dynamic min/max, and auto-expand max. Now GUARANTEED that any expanded max
// is immediately reflected in the slider (handle position + pips + aria).
//
// DOM IDs required:
//  #slider, #empInput, #grandTotal, #perEmployee, #perEmployeeNote, #toZero
//  Checkboxes: #hasInserts, #isSingleMail, #isHomeMail
// Optional labels (auto-filled if present):
//  #baseFee, #statementFee, #singleAddressMailFee, #homeAddressMailFee, #singleAddressCanadaMailFee, #insertCost
//
// Requires noUiSlider (CSS + JS) to be included on the page.
const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {
  // ===== DOM =====
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const resetBtn = document.getElementById("toZero");

  const cbHasInserts = document.getElementById("hasInserts");
  const cbSingleMail = document.getElementById("isSingleMail");
  const cbHomeMail = document.getElementById("isHomeMail");

  const labelBaseFee = document.getElementById("baseFee");
  const labelStatementFee = document.getElementById("statementFee");
  const labelSingleMailFee = document.getElementById("singleAddressMailFee");
  const labelHomeMailFee = document.getElementById("homeAddressMailFee");
  const labelCanadaMailFee = document.getElementById("singleAddressCanadaMailFee");
  const labelInsertCost = document.getElementById("insertCost");

  // ===== Utils =====
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });
  const formatK = (v) =>
    Math.abs(v) >= 1000
      ? (Number.isInteger(v / 1000) ? v / 1000 : (v / 1000).toFixed(1).replace(/\.0$/, "")) + "k"
      : String(v);
  const makePips = (min, max) =>
    max - min <= 0
      ? [min]
      : Array.from({ length: 11 }, (_, i) =>
          Math.round(min + ((max - min) * i) / 10)
        );

  // ===== Load JSON =====
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    data = await res.json();
  } catch (err) {
    console.error("JSON LOAD ERROR:", err);
    data = {};
  }

  // ===== Extract values =====
  let baseFee = toNum(data.baseFee);
  let statementFee = toNum(data.statementFee);
  let singleAddressMailFee = toNum(data.singleAddressMailFee);
  let homeAddressMailFee = toNum(data.homeAddressMailFee);
  let insertCost = toNum(data.insertCost);

  let hasInserts = !!data.hasInserts;
  let isSingleMail = !!data.isSingleMail;
  let isHomeMail = !!data.isHomeMail;

  let SLIDER_MIN = toNum(data.sliderMin);
  let SLIDER_MAX = toNum(data.sliderMax);
  if (SLIDER_MAX < SLIDER_MIN) [SLIDER_MIN, SLIDER_MAX] = [SLIDER_MAX, SLIDER_MIN];

  let JSON_COUNT = clamp(toNum(data.statementCount), SLIDER_MIN, SLIDER_MAX);

  // ===== Labels =====
  if (labelBaseFee) labelBaseFee.textContent = fmtUSD(baseFee);
  if (labelStatementFee) labelStatementFee.textContent = fmtUSD(statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(singleAddressMailFee);
  if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(homeAddressMailFee);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(data.singleAddressCanadaMailFee));
  if (labelInsertCost) labelInsertCost.textContent = fmtUSD(insertCost);

  // ===== Checkboxes initial =====
  if (cbHasInserts) cbHasInserts.checked = hasInserts;
  if (cbSingleMail) cbSingleMail.checked = isSingleMail;
  if (cbHomeMail) cbHomeMail.checked = isHomeMail;

  // ===== Slider create =====
  noUiSlider.create(sliderEl, {
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
    start: JSON_COUNT,
    step: 1,
    connect: [true, false],
    pips: { mode: "values", values: makePips(SLIDER_MIN, SLIDER_MAX), density: 10 },
  });

  const renderPipLabels = () => {
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.dataset.value);
      pip.textContent = formatK(v);
      pip.style.cursor = "pointer";
      pip.onclick = () => sliderEl.noUiSlider.set(v);
    });
  };
  renderPipLabels();

  // Input bounds/value
  empInputEl.min = SLIDER_MIN;
  empInputEl.max = SLIDER_MAX;
  empInputEl.value = JSON_COUNT;

  // ===== Pricing =====
  const currentMailingFee = () => (isHomeMail ? homeAddressMailFee : isSingleMail ? singleAddressMailFee : 0);
  const perStatementCost = () => statementFee + currentMailingFee() + (hasInserts ? insertCost : 0);

  function recalc(rawCount) {
    const n = clamp(toNum(rawCount), SLIDER_MIN, SLIDER_MAX);
    const perStatement = perStatementCost();
    const grand = n * perStatement + baseFee;

    if (n > 0) {
      perEmployeeEl.textContent = fmtUSD(perStatement + baseFee / n);
    } else {
      perEmployeeEl.textContent = "—";
    }
    grandTotalEl.textContent = fmtUSD(grand);

    if (empInputEl.value !== String(n)) empInputEl.value = n;
  }

  // ===== Expand max AND reflect it in the slider =====
  function expandMaxTo(newMax, targetValue = null) {
    SLIDER_MAX = newMax;

    // Update input attributes
    empInputEl.max = SLIDER_MAX;

    // Update slider options (range + pips)
    sliderEl.noUiSlider.updateOptions(
      {
        range: { min: SLIDER_MIN, max: SLIDER_MAX },
        pips: {
          mode: "values",
          values: makePips(SLIDER_MIN, SLIDER_MAX),
          density: 10,
        },
      },
      // Fire 'set' event to ensure UI sync after update
      true
    );

    // Re-label pips
    renderPipLabels();

    // Critically: set the slider to the intended value so the handle reflects it.
    if (targetValue != null) {
      sliderEl.noUiSlider.set(targetValue);
    }
  }

  // ===== Initial paint =====
  recalc(JSON_COUNT);

  // Slider → recalc; expand if user hits/exceeds max (keep handle at value)
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = toNum(vals[0]);
    if (val >= SLIDER_MAX) {
      // Expand to val + 10, then explicitly set slider to `val` so the UI reflects it.
      expandMaxTo(val + 10, val);
    }
    recalc(val);
  });

  // Input → slider; expand if typed over max (keep handle at typed value)
  empInputEl.addEventListener("input", () => {
    if (empInputEl.value === "") {
      sliderEl.noUiSlider.set(SLIDER_MIN);
      return;
    }
    let v = Math.floor(toNum(empInputEl.value));
    if (v > SLIDER_MAX) {
      // New rule: set max to typed value + 10 and set slider to typed value.
      expandMaxTo(v + 10, v);
    } else {
      v = clamp(v, SLIDER_MIN, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    }
  });

  // Reset → back to JSON count (clamped to current bounds)
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sliderEl.noUiSlider.set(clamp(JSON_COUNT, SLIDER_MIN, SLIDER_MAX));
  });

  // Checkboxes
  cbHasInserts.addEventListener("change", () => {
    hasInserts = cbHasInserts.checked;
    recalc(sliderEl.noUiSlider.get());
  });

  cbSingleMail.addEventListener("change", () => {
    if (cbSingleMail.checked) {
      isSingleMail = true;
      isHomeMail = false;
      cbHomeMail.checked = false;
    } else {
      isSingleMail = false;
    }
    recalc(sliderEl.noUiSlider.get());
  });

  cbHomeMail.addEventListener("change", () => {
    if (cbHomeMail.checked) {
      isHomeMail = true;
      isSingleMail = false;
      cbSingleMail.checked = false;
    } else {
      isHomeMail = false;
    }
    recalc(sliderEl.noUiSlider.get());
  });
});
