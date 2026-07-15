# Icon Render Fix Report

## Summary

The missing result/reward icons on iPhone Safari were coming from literal placeholder strings in the source, not from layout or scoring logic.

## Exact sources found

1. Finish / reward screen in `src/App.jsx`
   - `div className="big bounce"` was rendering a literal `??` placeholder.
   - The finish reward label chain also depended on `getStars()` / `normalizeStars()`, which still returned placeholder-style question marks.

2. Adaptive practice subject icon in `src/App.jsx`
   - Both the fresh adaptive-practice subject and the resumed adaptive-practice subject used `icon: '??'`.

3. Shared dashboard star labels in `src/dashboard/dashboardHelpers.jsx`
   - `getStars()` returned `?` for medium scores.

## Fix applied

- Replaced the finish reward placeholder with an inline SVG badge icon.
- Replaced adaptive practice placeholder icons with an inline SVG badge icon.
- Normalized star labels to safe star glyphs (`★`, `★★`, `★★★`, `☆☆☆`) instead of `?` / `??`.
- Kept layout, scoring, and AI logic unchanged.

## Files modified

- `src/App.jsx`
- `src/dashboard/dashboardHelpers.jsx`

## Validation

- `npm run build` ✅ passed
- Vite still reports the existing large-chunk warning for the main bundle, but the build completed successfully.

## Result

The visible `?` / `??` placeholders in the result/reward UI were removed and replaced with Safari-safe rendering.
