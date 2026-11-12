# P2.6-F4 — Physical Tutor accessibility acceptance (OWNER-ONLY, NOT RUN)

**Release decision:** **NO-GO** for real children and paid users. No actual iPhone, iPad,
Android device, native browser zoom, VoiceOver, or TalkBack test has been
observed or verified here. Synthetic Chromium QA and JSDOM are necessary
engineering evidence but are **not** substitutes for screen-reader acceptance.

## Version and safety preconditions

1. Use a dedicated tester-approved **isolated QA preview** origin, NOT
   `hrizz67.github.io` and NOT production. Use a reviewed exact Git SHA
   and include it visibly in every evidence capture.
2. Confirm `__QA_PREVIEW_BUILD__` is true. Preview must contain **no**
   Supabase URL/key, STT endpoint, Quiz STT Worker, remote AI, auth credential,
   cloud writes, active paid account, or real learner data. Test only an
   invented guest profile and authored synthetic exercise. If any dependency
   cannot be verified, stop; do not switch to live production.
3. This document is an execution checklist, not authorization to publish a
   preview. External preview hosting requires separately approved origin,
   owner-managed access allowlist and no automatic deployment.
4. Record device name/model, OS version, exact browser version, build SHA,
   viewport width at 100%/200%, input mode, tester, date/time, and a short
   sanitized recording or screenshot per check (no personal data/face/audio).
5. Do not test speech recognition or send child voice data to third-party
   browser services. Voice input and Quiz STT remain **OFF**.

## Manual acceptance matrix (each row starts NOT RUN)

| ID | Device and conditions | Procedure | Expected/stop criterion | Status |
| --- | --- | --- | --- | --- |
| F4-IOS-01 | iPhone Safari, portrait then landscape | Open synthetic Tutor, scroll through 16 long alternating messages, keep reading while a new reply is added | Transcript remains scrollable/readable, new reply does not steal position; no horizontal page scroll | NOT RUN |
| F4-IOS-02 | iPhone Safari, text enlargement and 200% Safari page zoom where supported | Enlarge system text and/or browser zoom; open chat in portrait/landscape, inspect title, question, disclosure, input, send/close and history | Critical actions, warning and readable conversation remain available, no clipped controls | NOT RUN |
| F4-IOS-03 | iPhone with VoiceOver | Rotor/navigate landmarks, headings and controls; locate named chat-history region, follow each message, return to composer; navigate unread reply | Focus order logical, names meaningful for BM/BI/Arabic, current answer announced exactly once, no stale/duplicate live announcements, no unexpected focus shift | NOT RUN |
| F4-AND-01 | Android Chrome, portrait then landscape | Scroll long chat, open a Tutor tool panel, type and send a synthetic BM/BI/Arabic prompt | 44px minimum actionable controls where designed, composer not hidden by keyboard, no horizontal overflow | NOT RUN |
| F4-AND-02 | Android with TalkBack | Navigate to named transcript region, traverse messages and return to input; trigger one fake Tutor answer | Roles/names and spoken language intelligible, single polite response announcement, no focus trap escape | NOT RUN |
| F4-KBD-01 | Desktop Chrome, hardware keyboard only | Tab/Shift+Tab through Tutor; scroll transcript with PageUp/Down and arrows; Escape; reopen | Trap forward/reverse within dialog, reading position preserved, Escape restores opener focus | NOT RUN |
| F4-ZOOM-01 | Desktop Chrome, **native** browser zoom 200% and 400% | Test Tutor at 1280 CSS px base with native zoom; check effective innerWidth and visual wrapping | Content reflows without loss of actions/instructions; no two-dimensional scrolling for core content | NOT RUN |
| F4-AT-01 | VoiceOver or TalkBack, Arabic example | Switch to Arabic subject, hear instructions with punctuation and diacritics, traverse responses and quick replies | Correct reading order and understandable utterances; no English/BM language mispronunciation of Arabic instruction | NOT RUN |

## Recording evidence

For each item, copy and fill this record in a review comment or attached report:

```text
Check ID:
Result: PASS | FAIL | BLOCKED | NOT RUN
Tester and date:
Device / OS / browser / browser version:
Exact SHA + QA build banner:
Viewport and native zoom setting:
Procedure and expected result:
Actual behavior (objective):
Reproduction steps and sanitized screenshot/video link:
P0/P1/P2 severity (if failed):
Linked remediation PR and verification SHA:
```

Do not mark PASS without actual observable evidence from the specified device
and assistive technology. An unreadable screenshot, missing exact SHA,
missing native-zoom value, or missing assistive-technology confirmation is
**BLOCKED** rather than PASS.

## Engineering gates already available

- F1: mounted JSDOM labels, focus behavior, target-size CSS contract.
- F2: isolated Chromium browser fixture; validates one live announcer,
  transcript focus and real scroll, no answer key reveal, no external
  application fetch/XHR, geometry and 44px targets.
- F3: CDP actual CSS viewport tests for 320/390px and landscape.
- F4 candidate: reverse Shift+Tab, Escape restoration and 200% root-text
  simulation at 320x640. This is **not** native zoom or screen-reader evidence.

## Decision authority and release barrier

An independent reviewer must cross-check every physical test row, unresolved
P0/P1 issues and the exact tested SHA. Until physical acceptance and an
explicit owner authorization, retain **MERGE-HOLD** for all Draft PRs; no
tag, release, deployment, Gate A2, child pilot, payment, remote generative AI,
or Quiz STT Worker.
