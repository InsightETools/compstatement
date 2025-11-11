  document.addEventListener("DOMContentLoaded", async () => {
    // ---- DOM refs ----
    const sliderEl = document.getElementById("slider");
    const empInputEl = document.getElementById("empInput");
    const grandTotalEl = document.getElementById("grandTotal");
    const perEmployeeEl = document.getElementById("perEmployee");
    const perEmployeeNoteEl = document.getElementById("perEmployeeNote");
    const resetBtn = document.getElementById("toZero");

    const baseFeeText = document.getElementById("baseFee");
    const statementFeeText = document.getElementById("statementFee");
    const mailingFeeText = document.getElementById("mailingFee");

    // ---- Utils ----
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const nnum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const fmtUSD = (n) =>
      Number(n).toLocaleString(undefined, {
        style: "currency", currency: "USD", maximumFractionDigits: 2
      });

    // ---- Fetch JSON ----
    const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json";
    let FEES = { base: 0, statement: 0, mailing: 0 };
    let STATEMENT_COUNT = 0;

    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Required fees
      FEES.base = nnum(json.baseFee);
      FEES.statement = nnum(json.statementFee);

      // Mailing mode (US single/home); extend as needed
      if (json.isHomeMail) FEES.mailing = nnum(json.homeAddressMailFee);
      else if (json.isSingleMail) FEES.mailing = nnum(json.singleAddressMailFee);
      else FEES.mailing = 0;

      // Employees controlled by JSON statementCount
      STATEMENT_COUNT = clamp(Math.floor(nnum(json.statementCount)), 0, 10000);
    } catch (err) {
      console.error("Failed to load pricing JSON:", err);
      // keep defaults: all zeros
    }

    // Reflect fees in UI (optional)
    baseFeeText.textContent = fmtUSD(FEES.base);
    statementFeeText.textContent = fmtUSD(FEES.statement);
    mailingFeeText.textContent = fmtUSD(FEES.mailing);

    // ---- Slider ----
    noUiSlider.create(sliderEl, {
      range: { min: 0, max: 10000 },
      start: STATEMENT_COUNT,
      step: 1,
      connect: [true, false],
      pips: {
        mode: "values",
        values: [0,1000,2000,3000,4000,5000,6000,7000,8000,9000,10000],
        density: 10
      }
    });

    // Pip labels + click
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.getAttribute("data-value"));
      pip.textContent = v === 0 ? "0" : (v / 1000) + "k";
      pip.style.cursor = "pointer";
      pip.addEventListener("click", () => sliderEl.noUiSlider.set(v));
    });

    // ---- Calculation ----
    function recalc(raw) {
      const n = clamp(Math.round(nnum(raw)), 0, 10000);
      const perStatement = FEES.statement + FEES.mailing;
      const grandTotal = n * perStatement + FEES.base;

      // keep input synced (without fighting user typing)
      if (empInputEl.value !== String(n)) empInputEl.value = String(n);

      if (n > 0) {
        const perEmployee = perStatement + (FEES.base / n);
        perEmployeeEl.textContent = fmtUSD(perEmployee);
        perEmployeeNoteEl.style.display = "none";
      } else {
        perEmployeeEl.textContent = "—";
        perEmployeeNoteEl.style.display = "block";
        perEmployeeNoteEl.textContent = fmtUSD(FEES.base);
      }

      grandTotalEl.textContent = fmtUSD(grandTotal);
    }

    // Initialize from JSON count
    empInputEl.value = String(STATEMENT_COUNT);
    recalc(STATEMENT_COUNT);

    // Slider -> calc
    sliderEl.noUiSlider.on("update", (vals) => recalc(vals[0]));

    // Input -> slider (live)
    empInputEl.addEventListener("input", () => {
      let v = clamp(Math.floor(nnum(empInputEl.value)), 0, 10000);
      // If input empty, treat as 0 for slider but don't overwrite field until blur
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(0);
      } else {
        sliderEl.noUiSlider.set(v);
      }
    });

    // Reset -> JSON's statementCount
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sliderEl.noUiSlider.set(STATEMENT_COUNT);
    });
  });
