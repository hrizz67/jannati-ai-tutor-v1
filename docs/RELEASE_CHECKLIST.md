# Release Checklist — Jannati AI Tutor v2.0 RC1

Use this checklist before tagging the release candidate.

## Build

- [ ] Run `npm run build`
- [ ] Confirm production build completes without errors
- [ ] Verify generated assets load correctly

## Deployment

- [ ] Confirm deployment target and environment
- [ ] Confirm release notes are approved
- [ ] Confirm rollback plan exists
- [ ] Confirm no emergency fixes are pending

## Subjects

- [ ] Bahasa Melayu content reviewed
- [ ] English content reviewed
- [ ] Matematik content reviewed
- [ ] Sains content reviewed
- [ ] Bahasa Arab content reviewed
- [ ] Pendidikan Islam content reviewed
- [ ] Pendidikan Jasmani & Kesihatan content reviewed

## Speech

- [ ] Bacaan transcript flow verified
- [ ] Bertutur transcript flow verified
- [ ] Quiz microphone flow verified
- [ ] Safari/iPhone speech behavior verified
- [ ] Speech fallback messages verified

## AI

- [ ] AI Explain verified
- [ ] AI Teacher verified
- [ ] Janna/Jati coach copy reviewed
- [ ] Adaptive recommendation verified
- [ ] Narrative layer verified

## Adaptive Learning

- [ ] Adaptive profile loads correctly
- [ ] Recommendation flow remains deterministic
- [ ] Resume flow preserves progress
- [ ] Daily mission and study plan remain stable

## Resume Learning

- [ ] Resume card opens the correct session
- [ ] Resume state survives refresh
- [ ] Malformed resume data falls back safely
- [ ] No duplicate resume writes occur

## Dashboards

- [ ] Home Dashboard verified
- [ ] Student Dashboard verified
- [ ] Parent Dashboard verified
- [ ] Analytics Dashboard verified
- [ ] Revision Dashboard verified

## Parent Dashboard

- [ ] Weekly analytics verified
- [ ] Subject comparison verified
- [ ] Study habit cards verified
- [ ] Recommendation cards verified
- [ ] Timeline verified

## Analytics

- [ ] Weekly trend verified
- [ ] Subject analytics verified
- [ ] Curriculum summary verified
- [ ] UASA readiness verified

## Arabic

- [ ] RTL rendering verified
- [ ] Arabic text renders correctly
- [ ] Arabic coach prompts reviewed
- [ ] Arabic examples reviewed

## Safari

- [ ] iPhone Safari tested
- [ ] iPad Safari tested
- [ ] SpeechRecognition cleanup verified
- [ ] Audio indicator turns off correctly

## Mobile

- [ ] 360px layout checked
- [ ] 390px layout checked
- [ ] Safe-area spacing verified
- [ ] Floating buttons do not overlap actions

## Accessibility

- [ ] Tap targets are usable
- [ ] Focus states are visible
- [ ] Modal close buttons are accessible
- [ ] Keyboard navigation works

## Performance

- [ ] Initial bundle reviewed
- [ ] Large chunks acknowledged
- [ ] Lazy-loaded surfaces still render safely

## QA

- [ ] Question validator passes
- [ ] Curriculum audit reviewed
- [ ] Speech regression validated
- [ ] Smart Question Generator regression validated

## Git

- [ ] Working tree reviewed
- [ ] Release branch confirmed
- [ ] No accidental content changes remain

## Release Tag

- [ ] Tag name agreed
- [ ] Release candidate notes approved
- [ ] Final sign-off recorded

