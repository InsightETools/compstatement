console.log("Pricing App v25.002.001");

// UPDATED: Remove hard-coded DATA_URL, will use SharedDataFetcher
const ENABLE_SHARE = true;
const MINIMAL_S = "eyJ2IjoxfQ";
const K = {
  baseFee:               "bf",
  statementFee:          "sf",
  singleAddressMailFee:  "sm",
  homeAddressMailFee:    "hm",
  insertCost:            "ic",
  sliderMin:             "mn",
  sliderMax:             "mx",
  statementCount:        "n",
  flags:                 "f",
  version:               "v"
};
const FLAG_BITS = {
  isSingleMail:  1 << 0,
  isHomeMail:    1 << 1,
  hasInserts:    1 << 2,
  pricingLocked: 1 << 3 
};

document.addEventListener("DOMContentLoaded", async () => {
  const sliderEl       = document.getElementById("slider");
  const empInputEl     = document.getElementById("empInput");
  const grandTotalEl   = document.getElementById("grandTotal");
  const perEmployeeEl  = document.getElementById("perEmployee");
  const resetBtn       = document.getElementById("toZero");
  const cbHasInserts   = document.getElementById("hasInserts");
  const cbSingleMail   = document.getElementById("isSingleMail");
  const cbHomeMail     = document.getElementById("isHomeMail");
  const labelBaseFee             = document.getElementById("baseFee");
  const labelStatementFee        = document.getElementById("statementFee");
  const labelSingleMailFee       = document.getElementById("singleAddressMailFee");
  const labelHomeMailFee         = document.getElementById("homeAddressMailFee");
  const labelCanadaMailFee       = document.getElementById("singleAddressCanadaMailFee");
  const labelInsertCost          = document.getElementById("insertCost");  
  const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const fmtUSD = (n) => Number(n).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
  const fmtInt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
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
      : Array.from({ length: steps + 1 }, (_, i) => Math.round(min + (span * i) / steps));
  };
  const renderPips = () => {
    sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
      const v = Number(pip.dataset.value);
      pip.textContent = formatK(v);
      pip.style.cursor = "pointer";
      pip.onclick = () => sliderEl.noUiSlider.set(v);
    });
  };

  // UPDATED: Fetch JSON using SharedDataFetcher
  let json = {};
  try {
    if (window.SharedDataFetcher) {
      // Use shared fetcher (with caching)
      json = await window.SharedDataFetcher.fetchData();
    } /*else {
      // Fallback to direct fetch if SharedDataFetcher not available
      const fallbackUrl = "https://compstatementdemo.netlify.app/data/EmployeeA.json";
      const res = await fetch(fallbackUrl, { cache: "no-store" });
      json = await res.json();
      console.warn("SharedDataFetcher not found, using fallback URL");
    }*/
  } catch (e) {
    console.error("Pricing App: Error loading JSON:", e);
    json = {};
  }

  // Defaults from JSON
  const defaults = {
    baseFee: toNum(json.baseFee),
    statementFee: toNum(json.statementFee),
    singleAddressMailFee: toNum(json.singleAddressMailFee),
    homeAddressMailFee: toNum(json.homeAddressMailFee),
    insertCost: toNum(json.insertCost),
    sliderMin: toNum(json.sliderMin),
    sliderMax: toNum(json.sliderMax),
    statementCount: toNum(json.statementCount),
    isSingleMail: !!json.isSingleMail,
    isHomeMail: !!json.isHomeMail,
    hasInserts: !!json.hasInserts,
    pricingLocked: !!json.pricingLocked,
    // PROTECTED JSON-ONLY fields (for DOM display)
    payrollSystem: json.payrollSystem ?? "",
    payrollDataMethod: json.payrollDataMethod ?? "",
    supplementalCostMethod: json.supplementalCostMethod ?? "",
    targetDate: json.targetDate ?? ""
  };

  /* ================== Share-mode detection & URL writer (debounced) ================== */
  const url = new URL(location.href);
  const sharePayload = ENABLE_SHARE ? url.searchParams.get("s") : null;
  const shareMode = ENABLE_SHARE && !!sharePayload;

  // State from share or defaults
  let state = shareMode ? decodeShare(sharePayload, defaults) : { ...defaults };

  // Business rules
  if (state.hasInserts) {
    state.isHomeMail = true;
    state.isSingleMail = false;
  }
  if (!state.isSingleMail && !state.isHomeMail) {
    state.hasInserts = false;
  }

  // Debounced URL sync
  let lastEncoded = null;
  let urlWriteTimer = null;
  function syncShareParam() {
    if (!ENABLE_SHARE) return;
    const encoded = encodeShare(state, defaults);
    if (encoded === lastEncoded) return; // no change → no write
    lastEncoded = encoded;

    clearTimeout(urlWriteTimer);
    urlWriteTimer = setTimeout(() => {
      const u = new URL(location.href);
      if (encoded === MINIMAL_S) u.searchParams.delete("s");
      else u.searchParams.set("s", encoded);
      history.replaceState(null, "", u);
    }, 200);
  }

  // If not share mode, write a compact default s (debounced)
  if (!shareMode && ENABLE_SHARE) {
    // initialize lastEncoded to avoid immediate double-write
    lastEncoded = null;
    syncShareParam();
  }

  // Immutable for reset
  const ORIG = { ...state };

  // Apply protected fields to DOM from JSON (strict rules)
  applyJsonFieldsStrict(defaults, [
    "payrollSystem",
    "payrollDataMethod",
    "supplementalCostMethod",
    "targetDate"
  ]);

  // pricingLocked visuals
  document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
    el.style.display = state.pricingLocked ? "none" : "";
  });
  if (state.pricingLocked) {
    const singleW = document.getElementById("isSingleMailWrapper");
    const homeW   = document.getElementById("isHomeMailWrapper");
    const insW    = document.getElementById("hasInsertsWrapper");
    if (singleW && state.isSingleMail === false) singleW.style.display = "none";
    if (homeW   && state.isHomeMail   === false) homeW.style.display   = "none";
    if (insW    && state.hasInserts   === false) insW.style.display    = "none";
  }

  // Optional fees display
  if (labelBaseFee)       labelBaseFee.textContent = fmtUSD(state.baseFee);
  if (labelStatementFee)  labelStatementFee.textContent = fmtUSD(state.statementFee);
  if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(state.singleAddressMailFee);
  if (labelHomeMailFee)   labelHomeMailFee.textContent = fmtUSD(state.homeAddressMailFee);
  if (labelInsertCost)    labelInsertCost.textContent = fmtUSD(state.insertCost);
  if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(json.singleAddressCanadaMailFee));

  // Initialize checkboxes
  if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
  if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
  if (cbHomeMail)   cbHomeMail.checked   = state.isHomeMail;

  // Create slider
  noUiSlider.create(sliderEl, {
    range: { min: state.sliderMin, max: state.sliderMax },
    start: state.statementCount,
    step: 1,
    connect: [true, false],
    pips: { mode: "values", values: makePips(state.sliderMin, state.sliderMax), density: 10 },
  });
  const renderAllPips = () => requestAnimationFrame(renderPips);
  renderAllPips();

  // Input bounds/value
  if (empInputEl) {
    empInputEl.min = state.sliderMin;
    empInputEl.max = state.sliderMax;
    empInputEl.value = state.statementCount;
  }

  // Pricing helpers
  const currentMailingFee = () =>
    state.isHomeMail ? state.homeAddressMailFee :
    state.isSingleMail ? state.singleAddressMailFee : 0;

  const perStatementCost = () =>
    state.statementFee + currentMailingFee() + (state.hasInserts ? state.insertCost : 0);

  function recalc(rawCount) {
    const n = clamp(Math.round(Number(rawCount)), state.sliderMin, state.sliderMax);
    const perEmp = (n > 0) ? (perStatementCost() + state.baseFee / n) : perStatementCost();
    const grand  = state.baseFee + perStatementCost() * n;

    if (perEmployeeEl) perEmployeeEl.textContent = fmtUSD(perEmp);
    if (grandTotalEl)  grandTotalEl.textContent  = fmtUSD(grand);
    if (empInputEl && empInputEl.value !== String(n)) empInputEl.value = n;

    state.statementCount = n;
    // NOTE: do NOT call syncShareParam() here — it's called on "set" & other user actions
  }

  function updateSliderRange(min, max, setVal = null) {
    state.sliderMin = min;
    state.sliderMax = max;
    if (empInputEl) {
      empInputEl.min = String(min);
      empInputEl.max = String(max);
    }
    sliderEl.noUiSlider.updateOptions(
      {
        range: { min, max },
        pips: { mode: "values", values: makePips(min, max), density: 10 },
      },
      true
    );
    renderAllPips();
    if (setVal != null) sliderEl.noUiSlider.set(setVal);
    syncShareParam();
  }

  // Initial paint
  recalc(state.statementCount);

  // Slider update (smooth UI) — no URL writes here
  let maxToastShown = false;
  sliderEl.noUiSlider.on("update", (vals) => {
    const val = Number(vals[0]);
    if (val >= state.sliderMax) {
      if (!maxToastShown) {
        Toast.show(
          `If your employee count is more than ${fmtInt(state.sliderMax)} then type the size in the input.`,
          {
            type: "info",
            duration: 3800,
            onShow: () => {
              if (empInputEl) {
                setTimeout(() => {
                  empInputEl.focus();
                  const v = empInputEl.value;
                  empInputEl.value = "";
                  empInputEl.value = v;
                }, 50);
              }
            }
          }
        );
        maxToastShown = true;
      }
    } else {
      maxToastShown = false;
    }
    recalc(val);
  });

  // Slider set (user released handle) — write URL here
  sliderEl.noUiSlider.on("set", () => {
    syncShareParam();
  });

  // Input -> expand if above max (typed+10)
  if (empInputEl) {
    empInputEl.addEventListener("input", () => {
      if (empInputEl.value === "") {
        sliderEl.noUiSlider.set(state.sliderMin);
        return;
      }
      let v = Math.floor(Number(empInputEl.value));
      if (!Number.isFinite(v)) return;

      if (v > state.sliderMax) {
        updateSliderRange(state.sliderMin, v + 10, v); // includes syncShareParam (debounced)
      } else {
        v = clamp(v, state.sliderMin, state.sliderMax);
        sliderEl.noUiSlider.set(v);
        syncShareParam(); // debounced write for manual input within range
      }
    });
  }

  // Reset (to ORIG)
  if (resetBtn) {
    resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      state = { ...ORIG };

      // pricingLocked visuals
      document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
        el.style.display = state.pricingLocked ? "none" : "";
      });
      if (state.pricingLocked) {
        const singleW = document.getElementById("isSingleMailWrapper");
        const homeW   = document.getElementById("isHomeMailWrapper");
        const insW    = document.getElementById("hasInsertsWrapper");
        if (singleW) singleW.style.display = state.isSingleMail ? "" : "none";
        if (homeW)   homeW.style.display   = state.isHomeMail   ? "" : "none";
        if (insW)    insW.style.display    = state.hasInserts   ? "" : "none";
      } else {
        ["isSingleMailWrapper","isHomeMailWrapper","hasInsertsWrapper"]
          .forEach(id => { const el = document.getElementById(id); if (el) el.style.display = ""; });
      }

      // checkboxes
      if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
      if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
      if (cbHomeMail)   cbHomeMail.checked   = state.isHomeMail;

      // slider & input
      updateSliderRange(state.sliderMin, state.sliderMax, state.statementCount);
      if (empInputEl) {
        empInputEl.min = state.sliderMin;
        empInputEl.max = state.sliderMax;
        empInputEl.value = state.statementCount;
      }

      // repaint & sync URL after reset
      maxToastShown = false;
      recalc(state.statementCount);
      syncShareParam();
    });
  }

  // Checkboxes + rules + share sync
  const onStateChanged = () => syncShareParam();

  if (cbHasInserts) {
    cbHasInserts.addEventListener("change", () => {
      state.hasInserts = cbHasInserts.checked;
      if (state.hasInserts) {
        if (!state.isHomeMail) {
          state.isHomeMail = true;
          if (cbHomeMail) cbHomeMail.checked = true;
        }
        if (state.isSingleMail) {
          state.isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
        }
      } else {
        if (!state.isSingleMail && !state.isHomeMail && cbHasInserts.checked) {
          cbHasInserts.checked = false;
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }

  if (cbSingleMail) {
    cbSingleMail.addEventListener("change", () => {
      if (cbSingleMail.checked) {
        state.isSingleMail = true;
        if (state.isHomeMail) {
          state.isHomeMail = false;
          if (cbHomeMail) cbHomeMail.checked = false;
        }
        if (state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
        }
      } else {
        state.isSingleMail = false;
        if (!state.isHomeMail && state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }

  if (cbHomeMail) {
    cbHomeMail.addEventListener("change", () => {
      if (cbHomeMail.checked) {
        if (state.isSingleMail) {
          state.isSingleMail = false;
          if (cbSingleMail) cbSingleMail.checked = false;
        }
        state.isHomeMail = true;
      } else {
        state.isHomeMail = false;
        if (!state.isSingleMail && state.hasInserts) {
          state.hasInserts = false;
          if (cbHasInserts) cbHasInserts.checked = false;
        }
      }
      recalc(sliderEl.noUiSlider.get());
      onStateChanged();
    });
  }
});
