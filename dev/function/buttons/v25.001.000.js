function _collectButtons() {
  document.querySelectorAll('button[id], [role="button"][id], a.button[id], .btn[id]').forEach(el => {
    _allKnownButtons.add(el.id);
  });
  [
    "design1","design2","layout1","layout2","header1","header2",
    "cover0","cover1","cover2","cover3","noCover","benefitsPage","companyPage"
  ].forEach(id => { if (document.getElementById(id)) _allKnownButtons.add(id); });
}

function _setBtnDisabled(id, disabled) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("disabled", !!disabled);
  el.toggleAttribute("disabled", !!disabled);
  el.setAttribute("aria-disabled", String(!!disabled));
}

function _applyEffectiveButtonStates() {
  _allKnownButtons.forEach((id) => {
    const jsonDis = !!_jsonDisabled.get(id);
    const desDis  = !!_designDisabled.get(id);
    _setBtnDisabled(id, jsonDis || desDis);
  });
}
