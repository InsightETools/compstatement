function packFlags(s){
  let f = 0;
  if (s.isSingleMail)  f |= FLAG_BITS.isSingleMail;
  if (s.isHomeMail)    f |= FLAG_BITS.isHomeMail;
  if (s.hasInserts)    f |= FLAG_BITS.hasInserts;
  if (s.pricingLocked) f |= FLAG_BITS.pricingLocked;
  return f;
}
function unpackFlags(f, s){
  s.isSingleMail  = !!(f & FLAG_BITS.isSingleMail);
  s.isHomeMail    = !!(f & FLAG_BITS.isHomeMail);
  s.hasInserts    = !!(f & FLAG_BITS.hasInserts);
  s.pricingLocked = !!(f & FLAG_BITS.pricingLocked);
  return s;
}
