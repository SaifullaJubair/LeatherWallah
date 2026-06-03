# Frontend V2 Picker — TODO

**Status:** Plan locked, edge-audit absorbed. Ready to code.

## Tasks (in order)

- [ ] **T1** — Add `wouldComboBeInStock` helper to `src/utils/helper.js`
- [ ] **T2** — Create `VariationPicker.jsx` with all branches:
  - [ ] T2a — Cap selection via `matchMedia` (8 / 14 / 20)
  - [ ] T2b — Value split (selected pinned first + cap + overflow)
  - [ ] T2c — Branch render: swatch+hex / swatch-no-hex (→button) / button / dropdown / legacy-inference
  - [ ] T2d — OOS faded chip + `title="স্টকে নেই"` + diagonal slash for swatches
  - [ ] T2e — Click → `handleSelectVariation` + OOS toast (dedup `toastId`)
  - [ ] T2f — "+N more" trigger button
- [ ] **T3** — Create `OverflowValuesModal.jsx`:
  - [ ] T3a — Backdrop + Esc close
  - [ ] T3b — Search input with `autoFocus`
  - [ ] T3c — Live filter `trim().toLowerCase().includes()`
  - [ ] T3d — Reuse `renderChip` from VariationPicker (extract + pass down)
  - [ ] T3e — Select → onSelect + onClose
- [ ] **T4** — Edit `SingleProduct.jsx`:
  - [ ] T4a — Import `VariationPicker`
  - [ ] T4b — Replace picker JSX (lines 837-923) with `<VariationPicker>` calls — one per axis
  - [ ] T4c — Pass props: `attribute`, `product`, `selectedVariations`, `handleSelectVariation`, `findVariation`
  - [ ] T4d — Verify no orphan helpers left in SingleProduct
- [ ] **T5** — Live test (Claude runs builds, owner runs browser):
  - [ ] T5a — `npm run build` exits 0
  - [ ] T5b — Owner browser-test the 6 tiers in PLAN.md
- [ ] **T6** — Inline-fix any bugs surfaced
- [ ] **T7** — Update `current-status-handoff.md` with session 16 results
- [ ] **T8** — Delete `.claude/work/frontend-v2-picker/` if owner confirms done

## NEXT SESSION START HERE

Start at first unchecked task.
