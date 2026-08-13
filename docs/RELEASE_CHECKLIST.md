# Release Checklist

Use this checklist for every tagged production release.

## 1. Prepare

- [ ] Confirm the intended semantic version, for example `3.2.23`.
- [ ] Run `npm run release -- 3.2.23`.
- [ ] Confirm `package.json`, `package-lock.json`, and `docs/releases/VERSION.json` show the same version.
- [ ] Review generated release notes, changelog, health report, and README badges.
- [ ] Confirm only intended source and generated release files changed.
- [ ] Confirm GitHub Secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are configured for production deploy.

## 2. Quality gates

- [ ] `npm run release:check -- --artifacts` passes.
- [ ] `npm run validate` passes with zero errors and zero warnings for a stable release.
- [ ] `npm run build` completes successfully.
- [ ] `npm run release:build-check` confirms every asset referenced by `dist/index.html` exists.
- [ ] Question-bank audit covers all 8 subjects.
- [ ] `npm run validate:learning-journey` confirms all 84 topics connect objectives, notes, examples, practice, assessment, feedback, and remediation with no blockers.
- [ ] `npm run validate:browser-device` confirms responsive, modal, bidi, recovery, and mobile touch-target contracts.
- [ ] `npm run validate:physical-device` confirms safe-area, install metadata, offline shell, reconnect, speech fallback, and hardware-protocol readiness.
- [ ] `npm run validate:performance` confirms lazy-loading, staged subject banks, focused imports, and deferred account SDK contracts.
- [ ] `npm run validate:classroom-pilot` confirms aggregate metrics, evidence sufficiency, explicit completion and anonymous-export privacy.
- [ ] The automatic postbuild bundle budget passes: entry ≤350 kB, initial JavaScript ≤900 kB, every chunk ≤480 kB.
- [ ] Curriculum, metadata, content-quality, storage, access, feedback, adaptive-subject, and UASA answer checks pass.

## 3. Manual acceptance

- [ ] Core learning journey opens the correct subject and topic.
- [ ] Notes, examples, questions, answers, hints, explanations, and next steps agree.
- [ ] Progress and resume state survive refresh.
- [ ] Arabic RTL text renders correctly.
- [ ] 360 px and 390 px layouts are usable.
- [ ] Keyboard focus, labels, contrast, and tap targets are usable.
- [ ] Speech and audio fallbacks behave safely where supported.
- [ ] Real iPhone Safari passes safe-area, software-keyboard, install, reload, microphone and audio checks.
- [ ] Real Android Chrome passes layout, permission, interrupted-network and install checks.
- [ ] VoiceOver and TalkBack pass reading order, control labels, modal focus and live-status announcements.
- [ ] Physical-device evidence is recorded using `docs/PHYSICAL_DEVICE_ACCEPTANCE_V1_PROTOCOL.md`.
- [ ] Any classroom pilot follows `docs/CLASSROOM_PILOT_P2_PROTOCOL.md`; only the anonymous pilot report is shared with the pilot team.

## 4. Commit and tag

- [ ] Commit the prepared release artifacts and source changes.
- [ ] Create annotated tag `v<package-version>` on that commit.
- [ ] Run `npm run release:check -- --tag v<package-version> --artifacts`.
- [ ] Push the branch and tag.

## 5. Automated deployment

The tag triggers `.github/workflows/deploy.yml`, which must complete these steps in order:

1. Install locked dependencies with `npm ci`.
2. Verify required production environment values.
3. Verify the tag, package, lockfile, and generated artifacts.
4. Run the validation suite.
5. Build the production application.
6. Verify the local HTML-to-asset references.
7. Publish `dist` to GitHub Pages.
8. Smoke-test the public HTML and confirm its entry hash matches the newly built asset.

## 6. Final verification

- [ ] GitHub Actions deploy workflow is green.
- [ ] Public site returns HTTP 200 and loads the new hashed entry asset.
- [ ] Remote branch and peeled tag point to the intended commit.
- [ ] Working tree is clean.
- [ ] A rollback tag or previous known-good tag is recorded.
