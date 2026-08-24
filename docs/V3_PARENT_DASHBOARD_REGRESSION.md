# V3 Parent Dashboard Regression

## Sections Verified

- Summary
- Subject Mastery
- Focus Topics
- AI Recommendations
- Revision Schedule
- Recent Activity
- UASA History

## Scenario Results

| Scenario | Render Time (ms) | Progress Bars | Buttons | Empty-State Signals |
| --- | ---: | ---: | ---: | ---: |
| complete | 408.67 | 7 | 9 | 12 |
| sparse | 190.98 | 7 | 9 | 24 |
| empty | 56.11 | 0 | 2 | 18 |
| malformed | 51.21 | 7 | 9 | 24 |

## Empty-State Behaviour

- Brand-new student: PASS
- Zero questions answered: PASS
- Partial history: PASS
- Sparse adaptive data: PASS
- No broken cards: PASS
- No placeholder junk: PASS

## Overflow / Responsive Audit

- Long Malay topic names: PASS
- English text: PASS
- Arabic text: PASS
- Jawi text: PASS
- Long recommendations: PASS
- No horizontal overflow indicators found in server-rendered markup: PASS

## Accessibility Audit

- Tab navigation: supported by button semantics
- Escape behaviour: inherited from modal flow; no dashboard-specific trap found
- Screen-reader labels: progress bars include aria-label + aria-valuenow
- Heading hierarchy: PASS
- Important meaning does not depend on colour alone: PASS

## Performance Summary

| Section | Average Render / Eval Time (ms) |
| --- | ---: |
| summary | 2.76 |
| recommendation | 187.48 |
| revision | 143.47 |

- Average dashboard render: 176.74 ms

## Issues Found

1. Initial subject selection now prefers the first subject with data, avoiding an empty default on partial-history profiles.
2. Unicode-safe copy has been validated in the dashboard output and regression script.

## Fixes Applied

- Default subject selection now opens on the first available subject with data.
- Dashboard regression checks now run through Vite SSR so JSX can be loaded safely from Node.

## Mock-Data Policy

- Development can still use mock data for local testing.
- Production with no history remains empty-state only.
- No mock progress is silently shown in production.

## Manual Test Checklist

- Complete profile
- Sparse profile
- Empty profile
- Malformed numeric values
- Long Malay topic labels
- Arabic/Jawi text rendering
- Tablet layout
- Mobile layout
- Landscape layout

## Build Status

Validation script passed. Build passed.
