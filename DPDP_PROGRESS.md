# DPDP Act (India) Compliance Progress Log
**SMS Edu Solutions | Branch: `compliance/dpdp` | Started: 2026-08-21**

---

## ✅ What Was Built

### 1. Consent Mechanism (DPDP Act §6)

| File | Description |
|------|-------------|
| `apps/web-ui/src/components/consent/useConsent.ts` | localStorage-backed consent state hook; per-purpose tracking; version-aware |
| `apps/web-ui/src/components/consent/ConsentBanner.tsx` | App-wide consent banner; blocks Google Charts until user decides; "Accept All" / "Necessary Only" |
| `apps/web-ui/src/components/consent/ConsentGatedChart.tsx` | Wrapper that prevents react-google-charts from loading without analytics consent |
| `apps/web-ui/src/App.tsx` | ConsentBanner mounted at app root (inside BrowserRouter for navigation) |
| `apps/web-ui/index.html` | Google Charts script removed; now loaded only after consent |
| `apps/web-ui/src/pages/LoginPage.tsx` | Per-purpose opt-in consent checkbox added (unchecked default); submit button disabled until ticked |

**Consent is now gated on 3 Google Charts components:**
- `FeeCollectionChart.tsx` — wrapped in ConsentGatedChart
- `AttendanceTrendChart.tsx` — wrapped in ConsentGatedChart
- `ExamPerformanceChart.tsx` — wrapped in ConsentGatedChart

---

### 2. Privacy Notice (DPDP Act §7)

| File | Description |
|------|-------------|
| `apps/web-ui/src/pages/Legal/PrivacyPolicy.tsx` | Full privacy policy page |
| Route: `/privacy` | Public, no auth required |

Sections: data categories, purposes with legal basis, retention periods, third parties (essential vs non-essential), Data Principal rights, Grievance Officer, live consent management.

---

### 3. Terms of Service — Data Protection Clause

| File | Description |
|------|-------------|
| `apps/web-ui/src/pages/Legal/TermsOfService.tsx` | Full ToS with Section 7 — Data Protection clause |
| Route: `/terms` | Public, no auth required |

Section 7 covers: Data Fiduciary/Processor roles, DPA obligations, minor consent, security standards (with honest security flag re: plaintext passwords), breach notification (48h internal, 72h DPBI), rights, cross-border transfers.

---

### 4. Data Rights Request Form (DPDP Act §11–§14)

| File | Description |
|------|-------------|
| `apps/web-ui/src/pages/Legal/DataRightsRequest.tsx` | Self-service form: Access / Correction / Erasure / Withdraw Consent / Grievance / Nominee |
| Route: `/data-rights` | Public, no auth required |

> Currently uses mailto: handler. Production: replace with backend API + DB.

---

### 5. Grievance Officer Contact (DPDP Act §13)

| File | Description |
|------|-------------|
| `apps/web-ui/src/components/shared/LegalFooter.tsx` | Reusable footer with Privacy / Terms / Data Rights links + Grievance Officer contact |
| `apps/web-ui/src/pages/LoginPage.tsx` | Static footer replaced with LegalFooter |

Appears on: Login, Privacy Policy, Terms, Data Rights pages.

---

### 6. Consent Record Store

| File | Description |
|------|-------------|
| `packages/shared/models/consentRecord.schema.js` | Immutable MongoDB schema; per-purpose consent; IP/UA audit fields |
| `apps/sm-auth-services/controllers/consent.controller.js` | POST /api/auth/consent — record; GET /api/auth/consent/:userId — history |
| `apps/sm-auth-services/routes/consent.routes.js` | Express routes |
| `apps/sm-auth-services/index.js` | Routes mounted at /api/auth/consent |

---

### 7. Breach Runbook (DPDP Act §8)

| File | Description |
|------|-------------|
| `BREACH_RUNBOOK.md` | 72h breach runbook: timeline, escalation tree, DPBI notification template, user email template, post-incident checklist |

---

## 🔴 Security Gaps Found & Flagged

| ID | Gap | Location | Severity |
|----|-----|----------|----------|
| GAP-001 | **Plaintext password storage & comparison** — `if (password !== user.password)` | `auth.controller.js` L74, L114, L188 | 🔴 CRITICAL |
| GAP-002 | **Fail-open encryption fallback key** — hardcoded key if env var missing | `marks-crypto.js` L4 | 🔴 CRITICAL |
| GAP-003 | **No rate limiting on auth routes** — brute force unprotected | `sm-auth-services/index.js` | 🟡 HIGH |
| GAP-004 | **HTTPS not enforced** — no HSTS, no redirect middleware | Backend services | 🟡 HIGH |
| GAP-005 | **Error messages leak internals** — `error: error.message` in 500s | Multiple controllers | 🟠 MEDIUM |
| GAP-006 | **No CAPTCHA on login** — combined with GAP-003 | `LoginPage.tsx` | 🟠 MEDIUM |
| GAP-007 | **No data retention automation** — no TTL indexes | All schemas | 🟠 MEDIUM |
| GAP-008 | **Consent GET endpoint lacks authentication** — any userId accessible | `consent.routes.js` | 🟠 MEDIUM |

