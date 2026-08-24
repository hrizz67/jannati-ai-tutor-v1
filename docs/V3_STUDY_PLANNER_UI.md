# V3 Study Planner UI

## Component structure

- `StudyPlannerPanel.jsx`
  - Top-level read-only planner section
  - Renders summary chips, today’s plan, weekly plan, and parent summary notes
- `DailyPlanCard.jsx`
  - Displays today’s study plan
  - Handles onboarding and empty states
- `WeeklyPlanList.jsx`
  - Displays all 7 days in a compact expandable list
  - Uses native `<details>` / `<summary>` for light interaction
- `StudyBlockItem.jsx`
  - Renders a single study block with safe labels and duration formatting

## Planner output mapping

Technical planner values are mapped to parent-friendly labels:

| Technical value | UI label |
| --- | --- |
| `review` | Ulang kaji |
| `practice` | Latihan |
| `challenge` | Cabaran |
| `revision` | Pengukuhan |
| `high` | Keutamaan tinggi |
| `medium` | Keutamaan sederhana |
| `low` | Keutamaan rendah |

Duration is clamped safely before rendering:

- `10` → `10 minit`
- `20` → `20 minit`
- `60` → `1 jam`

## Daily plan UI

The daily panel shows:

- subject
- topic
- reason
- duration
- priority
- activity type

If the profile is brand new, the UI clearly labels the content as a starter plan and keeps onboarding topics visible.

## Weekly plan UI

The weekly panel shows:

- day label
- subject list
- total minutes
- number of blocks

Each day can expand compactly using native disclosure controls, which keeps the layout lightweight and responsive.

## Onboarding behavior

When the planner receives an empty or brand-new profile:

- no fake weakness is shown
- the plan is clearly marked as a starter plan
- friendly guidance is shown instead of empty technical state
- onboarding topics from the planner output remain visible

## Error states

The UI handles:

- no profile
- sparse profile
- service failure
- partial daily plan
- partial weekly plan
- malformed blocks

The rendering layer avoids exposing:

- `undefined`
- `null`
- `NaN`
- `[object Object]`

## Accessibility

- Semantic headings are used for each panel
- Progress and summary content is text-readable
- Priority is shown with text labels, not colour alone
- Native disclosure controls remain keyboard-safe
- No focus traps are introduced

## Responsive notes

- The layout is suitable for mobile, tablet, and desktop
- Long Malay topic names remain wrapped in compact cards
- English subject labels are preserved
- Arabic / Jawi labels flow through the same safe text path
- The weekly plan stays readable without horizontal overflow

## Validation snapshot

- Dashboard surface used: Parent Dashboard
- Integrated sections:
  - Pelan Hari Ini
  - Pelan Mingguan
- Study planner simulation: PASS
- Study planner UI audit: PASS
- Build: PASS

