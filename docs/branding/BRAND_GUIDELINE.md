# Jannati AI Tutor Brand Guideline

## Logo Usage

Use `src/components/BrandLogo.jsx` for all app identity placements. Do not reference logo image paths directly inside screens.

- Full logo: splash/login and large official surfaces.
- Horizontal logo: footer, loading screen, install-style surfaces and constrained headers.
- Icon logo: sidebar, dashboard cards, AI Tutor, parent dashboard and empty states.
- Monochrome logo: dark or single-colour usage.

Minimum sizes:

- Icon: 32px.
- Horizontal logo: 140px wide.
- Full logo: 180px wide.

## Colour Palette

| Token | Hex | Usage |
| --- | --- | --- |
| Primary Green | `#087A3B` | Primary actions, headings, active navigation |
| Secondary Green | `#0EA75A` | Gradients, progress, positive accents |
| Accent Gold | `#F4C542` | Rewards, highlights, selected states |
| White | `#FFFFFF` | Cards, text on dark surfaces |
| Dark Gray | `#1F2937` | Main text and dark-mode logo usage |

All app branding colours are centralised in `src/styles/brand.css`.

## Typography

- Headings: Arial/Helvetica, 800 weight.
- Body: Arial/Helvetica, regular weight.
- Buttons: Arial/Helvetica, 700-800 weight.
- Dashboard labels: compact uppercase where already used by `.eyebrow`.
- Footer: compact metadata text with the horizontal logo.

## Spacing

Use the brand spacing tokens in `src/styles/brand.css`:

- `--brand-space-xs`: 4px
- `--brand-space-sm`: 8px
- `--brand-space-md`: 16px
- `--brand-space-lg`: 24px
- `--brand-space-xl`: 32px

## Light Mode

Use the full-colour logo on white, soft green and light gold backgrounds. Maintain clear space around the logo equal to at least half the icon width.

## Dark Mode

Use the monochrome logo with the `light` prop on dark green or dark gray backgrounds. Avoid placing the full-colour logo on low-contrast dark surfaces.

## Examples

```jsx
<BrandLogo full size="lg" />
<BrandLogo horizontal size="sm" />
<BrandLogo iconOnly />
<BrandLogo light horizontal />
```
