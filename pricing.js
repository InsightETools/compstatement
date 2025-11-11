document.addEventListener("DOMContentLoaded", function () {
  const sliderEl = document.getElementById("slider");

  // --- Utilities ---
  const parseCurrency = (txt) => {
    if (!txt) return 0;
    const n = String(txt).replace(/[^0-9.-]/g, "");
    const num = Number(n);
    return isNaN(num) ? 0 : num;
  };

  const fmtUSD = (n) =>
    Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

  // --- Fee sources: DIVs with text like "$600.00" ---
  const baseFeeEl = document.getElementById("baseFee");
  const statementFeeEl = document.getElementById("statementFee");
  const mailingFeeEl = document.getElementById("mailingFee");

  // --- Outputs ---
  const grandTotalEl = document.getElementById("grandTotal");
  const perEmployeeEl = document.getElementById("perEmployee");
  const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
  const resetBtn = document.getElementById("toZero");

  // New input for employees (two-way with slider)
  const empInputEl = document.getElementById("empInput");
  // (Optional: if you kept #empCount as a display elsewhere, we still support it)
  const legacyEmpCountDisplay = document.getElementById("empCount");

  function getFees() {
    return {
      baseFee: 600,
      statementFee: 2.1,
      mailingFee: 1.9,
    };
  }

  // --- Create slider if not already initialized ---
  if (!sliderEl.noUiSlider) {
    noUiSlider.create(sliderEl, {
      range: { min: 0, max: 10000 },
      start: Number(empInputEl?.value ?? 0) || 0,
      step: 1,
      connect: [true, false],
      pips: {
        mode: "values",
        values: [0,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000],
        density: 10
      }
    });
  }

  // --- Format pip labels and make them clickable ---
  function setupPips() {
    const pips = sliderEl.querySelectorAll(".noUi-value");
    pips.forEach((pip) => {
      const v = Number(pip.getAttribute("data-value"));
      pip.style.paddingTop = "5px";
      pip.style.cursor = "pointer";
      pip.textContent = v === 0 ? "0" : (v / 1000) + "k";
      pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
    });
  }
  setupPips();

  // --- Calculation & render ---
  function recalc(nRaw) {
    const n = Math.max(0, Math.min(10000, Math.round(Number(nRaw) || 0))); // clamp 0..10000
    const { baseFee, statementFee, mailingFee } = getFees();

    const perStatement = statementFee + mailingFee;                // variable per employee
    const grandTotal = n * perStatement + baseFee;                 // total cost
    let perEmployeeDisplay = "—";
    let noteText = "";

    if (n > 0) {
      const perEmployee = perStatement + (baseFee / n);            // allocated base
      perEmployeeDisplay = fmtUSD(perEmployee);
      noteText = "";
    } else {
      noteText = fmtUSD(baseFee);                                  // show base fee when n == 0
    }

    // Write to DOM
    if (empInputEl) empInputEl.value = String(n);
    if (legacyEmpCountDisplay) legacyEmpCountDisplay.textContent = n.toLocaleString();

    grandTotalEl.textContent = fmtUSD(grandTotal);
    perEmployeeEl.textContent = perEmployeeDisplay;
    if (perEmployeeNoteEl) {
      perEmployeeNoteEl.style.display = noteText ? "block" : "none";
      perEmployeeNoteEl.textContent = noteText;
    }
  }

  // Initial paint
  recalc(sliderEl.noUiSlider.get());

  // Recalc on slider move + reflect in input
  sliderEl.noUiSlider.on("update", function (values) {
    recalc(values[0]);
  });

  // Typing in the input drives the slider (and therefore the calc)
  function normalizeNumber(raw) {
    // Allow temporary empty string during typing
    if (raw === "" || raw === null || raw === undefined) return "";
    const n = Math.floor(Number(raw));
    if (isNaN(n)) return 0;
    return Math.max(0, Math.min(10000, n));
  }

  if (empInputEl) {
    // Live update while typing (but keep empty allowed)
    empInputEl.addEventListener("input", () => {
      const v = normalizeNumber(empInputEl.value);
      if (v === "") {
        // Don't force slider when empty; just blank the per-employee and show base fee
        perEmployeeEl.textContent = "—";
        if (perEmployeeNoteEl) {
          const { baseFee } = getFees();
          perEmployeeNoteEl.style.display = "block";
          perEmployeeNoteEl.textContent = fmtUSD(baseFee);
        }
        grandTotalEl.textContent = fmtUSD(getFees().baseFee);
        return;
      }
      if (Number(sliderEl.noUiSlider.get()) !== v) {
        sliderEl.noUiSlider.set(v);
      }
    });

    // On blur, commit a valid value (default to 0 if empty/invalid)
    empInputEl.addEventListener("blur", () => {
      let v = normalizeNumber(empInputEl.value);
      if (v === "") v = 0;
      empInputEl.value = String(v);
      if (Number(sliderEl.noUiSlider.get()) !== v) {
        sliderEl.noUiSlider.set(v);
      } else {
        // ensure UI recalcs if value didn't change
        recalc(v);
      }
    });

    // Enter key commits value
    empInputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") empInputEl.blur();
    });
  }

  // If fee text changes dynamically, observe and recalc
  const mo = new MutationObserver(() => recalc(sliderEl.noUiSlider.get()));
  [baseFeeEl, statementFeeEl, mailingFeeEl].forEach((el) => {
    if (el) mo.observe(el, { characterData: true, childList: true, subtree: true });
  });

  // Reset button -> sets employees to 0
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(0);
    });
  }
});
