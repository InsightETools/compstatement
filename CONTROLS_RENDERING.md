Platform Controls & Rendering Module — Developer Documentation

Last updated: Oct 15, 2025 • Build v2025.1

This document explains how the module is organized, what each function is responsible for, and how to safely extend or redesign the UI without breaking behavior. Save this alongside the code as CONTROLS_RENDERING.md.

1) Purpose & Responsibilities

This module coordinates UI state (active/disabled buttons), URL parameters → data fetching, and rendering (donut charts, currency formatting, overflow handling). It is intentionally small and generic so design/UX can change freely while data-flow and business logic remain stable.

Key responsibilities

Read & write URL query parameters (the “single source of truth” for state).

Debounce expensive operations (fetching + full re-render).

Track button states and enforce design/JSON constraints (e.g., disabling incompatible UI).

Render data-driven components (donut charts, currency values).

Provide utilities (hex → rgb, overflow handling).

2) Lifecycle & Data Flow (High Level)

Boot

Logs initialization; sets isLoaded=false.

Wires UI controls in the IIFE controls() (listeners, button registry).

State source = URL params

getParams() reads current state.

setParam() (to be implemented) writes changes back to URL (and only the URL).

Fetch & Render

buildFetchUrlFromParams() converts params → API URL.

reloadFromParams() (debounced by debouncedReloadFromParams) fetches JSON with currentFetchController.

renderAll(data) draws charts, text, and layout; calls helpers (e.g., renderDonutChart, formatCurrency, applyOverflow).

Constraints & Button States

_collectButtons() discovers/records buttons (IDs).

_jsonDisabled and _designDisabled maps hold “reason for disabling” per button.

_applyEffectiveButtonStates() enforces final enable/disable + active classes from constraints + params.

computeDesignConstraintsAndApply() evaluates the current design (e.g., design=2) and updates maps.

Rule of thumb: All user actions should mutate URL params only; rendering reacts to params (never directly to button clicks). That keeps logic predictable and supports deep-linking / shareable state.

3) Public API Surface

These are the functions other modules/tests can safely call:

window.reloadFromParams()
Re-fetches and re-renders based on current URL params.

window.applyOverflow()
Enforces overflow/scroll behavior after dynamic content changes.

Everything else is an internal helper and can be refactored without changing the public API.

4) Function-by-Function Guide

Where you see “(to be implemented)” the body is intentionally blank in the scaffold. Keep the signatures stable; change internals freely.

Boot & Globals

let isLoaded = false;
Guard to prevent duplicate init. Flip to true only after first successful render.

const $ / $$
DOM shorthands. Use them instead of document.querySelector(All) for consistency.

const getParams = () => new URLSearchParams(window.location.search);
Read-only access to state. Never mutate this object directly—create a new instance when writing.

const setParam = (key, value) => { ... } (to be implemented)
Single place to add/update/remove a query param. Recommended behavior:

Read getParams()

If value === null || value === undefined || value === '' → remove key

Else → set key=value

Update history.replaceState (or pushState if you want back-button behavior)

Call debouncedReloadFromParams()

const toggleActive = (id, isActive)
Adds/removes .active on a control by ID. Use this only in _applyEffectiveButtonStates()—don’t call it directly from click handlers.

const debounced = (fn, ms = 60) => { ... } (to be implemented)
Standard trailing-edge debounce. Must cancel prior timer and reuse a stable closure.

let currentFetchController = null;
AbortController for in-flight fetches. Always abort obsolete requests before starting a new one.

Fetching

function buildFetchUrlFromParams() { ... } (to be implemented)
Translate URL params → API endpoint + query string. Keep this a pure function (no side effects).

window.reloadFromParams = async () => { ... } (to be implemented)
Recommended flow:

Abort currentFetchController if present; create a new one.

Build URL from buildFetchUrlFromParams().

fetch(url, { signal }), await res.json().

computeDesignConstraintsAndApply() before rendering (so UI states reflect any data-driven rules).

await renderAll(data).

applyOverflow().

Set isLoaded = true.

Rendering & Utilities

