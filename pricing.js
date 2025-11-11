// Full JavaScript — pricing slider with JSON config, auto-expand,
// checkbox logic, input sync, and TRUE reset (min/max restored).
// NO NOTE ELEMENT HANDLING.

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {

  // ----- DOM -----
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
  const labelInsertCost = document.getElementById("insertCost");

  // ----- Utils -----
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
    Array.from({ length: 11 }, (_, i) =>
      Math.round(min + ((max - min) * i) / 10)
    );

  const renderPips = () => {
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.dataset.value);
      pip.textContent = formatK(v);
      pip.style.cursor = "pointer";
      pip.onclick = () => sliderEl.noUiSlider.set(v);
    });
  };

  // ----- Fetch JSON -----
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    console.error("Error loading JSON:", e);
    data = {};
  }

  // ----- Extract values -----
  const baseFee = toNum(data.baseFee);
  const statementFee = toNum(data.statementFee);
  const mailSingle = toNum(data.singleAddressMailFee);
  const mailHome = toNum(data.homeAddressMailFee);
  const insertCost = toNum(data.insertCost);

  // ORIGINAL RESET VALUES
  const ORIG = {
    hasInserts: !!data.hasInserts,
    isSingleMail: !!data.isSingleMail,
    isHomeMail: !!data.isHomeMail,
    sliderMin: toNum(data.sliderMin),
    sliderMax: toNum(data.sliderMax),
    statementCount: toNum(data.statementCount)
  };

  // Normalize min/max
  if (ORIG.sliderMax < ORIG.sliderMin) {
    [ORIG.sliderMin, ORIG.sliderMax] = [ORIG.sliderMax, ORIG.sliderMin];
  }
  ORIG.statementCount = clamp(ORIG.statementCount, ORIG.sliderMin, ORIG.sliderMax);

  // MUTABLE state
  let hasInserts = ORIG.hasInserts;
  let isSingleMail = ORIG.isSingleMail;
  let isHomeMail = ORIG.isHomeMail;
  let SLIDER_MIN = ORIG.sliderMin;
  let SLIDER_MAX = ORIG.sliderMax;

  // ----- Labels -----
  if (labelBaseFee) labelBaseFee.textContent = fmtUSD(baseFee);
  if (labelStatementFee) labelStatementFee.textContent = fmtUSD(statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(mailSingle);
  if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(mailHome);
  if (labelInsertCost) labelInsertCost.textContent = fmtUSD(insertCost);

  // ----- Checkboxes initial -----
  cbHasInserts.checked = hasInserts;
  cbSingleMail.checked = isSingleMail;
  cbHomeMail.checked = isHomeMail;

  // ----- Create Slider -----
  noUiSlider.create(sliderEl, {
    range: { min: SLIDER_MIN, max: SLIDER_MAX },
    start: ORIG.statementCount,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      values: makePips(SLIDER_MIN, SLIDER_MAX),
      density: 10
    }
  });

  renderPips();

  // Input setup
  empInputEl.min = SLIDER_MIN;
  empInputEl.max = SLIDER_MAX;
  empInputEl.value = ORIG.statementCount;

  // ----- Pricing -----
  const mailingFee = () =>
    isHomeMail ? mailHome : isSingleMail ? mailSingle : 0;

  const perStatement = () =>
    statementFee + mailingFee() + (hasInserts ? insertCost : 0);

  function recalc(count) {
    const n = clamp(Math.round(toNum(count)), SLIDER_MIN, SLIDER_MAX);

    const perEmp = perStatement() + (n > 0 ? baseFee / n : 0);
    const grandTotal = baseFee + perStatement() * n;

    perEmployeeEl.textContent = fmtUSD(perEmp);
    grandTotalEl.textContent = fmtUSD(grandTotal);

    if (empInputEl.value !== String(n)) empInputEl.value = n;
  }

  // ----- Update slider min/max -----
  function updateSliderRange(min, max, setVal = null) {
    SLIDER_MIN = min;
    SLIDER_MAX = max;

    empInputEl.min = min;
    empInputEl.max = max;

    sliderEl.noUiSlider.updateOptions(
      {
        range: { min, max },
        pips: { mode: "values", values: makePips(min, max), density: 10 }
      },
      true
    );

    renderPips();

    if (setVal !== null) sliderEl.noUiSlider.set(setVal);
  }

  // Expand max
  function expandMax(newMax, value) {
    updateSliderRange(SLIDER_MIN, newMax, value);
  }

  // ----- Initial calc -----
  recalc(ORIG.statementCount);

  // ----- SLIDER → INPUT + EXPAND -----
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = toNum(vals[0]);
    if (val >= SLIDER_MAX) expandMax(val + 10, val);
    recalc(val);
  });

  // ----- INPUT → SLIDER + EXPAND -----
  empInputEl.addEventListener("input", () => {
    if (empInputEl.value === "") {
      sliderEl.noUiSlider.set(SLIDER_MIN);
      return;
    }

    let v = Math.floor(toNum(empInputEl.value));

    if (v > SLIDER_MAX) {
      expandMax(v + 10, v);
    } else {
      v = clamp(v, SLIDER_MIN, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    }
  });

// ----- CHECKBOXES -----
cbHasInserts.addEventListener("change", () => {
  hasInserts = cbHasInserts.checked;

  // If inserts turned on, single-address mail must be off
  if (hasInserts && isSingleMail) {
    isSingleMail = false;
    cbSingleMail.checked = false;
  }

  recalc(sliderEl.noUiSlider.get());
});

cbSingleMail.addEventListener("change", () => {
  if (cbSingleMail.checked) {
    isSingleMail = true;

    // single-address mail excludes inserts
    if (hasInserts) {
      hasInserts = false;
      cbHasInserts.checked = false;
    }

    // keep single/home mutually exclusive
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

    // home mail does NOT conflict with inserts
    // but remains mutually exclusive with single-address mail
    isSingleMail = false;
    cbSingleMail.checked = false;
  } else {
    isHomeMail = false;
  }

  recalc(sliderEl.noUiSlider.get());
});

  // ----- RESET EVERYTHING -----
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Reset booleans
    hasInserts = ORIG.hasInserts;
    isSingleMail = ORIG.isSingleMail;
    isHomeMail = ORIG.isHomeMail;

    // Enforce exclusivity at load: inserts wins over single-mail if both were true in JSON
    if (hasInserts && isSingleMail) {
      isSingleMail = false;
    }

    cbHasInserts.checked = hasInserts;
    cbSingleMail.checked = isSingleMail;
    cbHomeMail.checked   = isHomeMail;
    
    // Reset slider min/max + full rebuild
    updateSliderRange(ORIG.sliderMin, ORIG.sliderMax, ORIG.statementCount);

    // Reset input
    empInputEl.value = ORIG.statementCount;

    // Recalc
    recalc(ORIG.statementCount);
  });
});
