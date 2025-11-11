// Full JavaScript — pricing slider w/ conditional fees, JSON loading,
// checkbox logic, dynamic min/max, auto-expand max, and NEW RULE:
// If user types a value > current max → newMax = typedValue + 10.

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {

  // ===== DOM ELEMENTS =====
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
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

  // ===== UTILS =====
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

  // ===== LOAD JSON =====
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    data = await res.json();
  } catch (err) {
    console.error("JSON LOAD ERROR:", err);
    data = {};
  }

  // ===== EXTRACT VALUES =====
  let baseFee = toNum(data.baseFee);
  let statementFee = toNum(data.statementFee);
  let singleAddressMailFee = toNum(data.singleAddressMailFee);
  let homeAddressMailFee = toNum(data.homeAddressMailFee);
  let insertCost = toNum(data.insertCost);

  // Booleans (controlled by checkboxes)
  let hasInserts = !!data.hasInserts;
  let isSingleMail = !!data.isSingleMail;
  let isHomeMail = !!data.isHomeMail;

  // Slider dynamic range
  let SLIDER_MIN = toNum(data.sliderMin);
  let SLIDER_MAX = toNum(data.sliderMax);
  if (SLIDER_MAX < SLIDER_MIN) [SLIDER_MIN, SLIDER_MAX] = [SLIDER_MAX, SLIDER_MIN];

  // Initial count
  let JSON_COUNT = clamp(toNum(data.statementCount), SLIDER_MIN, SLIDER_MAX);

  // ===== POPULATE LABELS =====
  if (labelBaseFee) labelBaseFee.textContent = fmtUSD(baseFee);
  if (labelStatementFee) labelStatementFee.textContent = fmtUSD(statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(singleAddressMailFee);
  if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(homeAddressMailFee);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(data.singleAddressCanadaMailFee));
  if (labelInsertCost) labelInsertCost.textContent = fmtUSD(insertCost);

  // ===== INITIAL CHECKBOX STATES =====
  if (cbHasInserts) cbHasInserts.checked = hasInserts;
  if (cbSingleMail) cbSingleMail.checked = isSingleMail;
  if (cbHomeMail) cbHomeMail.checked = isHomeMail;

  // ===== SLIDER CREATION =====
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

  // Input range config
  empInputEl.min = SLIDER_MIN;
  empInputEl.max = SLIDER_MAX;
  empInputEl.value = JSON_COUNT;

  // ===== CALCULATIONS =====
  const currentMailingFee = () =>
    isHomeMail ? homeAddressMailFee : isSingleMail ? singleAddressMailFee : 0;

  const perStatementCost = () =>
    statementFee + currentMailingFee() + (hasInserts ? insertCost : 0);

  function recalc(rawCount) {
    const n = clamp(toNum(rawCount), SLIDER_MIN, SLIDER_MAX);
    const perStatement = perStatementCost();
    const grand = n * perStatement + baseFee;

    if (n > 0) {
      perEmployeeEl.textContent = fmtUSD(perStatement + baseFee / n);
      perEmployeeNoteEl.style.display = "none";
    } else {
      perEmployeeEl.textContent = "—";
      perEmployeeNoteEl.style.display = "block";
      perEmployeeNoteEl.textContent = fmtUSD(baseFee);
    }
    grandTotalEl.textContent = fmtUSD(grand);

    // sync input
    if (empInputEl.value !== String(n)) empInputEl.value = n;
  }

  // ===== AUTO-EXPAND MAX =====
  function expandMaxTo(newMax) {
    SLIDER_MAX = newMax;

    empInputEl.max = SLIDER_MAX;

    sliderEl.noUiSlider.updateOptions({
      range: { min: SLIDER_MIN, max: SLIDER_MAX },
      pips: {
        mode: "values",
        values: makePips(SLIDER_MIN, SLIDER_MAX),
        density: 10,
      },
    });

    renderPipLabels();
  }

  // ===== INITIAL RENDER =====
  recalc(JSON_COUNT);

  // ===== SLIDER → RECALC + EXPAND =====
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = toNum(vals[0]);

    // Dragging past max expands max using new rule
    if (val >= SLIDER_MAX) {
      expandMaxTo(val + 10);
    }

    recalc(val);
  });

  // ===== INPUT → SLIDER + EXPAND ON OVERSHOOT =====
  empInputEl.addEventListener("input", () => {
    if (empInputEl.value === "") {
      sliderEl.noUiSlider.set(SLIDER_MIN);
      return;
    }

    let v = toNum(empInputEl.value);

    // ✅ NEW RULE: If typedValue > max → new max = typedValue + 10
    if (v > SLIDER_MAX) {
      expandMaxTo(v + 10);
    }

    v = clamp(v, SLIDER_MIN, SLIDER_MAX);
    sliderEl.noUiSlider.set(v);
  });

  // ===== RESET BUTTON =====
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sliderEl.noUiSlider.set(clamp(JSON_COUNT, SLIDER_MIN, SLIDER_MAX));
  });

  // ===== CHECKBOXES =====
  cbHasInserts.addEventListener("change", () => {
    hasInserts = cbHasInserts.checked;
    recalc(sliderEl.noUiSlider.get());
  });

  cbSingleMail.addEventListener("change", () => {
    if (cbSingleMail.checked) {
      isSingleMail = true;
      isHomeMail = false;
      cbHomeMail.checked = false;
    } else isSingleMail = false;

    recalc(sliderEl.noUiSlider.get());
  });

  cbHomeMail.addEventListener("change", () => {
    if (cbHomeMail.checked) {
      isHomeMail = true;
      isSingleMail = false;
      cbSingleMail.checked = false;
    } else isHomeMail = false;

    recalc(sliderEl.noUiSlider.get());
  });

});
