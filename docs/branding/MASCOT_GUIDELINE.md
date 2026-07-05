# Jannati Mascot Guideline

## Mascot Roles
- Janna: Friendly learner companion. Use her for welcome moments, encouragement, empty states, rewards, and completion.
- Jati: AI teacher companion. Use him for explanation, teaching, hint, and tutor support moments.

## Moods
- `happy`: positive welcome and steady encouragement.
- `thinking`: reflective help when a learner needs to understand a question.
- `teaching`: AI teacher explanations and guided learning.
- `celebrating`: completion, correct answers, rewards, and progress wins.
- `encouraging`: retry, empty states, and low-pressure next steps.

## Usage Rules
- Use the reusable `Mascot` component for every mascot placement.
- Keep messages short, warm, and Malay-friendly.
- Prefer Janna for learner-facing motivation and Jati for teaching or AI support.
- Do not use mascots as buttons unless the component is intentionally made interactive later.
- Do not place mascots inside dense data tables, legal text, validator output, or technical reports.

## Example Messages
- "Syabas! Teruskan usaha kamu."
- "Mari kita cuba sekali lagi."
- "Guru AI akan bantu kamu faham."
- "Hebat! Kamu semakin mahir."

## Where Mascots Should Appear
- Dashboard welcome card.
- AI Teacher modal.
- AI Explain modal.
- Empty states.
- Congratulations and completion screens.
- Feedback success messages.

## Where Mascots Should Not Appear
- Question stem text.
- Answer option text.
- Curriculum metadata.
- Parent analytics tables with dense records.
- Build, validation, or developer-only reports.

## Asset Foundation
- Placeholder folders live in `public/brand/mascot/janna/` and `public/brand/mascot/jati/`.
- Manifest lives at `public/brand/mascot/mascot-manifest.json`.
- Future artwork should keep the current component API stable: `character`, `mood`, `size`, `showSpeechBubble`, and `message`.
