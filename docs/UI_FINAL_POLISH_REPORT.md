# UI Final Polish Report

Project: Jannati AI Tutor v2.0 Beta  
Date: 2026-07-15

## Files modified

- `src/dashboard/dashboardHelpers.jsx`
- `src/styles/style.css`

## Overlap issue resolved

- The Subject Selection cards were rendering the subject title twice: once in the illustration block and once as the main card title.
- I changed the illustration block to render only the subject icon, so the title now appears only once.
- The progress bar, mastery percentage, topic count, and button layout were preserved.

## Speaker icon changes

- Reduced the visual weight of the voice/speaker control by shrinking the icon and tightening the internal spacing.
- Kept the button at a minimum 44px touch target.
- Kept the label more prominent so the action reads clearly on mobile.

## Floating button changes

- Moved the `Maklum Balas Beta` floating button slightly farther from the bottom-right edge on small screens.
- Kept safe-area-aware spacing.
- Preserved floating visibility while reducing overlap risk on narrow viewports.

## Build result

- `npm run build` ✅ passed

## Remaining UI risks

- Speech-heavy screens still deserve real-device QA on iPhone Safari and Android Chrome, especially with long transcripts and the mobile keyboard open.
- Very long Malay content can still create dense cards on the smallest phones, so final visual spot checks are still worthwhile.

