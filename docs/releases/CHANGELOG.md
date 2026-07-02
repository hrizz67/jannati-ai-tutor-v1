# Changelog

## 2.0.0-alpha.1 - 2026-07-02

### Features

- V2.0 alpha release pipeline with automated build, validation, version, changelog, release notes, and health outputs.
- Validator suite reports INFO, WARNING, and ERROR severity levels.
- CI release readiness is based on ERROR severity only.

### Fixes

- Release generation now reads validation summaries and curriculum coverage directly from generated reports.
- README badges are refreshed from release health data.

### Known Issues

- Validation currently reports 2 warning(s) and 12000 info item(s).
- Curriculum SK, SP, and estimated time values are inferred where explicit metadata is absent.
- Alpha release remains pre-production until Sprint 11 sign-off.

