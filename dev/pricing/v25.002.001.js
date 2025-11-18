//------PRICING APP (FIXED, costDetails)------//

console.log("Pricing App v25.002.005");

const ENABLE_SHARE = true;
const MINIMAL_S = "eyJ2IjoxfQ";
const K = {
    baseFee: "bf",
    statementFee: "sf",
    singleAddressMailFee: "sm",
    homeAddressMailFee: "hm",
    insertCost: "ic",
    sliderMin: "mn",
    sliderMax: "mx",
    statementCount: "n",
    flags: "f",
    version: "v"
};
const FLAG_BITS = {
    isSingleMail: 1 << 0,
    isHomeMail: 1 << 1,
    hasInserts: 1 << 2,
    pricingLock: 1 << 3
};

document.addEventListener("DOMContentLoaded", async () => {
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
    const labelCanadaMailFee = document.getElementById("singleAddressCanadaMailFee");
    const labelInsertCost = document.getElementById("insertCost");

    // SVG true/false icons
    const isSingleMailTrueEl = document.getElementById("isSingleMailTrue");
    const isSingleMailFalseEl = document.getElementById("isSingleMailFalse");
    const isHomeMailTrueEl = document.getElementById("isHomeMailTrue");
    const isHomeMailFalseEl = document.getElementById("isHomeMailFalse");
    const hasInsertsTrueEl = document.getElementById("hasInsertsTrue");
    const hasInsertsFalseEl = document.getElementById("hasInsertsFalse");

    const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const fmtUSD = (n) =>
        Number(n).toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 2
        });
    const fmtInt = (n) =>
        Number(n).toLocaleString(undefined, {
            maximumFractionDigits: 0
        });

    // Generic helper to push values into [data="..."] elements
    const applyDataValue = (name, value, formatter) => {
        const formatted = formatter ? formatter(value) : value;
        document.querySelectorAll(`[data="${name}"]`).forEach((el) => {
            el.textContent = formatted;
        });
    };

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

    const renderPips = () => {
        sliderEl.querySelectorAll(".noUi-value").forEach((pip) => {
            const v = Number(pip.dataset.value);
            pip.textContent = formatK(v);
            pip.style.cursor = "pointer";
            pip.onclick = () => sliderEl.noUiSlider.set(v);
        });
    };

    // Fetch JSON using SharedDataFetcher
    let json = {};
    try {
        json = await window.SharedDataFetcher.fetchData();
    } catch (e) {
        console.error("Pricing App: Error loading JSON:", e);
        json = {};
    }

    // NEW: grab nested costDetails (with fallback to {})
    const cost = json.costDetails || {};

    // Defaults from JSON (now from costDetails)
    const defaults = {
        baseFee: toNum(cost.baseFee),
        statementFee: toNum(cost.statementFee),
        singleAddressMailFee: toNum(cost.singleAddressMailFee),
        homeAddressMailFee: toNum(cost.homeAddressMailFee),
        insertCost: toNum(cost.insertCost),
        sliderMin: toNum(cost.sliderMin),
        sliderMax: toNum(cost.sliderMax),
        statementCount: toNum(cost.statementCount),
        isSingleMail: !!cost.isSingleMail,
        isHomeMail: !!cost.isHomeMail,
        hasInserts: !!cost.hasInserts,
        pricingLock: !!cost.pricingLock,
        // PROTECTED JSON-ONLY fields (for DOM display, also from costDetails now)
        payrollSystem: cost.payrollSystem ?? "",
        payrollDataMethod: cost.payrollDataMethod ?? "",
        supplementalCostMethod: cost.supplementalCostMethod ?? "",
        targetDate: cost.targetDate ?? ""
    };

    applyJsonFieldsStrict(defaults, [
        "payrollSystem",
        "payrollDataMethod",
        "supplementalCostMethod",
        "targetDate"
    ]);

    hideEmptyJsonWrappers(defaults, [
        "payrollSystem",
        "payrollDataMethod",
        "supplementalCostMethod",
        "targetDate"
    ]);

    /* ================== Share-mode detection & URL writer (debounced) ================== */
    const url = new URL(location.href);
    const sharePayload = ENABLE_SHARE ? url.searchParams.get("s") : null;
    const shareMode = ENABLE_SHARE && !!sharePayload;

    // State from share or defaults
    let state = shareMode ? decodeShare(sharePayload, defaults) : { ...defaults };

    // Business rules
    // Inserts are allowed with either mailing option, but not with neither
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
        lastEncoded = null;
        syncShareParam();
    }

    const ORIG = { ...state };

    function hideEmptyJsonWrappers(source, keys) {
        keys.forEach((key) => {
            const v = source[key];

            // value is "missing" or blank string
            const isMissing = v === undefined;
            const isBlank = typeof v === "string" && v.trim() === "";

            if (isMissing || isBlank) {
                // Prefer the explicit wrapper id like "payrollSystemWrapper"
                const wrapperById = document.getElementById(`${key}Wrapper`);
                if (wrapperById) {
                    wrapperById.style.display = "none";
                    return;
                }

                // Fallback: hide the immediate parent of the [data="key"] element
                document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
                    const wrapper = el.parentElement;
                    if (wrapper) wrapper.style.display = "none";
                });
            }
        });
    }

    // Helper: enable/disable inserts based on mailing choice
    function updateHasInsertsAvailability() {
        const hasMail = state.isSingleMail || state.isHomeMail;
        if (!cbHasInserts) return;

        cbHasInserts.classList.toggle("inactive", !hasMail);
        cbHasInserts.disabled = !hasMail;

        if (!hasMail) {
            cbHasInserts.checked = false;
            state.hasInserts = false;
        }
    }

    // Helper: show/hide true/false icons
    function setBooleanIcon(value, trueEl, falseEl) {
        if (!trueEl || !falseEl) return;
        if (value) {
            trueEl.style.display = "";
            falseEl.style.display = "none";
        } else {
            trueEl.style.display = "none";
            falseEl.style.display = "";
        }
    }

    function updateBooleanIcons() {
        setBooleanIcon(state.isSingleMail, isSingleMailTrueEl, isSingleMailFalseEl);
        setBooleanIcon(state.isHomeMail,   isHomeMailTrueEl,   isHomeMailFalseEl);
        setBooleanIcon(state.hasInserts,   hasInsertsTrueEl,   hasInsertsFalseEl);
    }

    // pricingLock visibility logic
