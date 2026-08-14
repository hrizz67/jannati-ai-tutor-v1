# Changelog

## 3.3.3 - 2026-08-14

### Infrastructure and CI

- Upgraded CI and tagged deployment from Node.js 20 to Node.js 24.
- Upgraded `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`, and `peaceiris/actions-gh-pages` to Node 24-compatible releases.
- Added release-pipeline regression gates for the required runtime and action generations.
- Declared the source ESM boundary explicitly and renamed the Vite configuration to `vite.config.mjs` to remove module-loader warnings.

### Release controls

- Package metadata is the single source of truth for version and release status.
- Tagged deployments verify package, lockfile, tag, and generated release artifacts before publishing.
- Validation, production environment, build, and local asset gates run before GitHub Pages deployment.

### Quality snapshot

- 8 subjects, 84 topics, and 4530 questions validated.
- Validation result: 0 error(s), 0 warning(s), 14660 informational item(s).
- Production smoke testing requires the public entry hash to match the newly built JavaScript asset.

### Follow-up work

- Continue reducing large production chunks through route and subject-level code splitting.
- Complete real-device Safari, speech, RTL, and accessibility acceptance checks.
