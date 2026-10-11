# Changelog

## 3.13.22 - 2026-10-11

### Manual Premium Sales Readiness

- Added a manual Premium upgrade and renewal page with 30, 90, and 365-day plans priced at RM10, RM25, and RM100.
- Added an account identity summary, manual DuitNow or bank-transfer instructions, and a WhatsApp-assisted sales flow.
- Admin verifies real payment before the existing Admin Console activates or renews server-authoritative Premium access.
- No payment gateway, automatic activation, customer-side PAID trust, public bank-account details, or database migration is included.
- P1.13 cloud/reward behavior, voice/STT behavior, and the question bank are unchanged.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
