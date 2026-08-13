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
- [ ] Curriculum, metadata, content-quality, storage, access, feedback, adaptive-subject, and UASA answer checks pass.

## 3. Manual acceptance

- [ ] Core learning journey opens the correct subject and topic.
- [ ] Notes, examples, questions, answers, hints, explanations, and next steps agree.
- [ ] Progress and resume state survive refresh.
- [ ] Arabic RTL text renders correctly.
- [ ] 360 px and 390 px layouts are usable.
- [ ] Keyboard focus, labels, contrast, and tap targets are usable.
- [ ] Speech and audio fallbacks behave safely where supported.

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
