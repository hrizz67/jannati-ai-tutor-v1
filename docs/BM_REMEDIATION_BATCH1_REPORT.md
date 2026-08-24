# Bahasa Melayu Remediation Batch 1 Report

Date: 2026-07-14

## Scope

- Controlled remediation batch for high-impact Bahasa Melayu stems only.
- No question answers were changed.
- No accepted answers were changed.
- No curriculum metadata was changed.
- No AI logic, scoring, or adaptive behavior was changed.
- No repository-wide stylistic rewrite was performed.

## Files Modified

- `src/data/subjects/bm.js`
- `reports/validation/bm-style-report.json`

## Questions Changed

- 85 question records updated.
- Focus area:
  - `BM-PEMAHAMAN_PENULISAN-056` to `BM-PEMAHAMAN_PENULISAN-110`
  - `BM-AYAT-001` to `BM-AYAT-030`

## What Changed

### Stem Variations Introduced

The batch reduced repetition in the two highest-frequency stem groups:

- `Baca ayat`
- `Apakah jenis ayat ini`

New Year 2-friendly variants were used where the task meaning stayed the same:

- `Baca ayat berikut.`
- `Perhatikan ayat ini.`
- `Teliti ayat di bawah.`
- `Kenal pasti jenis ayat berikut.`
- `Ayat ini tergolong dalam jenis yang mana?`
- `Pilih jenis ayat yang betul.`
- `Tentukan jenis ayat di bawah.`

### DBP Corrections

- No high-confidence DBP spelling or grammar corrections were applied in this batch.
- The controlled pass focused on stem diversity and prompt hygiene.

### Hint / Explanation Improvements

- No hint or explanation rewrites were included in this batch.
- Existing hints and explanations were preserved.

## Validation Metrics

### Before Batch

From the previous validation snapshot:

- Questions scanned: 800
- Unique stems: 678
- Repeated stem groups: 15
- Repeated hint templates: 788
- Repeated explanation templates: 768
- Non-DBP issues: 153
- Robot-like issues: 1
- Total issues: 1726

Target stem frequencies before the batch:

- `Baca ayat`: 55
- `Apakah jenis ayat ini`: 30

### After Batch

From the latest validation run:

- Questions scanned: 800
- Unique stems: 746
- Repeated stem groups: 30
- Repeated hint templates: 788
- Repeated explanation templates: 768
- Non-DBP issues: 153
- Robot-like issues: 1
- Total issues: 1742

Current exact opener counts after the batch:

- `Baca ayat` starts: 19
- `Apakah jenis ayat ini` starts: 0

## Validator Notes

- `node scripts/validate/bmStyleValidator.mjs` completed successfully.
- `node scripts/validate/questionValidator.js` completed successfully with `0 errors, 6 warnings, 0 info`.
- The warnings remain outside this batch scope.

## Uncertain Issues Left Unchanged

- No low-confidence DBP items were auto-fixed.
- No broad rewrite was attempted on the remaining repeated stem groups, since this batch was limited to the safest high-frequency prompts.

## Build Result

- `npm run build` passed successfully.
- Vite completed the production build with only chunk-size warnings.

## Change Log Summary

- Reworded 85 question stems for variety and reduced repetition.
- Fixed two malformed Ayat Tanya prompts introduced during the rewrite pass.
- Preserved answers, accepted answers, hints, explanations, and curriculum metadata.
