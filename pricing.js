// Pricing Slider — full JavaScript with conditional fees + checkboxes
// Requires checkbox IDs:
//   #hasInserts, #isSingleMail, #isHomeMail
// These checkboxes will reflect JSON values on load
// Then override them when the user changes them.

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";

document.addEventListener("DOMContentLoaded", async () => {
  // ------- DOM refs -------
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  // Fee + boolean checkboxes
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
    if (Math.abs(v) >= 1000) {
      const k = v / 1000;
      return Number.isInteger(k) ? k + "k" : k.toFixed(1).replace(/\.0$/, "") + "k";
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

  // ------- Load JSON -------
  let data = {};
  try {
    const res = await fetch(DATA_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    console.error("ERROR: JSON FETCH FAILED", err);
    data = {};
  }

  // ------- Extract Values -------
  let baseFee = toNum(data.baseFee);
  let statementFee = toNum(data.statementFee);

  let singleAddressMailFee = toNum(data.singleAddressMailFee);
  let homeAddressMailFee = toNum(data.homeAddressMailFee);
  let insertCost = toNum(data.insertCost);

  // these booleans WILL BE UPDATED when checkboxes change
  let isSingleMail = !!data.isSingleMail;
  let isHomeMail = !!data.isHomeMail;
  let hasInserts = !!data.hasInserts;

  // slider range
  let SLIDER_MIN = toNum(data.sliderMin);
  let SLIDER_MAX = toNum(data.sliderMax);
  if (SLIDER_MAX < SLIDER_MIN) [SLIDER_MIN, SLIDER_MAX] = [SLIDER_MAX, SLIDER_MIN];

  // starting employee count
  let JSON_COUNT = clamp(toNum(data.statementCount), SLIDER_MIN, SLIDER_MAX);

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

  // ------- Slider Init -------
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

  // Clickable pips + formatting
  sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.textContent = formatK(v);
    pip.style.cursor = "pointer";
    pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
  });

  // Input sync
  if (empInputEl) {
    empInputEl.min = SLIDER_MIN;
    empInputEl.max = SLIDER_MAX;
    empInputEl.value = JSON_COUNT;
  }

  // ------- Recalculate Pricing -------
  function recalc(rawCount) {
    const n = clamp(toNum(rawCount), SLIDER_MIN, SLIDER_MAX);

    // Determine mailing fee dynamically
    let mailingFee = 0;
    if (isHomeMail) mailingFee = homeAddressMailFee;
    else if (isSingleMail) mailingFee = singleAddressMailFee;

    // include insert cost if checked
    const perStatement =
      statementFee +
      mailingFee +
      (hasInserts ? insertCost : 0);

    const grandTotal = n * perStatement + baseFee;

    // Update per employee
    if (n > 0) {
      const perEmployee = perStatement + baseFee / n;
      perEmployeeEl.textContent = fmtUSD(perEmployee);
      perEmployeeNoteEl.style.display = "none";
    } else {
      perEmployeeEl.textContent = "—";
      perEmployeeNoteEl.style.display = "block";
      perEmployeeNoteEl.textContent = fmtUSD(baseFee);
    }

    grandTotalEl.textContent = fmtUSD(grandTotal);

    // keep input in sync
    if (empInputEl.value !== String(n)) empInputEl.value = n;
  }

  // Initial render
  recalc(JSON_COUNT);

  // Slider → recalc
  sliderEl.noUiSlider.on("update", (vals) => recalc(vals[0]));

  // Input → slider
  empInputEl.addEventListener("input", () => {
    if (empInputEl.value === "") {
      sliderEl.noUiSlider.set(SLIDER_MIN);
      return;
    }
    sliderEl.noUiSlider.set(clamp(toNum(empInputEl.value), SLIDER_MIN, SLIDER_MAX));
  });

  // Reset
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sliderEl.noUiSlider.set(JSON_COUNT);
  });

  // --------------- CHECKBOX EVENTS ---------------
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
