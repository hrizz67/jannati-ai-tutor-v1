# Physical Device Acceptance V1 Protocol

## Status

**READY FOR HARDWARE — NOT RUN**

Automated readiness is not physical-device acceptance. The repository checks and local browser simulation confirm that the required contracts exist, but every physical-device row below remains `NOT RUN` until dated evidence is recorded from real hardware.

## Entry gate

Before using a physical device:

1. Run `npm run validate:physical-device`.
2. Run `npm run validate` and `npm run build`.
3. Use the intended release candidate URL over HTTPS.
4. Export or back up any real learner data before testing recovery flows.
5. Create a clearly named test learner; do not reuse a child's production profile.

## Required device matrix

| Device class | Browser / assistive technology | Primary coverage | Status | Evidence |
| --- | --- | --- | --- | --- |
| Compact iPhone | iPhone Safari | 375 px-class layout, software keyboard, audio and safe area | NOT RUN | — |
| Notched iPhone | iPhone Safari | Notch/Dynamic Island, bottom home indicator, install and reload | NOT RUN | — |
| Android phone | Android Chrome | 360–430 px layout, permissions, install and interrupted network | NOT RUN | — |
| iPhone accessibility | Safari + VoiceOver | Reading order, labels, status announcements and modal focus | NOT RUN | — |
| Android accessibility | Chrome + TalkBack | Reading order, labels, status announcements and modal focus | NOT RUN | — |

Record the exact device model, OS and browser version for every executed row.

## Acceptance scenarios

| ID | Scenario | Expected result | Priority |
| --- | --- | --- | --- |
| PD-01 | Open onboarding and dashboard in portrait | No clipped text, horizontal overflow or unsafe-area collision | P0 |
| PD-02 | Focus name, answer and transcript fields | Software keyboard does not hide the active field or primary action | P0 |
| PD-03 | Complete a quiz and open/close explanation | Hint, feedback and modal remain operable; focus returns safely | P0 |
| PD-04 | Open Arabic notes and answer an Arabic question | Arabic and mixed text preserve correct reading direction | P0 |
| PD-05 | Allow microphone permission | Listening state, transcript confirmation and manual correction work | P0 |
| PD-06 | Deny microphone permission | Clear fallback appears and manual transcript remains usable | P0 |
| PD-07 | Play Malay, English and Arabic audio | Voice plays where installed; unavailable voice gives visible status | P1 |
| PD-08 | Enable Airplane mode during a learning session | Offline notice is announced; local learning and progress continue | P0 |
| PD-09 | Reload the installed app while offline after one online visit | Cached shell opens or a recorded limitation is raised | P0 |
| PD-10 | Restore the network | Reconnect notice appears and a deferred account sync retries safely | P0 |
| PD-11 | Background and resume during a quiz | Current topic/progress returns without duplicate scoring | P0 |
| PD-12 | Navigate with VoiceOver or TalkBack | Controls have meaningful names, logical order and usable focus | P0 |
| PD-13 | Enable reduced motion and large text | Core actions remain visible and non-essential animation is reduced | P1 |
| PD-14 | Add to Home Screen and relaunch | Correct icon/title, portrait shell and safe-area layout are retained | P1 |

## Network interruption procedure

1. Start a quiz while online and answer at least one question.
2. Enable Airplane mode without closing the app.
3. Continue one learning action and confirm local progress remains available.
4. Attempt manual cloud sync and confirm it reports a deferred offline state.
5. Background the app for at least 30 seconds, then resume it.
6. Disable Airplane mode and confirm the restored-connection announcement.
7. Verify that account sync completes without replacing newer local progress.

## Accessibility procedure

For both VoiceOver and TalkBack:

1. Start from the top of the dashboard and swipe through every primary action.
2. Confirm the selected subject, progress values and buttons have understandable names.
3. Open an explanation modal, verify focus enters it, then close it and verify focus returns to `Terangkan`.
4. Trigger offline and online transitions; confirm each status is announced once.
5. Complete one Arabic question and confirm the spoken order is understandable.

## Evidence record

For every scenario, capture:

- Date, tester and release candidate version.
- Device model, OS and browser version.
- PASS, FAIL or BLOCKED result.
- Screenshot / video for layout, permission, offline and accessibility evidence.
- Reproduction steps and severity for every failure.
- Retest evidence after a repair.

Acceptance is complete only when all P0 rows pass on the required device matrix. P1 exceptions require a documented owner, impact and follow-up date.
