# Jannati AI Tutor Brand Guideline

## Official Name

Use `Jannati AI Tutor` as the full product name. Use `Jannati` only when space is limited, such as app icons, compact sidebar labels, and short navigation labels.

## Logo System

- Primary logo: `public/brand/logos/jannati-logo.svg`
- Square logo: `public/brand/logos/jannati-icon.svg`
- Manifest icon: `public/brand/icons/icon.svg`
- Favicon: `public/brand/icons/favicon.svg`

The old root-level `public/logo.svg` and `public/favicon.svg` files are compatibility aliases and should not be used for new references.

## Official Colour Palette

| Token | Hex | Use |
| --- | --- | --- |
| Jannati Primary | `#087A3B` | Main buttons, headings, progress, active navigation |
| Jannati Primary 2 | `#0EA75A` | Gradients and positive accents |
| Jannati Gold | `#F4C542` | Rewards, highlights, selected states |
| Jannati Soft | `#EAFFF0` | Soft panels and positive feedback backgrounds |
| Jannati Background | `#F8FFF8` | App background |
| Jannati Ink | `#1F2937` | Main text |
| Jannati Muted | `#6B7280` | Secondary text |
| Jannati Border | `#DFE8E2` | Borders and separators |

Use the CSS custom properties in `src/styles/style.css` instead of introducing new brand colours.

## Mascots

The official mascot folders are reserved at:

- `public/brand/mascots/janna`
- `public/brand/mascots/jati`

Do not place temporary production artwork outside these folders once official mascot files are approved.

## UI Rules

- All product identity surfaces must use the shared `BrandLogo` component in `src/App.jsx`.
- Do not reintroduce standalone robot emoji as the Jannati product logo.
- Feature icons may still be used for subjects and learning modes, but they should not replace the official product mark.
