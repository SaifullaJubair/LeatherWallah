// Worked examples + copyable ChatGPT prompts, one per Page Content section.
//
// The grey helper line under each section only ever *showed* an example — the
// admin still typed everything by hand. These power the "Example" button next
// to Paste / Add: a sample of what good looks like, plus a prompt the admin can
// copy, run against their own product, and paste back with the Paste button.
//
// Every prompt states the output format explicitly (one item per line, no
// numbering, no extra prose) so the answer drops straight into the matching
// Paste modal, which parses exactly that shape. It also states the row cap and
// the per-row character limit, because both are enforced on save and a longer
// answer just gets clipped.
//
// `name` is the product being edited, so the prompt is about THIS product
// rather than a generic one.

const p = (name) => name?.trim() || "this product";

export const shortFeaturesExample = (name) => ({
  sample: [
    "Full-Grain Leather",
    "Handcrafted",
    "1 Year Warranty",
    "Cash on Delivery",
  ],
  note: "Max 4 · up to 30 characters each — these sit in the icon row under the product name, so keep them to 2–3 words.",
  prompt: `Write 4 short hero features for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- Each feature is 2-3 words, maximum 30 characters.
- They render as a small icon row under the product name, so they must be punchy, not sentences.
- Cover material, craft, guarantee and buying confidence.
- Output ONLY the 4 features, one per line. No numbering, no bullets, no explanation.`,
});

export const processStepsExample = (name) => ({
  sample: [
    "Sourcing the finest hides",
    "Hand-cutting and stitching",
    "Polishing and finishing",
    "Quality check and packaging",
  ],
  note: "Max 4 · up to 60 characters each. Note: this section only appears on the PDP if a video is also set — steps alone render nothing.",
  prompt: `Write 4 "how it's made" process steps for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- Each step is a short phrase, maximum 60 characters.
- They run in order, from raw material to finished, packed product.
- Output ONLY the 4 steps, one per line. No numbering, no bullets, no explanation.`,
});

export const benefitsExample = (name) => ({
  sample: [
    "Premium full-grain leather that ages beautifully",
    "Goodyear-welt construction for years of durability",
    "Cushioned leather insole for all-day comfort",
    "Non-slip rubber outsole with a classic stacked heel",
  ],
  note: "Max 6 · up to 90 characters each. One benefit per line — keep the detail for the Description section.",
  prompt: `Write 5 customer benefits for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- Each benefit is ONE line, maximum 90 characters.
- Say what the customer GETS (comfort, durability, style), not just what the product has.
- Concrete and specific — avoid vague marketing words like "best quality" or "world class".
- Output ONLY the 5 benefits, one per line. No numbering, no bullets, no explanation.`,
});

export const useCasesExample = (name) => ({
  sample: [
    "Office & business meetings",
    "Weddings & formal events",
    "Everyday carry",
    "Travel & outings",
  ],
  note: "Max 6 · up to 70 characters each — these answer “where would I use this?”",
  prompt: `Write 4 use cases for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- Each one is a short phrase, maximum 70 characters — an occasion or setting, not a sentence.
- They answer the customer's question "where would I actually use this?".
- Output ONLY the 4 use cases, one per line. No numbering, no bullets, no explanation.`,
});

export const customSpecExample = (name) => ({
  sample: [
    "Upper Material | Full-grain cow leather",
    "Construction | Goodyear welted",
    "Outsole | Rubber (anti-slip)",
    "Warranty | 6 months",
    "Origin | Handmade in Bangladesh",
  ],
  note: "Each row is a label and a value. Paste them with the Paste table button — one row per line, separated by | or a tab.",
  prompt: `Write a product spec table for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- 5 to 8 rows. Each row is: Label | Value
- Use the separator "|" exactly, one row per line.
- Only facts a buyer cares about: material, construction, sole, lining, size range, warranty, origin, care.
- Do not invent certifications or numbers you cannot justify.
- Output ONLY the rows. No header row, no numbering, no explanation.`,
});

// Product Details tab — the LEFT card's table on the PDP.
export const specRowsExample = (name) => ({
  sample: [
    "Upper Material | Full-grain cow leather",
    "Lining | Genuine leather",
    "Outsole | Rubber (anti-slip)",
    "Construction | Goodyear welted",
    "Closure | Lace-up",
  ],
  note: "One row per line: Label | Value. These render as the spec table on the PDP.",
  prompt: `Write a product spec table for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- 5 to 7 rows. Each row is: Label | Value
- Use the separator "|" exactly, one row per line.
- Only hard facts: material, lining, sole, construction, closure, dimensions.
- Do not invent certifications or numbers you cannot justify.
- Output ONLY the rows. No header row, no numbering, no explanation.`,
});

// Product Details tab — the small icon tiles beside the table.
export const infoTilesExample = (name) => ({
  sample: [
    "Warranty | 6 months",
    "Origin | Handmade in BD",
    "Care | Wipe + condition",
  ],
  note: "Max 6 · these are the small icon tiles beside the spec table. Keep values to a few words — pick an icon per tile after pasting.",
  prompt: `Write 3 short "at a glance" info tiles for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- Each row is: Label | Value, using the separator "|" exactly, one per line.
- The value must be VERY short — a few words at most (e.g. "6 months", "Handmade in BD").
- Pick the things a buyer checks fast: warranty, origin, care, delivery.
- Output ONLY the 3 rows. No header row, no numbering, no explanation.`,
});

export const sizeGuideExample = (name) => ({
  sample: [
    "Size | EU | UK | CM",
    "M | 41 | 7 | 26",
    "L | 42 | 8 | 27",
    "XL | 43 | 9 | 28",
  ],
  note: "First line = the column headers, then one line per row. Max 8 columns / 30 rows.",
  prompt: `Write a size chart for "${p(name)}", a product sold by a Bangladeshi leather goods store.

Rules:
- First line is the column headers, separated by "|".
- Then one line per size, using the same "|" separator and the same number of columns.
- For footwear use: Size | EU | UK | CM. For a belt or a strap use: Size | Waist (inch) | Length (cm).
- Use realistic Bangladeshi retail sizing.
- Output ONLY the table. No markdown dividers (no |---|), no numbering, no explanation.`,
});
