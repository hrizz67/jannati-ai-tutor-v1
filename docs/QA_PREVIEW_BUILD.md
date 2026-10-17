# Isolated QA preview build

P1.16F provides a build artifact only. It does not create or deploy a preview site, and it does not activate the deferred R3A/R3B exact-question harness.

## Isolation contract

- Build mode: `qa-preview`.
- Required identity: an exact 40-character Git SHA in `VITE_BUILD_REVISION`.
- Application base path: `/jannati-ai-tutor-v1/`, preserving existing manifest, asset and service-worker paths.
- Supabase URL/key and STT endpoint: forced to empty values by the build configuration, even if inherited environment values exist.
- Cloud writes, real authentication and remote speech transcription: unavailable in the artifact.
- A browser-native Web Speech implementation may still use an operating-system/browser speech service on supported non-iOS devices. That is outside the application STT transport and must be covered by tester consent; the iOS MediaRecorder-to-STT production path remains unavailable without a separately approved preview backend/CORS change.
- Browser storage: isolated only when the artifact is hosted on a separate origin. Never mount it under the production GitHub Pages origin.
- R3A/R3B and exact-ID selection: disabled.

The artifact is emitted at `qa-preview-site/`. Cloudflare Pages can serve that directory without changing the application base path. Its root redirects to `/jannati-ai-tutor-v1/`; security headers block indexing, framing and remote backend connections.

## Future hosting gate

A later, separately approved operation may upload the artifact to a dedicated Cloudflare Pages project. That project must:

1. use a dedicated preview hostname that is not `hrizz67.github.io` and not a path on the production origin;
2. require Cloudflare Access for an explicit tester allowlist;
3. disable automatic Git deployments and production-branch builds;
4. accept only the reviewed immutable artifact for the recorded SHA;
5. have no Supabase, STT, Worker or other application credentials configured;
6. retain the generated `_headers`, `_redirects` and `qa-preview-manifest.json` files;
7. be deleted or access-disabled after the physical acceptance window.

Cloudflare Access is an external project setting and cannot be proven by this repository. Deployment remains blocked until an owner verifies that setting manually.

## Build locally

Set `VITE_BUILD_REVISION` to the exact approved commit SHA, then run:

```text
npm run build:qa-preview
```

The command runs the existing bundle budgets, packages the nested base path and validates isolation. It never uses `.env.local` in `qa-preview` mode.

The validation includes two negative builds with dummy-only values: one supplies inherited backend environment variables and one supplies the same classes of values through an isolated `.env.local`. Every generated JavaScript, HTML and preview configuration file is scanned to prove those sentinels are absent.

Artifact integrity validation follows HTML entries, JavaScript imports and lazy chunks, CSS URLs, both web manifests and their icons, JSON asset references, and the service-worker precache list. Every local reference must resolve to a file below `/jannati-ai-tutor-v1/`, and no asset may point at the production GitHub Pages origin.

The manual GitHub workflow **Build isolated QA preview artifact** performs the same operation and uploads a short-lived private Actions artifact. It has read-only repository permissions and contains no deployment step or Cloudflare credential.

## Service worker and cleanup

The existing service worker remains scoped to `/jannati-ai-tutor-v1/`. Cache names include the application version and immutable build SHA. A separate preview origin prevents cache, IndexedDB, Cache Storage, cookies, local storage and service-worker registrations from overlapping production.

Before and after physical QA, testers should remove the preview site's Safari/Chrome website data or uninstall its PWA. This does not touch production-origin data.
