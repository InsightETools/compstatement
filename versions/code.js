// --- Module registry: names <-> letters + valid variants --------------------
const MODULES = {
  standardTable: { code: "a", variants: ["0", "1", "2"] },
  booleanTable:  { code: "b", variants: [] },
  donutChart:    { code: "c", variants: ["0", "1", "2"] },
  image:         { code: "d", variants: [] },
  listModule:    { code: "e", variants: ["0", "1", "2"] },
  snapshot:      { code: "f", variants: ["0", "1"] }
};
const CODE_TO_NAME = Object.fromEntries(Object.entries(MODULES).map(([k,v]) => [v.code, k]));

// --- Utilities --------------------------------------------------------------
const getParams = () => new URLSearchParams(window.location.search);
const getHashParams = () => new URLSearchParams(window.location.hash.slice(1));

function coerceBool(v) {
  if (v == null) return undefined;
  const s = String(v).toLowerCase();
  if (["1","true","yes","on"].includes(s)) return true;
  if (["0","false","no","off"].includes(s)) return false;
  return undefined;
}

function resolveModuleName(input) {
  if (!input) return null;
  const s = String(input).trim();
  // allow full name: "donutChart"
  if (MODULES[s]) return s;
  // allow letter code: "c"
  const byCode = CODE_TO_NAME[s.toLowerCase()];
  return byCode || null;
}

function resolveVariant(modName, rawVariant) {
  if (rawVariant == null) return null;
  const v = String(rawVariant).trim();
  // Accept numeric variants like "0","1","2" or named like "left"/"comp"
  const allowed = MODULES[modName]?.variants || [];
  if (allowed.length === 0) return v; // accept passthrough
  // Accept even if not listed, but prefer listed ones
  return allowed.includes(v) ? v : v;
}

// Parse both querystring and hash for directives like: 2a14=standardTable%0 or 3b16=c%2
function parseSlotDirectivesFromString(s) {
  const placements = [];
  // pattern: <design digit><layout letter><slot number>=<module name or code>%<variant>
  const re = /(\d)([a-z])(\d+)\s*=\s*([A-Za-z]+)\s*%?\s*([A-Za-z0-9_-]+)?/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const [, designStr, layout, slotStr, moduleToken, variantToken] = m;
    const design = parseInt(designStr, 10);
    const slot   = parseInt(slotStr, 10);
    const modName = resolveModuleName(moduleToken);
    if (!modName) continue;
    const variant = variantToken != null ? resolveVariant(modName, variantToken) : null;
    placements.push({ design, layout, slot, module: modName, variant });
  }
  return placements;
}

function parseStateFromUrl() {
  const qp = getParams();
  const hp = getHashParams();

  const state = {
    mode: qp.get("mode") || undefined,
    employeeKey: qp.get("ek") || qp.get("employeeKey") || undefined,
    design: qp.get("design") ? parseInt(qp.get("design"), 10) : undefined,
    layout: qp.get("layout") || undefined,
    header: qp.get("header") ? parseInt(qp.get("header"), 10) : undefined,
    cover: qp.get("cover") ? parseInt(qp.get("cover"), 10) : undefined,

    theme: {
      primaryColor: qp.get("primaryColor") || undefined,
      secondaryColor: qp.get("secondaryColor") || undefined,
      primaryFont: qp.get("primaryFont") || undefined,
      secondaryFont: qp.get("secondaryFont") || undefined,
      bodyFont: qp.get("bodyFont") || undefined
    },

    toggles: {
      benefits: coerceBool(qp.get("benefits")),
      contacts: coerceBool(qp.get("contacts"))
    },

    // slot placements parsed from both query and hash
    slots: [
      ...parseSlotDirectivesFromString(window.location.search),
      ...parseSlotDirectivesFromString(window.location.hash)
    ]
  };

  // If any slot directive includes design/layout, prefer that as explicit state if not already set
  if (state.slots.length) {
    if (state.design == null) state.design = state.slots[0].design;
    if (state.layout == null) state.layout = state.slots[0].layout;
  }

  return state;
}

// Example: apply to DOM (customize to your structure)
function applyState(state) {
  // Design/layout/header/cover toggles
  if (state.design != null) document.documentElement.setAttribute("data-design", state.design);
  if (state.layout) document.documentElement.setAttribute("data-layout", state.layout);
  if (state.header != null) document.documentElement.setAttribute("data-header", state.header);
  if (state.cover != null) document.documentElement.setAttribute("data-cover", state.cover);

  // Theme
  const root = document.documentElement.style;
  if (state.theme.primaryColor)   root.setProperty("--primary", `#${state.theme.primaryColor}`);
  if (state.theme.secondaryColor) root.setProperty("--secondary", `#${state.theme.secondaryColor}`);
  if (state.theme.primaryFont)    root.setProperty("--font-primary", state.theme.primaryFont);
  if (state.theme.secondaryFont)  root.setProperty("--font-secondary", state.theme.secondaryFont);
  if (state.theme.bodyFont)       root.setProperty("--font-body", state.theme.bodyFont);

  // Boolean toggles (example)
  const benefitsOn = state.toggles.benefits;
  const contactsOn = state.toggles.contacts;
  if (benefitsOn !== undefined) document.body.classList.toggle("benefits-on", !!benefitsOn);
  if (contactsOn !== undefined) document.body.classList.toggle("contacts-on", !!contactsOn);

  // Modules by slot
  // Expect a container with [slot="14"] or #slot-14, adapt as needed.
  state.slots.forEach(({ slot, module, variant, design, layout }) => {
    const slotEl = document.querySelector(`[slot="${slot}"]`) || document.getElementById(`slot-${slot}`);
    if (!slotEl) return;

    slotEl.setAttribute("data-design", design);
    slotEl.setAttribute("data-layout", layout);
    slotEl.setAttribute("data-module", module);
    if (variant != null) slotEl.setAttribute("data-variant", variant);

    // Optional: mount a template by module name
    // Example expects a <template id="tpl-standardTable"> etc.
    const tpl = document.getElementById(`tpl-${module}`);
    if (tpl?.content) {
      slotEl.innerHTML = "";
      slotEl.appendChild(tpl.content.cloneNode(true));
      // Variant hook
      slotEl.dispatchEvent(new CustomEvent("module:mounted", { detail: { module, variant, slot } }));
    }
  });
}

// Run
const state = parseStateFromUrl();
applyState(state);