function hexToRgb(hex) { ... } (to be implemented)
Return {r,g,b} or a CSS string like rgb(r, g, b). Keep this forgiving (accept #rgb, #rrggbb, uppercase).

function formatCurrency(value, element = null, decimalFlag = null, isCurrency = true) { ... } (to be implemented)
Standardizes numeric formatting across the app. Suggested behavior:

Decide decimals via decimalFlag OR a dataset attribute on element (e.g., data-decimals="2").

If isCurrency, prefix with symbol (or use Intl.NumberFormat).

Return a string; only write to DOM if element is provided.

function renderDonutChart({ chartId, categoryGroup, containerSelector }) { ... } (to be implemented)
Encapsulate chart rendering. Don’t read URL params here; pass everything it needs.
Design-safe tip: Accept style tokens (radius, thickness) through CSS variables so visual redesigns don’t require JS changes.

async function renderAll(data) { ... } (to be implemented)
The sole place that:

Derives view-model from raw data

Calls renderDonutChart for each donut

Populates text nodes, tables, images

Calls formatCurrency where needed

Calls toggleActive for currently selected options (read from params)

Avoids side-effects unrelated to rendering (no param writes here)

window.applyOverflow = function () { ... } (to be implemented)
Show/hide scrollbars or apply CSS classes to fix layout shifts after rendering. Run this last.

Controls & Constraints

const _jsonDisabled = new Map();
Tracks buttons disabled due to data (e.g., a feature missing from the JSON). Key = button ID; Value = boolean or reason string.

const _designDisabled = new Map();
Tracks buttons disabled due to design constraints (e.g., design=2 disables layout choices).

const _allKnownButtons = new Set();
Registry of all control IDs discovered by _collectButtons().

function _collectButtons() { ... } (to be implemented)
Query DOM for known control selectors (e.g., [data-control] or specific IDs) and fill _allKnownButtons.
Design-safe tip: Stop hardcoding specific IDs in JS wherever possible—prefer data attributes the markup can move around with.

function _setBtnDisabled(id, disabled) { ... } (to be implemented)
Apply/remove the .disabled class and aria-disabled="true" consistently. Never hide buttons here; just control availability. Do not toggle .active here.

function _applyEffectiveButtonStates() { ... } (to be implemented)
Merge constraints:

Start from all enabled

Apply _designDisabled

Apply _jsonDisabled

Compute “active” from URL params (not clicks!) and call toggleActive(id, true/false)

function computeDesignConstraintsAndApply() { ... } (to be implemented)
Read getParams().get('design'), getParams().get('layout'), etc., and set flags in _designDisabled. Then call _applyEffectiveButtonStates().

const debouncedReloadFromParams = debounced(() => window.reloadFromParams(), 60);
Stable debounced ref. Use this after any param change.

(function controls() { ... })(); (to be implemented)
The only place that attaches event listeners to the DOM.
Pattern for a button click:

// Example
$('#layout1')?.addEventListener('click', (e) => {
  e.preventDefault();
  setParam('layout', '1'); // write intent to URL
  // DO NOT call toggleActive here; rendering will handle it
});


Register every button in _allKnownButtons.

Never mutate DOM classes directly here (except for simple focus/hover states).

Never fetch here—writing params will trigger debouncedReloadFromParams().

5) Changing the Design Without Breaking Behavior

Follow these guidelines to keep logic stable while redesigning:

Don’t move logic into templates.
Keep the “read params → fetch → render → apply overflow” pipeline intact.

Prefer data attributes to fixed IDs.
When redesigning, keep a small stable “control contract”, for example:

Controls carry data-param="layout" and data-value="1".

_collectButtons() uses [data-param] instead of a hardcoded list of IDs.

_applyEffectiveButtonStates() sets .active by matching param=value.

Use CSS variables for visual changes.
Donut size, stroke, paddings → set via CSS custom props (e.g., --donut-size), not JS.

Keep formatters pure.
If currency rules change (decimals, symbol), update formatCurrency() only—don’t spread number formatting in render code.

Never bypass URL params.
Do not store view state in globals or dataset flags. The URL is the single source of truth, enabling deep-linking and reliable re-renders.

Constraints live in one place.
If design #2 disables header buttons, express that only in computeDesignConstraintsAndApply(). The rest of the code reads the result.

6) Common Extension Recipes
A) Add a new toggle button (e.g., header=2)

Markup:

<a id="header2" class="template-button" data-param="header" data-value="2">Header #2</a>


controls(): Add a click listener that calls setParam('header','2').

Rendering: In renderAll(), show/hide blocks based on params.get('header').

Constraints: If design=2 should disable headers, set _designDisabled.set('header2', true) in computeDesignConstraintsAndApply().

B) Add a new donut chart

Data: Ensure API returns the needed slice values under a new group key.

renderAll():

renderDonutChart({ chartId: 'benefitsDonut', categoryGroup: data.benefits, containerSelector: '#benefitsDonutContainer' });


CSS: Style via variables (--donut-thickness, --donut-gap).

C) New URL param (e.g., theme=dark)

controls(): Add controls that call setParam('theme','dark') or remove the param.

