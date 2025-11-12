// Full, self-contained JS to apply 4 JSON fields with the exact rules:
// - If value is blank ("", whitespace) => put "Unknown" in the element (#<key>)
// - If value is null                  => hide its wrapper (#<key>Wrapper), or the element if wrapper missing
// - Otherwise                         => put the actual value in the element
//
// Targets:
//   #payrollSystem, #payrollDataMethod, #supplementalCostMethod, #targetDate
//
// How it gets JSON:
// - If window.PRICING_JSON exists, it will use that.
// - Otherwise, it will fetch DATA_URL (set it below to your JSON URL).
//
// Tip: Make sure you actually have elements with those IDs, and optional wrappers
// with IDs: #payrollSystemWrapper, #payrollDataMethodWrapper, #supplementalCostMethodWrapper, #targetDateWrapper

const DATA_URL = "https://compstatementdemo.netlify.app/data/EmployeeA.json"; // <-- change if needed
const TARGET_FIELDS = [
  "payrollSystem",
  "payrollDataMethod",
  "supplementalCostMethod",
  "targetDate"
];

document.addEventListener("DOMContentLoaded", async () => {
  let data = null;

  // 1) Prefer an already-provided global (lets you inject JSON server-side)
  if (typeof window.PRICING_JSON === "object" && window.PRICING_JSON !== null) {
    data = window.PRICING_JSON;
  } else {
    // 2) Fallback: fetch from DATA_URL
    try {
      const res = await fetch(DATA_URL, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (err) {
      console.error("[applyJsonFields] Failed to load JSON:", err);
      return; // Without data, we can’t proceed
    }
  }

  applyJsonFieldsStrict(data, TARGET_FIELDS);
});

/**
 * Apply JSON values to elements by ID with wrapper-hiding and "Unknown" fallback.
 * Rules:
 *  - If value === null (or string "null"/"NULL"/"Null") => hide wrapper (#<key>Wrapper) or the element
 *  - If value is blank string                          => put "Unknown"
 *  - Else                                              => put the actual value
 *
 * Only writes textContent (these 4 are text fields).
 */
function applyJsonFieldsStrict(json, fields) {
  const isBlank = (v) => typeof v === "string" && v.trim() === "";
  const isNullishByRule = (v) =>
    v === null || (typeof v === "string" && v.trim().toLowerCase() === "null");

  const sliderEl = document.getElementById("slider");

  fields.forEach((key) => {
    const el = document.getElementById(key);
    const wrapper = document.getElementById(`${key}Wrapper`);
    if (!el) return;

    const val = json?.[key];

    // If nullish -> hide wrapper (unless it would also hide the slider)
    if (isNullishByRule(val)) {
      if (wrapper) {
        if (sliderEl && wrapper.contains(sliderEl)) {
          // Safety: don't nuke the slider; show "Unknown" instead.
          console.warn(`[applyJsonFieldsStrict] ${key} is null but ${key}Wrapper contains #slider; not hiding.`);
          wrapper.style.display = "";     // keep shown
          el.style.display = "";          // keep shown
          el.textContent = "Unknown";
        } else {
          wrapper.style.display = "none";
          console.debug(`[applyJsonFieldsStrict] Hid wrapper #${key}Wrapper because value is null.`);
        }
      } else {
        // No wrapper; avoid hiding if this element is (or contains) the slider
        if (sliderEl && el.contains(sliderEl)) {
          console.warn(`[applyJsonFieldsStrict] ${key} is null but #${key} contains #slider; not hiding element.`);
          el.style.display = "";
          el.textContent = "Unknown";
        } else {
          el.style.display = "none";
          console.debug(`[applyJsonFieldsStrict] Hid element #${key} because value is null.`);
        }
      }
      return;
    }

    // Non-nullish: ensure visible
    if (wrapper) wrapper.style.display = "";
    el.style.display = "";

    // Blank -> "Unknown"; otherwise actual value
    el.textContent = isBlank(val) ? "Unknown" : String(val);
  });
}

