// S4+S5 Phase 1B — name split for Meta/TikTok Advanced Matching.
// Meta convention: fn = first name, ln = last name. Passing full name
// as fn drops match rate because Meta's algorithm assumes single token.
//
// Bangladesh names: usually 2-3 tokens ("Sumiya Akter", "Mohammad
// Rakibul Islam"). First token → fn, rest joined → ln. Single-word
// names → fn only, ln undefined.

export const splitName = (full) => {
  if (!full || typeof full !== "string") return { fn: undefined, ln: undefined };
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { fn: undefined, ln: undefined };
  if (parts.length === 1) return { fn: parts[0], ln: undefined };
  return { fn: parts[0], ln: parts.slice(1).join(" ") };
};
