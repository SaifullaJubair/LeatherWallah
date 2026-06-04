# B1 — Anonymous → Register Flow Audit Memo

**Date:** 2026-06-04 (Session 19)
**Trigger:** Sprint card B1, audit-required + market-comparison + owner-decision.
**Outcome:** Audit complete + BE-side fixes shipped on v2 in same session. FE-side fixes still pending (Layer 3 sweep).

---

## 1. Current flow (as-shipped before this session)

```
┌─────────────────────────┐
│ Buyer lands from FB ad  │
└────────────┬────────────┘
             │
             ▼
   ┌──────────────────┐
   │  Adds to cart    │
   │  /cart page      │  (becomes /checkout in S1)
   └────────┬─────────┘
            │
            ▼
   ┌──────────────────────────────────────┐
   │  Fills phone + name + address        │
   │  Clicks "Place Order"                │
   └────────┬─────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────┐
   │  POST /api/v1/order  (need_user_create=true)     │
   │  Server-side findOrCreateUser:                   │
   │   - lookup UserModel.findOne({ user_phone })     │
   │   - if found  → reuse, customer_id = that._id    │
   │   - if absent → create with:                     │
   │       user_type: "guest"                         │
   │       user_verified: false                       │
   │       user_password: undefined ⚠️ EMPTY          │
   └────────┬─────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────┐
   │  Order persisted (cod by default)        │
   │  sendOrderSMS_GuestUnverified fires:     │
   │   "ধন্যবাদ! আপনার অর্ডার <ID> place hocho.."│
   │  NO password-set CTA in SMS              │
   └──────────────────────────────────────────┘

   ────────  buyer leaves the site ────────
```

**Later, the buyer wants to sign in:**

```
   ┌───────────────────────────────────────────┐
   │  /sign-in page                            │
   │  Buyer types phone + ANY password         │
   └────────┬──────────────────────────────────┘
            │
            ▼
   ┌────────────────────────────────────────────────────────┐
   │  POST /api/v1/user/login (postLogUser)                 │
   │  Lookup user_phone                                     │
   │   if !findUser.user_password  ⚠️ SECURITY HOLE         │
   │      bcrypt.hash(whatever_they_typed) → store          │
   │      mark user_verified=true, user_type="registered"   │
   │      issue tokens                                      │
   │      ★ ATTACKER WHO KNOWS PHONE OWNS ACCOUNT ★         │
   │   else                                                 │
   │      bcrypt.compare → match? issue : reject            │
   └────────────────────────────────────────────────────────┘
```

---

## 2. Findings

### 🔴 F-B1.1 — Silent auto-password-set on first login (P0 SECURITY)

**Location:** `src/app/user/user.controllers.ts:130-142`

**Behaviour:** if `user_password` is empty on the user doc (the typical state for guest-order auto-created accounts), the FIRST `/login` call with any password string silently SETS that string as the account password. No OTP, no email/SMS verification, no rate-limit on this specific path.

**Threat model:** an attacker only needs to know a victim's phone number — which is leaked in any number of ways (Facebook scraping, leaked customer lists, casual observation) — to call `/login` once with `"hackedpass123"` and own that account permanently. No notification fires (the SMS path is gated on order placement, not login).

**Severity:** P0. Affects every guest order ever placed.

### 🟠 F-B1.2 — Same buyer with two phone formats → duplicate accounts

**Location:** `src/app/order/order.controller.ts:83`, `src/app/user/user.controllers.ts:125, 203`

**Behaviour:** `findOne({ user_phone: rawInput })` does no normalization. `"01711-123456"` and `"+8801711123456"` and `"8801711123456"` are three different DB documents. Same human, three accounts; orders + wallet + loyalty points scattered.

**Severity:** P1 — data integrity + customer support headache. Worse over time.

### 🟡 F-B1.3 — Guest-order SMS has no set-password CTA

**Location:** `src/utils/send.order.sms.ts sendOrderSMS_GuestUnverified`

