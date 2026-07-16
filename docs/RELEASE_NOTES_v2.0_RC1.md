# Release Notes — Jannati AI Tutor v2.0 RC1

## Overview

Jannati AI Tutor v2.0 RC1 is the release candidate for the Year 2 learning platform. This release emphasizes stable learning flows, clearer subject experiences, stronger AI coaching, improved speech support, and production-ready UI polish.

## Major Features

- All 8 Year 2 subjects are available in a unified learning experience.
- Adaptive learning continues to guide practice based on mastery and progress.
- Parent analytics provides a clearer view of learning trends and subject readiness.
- Revision, resume, and daily mission flows remain available across the app.

## AI Features

- AI Explain and AI Teacher provide guided, topic-aware support.
- Janna and Jati personality layers offer more natural learning dialogue.
- Narrative surfaces present friendly daily greetings, encouragement, and progress summaries.
- Coach layers support hints, explanations, and next-step guidance.

## Speech Improvements

- Speech support has been hardened for Safari/iPhone behavior.
- Bacaan, Bertutur, and quiz microphone flows have safer transcript handling.
- Voice features now fall back more gracefully when browser support is limited.

## Content Improvements

- Bahasa Melayu, English, Matematik, Sains, Bahasa Arab, Pendidikan Islam, PJ, and PK were audited.
- Curriculum mapping and subject coverage were reviewed for release readiness.
- Readability, Year 2 suitability, and content consistency were improved through controlled remediation passes.

## UI Improvements

- Dashboard layouts were polished for mobile, tablet, and desktop.
- AI modal behavior was tightened for safer scrolling and header layout.
- Release-blocker visuals such as placeholder glyphs and icon issues were cleaned up.

## Performance Improvements

- Production bundle and chunking behavior were reviewed.
- Large subject and dashboard surfaces were analyzed for safe lazy-loading opportunities.
- Core flows were preserved while reducing avoidable UI risk.

## Subject Coverage

| Subject | Status |
|---|---|
| Bahasa Melayu | Audited and remediated in controlled batches |
| English | Audited and remediated in controlled batches |
| Matematik | Audited and lightly remediated |
| Sains | Audited and lightly remediated |
| Bahasa Arab | Audited and lightly remediated |
| Pendidikan Islam | Audited and lightly remediated |
| Pendidikan Jasmani | Audited and lightly remediated |
| Pendidikan Kesihatan | Audited and lightly remediated |

## Bug Fix Highlights

- Safari transcript regressions were hardened.
- Blank-screen runtime paths were audited and guarded.
- Placeholder glyphs and mojibake-related UI artifacts were cleaned up.
- Resume and speech cleanup paths were stabilized.

## Known Limitations

- Some AI coach copy still uses shared templates across subjects.
- Some content areas remain better covered than others in example variety.
- Bundle size can still be improved further in later releases.

## Next Release

RC1 is intended to freeze the current learning behavior and prepare for production validation. The next release will focus on targeted polish, deeper subject-specific coaching variety, and performance refinements.

