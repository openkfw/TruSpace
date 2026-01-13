# Security Log

**Project:** truspace
**Date:** 2026-01-13  

This document summarizes known security vulnerabilities and how they are mitigated.

---

## 1. Critical / High Severity

| Project   | Package | Version | Severity | Description                                                                                                | Status / Mitigation |
|-----------|---------|---------|----------|------------------------------------------------------------------------------------------------------------|---------------------|
| backend   | zlib1g  | 1:1.2.13.dfsg-1 | Critical | Integer overflow in MiniZip code could lead to heap-based buffer overflow when compressing long filenames. | Upgraded OS package to latest patched version. No direct use of MiniZip in production code. |
| backend   | glob    | 7.2.3 | High (scanner flagged) | CVE-2025-64756 affects CLI versions ≤10.4.5. backend use glob@7.2.3 as library only; no CLI usage.         | No action required. Documented. |
| e2e-tests | glob    | 7.2.3 | High (scanner flagged) | CVE-2025-64756 affects CLI versions ≤10.4.5. E2E tests use glob@7.2.3 as library only; no CLI usage.       | No action required. Documented. |

---

## 2. Moderate / Low Severity

| Project | Package | Version | Severity | Description | Status / Mitigation |
|---------|---------|---------|----------|-------------|-------------------|
| e2e-tests | elliptic | 6.6.1   | Low | Risky ECDSA implementation that may expose private keys. | Used **dev-only** by `cypress-cucumber-preprocessor`. No patched version exists. Not used in production. Documented and monitored. |

---

## Notes / General Mitigation Strategy

- All packages are updated to latest minor versions using `npm update`, `npm audit fix` and `overrides` where necessary.
- Dev-only dependencies are audited, but vulnerabilities in dev tools that do **not affect production** are documented but not actively patched (e.g., `elliptic`).
- Production code never uses `elliptic`, or other dev-only crypto libraries directly.
- Any future upgrade of `cypress-cucumber-preprocessor` will be assessed for removal or patch of `elliptic`.