**Behaviour:** the SMS confirms the order but never invites the buyer to set a password. So even motivated buyers (who'd happily set one) don't know they can.

**Severity:** P2 — UX gap; the buyer can still go to `/forget-password` manually but discoverability is low.

### 🟡 F-B1.4 — Three frontend SetPassword surfaces, one backend endpoint

**Location:** FE — `(auth)/set-password/page.jsx`, `components/frontend/auth/setPassword/SetPassword.jsx`, `SetPasswordModal.jsx`, `accountModal/AccountModal.jsx`

**Behaviour:** all four hit the same `POST /user/setNewPassword`. Not broken — but it's confusing for FE work to ensure all four are touched when the contract changes. Document so the Layer-3 FE sweep doesn't miss one.

**Severity:** P3 — code-quality only.

### 🟡 F-B1.5 — `/login` doubles as "first-time set" — `LoginForm.jsx` likely shows generic "Password does not match" on what was actually a missing-password account

**Location:** FE `components/frontend/auth/SignIn/LoginForm.jsx`

**Behaviour (pre-D3-fix):** Login form simply submits phone + password to `/login`. Before this session's fix, the server silently set the password and returned success — buyer never knew their account was bare. After this session's fix, the server returns a clear error ("Account exists but no password set. Please use 'Forgot Password' to set one via OTP."). The login form needs to CATCH this specific message and redirect the user to `/forget-password?phone=X`, otherwise they see a generic error and bounce.

**Severity:** P1 for UX — without the FE handling, the fix degrades the experience.

---

## 3. Market comparison

| Market | Pattern | Compare to FruitSnacks |
|---|---|---|
| **Shopify guest checkout** | No account at all; email confirmation only; account is opt-in afterwards | We auto-create with `user_type: "guest"`, no opt-in — heavier than Shopify but matches BD norm |
| **Daraz BD** | Phone-OTP auto-account; forces password later via SMS link | Closer to what we do, but Daraz never auto-sets a password without OTP |
| **Amazon** | Strong separation guest-vs-registered; no auto-link by phone | Very different model, doesn't fit our SMS-driven BD context |
| **Pickaboo BD** | Auto-account on order; password-set is OTP-gated via "Forgot Password" link | Closest to what we *should* be doing |
| **Pathao / Foodpanda** | Phone-OTP at start, never silent password set | Stronger but heavier UX at start |

**Verdict:** our flow is mostly aligned with BD norms (Daraz, Pickaboo). The one specific divergence — silently setting password on first login — is NOT a market pattern; it's an oversight. Fixing it brings us in line with Pickaboo.

---

## 4. Alternatives considered

### Option A (chosen) — Kill auto-set, require OTP-gated set-password

- `/login` rejects passwords against an empty-password account
- Buyer is told to use "Forgot Password" → OTP → set
- Anonymous checkout unchanged
- FE LoginForm catches the specific error and redirects

✅ Closes the security hole
✅ Anonymous flow unchanged
✅ BD-market-aligned (Pickaboo pattern)
⚠️  Adds one step to first-time login (acceptable)

### Option B — Send password-set SMS on guest order

- After guest order, SMS includes deep-link to `/set-password?phone=X&token=Y`
- One-tap to set password
- Anonymous flow unchanged

Pro: Frictionless conversion guest → registered
Con: Doesn't close the `/login` hole on its own; needs A+B

**Recommendation:** ship A this session (BE fix already in v2). Ship B as a follow-up in Layer 3 FE work where the SMS template is touched anyway.

### Option C — Make `/login` require OTP every time

- Phone + OTP → token (no password concept)
- Way too much friction for daily customers

Rejected.

---

## 5. Owner decisions (locked 2026-06-04)

- **D3 (chosen):** kill auto-set in `/login`. Anonymous checkout protected.
- Backfill script for legacy duplicates: yes, included.
- Phone normalization in all lookups: yes, BE-side applied in this session.
- Set-password SMS extension: deferred to Layer-3 FE work (alongside SMS audit).

---

## 6. What shipped on BE v2 (this session)

| Change | File |
|---|---|
| D3 security fix: kill auto-password-set | `user/user.controllers.ts` postLogUser |
| Phone normalize helper | NEW `utils/phone.ts` |
| Normalize in `postLogUser` (dual lookup) | `user/user.controllers.ts` |
| Normalize in `checkUserPhone` (dual lookup) | `user/user.controllers.ts` |
| Normalize in `findOrCreateUser` (dual lookup + write canonical) | `order/order.controller.ts` |
| Backfill script (idempotent) | NEW `scripts/normalize-user-phones.ts` |

---

## 7. What's still pending (Layer 3 FE + Admin work)

1. **`LoginForm.jsx`** — catch the new server error and redirect to `/forget-password?phone=X`
2. **Post-order success page** — add "Set a password to track future orders" CTA → `/set-password?phone=X`
3. **`sendOrderSMS_GuestUnverified`** — add deep-link in SMS body
4. **Customer list admin filter** — Type column (guest / registered) + Filter
5. **Verify `(auth)/set-password/page.jsx`** works for first-time-set, not just forgot-password
6. **Owner runs the backfill script** once after merge to main, then logs collisions for manual merge

---

## 8. Test plan (owner manual, post-Layer-3 deploy)

### Priority 1 — Smoke (anonymous checkout still works)
1. Open `/products/<slug>` in incognito → add to cart → checkout → place order with phone+name+address
2. Verify SMS arrives
3. Verify order shows in `/api/v1/order/dashboard` with `user_type: "guest"`
4. **No regression — this is the FB ad flow**

### Priority 2 — Security fix verified
1. Try `/login` with the phone above + any password
2. Expect: 400 "Account exists but no password set. Please use 'Forgot Password'..."
3. Click "Forgot Password" → enter phone → receive OTP → verify → set new password
4. Login again with new password → success
5. Verify the previous order shows in `/orders`

### Priority 3 — Phone normalization
1. Same buyer re-orders later via FB ad, types phone as `01711-123456` (with dash)
2. Expect: server finds existing user, links new order to same customer_id
3. Verify only ONE user doc exists for that phone (not two)
4. Run `npm run script:normalize-phones` (or equivalent) on legacy data → check console output for collisions

---

## 9. Related references

- Sprint doc: [docs/_ai/CLIENT_SPRINT.md](../../../docs/_ai/CLIENT_SPRINT.md) §B1
- Edge-audit findings: F-B1.1, F-B1.2 in audit output
- Phone normalize util: [src/utils/phone.ts](../../../FruitSnacksBackend/src/utils/phone.ts)
- Backfill script: [src/scripts/normalize-user-phones.ts](../../../FruitSnacksBackend/src/scripts/normalize-user-phones.ts)
