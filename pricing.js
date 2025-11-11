// Full JavaScript — pricing slider with JSON config, checkboxes, input sync,
// dynamic min/max, and auto-expand max (+10) when user hits/exceeds it.
//
// Requirements in DOM (IDs):
//  #slider, #empInput, #grandTotal, #perEmployee, #perEmployeeNote, #toZero
//  Checkboxes: #hasInserts, #isSingleMail, #isHomeMail
// Optional value displays (if present, they’ll be filled): 
//  #baseFee, #statementFee, #singleAddressMailFee, #homeAddressMailFee, #singleAddressCanadaMailFee, #insertCost
//
// Needs noUiSlider loaded (CSS + JS).
const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {
  // ------- DOM refs -------
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  // Checkboxes
  const cbHasInserts = document.getElementById("hasInserts");
  const cbSingleMail = document.getElementById("isSingleMail");
  const cbHomeMail = document.getElementById("isHomeMail");

  // Optional labels
  const labelBaseFee = document.getElementById("baseFee");
  const labelStatementFee = document.getElementById("statementFee");
  const labelSingleMailFee = document.getElementById("singleAddressMailFee");
  const labelHomeMailFee = document.getElementById("homeAddressMailFee");
  const labelCanadaMailFee = document.getElementById("singleAddressCanadaMailFee");
  const labelInsertCost = document.getElementById("insertCost");

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
    const steps = 10;
    const span = max - min;
    return span <= 0
      ? [min]
      : Array.from({ length: steps + 1 }, (_, i) =>
          Math.round(min + (span * i) / steps)
        );
  };

  // ------- Fetch JSON -------
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("ERROR: JSON FETCH FAILED", err);
    data = {};
  }

  // ------- Extract values from JSON -------
  let baseFee = toNum(data.baseFee);
  let statementFee = toNum(data.statementFee);
  let singleAddressMailFee = toNum(data.singleAddressMailFee);
  let homeAddressMailFee = toNum(data.homeAddressMailFee);
  let insertCost = toNum(data.insertCost);

  // Booleans (will be controlled by checkboxes too)
  let hasInserts = !!data.hasInserts;
  let isSingleMail = !!data.isSingleMail;
  let isHomeMail = !!data.isHomeMail;

  // Slider range from JSON
  let SLIDER_MIN = toNum(data.sliderMin);
  let SLIDER_MAX = toNum(data.sliderMax);
  if (SLIDER_MAX < SLIDER_MIN) [SLIDER_MIN, SLIDER_MAX] = [SLIDER_MAX, SLIDER_MIN];

  // Initial employee count (statementCount) clamped to range
  let JSON_COUNT = clamp(Math.floor(toNum(data.statementCount)), SLIDER_MIN, SLIDER_MAX);

  // ------- Populate labels if present -------
  if (labelBaseFee) labelBaseFee.textContent = fmtUSD(baseFee);
  if (labelStatementFee) labelStatementFee.textContent = fmtUSD(statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(singleAddressMailFee);
  if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(homeAddressMailFee);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(data.singleAddressCanadaMailFee));
  if (labelInsertCost) labelInsertCost.textContent = fmtUSD(insertCost);

  // ------- Set initial checkbox states -------
  if (cbHasInserts) cbHasInserts.checked = hasInserts;
  if (cbSingleMail) cbSingleMail.checked = isSingleMail;
  if (cbHomeMail) cbHomeMail.checked = isHomeMail;

  // ------- Slider init -------
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

  // Make pips pretty + clickable
  const renderPipLabels = () => {
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.getAttribute("data-value"));
      pip.textContent = formatK(v);
      pip.style.cursor = "pointer";
      pip.onclick = () => sliderEl.noUiSlider.set(v);
    });
  };
  renderPipLabels();

  // Keep input bounds/initial value in sync
  if (empInputEl) {
    empInputEl.min = String(SLIDER_MIN);
    empInputEl.max = String(SLIDER_MAX);
    empInputEl.value = String(JSON_COUNT);
  }

  // ------- Pricing calc -------
  function currentMailingFee() {
    if (isHomeMail) return homeAddressMailFee;
    if (isSingleMail) return singleAddressMailFee;
    return 0;
  }

  function perStatementCost() {
    return statementFee + currentMailingFee() + (hasInserts ? insertCost : 0);
  }

  function recalc(rawCount) {
    const n = clamp(Math.round(toNum(rawCount)), SLIDER_MIN, SLIDER_MAX);
    const perStatement = perStatementCost();
    const grandTotal = n * perStatement + baseFee;

    // Per-employee
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

    // Keep input synced
    if (empInputEl && empInputEl.value !== String(n)) {
      empInputEl.value = String(n);
    }
  }

  // ------- Auto-expand max (+10) when hitting/exceeding max -------
  function expandMax(by = 10) {
    SLIDER_MAX += by;

    // Update input max
    if (empInputEl) empInputEl.max = String(SLIDER_MAX);

    // Update slider range + pips
    sliderEl.noUiSlider.updateOptions({
      range: { min: SLIDER_MIN, max: SLIDER_MAX },
      pips: {
        mode: "values",
        values: makePips(SLIDER_MIN, SLIDER_MAX),
        density: 10,
      },
    });

    // Re-wire pip labels
    renderPipLabels();
  }

  // ------- Initial render -------
  recalc(JSON_COUNT);

  // Slider → recalc + expand if user hits max
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = Number(vals[0]);
    if (val >= SLIDER_MAX) {
      expandMax(10);
    }
    recalc(val);
  });

  // Input → slider (live) + expand if over max
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(SLIDER_MIN);
        return;
      }
      let v = Math.floor(toNum(empInputEl.value));
      if (v > SLIDER_MAX) {
        expandMax(10);
      }
      v = clamp(v, SLIDER_MIN, SLIDER_MAX);
      sliderEl.noUiSlider.set(v);
    });
  }

  // Reset → back to JSON count (clamped to current bounds)
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(clamp(JSON_COUNT, SLIDER_MIN, SLIDER_MAX));
    });
  }

  // ------- Checkbox handlers -------
  if (cbHasInserts) {
    cbHasInserts.addEventListener("change", () => {
      hasInserts = cbHasInserts.checked;
      recalc(sliderEl.noUiSlider.get());
    });
  }

  if (cbSingleMail) {
    cbSingleMail.addEventListener("change", () => {
      if (cbSingleMail.checked) {
        isSingleMail = true;
        if (cbHomeMail) cbHomeMail.checked = false;
        isHomeMail = false;
      } else {
        isSingleMail = false;
      }
      recalc(sliderEl.noUiSlider.get());
    });
  }

  if (cbHomeMail) {
    cbHomeMail.addEventListener("change", () => {
      if (cbHomeMail.checked) {
        isHomeMail = true;
        if (cbSingleMail) cbSingleMail.checked = false;
        isSingleMail = false;
      } else {
        isHomeMail = false;
      }
      recalc(sliderEl.noUiSlider.get());
    });
  }
});