renderAll(): Read params.get('theme') and set a CSS class on the root container.

Constraints: If some layouts are incompatible with theme=dark, disable via _designDisabled.

7) Abort & Debounce Guarantees

Always create a new AbortController before each fetch and abort the old one.
This prevents outdated data from racing the current render.

Never call reloadFromParams() directly after setParam(); use the debounced proxy debouncedReloadFromParams inside setParam() to coalesce multiple rapid changes (e.g., during sliders or typeahead).

8) Error Handling & Resilience

Wrap fetch in try/catch. On error:

Log a concise error (console.error('Fetch failed', err)).

Keep prior UI visible; optionally display a non-blocking toast.

renderAll() should be defensive:

Guard for missing keys.

Skip charts with empty data (and do not throw).

formatCurrency() must handle null/undefined/NaN gracefully (return — or 0 per product spec).

9) Accessibility & Semantics

Disabled buttons must set aria-disabled="true" and prevent default on click.

Active state should be conveyed with aria-pressed="true" for toggle-like buttons.

Donuts must have accessible labels (e.g., <canvas aria-label="Benefit distribution"> or an adjacent text table).

10) Testing Checklist (Before Ship)

 URL params correctly reflect each control interaction.

 Copy-pasting a full URL reproduces the same UI.

 Switching design= value updates disabled states as expected.

 Rapid param changes (e.g., clicking quickly) trigger only one fetch/render.

 Donut charts render for all expected categories; don’t vanish after layout/design changes.

 Currency/number formats are consistent across the app.

 Overflow behaves on small screens and large datasets.

 No console errors; meaningful warnings only.

11) Suggested Implementations (Pseudocode Snippets)

Debounce

function debounced(fn, ms = 60) {
  let t = null;
  return (...args) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), ms);
  };
}


setParam

function setParam(key, value) {
  const p = new URLSearchParams(window.location.search);
  if (value === null || value === undefined || value === '') p.delete(key);
  else p.set(key, value);
  const newUrl = `${location.pathname}?${p.toString()}${location.hash || ''}`;
  history.replaceState(null, '', newUrl);
  debouncedReloadFromParams();
}


reloadFromParams (skeleton)

window.reloadFromParams = async () => {
  const params = getParams();
  computeDesignConstraintsAndApply(); // set disabled/active states upfront

  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();

  try {
    const url = buildFetchUrlFromParams(params);
    const res = await fetch(url, { signal: currentFetchController.signal });
    const data = await res.json();
    await renderAll(data);
    window.applyOverflow();
    isLoaded = true;
  } catch (err) {
    if (err.name !== 'AbortError') console.error('Reload failed:', err);
  }
};


_applyEffectiveButtonStates (pattern)

function _applyEffectiveButtonStates() {
  const params = getParams();
  _allKnownButtons.forEach((id) => {
    const disabled = !!_designDisabled.get(id) || !!_jsonDisabled.get(id);
    _setBtnDisabled(id, disabled);

    // Active based on param contract
    const el = document.getElementById(id);
    if (!el) return;
    const param = el.dataset.param;     // e.g., "layout"
    const value = el.dataset.value;     // e.g., "1"
    if (param && value) {
      const isActive = params.get(param) === value;
      toggleActive(id, isActive);
      el.setAttribute('aria-pressed', String(isActive));
    }
  });
}

12) Design–Logic Contracts (Keep These Stable)

Controls: Use data-param / data-value on interactive elements.

Active class: .active communicates selection; logic derives it from URL.

Disabled class: .disabled + aria-disabled="true" used for constraints.

Donut charts: Call renderDonutChart({ chartId, categoryGroup, containerSelector }) with no knowledge of URL.

Formatting: All money/number display goes through formatCurrency().

13) Future-Proofing Notes

If you add routing or multi-page state, keep the param contract identical so components remain portable.

If you migrate to a framework (e.g., React/Vue), retain the “state in URL → render from props” philosophy to keep deep links and debounced fetching intact.

Consider extracting the constraint engine (maps + apply) into a standalone module for unit testing.

14) Quick FAQ

Q: Why not set .active inside click handlers?
A: Clicks express intent only. URL = state. Rendering reflects state. This avoids drift between UI and sharable URLs.

Q: Why two disable maps?
A: One for data-driven unavailability (_jsonDisabled), one for design-mode constraints (_designDisabled). They can be toggled independently and composed predictably.

Q: Donut charts disappear when layout changes—why?
A: Ensure renderAll() is the only place that mounts charts, and that layout switches don’t destroy containers before re-render calls renderDonutChart().
