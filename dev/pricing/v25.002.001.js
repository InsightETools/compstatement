//------PRICING APP (FIXED)------//

console.log("Pricing App v25.002.002");

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
        return span <= 0 ?
            [min] :
            Array.from({
                length: steps + 1
            }, (_, i) => Math.round(min + (span * i) / steps));
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
        pricingLock: !!json.pricingLock,
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
    let state = shareMode ? decodeShare(sharePayload, defaults) : {
        ...defaults
    };

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

    const ORIG = {
        ...state
    };

    function hideEmptyJsonWrappers(source, keys) {
            keys.forEach((key) => {
            const v = source[key];
            console.log(v);
            if (v === null) {
                document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
                    el.textContent = "Unknown";
                });
                return;
            }
            const isEmpty =
                v === undefined ||
                (typeof v === "string" && v.trim() === "") ||
                (typeof v !== "string" && String(v).trim() === "");
            if (isEmpty) {
                document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
                    const wrapper = el.parentElement;
                    if (wrapper) wrapper.style.display = "none";
                });
                return;
            }
        });
    }

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

    // pricingLock visibility logic
    function applypricingLockVisibility() {
        const isLocked = state.pricingLock === true;

        document.querySelectorAll('[lock="pricingLock"]').forEach(el => {
            if (isLocked) {
                el.style.display = "none";
            } else {
                el.style.display = "";
            }
        });
    }

    // Apply initial pricingLock state
    applypricingLockVisibility();

    // Optional fees display (ID targets)
    if (labelBaseFee) labelBaseFee.textContent = fmtUSD(state.baseFee);
    if (labelStatementFee) labelStatementFee.textContent = fmtUSD(state.statementFee);
    if (labelSingleMailFee) labelSingleMailFee.textContent = fmtUSD(state.singleAddressMailFee);
    if (labelHomeMailFee) labelHomeMailFee.textContent = fmtUSD(state.homeAddressMailFee);
    if (labelInsertCost) labelInsertCost.textContent = fmtUSD(state.insertCost);
    if (labelCanadaMailFee) labelCanadaMailFee.textContent = fmtUSD(toNum(json.singleAddressCanadaMailFee));

    // Initialize checkboxes
    if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
    if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
    if (cbHomeMail) cbHomeMail.checked = state.isHomeMail;

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
        },
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
        applyDataValue("insertCost", insertFee, fmtUSD);
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

        // NOTE: do NOT call syncShareParam() here — it's called on "set" & other user actions
    }

    function updateSliderRange(min, max, setVal = null) {
        state.sliderMin = min;
        state.sliderMax = max;
        if (empInputEl) {
            empInputEl.min = String(min);
            empInputEl.max = String(max);
        }
        sliderEl.noUiSlider.updateOptions({
                range: {
                    min,
                    max
                },
                pips: {
                    mode: "values",
                    values: makePips(min, max),
                    density: 10
                },
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
                    `If your employee count is more than ${fmtInt(state.sliderMax)} then type the size in the input.`, {
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
            state = {
                ...ORIG
            };

            // Reapply pricingLock visibility
            applypricingLockVisibility();

            // checkboxes
            if (cbHasInserts) cbHasInserts.checked = state.hasInserts;
            if (cbSingleMail) cbSingleMail.checked = state.isSingleMail;
            if (cbHomeMail) cbHomeMail.checked = state.isHomeMail;

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
            // Attempting to turn inserts on
            if (cbHasInserts.checked) {
                // BUT no mailing option selected
                if (!state.isSingleMail && !state.isHomeMail) {
                    // Revert toggle
                    cbHasInserts.checked = false;
                    state.hasInserts = false;

                    // Show toast message
                    Toast.show(
                        "Please choose a mailing option (Single Address or Home Address) before enabling inserts.", {
                            type: "warning",
                            duration: 3500
                        }
                    );

                    return; // Prevent recalc
                }

                // Allowed: mailing option exists
                state.hasInserts = true;
            } else {
                // Inserts turned off
                state.hasInserts = false;
            }

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
                // If no mailing method is selected, inserts can't stay enabled
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
