# V3 Manual Release Checklist

Automated validators do not replace browser/device testing. Mark each item only after it is actually performed.

## Browsers and sizes

- [ ] Desktop Chrome: 1366×768
- [ ] Desktop Chrome: 1440×900
- [ ] Tablet landscape: 1024×768
- [ ] Tablet portrait: 768×1024
- [ ] Mobile Chrome: 320×568
- [ ] Mobile Chrome: 360×640
- [ ] iPhone Safari: 375×667
- [ ] iPhone Safari: 390×844
- [ ] Android Chrome: 412×915

## Core workflow

- [ ] First-run onboarding and student name
- [ ] Select each of the eight subjects
- [ ] Answer, retry, continue, and complete a lesson
- [ ] Refresh during a lesson and resume
- [ ] Switch subject after partial progress
- [ ] Clear progress and reopen the app
- [ ] Browser back/forward and GitHub Pages deep-link refresh

## AI surfaces

- [ ] Tutor AI opens from quiz, dashboard, and finish surfaces
- [ ] First, second, and full-support hint stages
- [ ] One wrong, two wrong, three wrong, and correct-answer flows
- [ ] Empty, long, and unrelated free-text input
- [ ] Rapid repeated send clicks
- [ ] Close and reopen chat without duplicated messages
- [ ] AI Explain and Ajar Saya open/close and return focus
- [ ] Arabic and Jawi content direction and punctuation

## Speech

- [ ] Read-aloud for BM, English, Arabic, and long questions
- [ ] Speech cancellation and repeated play
- [ ] Change question while speaking
- [ ] Close modal while speaking
- [ ] Microphone retry on iPhone Safari
- [ ] Speech-unavailable fallback

## Dashboards and persistence

- [ ] Student summary, mastery, revision, XP, streak, and achievements
- [ ] Parent dashboard with empty, sparse, and complete history
- [ ] Analytics values agree with exercise results
- [ ] Revision item survives refresh and completes once
- [ ] Study planner onboarding and overdue revision
- [ ] Corrupted localStorage recovery

## Minimum sample matrix

- [ ] 20 questions per subject (160 total)
- [ ] 10 wrong-answer Tutor interactions per subject
- [ ] 10 correct-answer Tutor interactions per subject
- [ ] 5 AI Teacher explanations per subject
- [ ] 5 free-text chats per subject
- [ ] 10 resume/refresh scenarios
- [ ] 5 corrupted-storage scenarios

## Sign-off

Tester: ____________________  Date: ____________________

Blocking issues: ______________________________________________________

Final manual recommendation:  
`READY` / `READY WITH NON-BLOCKING WARNINGS` / `NOT READY — RELEASE BLOCKERS FOUND`
