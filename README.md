# Jannati AI Tutor

<!-- release-badges:start -->
![Release](https://img.shields.io/badge/Release-v3.9.1-blue) ![Build](https://img.shields.io/badge/Build-PASS-brightgreen) ![Validation](https://img.shields.io/badge/Validation-PASS-brightgreen) ![Coverage](https://img.shields.io/badge/Coverage-100%25-blue)
<!-- release-badges:end -->

React + Vite learning app for Malaysian Year 2 revision with split subject banks, learning paths, PBD summative assessment, AI explain/teacher helpers, parent dashboard, and tag-gated GitHub Pages deployment.

## Current Focus

- Final Jannati brand identity across app shell, manifest, favicon and runtime UI.
- Split subject banks with learning path, PBD summative assessment and offline AI helper flows.
- LocalStorage migration that preserves older learner progress.
- Service worker cache refresh to reduce stale HTML after deployment.
- Contextual two-way Tutor AI with profile-aware learning recommendations, compact chat tools, a local curriculum engine and a privacy-gated generative gateway that remains disabled until under-18 compliance is confirmed.

## Validate and build

```bash
npm run build
npm run release:build-check
npm run validate
npm run release:check
```

## Prepare a release

```bash
npm run release -- 3.2.23
npm run release:check -- --tag v3.2.23 --artifacts
```

Pushing the matching annotated tag triggers validation, build, GitHub Pages deployment, and a public smoke test. See `docs/RELEASE_CHECKLIST.md` for the complete procedure.

The optional Tutor AI generative gateway is documented in `docs/engineering/TUTOR_AI_GENERATIVE_GATEWAY.md`. Never expose an OpenAI API key through a `VITE_` environment variable.
