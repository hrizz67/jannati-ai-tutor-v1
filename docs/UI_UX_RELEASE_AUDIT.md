# UI/UX Release Candidate Audit

Project: Jannati AI Tutor v2.0 Beta

Date: 2026-07-15

Scope: UI/UX audit only. No business logic, AI, curriculum, or question-bank changes were made.

## Executive summary

The application is broadly in good release shape: the major dashboard surfaces are componentised, lazy loading is in place for large modal and dashboard chunks, and the core app shell is protected by production error boundaries. Responsive support and safe-area offsets are already present in the stylesheet, and the production build passes.

The main release blocker for polish is a visible encoding issue in the AI modal close controls. The app is usable, but this is a high-visibility UI defect that should be corrected before freezing the release candidate.

## Scores

- Overall UI score: 84/100
- Consistency score: 82/100
- Accessibility score: 80/100
- Responsive score: 81/100
- Production readiness: 78/100

## Critical issues

1. Corrupted close-button glyph in the AI Explain and AI Teacher modals.
   - File(s): `src/components/ai/AIExplainModal.jsx`, `src/components/ai/AITeacherModal.jsx`
   - Evidence: the close button renders a mojibake character instead of a clean icon/label.
   - Impact: visible on a primary interaction surface; reduces polish and can confuse users.

## High issues

1. AI modal content is dense on smaller screens.
   - File(s): `src/components/ai/AIExplainModal.jsx`, `src/components/ai/AITeacherModal.jsx`, `src/styles/style.css`
   - Why it matters: the modal uses multiple stacked sections, lists, and footer actions. The structure is functional, but it needs careful mobile QA to avoid clipped content or awkward scroll behaviour on small devices.

2. Speech-focused screens are visually complex and should be verified on iPhone Safari and Android Chrome.
   - File(s): `src/App.jsx`
   - Surfaces: Bacaan, Bertutur, Mendengar, Menulis
   - Why it matters: these surfaces include microphone controls, status feedback, resume state, and long instructional copy. They are the highest-risk areas for accidental overflow or cramped spacing.

3. Dashboard metric pages are content-heavy and need device-by-device review.
   - File(s): `src/dashboard/*.jsx`, `src/components/MetricCard.jsx`
   - Surfaces: Parent Dashboard, Analytics Dashboard, Revision Dashboard, Student Dashboard
   - Why it matters: the cards are responsive, but many metrics are stacked into long scrolling regions, which can create visual density on tablets and narrow phones.

## Medium issues

1. Mixed visual language across status indicators.
   - File(s): `src/App.jsx`, `src/dashboard/*.jsx`
   - Notes: the UI mixes text badges, emoji-style icons, and numeric pills. This is not broken, but the presentation is not fully uniform across all surfaces.

2. Some surfaces still rely on long Malay copy blocks.
   - File(s): `src/dashboard/AnalyticsDashboard.jsx`, `src/dashboard/ParentDashboard.jsx`, `src/dashboard/HomeDashboard.jsx`
   - Notes: copy is generally good, but a few cards can wrap into taller blocks on mobile and should be checked for rhythm and whitespace.

3. Speech feedback and completion states need final real-device confirmation.
   - File(s): `src/App.jsx`
   - Notes: the code has safety guards, but the real risk is the interplay between status text, transcripts, and button states on mobile browsers.

## Low issues

1. The dashboard shell and loading states are well structured, but some fallback cards are visually basic.
   - File(s): `src/App.jsx`, `src/dashboard/HomeDashboard.jsx`

2. A few icon-only or compact elements should be checked for tap target comfort.
   - File(s): `src/components/VoiceButton.jsx`, `src/components/MascotCard.jsx`, `src/components/BrandLogo.jsx`

## Screens reviewed

### Already release-ready

- Home Dashboard
- Student Dashboard
- Parent Dashboard
- Revision Dashboard
- Analytics Dashboard
- Loading screens / skeletons
- Settings panel
- Subject selection flows
- Resume shell and recovery handling
- Production error boundary coverage

### Screens requiring polish

- AI Explain Modal
- AI Teacher Modal
- Bacaan
- Bertutur
- Mendengar
- Menulis
- Finish screen
- Resume overlay / restore flows
- Parent analytics detail cards
- Speech control surfaces

## Accessibility review

Strengths:

- Production error boundary is in place for core surfaces.
- Modal dialogs declare `role="dialog"` and `aria-modal="true"`.
- Voice controls use labelled buttons and are hidden when unsupported.
- Safe-area offsets are present in the stylesheet for mobile browser chrome.

Risks:

- Some compact controls and icon buttons should still be checked on touch devices for tap comfort.
- Dense modal content could become difficult to navigate with zoomed text or larger system font settings.
- Arabic rendering support exists, but RTL-heavy screens should still be confirmed visually on mobile and tablet.

## Responsive review

Strengths:

- The styles include multiple breakpoint rules for dashboard grids, footers, modals, and speech controls.
- Safe-area-aware spacing is already used for bottom-right floating UI and the app footer.
- Lazy-loaded dashboard chunks reduce initial rendering pressure.

Risks:

- Long Malay strings can still create tall cards or multi-line labels on smaller phones.
- AI modal bodies are scrollable, but the content density means vertical rhythm should be checked on iPhone Safari and Android Chrome.
- Speech screens need careful verification in portrait and landscape to confirm buttons do not crowd the viewport.

## Production readiness assessment

The UI is close to release-candidate quality and is structurally solid. The biggest remaining polish issue is the corrupted close-button glyph in the AI modal surfaces. After that, the remaining work is mostly device-specific visual QA on speech and modal surfaces.

Recommendation: conditional release readiness, with a final polish pass for the AI modal close control and mobile QA on speech-heavy surfaces.

## Suggested screenshots

- AI Explain modal on desktop and iPhone Safari
- AI Teacher modal on desktop and iPhone Safari
- Bacaan, Bertutur, Mendengar, and Menulis on iPhone Safari
- Parent Analytics on tablet and mobile
- Finish screen on desktop and mobile

## Validation

Build result:

- `npm run build` ✅ passed
- Build output:
  - `dist/assets/index-CuIZUhpz.js` ~498.26 kB
  - lazy dashboard/modal chunks are present and split
  - production CSS and subject chunks were generated successfully