function applypricingLockVisibility() {
    const isLocked = state.pricingLock === true;

    // For each toggle pill input, hide/show the pill UI when locked
    ["isSingleMail", "isHomeMail", "hasInserts"].forEach((id) => {
        const input = document.getElementById(id);
        if (!input) return;

        // The pill structure (label + track + thumb)
        const pillRoot = input.closest(".pill-toggle") || input.parentElement;
        if (!pillRoot) return;

        // In your HTML, the pill is wrapped in a div with lock="pricingLock"
        const wrapper = pillRoot.closest('[lock="pricingLock"]') || pillRoot;

        // When isLocked is true, hide the input pill UI; when false, show it
        wrapper.style.display = isLocked ? "none" : "";
    });

    // Icons (True/False SVGs) are always driven by state
    updateBooleanIcons();
}

    // Apply initial pricingLock state
    applypricingLockVisibility();

    // Optional fees display (ID targets)
    if (labelBaseFee) labelBaseFee.textContent = fmtUSD(state.baseFee);
    if (labelStatementFee) labelStatementFee.textContent = fmtUSD(state.statementFee);
    if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(state.singleAddressMailFee);
    if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(state.homeAddressMailFee);
    if (labelInsertCost) labelInsertCost.textContent = fmtUSD(state.insertCost);
    if (labelCanadaMailFee)
        labelCanadaMailFee.textContent = fmtUSD(toNum(cost.singleAddressCanadaMailFee));

    // Initialize checkboxes
    if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
    if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
    if (cbHomeMail) cbHomeMail.checked = state.isHomeMail;

    // Ensure inserts availability matches initial mailing state
    updateHasInsertsAvailability();
    // Ensure icons match initial state
    updateBooleanIcons();

    // Create slider
    noUiSlider.create(sliderEl, {
        range: {
            min: state.sliderMin,
            max: state.sliderMax
        },
        start: state.statementCount,
        step: 1,
        connect: [true, false],
        pips: {
            mode: "values",
            values: makePips(state.sliderMin, state.sliderMax),
            density: 10
        }
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
        state.isHomeMail
            ? state.homeAddressMailFee
            : state.isSingleMail
            ? state.singleAddressMailFee
            : 0;

    // Kept for compatibility, though recalc now does full math
    const perStatementCost = () =>
        state.statementFee + currentMailingFee() + (state.hasInserts ? state.insertCost : 0);

    // Full pricing + data-binding logic
    function recalc(rawCount) {
        const n = clamp(Math.round(Number(rawCount)), state.sliderMin, state.sliderMax);

        const baseFee = state.baseFee;
        const statementFee = state.statementFee;
        const insertFee = state.hasInserts ? state.insertCost : 0;
        const mailingPerStmt = currentMailingFee();

        const statementTotal = n * statementFee;
        const insertTotal = n * insertFee;
        const deliveryTotal = n * mailingPerStmt;
        const mailTotal = insertTotal + deliveryTotal;

        // grandTotal = baseFee + statementTotal + insertTotal + deliveryTotal
        const grandTotal = baseFee + statementTotal + insertTotal + mailTotal;

        // pricePerStatement = grandTotal / statementCount (if > 0)
        const pricePerStatement = n > 0 ? grandTotal / n : 0;

        // Primary UI totals (if you have separate hero numbers by ID)
        if (perEmployeeEl) perEmployeeEl.textContent = fmtUSD(pricePerStatement);
        if (grandTotalEl) grandTotalEl.textContent = fmtUSD(grandTotal);
        if (empInputEl && empInputEl.value !== String(n)) empInputEl.value = n;

        state.statementCount = n;

        // Push raw values into [data="..."] elements

        // Direct/store values
        applyDataValue("baseFee", baseFee, fmtUSD);
        applyDataValue("statementFee", statementFee, fmtUSD);
        // Always show original JSON insert cost, not 0 when toggled off
        applyDataValue("insertCost", defaults.insertCost, fmtUSD);
        applyDataValue("singleAddressMailFee", state.singleAddressMailFee, fmtUSD);
        applyDataValue("homeAddressMailFee", state.homeAddressMailFee, fmtUSD);

        // Per-statement delivery fee (for data="deliveryFee")
        applyDataValue("deliveryFee", mailingPerStmt, fmtUSD);

        // Count (non-dollar)
        applyDataValue("statementCount", n, fmtInt);

        // Calculated totals
        applyDataValue("statementTotal", statementTotal, fmtUSD);
        applyDataValue("insertTotal", insertTotal, fmtUSD);
        applyDataValue("deliveryTotal", deliveryTotal, fmtUSD);
        applyDataValue("mailTotal", mailTotal, fmtUSD);
        applyDataValue("pricePerStatement", pricePerStatement, fmtUSD);
        applyDataValue("grandTotal", grandTotal, fmtUSD);

        // Keep icons in sync with state
        updateBooleanIcons();

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
                range: {
                    min,
                    max
                },
                pips: {
                    mode: "values",
                    values: makePips(min, max),
                    density: 10
                }
            },
            true
        );
        renderAllPips();
        if (setVal != null) sliderEl.noUiSlider.set(setVal);
        syncShareParam();
    }

    // Initial paint (formats all dollar values + statementCount on load)
    recalc(state.statementCount);

    // Slider update (smooth UI) — no URL writes here
    let maxToastShown = false;
    sliderEl.noUiSlider.on("update", (vals) => {
        const val = Number(vals[0]);
        if (val >= state.sliderMax) {
            if (!maxToastShown) {
                Toast.show(
                    `If your employee count is more than ${fmtInt(
                        state.sliderMax
                    )} then type the size in the input.`,
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

            // Reapply pricingLock visibility (also updates icons)
            applypricingLockVisibility();

            // checkboxes
            if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
            if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
            if (cbHomeMail) cbHomeMail.checked = state.isHomeMail;

            // Ensure inserts availability matches new mailing state
            updateHasInsertsAvailability();
            // Ensure icons match new state
            updateBooleanIcons();

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

    // Inserts toggle — no toast now, availability handled elsewhere
    if (cbHasInserts) {
        cbHasInserts.addEventListener("change", () => {
            state.hasInserts = cbHasInserts.checked;
            recalc(sliderEl.noUiSlider.get());
            onStateChanged();
        });
    }

    if (cbSingleMail) {
        cbSingleMail.addEventListener("change", () => {
            if (cbSingleMail.checked) {
                state.isSingleMail = true;
                // Still keep single vs home mutually exclusive
                if (state.isHomeMail) {
                    state.isHomeMail = false;
                    if (cbHomeMail) cbHomeMail.checked = false;
                }
            } else {
                state.isSingleMail = false;
            }

            // Update inserts availability after mail change
            updateHasInsertsAvailability();

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
            }

            // Update inserts availability after mail change
            updateHasInsertsAvailability();

            recalc(sliderEl.noUiSlider.get());
            onStateChanged();
        });
    }
});
