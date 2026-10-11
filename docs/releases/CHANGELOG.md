# Changelog

## 3.13.23 - 2026-10-11

### Public launch readiness

- Removed customer-visible beta, demo, and testing wording and clarified account login copy.
- Kept internal feedback, QDE, and classroom-pilot surfaces out of the normal production experience.
- Added safer public account recovery for forgotten passwords, recovery-session finalization, confirmation resend, and invalid or expired e-mail links.
- Added public Privacy, Terms, and Support pages with account/data deletion guidance, manual refund and payment-review guidance, and global footer links.

### Scope boundaries

- Manual Premium sales remain manual; no payment gateway or automatic Premium activation was added.
- Refund review remains manual, and no automated backend account deletion was added.
- No database, schema, RPC, P1.13 sync, reward, STT/voice, or question-bank behavior changed.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14816 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
