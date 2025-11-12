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

  fields.forEach((key) => {
    const el = document.getElementById(key);
    const wrapper = document.getElementById(`${key}Wrapper`);

    if (!el) {
      // Element not found — nothing to do (but helpfully log once)
      // console.warn(`[applyJsonFields] Missing element #${key}`);
      return;
    }

    const val = json?.[key];

    // Null rule: hide wrapper (or element)
    if (isNullishByRule(val)) {
      if (wrapper) wrapper.style.display = "none";
      else el.style.display = "none";
      return;
    }

    // Ensure visible if not null
    if (wrapper) wrapper.style.display = "";
    el.style.display = "";

    // Blank => "Unknown"; otherwise actual value
    el.textContent = isBlank(val) ? "Unknown" : String(val);
  });
}
