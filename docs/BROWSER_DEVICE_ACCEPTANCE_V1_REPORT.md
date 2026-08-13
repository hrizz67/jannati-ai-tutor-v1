# Browser & Device Acceptance V1

## Outcome

The local browser acceptance baseline passes after three targeted repairs. The tested learning journey is usable at desktop, 390 px, and 360 px widths with no horizontal overflow, no fresh browser-console errors, accessible modal behaviour, and bidirectional answer support.

| Area | Evidence | Result |
| --- | --- | --- |
| Onboarding | Welcome → learner name → Year 2 → Free start | Pass |
| Dashboard | Subject navigation, learning summary, resume card, and primary actions | Pass |
| Core quiz | Hint, wrong answer, correct answer, explanation, retry, and next action | Pass |
| AI explanation modal | Dialog semantics, focus boundary, Escape close, focus restoration, and background inert state | Pass |
| Responsive 360 px | 360 × 800 viewport, no horizontal overflow, critical controls at least 44 px | Pass |
| Responsive 390 px | 390 × 844 viewport, no horizontal overflow, critical controls at least 44 px | Pass |
| Bahasa Arab | Arabic notes and quiz load correctly; question, answer, transcript, and feedback surfaces preserve automatic bidi direction | Pass |
| Reload and resume | Reload returns safely to the dashboard and exposes the interrupted Arabic topic through the resume card | Pass |
| Free/Premium boundary | Premium feature opens a clear access notice and returns safely to learning | Pass |
| Browser console | Fresh retest produced no error or warning entries | Pass |

## Repairs from the browser run

### React inert state

The application shell previously passed an empty string to React's boolean `inert` attribute. React reported a browser-console error whenever an AI modal opened.

The shell now uses a real boolean. Opening a modal sets `inert` and `aria-hidden="true"`; closing it removes both attributes and restores focus to the triggering button.

### Mobile touch targets

The account action was 38 px high and the two subject navigation arrows were 40 px high at the mobile breakpoint. All three are now at least 44 px at both tested mobile widths.

### Arabic and mixed-direction answers

The main quiz question, answer input, speech transcript, correct-answer feedback, and explanation text now use automatic bidirectional direction where learner-authored or subject-authored text can be Arabic, Malay, or mixed.

## Automated contract

Run:

```text
npm run validate:browser-device
```

The validator contains nine deterministic contracts covering:

1. Document language and responsive viewport metadata.
2. Onboarding and core learning actions.
3. Free/Premium recovery copy.
4. Modal dialog, Escape, Tab, body lock, and focus restoration behaviour.
5. Boolean background inert handling.
6. Bidirectional question and answer handling.
7. Live speech status and voice fallback semantics.
8. Error-boundary recovery surfaces.
9. Minimum 44 px mobile targets for critical compact controls.

This audit is part of `npm run validate` through `prevalidate`.

## Test environment

- Local Vite application served from the current source tree.
- Codex in-app browser.
- Default desktop viewport and explicit 390 × 844 and 360 × 800 overrides.
- Existing Free learner profile with a real Bahasa Melayu and Bahasa Arab quiz flow.

## Remaining physical-device boundary

V1 establishes the deterministic and local-browser baseline. These items still require physical hardware or browser-specific manual acceptance:

- iPhone Safari safe-area and dynamic browser chrome.
- Real microphone permission and speech-recognition behaviour.
- Voice playback through actual speakers or headphones.
- Slow, interrupted, and offline mobile networks.
- Screen-reader testing with VoiceOver or TalkBack.

These remain release-checklist items and should not be represented as automated passes.
