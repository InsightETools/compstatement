function encodeShare(state, defaults){
  const out = {[K.version]: 1};

  const numFields = [
    ["baseFee","bf"], ["statementFee","sf"], ["singleAddressMailFee","sm"],
    ["homeAddressMailFee","hm"], ["insertCost","ic"],
    ["sliderMin","mn"], ["sliderMax","mx"], ["statementCount","n"]
  ];
  for (const [key, sk] of numFields){
    const v = Number(state[key]);
    const dv = Number(defaults[key]);
    if (!Number.isFinite(v) || !Number.isFinite(dv)) continue;
    if (v !== dv) out[sk] = numTo36(v);
  }

  const fState = packFlags(state);
  const fDef   = packFlags(defaults);
  if (fState !== fDef) out[K.flags] = numTo36(fState);

  return toBase64Url(JSON.stringify(out));
}

/** Decode ?s= back to state merged with defaults */
function decodeShare(s, defaults){
  let obj = {};
  try {
    obj = JSON.parse(fromBase64Url(s));
  } catch(e){
    console.warn("Bad share payload; using defaults.", e);
    return {...defaults};
  }
  const st = {...defaults};

  const rd = (sk, key) => {
    if (obj[sk] !== undefined) st[key] = from36(obj[sk], defaults[key]);
  };
  rd("bf","baseFee"); rd("sf","statementFee"); rd("sm","singleAddressMailFee");
  rd("hm","homeAddressMailFee"); rd("ic","insertCost");
  rd("mn","sliderMin"); rd("mx","sliderMax"); rd("n","statementCount");

  if (obj[K.flags] !== undefined){
    const f = from36(obj[K.flags], packFlags(defaults));
    unpackFlags(f, st);
  }

  // normalize
  if (st.sliderMax < st.sliderMin){ const t = st.sliderMin; st.sliderMin = st.sliderMax; st.sliderMax = t; }
  st.statementCount = Math.min(Math.max(st.statementCount, st.sliderMin), st.sliderMax);

  return st;
}
