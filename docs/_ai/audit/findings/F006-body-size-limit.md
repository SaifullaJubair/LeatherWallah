---
name: F006-body-size-limit
description: "express.json() and urlencoded() without explicit size limits — DoS via huge body bomb."
metadata:
  finding_id: F006
  severity: P2
  status: in-progress
  module: index.ts
---

# F006 — Body size limit

## Severity: 🟡 P2
## Status: Session 18 — implementing now

## The problem

[index.ts:17, 42](../../../FruitSnacksBackend/src/index.ts#L17):
```ts
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Default body-parser limit in express 4.16+ is `100kb` — already enforced, BUT:
- Default isn't explicit → easy to break if someone later writes `express.json({ limit: '50mb' })` for one endpoint
- 100kb is too generous for non-upload JSON (most real bodies < 10kb)
- File uploads use multer separately — these JSON limits don't apply

## Fix

Explicit limit in `index.ts`:
```ts
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));
```

### Why 200kb

- Typical order body (with 20 line items + addresses): ~10kb
- Settings save with all flags: ~30kb
- Page-content patch (rich text): can hit 100kb
- 200kb gives 2x headroom without enabling abuse

### Multer upload routes unaffected

`multer({ limits: { fileSize: ... } })` is separate; image/video upload paths keep their own limits (audited in F009).

## Test plan

1. Normal API request → succeeds ✓
2. Settings save → succeeds ✓
3. POST a 500kb JSON body → 413 Payload Too Large ✓

## Files touched

- `src/index.ts` — add `limit` to body-parser calls
