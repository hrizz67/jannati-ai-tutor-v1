# Jannati AI Tutor v2.0 Beta — Release Notes

## Highlights

- Added a reusable production error boundary
- Lazy-loaded heavier dashboard and AI modal surfaces
- Added browser-only voice support for supported content
- Optimized the Jati mascot asset
- Added release QA documentation

## Files of Note

- `src/components/ProductionErrorBoundary.jsx`
- `src/components/VoiceButton.jsx`
- `src/ai/voice/*`
- `src/dashboard/HomeDashboard.jsx`
- `src/App.jsx`

## QA Notes

- Malay copy remains the default fallback
- Speech uses the browser SpeechSynthesis API only
- Error fallback keeps the rest of the app usable

## Known Limitations

- Browser voice support varies by device and browser
- Lazy-loaded areas show a short loading fallback

## Deployment Checklist

- Run `npm run build`
- Verify the quiz, finish screen, parent dashboard, and AI modals
- Confirm voice buttons appear only where supported
