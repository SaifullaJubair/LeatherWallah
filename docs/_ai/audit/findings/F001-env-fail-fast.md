---
name: F001-env-fail-fast
description: "Missing env vars (ACCESS_TOKEN, MONGO_URI, S3_*) cause silent runtime failures instead of fail-fast at boot."
metadata:
  finding_id: F001
  severity: P1
  status: in-progress
  module: utils/auth.tokens + server + index
---

# F001 — Env fail-fast guard

## Severity: 🟠 P1
## Status: Session 18 — implementing now

## The problem

[auth.tokens.ts:25](../../../FruitSnacksBackend/src/utils/auth.tokens.ts#L25):
```ts
const SECRET = process.env.ACCESS_TOKEN;
```

[server.ts:4](../../../FruitSnacksBackend/src/server.ts#L4):
```ts
const uri = process.env.MONGO_URI as string;
```

If either env is missing:
- `jwt.sign(payload, undefined, ...)` → all logins fail with cryptic errors at runtime
- `mongoose.connect(undefined)` → DB fails silently in a `.catch` that only logs

S3 creds same — uploads fail at runtime instead of boot.

### Impact

- Misconfigured deploy goes "live" and looks healthy (`GET /` returns "FruitSnacks Server is working!") but EVERY auth + EVERY upload broken
- Customer support nightmare — works locally, broken in staging
- Clone-per-client risk — new buyer copy-paste wrong env → site looks up but broken

## Fix

New file `src/utils/env.ts`:

```ts
const REQUIRED = [
  "MONGO_URI",
  "ACCESS_TOKEN",
  "S3_REGION",
  "S3_ENDPOINT",
  "S3_ACCESS_KEY",
  "S3_SECRET_KEY",
  "S3_BUCKET",
  "S3_PUBLIC_URL",
] as const;

const OPTIONAL_WITH_WARN = [
  "PORT",
  "PATHAO_BASE_URL",
  "STEADFAST_CLIENT_ID",
  "FRAUDBD_API_KEY",
] as const;

export const validateEnv = (): void => {
  const missing = REQUIRED.filter((k) => !process.env[k] || !process.env[k]!.trim());
  if (missing.length) {
    console.error("\n❌ Missing required environment variables:");
    missing.forEach((k) => console.error(`   - ${k}`));
    console.error("\nCheck your .env file. Server will not start.\n");
    process.exit(1);
  }
  const warns = OPTIONAL_WITH_WARN.filter((k) => !process.env[k]);
  if (warns.length) {
    console.warn(`⚠️  Optional env vars not set: ${warns.join(", ")} — related features will be disabled.`);
  }
};
```

Wire in `index.ts` BEFORE `import routes`:
```ts
import dotenv from "dotenv";
dotenv.config();
import { validateEnv } from "./utils/env";
validateEnv();  // throws + exits if missing required
// ... rest of imports
```

## Why we picked process.exit(1) over throwing

- Throwing from top-level module is swallowed inconsistently by ts-node-dev / node
- Coolify health-check correctly reports the container as failed
- Clear stderr message tells operator exactly which env to add

## Test plan

1. Boot with all envs → server starts ✓
2. Remove `ACCESS_TOKEN` from `.env`, restart → process exits with clear message ✓
3. Remove a non-required env (`PATHAO_BASE_URL`) → boots with warning ✓

## Files touched

- NEW: `src/utils/env.ts`
- `src/index.ts` — call `validateEnv()` after `dotenv.config()`
