document.addEventListener("DOMContentLoaded", function () {
  const sliderEl = document.getElementById("slider");
  const empInputEl = document.getElementById("empInput"); // numeric input you added
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  // (Optional) if you still show fee values on the page:
  const baseFeeText = document.getElementById("baseFee");
  const statementFeeText = document.getElementById("statementFee");
  const mailingFeeText = document.getElementById("mailingFee");

  // === FEES: set them here ===
  const FEES = {
    base: 600.00,
    statement: 2.10,
    mailing: 1.90
  };

  // (Optional) reflect constants into any visible labels
  const fmtUSD = (n) => Number(n).toLocaleString(
    undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }
  );
  if (baseFeeText) baseFeeText.textContent = fmtUSD(FEES.base);
  if (statementFeeText) statementFeeText.textContent = fmtUSD(FEES.statement);
  if (mailingFeeText) mailingFeeText.textContent = fmtUSD(FEES.mailing);

  // Create slider 0..10000
  const startVal = Math.max(0, Math.min(10000, Math.floor(Number(empInputEl?.value ?? 0) || 0)));
  noUiSlider.create(sliderEl, {
    range: { min: 0, max: 10000 },
    start: startVal,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      values: [0,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000],
      density: 10
    }
  });

  // Format pip labels and make clickable
  const pips = sliderEl.querySelectorAll(".noUi-value");
  pips.forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.style.paddingTop = "5px";
    pip.style.cursor = "pointer";
    pip.textContent = v === 0 ? "0" : (v / 1000) + "k";
    pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
  });

  function recalc(nRaw) {
    const n = Math.max(0, Math.min(10000, Math.round(Number(nRaw) || 0)));
    const perStatement = FEES.statement + FEES.mailing;
    const grandTotal = n * perStatement + FEES.base;

    if (empInputEl && String(empInputEl.value) !== String(n)) {
      empInputEl.value = String(n);
    }

    if (n > 0) {
      const perEmployee = perStatement + (FEES.base / n);
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

  // Initial paint
  recalc(sliderEl.noUiSlider.get());

  // Slider -> Input + totals (fires for every move)
  sliderEl.noUiSlider.on("update", (values) => recalc(values[0]));

  // Input -> Slider on every input event (no blur needed)
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      let v = Math.floor(Number(empInputEl.value));
      if (isNaN(v)) v = 0;
      v = Math.max(0, Math.min(10000, v));
      if (Number(sliderEl.noUiSlider.get()) !== v) {
        sliderEl.noUiSlider.set(v);
      } else {
        recalc(v); // ensure totals refresh even if same number
      }
    });
  }

  // Reset button sets to 0
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(0);
    });
  }
});