---

## ⚖️ What Needs Lawyer Review

All marked [LEGAL REVIEW REQUIRED] in code:

| Item | Location |
|------|----------|
| All Privacy Policy sections | `PrivacyPolicy.tsx` |
| Retention periods (RTE Act, IT Act, board rules) | `PrivacyPolicy.tsx` §3 |
| All Terms of Service clauses | `TermsOfService.tsx` |
| Data Protection clause — school-as-fiduciary model | ToS §7.1 |
| Minor consent verification mechanism | ToS §7.3 |
| Cross-border transfer rules (DPDP Rules not yet notified) | ToS §7.7 |
| Data Rights form response SLA | `DataRightsRequest.tsx` |
| Consent checkbox wording | `LoginPage.tsx` |
| Grievance Officer name/email — replace placeholders | All legal pages |
| Registered company address | `TermsOfService.tsx` |
| Breach notification templates | `BREACH_RUNBOOK.md` |
| Consent record retention period | `consentRecord.schema.js` |

---

## 🔓 Open Items (Not Yet Implemented)

| # | Item | Priority |
|---|------|----------|
| OI-001 | Fix plaintext passwords — bcrypt migration + user reset flow | 🔴 CRITICAL |
| OI-002 | Remove fail-open encryption fallback | 🔴 CRITICAL |
| OI-003 | Rate limiting on auth routes | 🟡 HIGH |
| OI-004 | HTTPS + HSTS enforcement | 🟡 HIGH |
| OI-005 | Frontend: POST to /api/auth/consent after login checkbox tick | 🟡 HIGH |
| OI-006 | Protect GET /api/auth/consent/:userId with JWT auth middleware | 🟠 MEDIUM |
| OI-007 | Replace DataRightsRequest mailto: with backend API + DB | 🟠 MEDIUM |
| OI-008 | Data retention automation (TTL indexes + purge crons) | 🟠 MEDIUM |
| OI-009 | CAPTCHA on login form (consent-gated) | 🟠 MEDIUM |
| OI-010 | Consent re-collection flow on policy version bump | 🟡 HIGH |
| OI-011 | Minor consent verification at school level | 🟡 HIGH |
| OI-012 | Data Processing Agreements with each school | 🟡 HIGH |
| OI-013 | Officially appoint Grievance Officer per DPDP Act §13 | 🟡 HIGH |
| OI-014 | Check DPBI registration requirement for platform size | TBD |

---

## 📁 Files Changed

### New Files
```
apps/web-ui/src/components/consent/useConsent.ts
apps/web-ui/src/components/consent/ConsentBanner.tsx
apps/web-ui/src/components/consent/ConsentGatedChart.tsx
apps/web-ui/src/components/shared/LegalFooter.tsx
apps/web-ui/src/pages/Legal/PrivacyPolicy.tsx
apps/web-ui/src/pages/Legal/TermsOfService.tsx
apps/web-ui/src/pages/Legal/DataRightsRequest.tsx
packages/shared/models/consentRecord.schema.js
apps/sm-auth-services/controllers/consent.controller.js
apps/sm-auth-services/routes/consent.routes.js
BREACH_RUNBOOK.md
DPDP_PROGRESS.md
```

### Modified Files
```
apps/web-ui/src/App.tsx                                        — ConsentBanner added
apps/web-ui/index.html                                         — Google Charts script removed (consent-gated)
apps/web-ui/src/routers/MainRouters.tsx                        — /privacy, /terms, /data-rights routes
apps/web-ui/src/pages/LoginPage.tsx                            — consent checkbox + LegalFooter
apps/web-ui/src/components/Dashboard/FeeCollectionChart.tsx    — ConsentGatedChart wrapper
apps/web-ui/src/components/Dashboard/AttendanceTrendChart.tsx  — ConsentGatedChart wrapper
apps/web-ui/src/components/Dashboard/ExamPerformanceChart.tsx  — ConsentGatedChart wrapper
apps/sm-auth-services/index.js                                 — consent routes mounted
```

---

*Branch: `compliance/dpdp` | Last updated: 2026-08-21 | No push to remote.*
*Audit conducted by: Antigravity AI — not a legal opinion. All legal copy requires lawyer review.*
