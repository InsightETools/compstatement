document.addEventListener("DOMContentLoaded", function () {
  const sliderEl = document.getElementById("slider");
  const empCountEl = document.getElementById("empCount");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const grandTotalEl = document.getElementById("grandTotal");
  const toZeroBtn = document.getElementById("toZero");

  const statementFeeEl = document.getElementById("statementFee");
  const mailingFeeEl = document.getElementById("mailingFee");
  const baseFeeEl = document.getElementById("baseFee");

  // Helper: currency format
  const fmt = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  // Create slider 0..10000, start at 1 to avoid divide-by-zero in per-employee
  noUiSlider.create(sliderEl, {
    range: { min: 0, max: 10000 },
    start: 1,
    step: 1,
    connect: [true, false],
    pips: {
      mode: "values",
      values: [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
      density: 10
    }
  });

  // Format pip labels: 0, 1k, 2k, ..., 10k
  const pips = sliderEl.querySelectorAll(".noUi-value");
  pips.forEach((pip) => {
    const v = Number(pip.getAttribute("data-value"));
    pip.style.paddingTop = "5px";
    pip.style.cursor = "pointer";
    pip.textContent = v === 0 ? "0" : (v / 1000) + "k";
    pip.addEventListener("click", function () {
      sliderEl.noUiSlider.set(v);
    });
  });

  function getInputs() {
    const statementFee = Number(statementFeeEl.value);
    const mailingFee = Number(mailingFeeEl.value);
    const baseFee = Number(baseFeeEl.value);
    return { statementFee, mailingFee, baseFee };
  }

  function recalc(nRaw) {
    const n = Math.round(Number(nRaw) || 0);
    const { statementFee, mailingFee, baseFee } = getInputs();

    // Grand total always includes base fee
    const grandTotal = n * (statementFee + mailingFee) + baseFee;

    // Per-employee includes base allocated only if n > 0
    let perEmployeeDisplay = "—";
    let showNote = false;

    if (n > 0) {
      const perEmployee = (statementFee + mailingFee) + (baseFee / n);
      perEmployeeDisplay = fmt(perEmployee);
      showNote = false;
    } else {
      // n == 0: show dash for per-employee; note explains why
      showNote = true;
    }

    empCountEl.textContent = n.toLocaleString();
    perEmployeeEl.textContent = perEmployeeDisplay;
    perEmployeeNoteEl.style.display = showNote ? "block" : "none";
    grandTotalEl.textContent = fmt(grandTotal);
  }

  // Initial calc
  recalc(sliderEl.noUiSlider.get());

  // Recalc on slider update
  sliderEl.noUiSlider.on("update", function (values) {
    recalc(values[0]);
  });

  // Recalc on fee input changes
  [statementFeeEl, mailingFeeEl, baseFeeEl].forEach((el) => {
    el.addEventListener("input", () => recalc(sliderEl.noUiSlider.get()));
    el.addEventListener("change", () => recalc(sliderEl.noUiSlider.get()));
  });

  // Quick control to set to 0
  toZeroBtn.addEventListener("click", () => {
    sliderEl.noUiSlider.set(0);
  });
});
