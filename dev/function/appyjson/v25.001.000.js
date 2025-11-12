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

    if (isNullishByRule(val)) {
      if (wrapper) {
        if (sliderEl && wrapper.contains(sliderEl)) {
          // Safety: don't hide the slider's container
          wrapper.style.display = "";
          el.style.display = "";
          el.textContent = "Unknown";
        } else {
          wrapper.style.display = "none";
        }
      } else {
        if (sliderEl && el.contains(sliderEl)) {
          el.style.display = "";
          el.textContent = "Unknown";
        } else {
          el.style.display = "none";
        }
      }
      return;
    }

    if (wrapper) wrapper.style.display = "";
    el.style.display = "";
    el.textContent = isBlank(val) ? "Unknown" : String(val);
  });
}
