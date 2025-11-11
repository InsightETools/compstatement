document.addEventListener("DOMContentLoaded", async () => {
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput");
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  const baseFeeText = document.getElementById("baseFee");
  const statementFeeText = document.getElementById("statementFee");
  const mailingFeeText = document.getElementById("mailingFee");

  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  // === LOAD FEES FROM JSON ===
  const url = "https://compstatementdemo.netlify.app/data/EmployeeA.json";
  let FEES = {
    base: 0,
    statement: 0,
    mailing: 0,
  };

  try {
    const response = await fetch(url, { cache: "no-store" });
    const json = await response.json();

    FEES.base = Number(json.baseFee || 0);
    FEES.statement = Number(json.statementFee || 0);
    FEES.mailing = Number(json.mailingFee || 0);

  } catch (err) {
    console.error("JSON fetch failed:", err);
  }

  // Update visible fee labels (optional)
  if (baseFeeText) baseFeeText.textContent = fmtUSD(FEES.base);
  if (statementFeeText) statementFeeText.textContent = fmtUSD(FEES.statement);
  if (mailingFeeText) mailingFeeText.textContent = fmtUSD(FEES.mailing);

  // === CREATE SLIDER ===
  noUiSlider.create(sliderEl, {
    range: { min: 0, max: 10000 },
    start: 0,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      values: [0,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000],
      density: 10
    }
  });

  // Format pip labels + click-to-jump
  sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.textContent = v === 0 ? "0" : (v / 1000) + "k";
    pip.style.cursor = "pointer";
    pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
  });

  // === CALC ===
  function recalc(nRaw) {
    const n = Math.max(0, Math.min(10000, Math.round(Number(nRaw) || 0)));

    const perStatement = FEES.statement + FEES.mailing;
    const grandTotal = n * perStatement + FEES.base;

    if (empInputEl.value !== String(n)) empInputEl.value = n;

    if (n > 0) {
      const perEmployee = perStatement + FEES.base / n;
      perEmployeeEl.textContent = fmtUSD(perEmployee);
      perEmployeeNoteEl.style.display = "none";
    } else {
      perEmployeeEl.textContent = "—";
      perEmployeeNoteEl.style.display = "block";
      perEmployeeNoteEl.textContent = fmtUSD(FEES.base);
    }

    grandTotalEl.textContent = fmtUSD(grandTotal);
  }

  // Initial calculation
  recalc(0);

  // Slider → Input + calc
  sliderEl.noUiSlider.on("update", (values) => {
    recalc(values[0]);
  });

  // Input → Slider + calc (LIVE update)
  empInputEl.addEventListener("input", () => {
    let v = Math.floor(Number(empInputEl.value));
    if (isNaN(v)) v = 0;
    v = Math.max(0, Math.min(10000, v));
    sliderEl.noUiSlider.set(v);
  });

  // Reset button
  resetBtn.addEventListener("click", (e) => {
    e.preventDefault();
    sliderEl.noUiSlider.set(0);
  });
});
