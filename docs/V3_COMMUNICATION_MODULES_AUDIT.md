# V3 Communication Modules Audit

## Scope

Bacaan, Bertutur, Mendengar and Menulis remain offline-first and use the existing speech/manual fallbacks. Arabic samples are stored as genuine UTF-8 Arabic text and rendered with `lang="ar"`/RTL attributes.

## Content pools

Each language entry now owns a deterministic session pool: Bacaan 30 items, Bertutur 40 prompts, Menulis 50 exercises and Mendengar 12 mixed tasks. IDs are derived from the language id and item number, preventing collisions. The compact language selector still shows one tab per language; pool metadata is available to the session layer without changing the current workflow.

## Safety checks

- no replacement-character or known Arabic mojibake literals remain in `App.jsx`;
- speech recognition and synthesis retain unsupported-browser fallbacks;
- audio elements do not use an empty source;
- result fields are normalized before display;
- manual input remains available when Safari recognition is unavailable.

## Limitation

The current UI still presents the existing compact activity controls. Real-device testing is required to confirm five consecutive sessions rotate through pool items and that microphone/audio cancellation behaves correctly on iPhone Safari.
