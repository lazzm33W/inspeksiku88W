# Design Brief

## Direction

Pit Lane — a warm "workshop paper" inspection tool: printed work-order document crossed with a precision instrument panel, built for mechanics standing at a car with a phone in one hand.

## Tone

Industrial-utilitarian meets editorial restraint — tactile paper surfaces, hairline rules, and instrument-grade monospace, with zero decoration that does not carry information.

## Differentiation

The license-plate chip: every report is anchored by an embossed, letter-spaced monospace plate badge with a heavy bottom rule — the interface reads as a stack of physical work orders, not a generic dashboard.

## Color Palette

| Token      | OKLCH        | Role                                                        |
| ---------- | ------------ | ----------------------------------------------------------- |
| background | 0.972 0.008 85 | warm off-white workshop paper, the default canvas           |
| foreground | 0.22 0.028 258 | deep ink navy for all text, high legibility                 |
| card       | 0.995 0.004 85 | near-white report sheet, lifts off the paper background     |
| primary    | 0.30 0.062 258 | deep ink navy — headers, structural bars, primary text CTA  |
| accent     | 0.88 0.185 122 | signal chartreuse — primary action + active state only      |
| muted      | 0.935 0.012 85 | recessed paper wells, metadata rows, inactive surfaces      |
| success    | 0.55 0.145 152 | status "OK"                                                 |
| warning    | 0.70 0.155 70  | status "Perlu Perhatian"                                     |
| destructive | 0.53 0.20 27  | status "Harus Diganti"                                       |

## Typography

- Display: Space Grotesk — page/section headings, report titles, vehicle names, big summary numbers
- Body: Figtree — paragraphs, form labels, checklist item text, buttons
- Mono: Geist Mono — plate numbers, Rupiah amounts, dates, counts, uppercase eyebrow labels
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl md:text-3xl font-bold tracking-tight`, label `text-[11px] font-mono uppercase tracking-[0.18em]`, body `text-base`

## Elevation & Depth

Almost no shadow — depth comes from layered paper tones (`background` → `card` → `popover`) plus 1px hairline borders; only the sticky header and floating action button use `shadow-elevated`.

## Structural Zones

| Zone    | Background          | Border       | Notes                                                                 |
| ------- | ------------------- | ------------ | --------------------------------------------------------------------- |
| Header  | `bg-primary` (ink)  | none         | Sticky; mono eyebrow label + display title in `primary-foreground`    |
| Content | `bg-background`     | —            | Cards on `bg-card`; alternate summary band on `bg-muted/40`           |
| Footer  | `bg-muted/40`       | `border-t`   | Quiet utility strip; action bar is a floating chartreuse button       |

## Spacing & Rhythm

Sections separated by `space-y-6`/`gap-6`; cards use `p-4 sm:p-5` with `gap-3` internal rhythm; checklist rows are dense at `py-3` divided by hairlines; page gutter `px-4 sm:px-6` with `max-w-3xl` reading column.

## Component Patterns

- Buttons: `rounded-md`, ink-navy fill for default, signal chartreuse for the single primary action, ghost/outline for secondary; hover shifts surface tone, never color hue
- Cards: `rounded-md bg-card border shadow-subtle`, plate chip in the top-left, status pill row at the bottom
- Badges: pill-shaped, tinted semantic background at low opacity with solid semantic text — green OK, amber Perlu Perhatian, red Harus Diganti
- Inputs: `rounded-md border-input bg-card`, focus ring in ink navy, mono for plate/currency fields

## Motion

- Entrance: report cards `animate-rise` with 40ms stagger; page sections `animate-fade-in` 300ms
- Hover: `transition-smooth` (300ms) on border tone and surface tint only — no scale, no lift
- Decorative: `animate-pulse-soft` reserved for upload progress and loading skeletons

## Constraints

- All copy in Bahasa Indonesia; no English UI strings
- No login, no account surfaces, no public share links — sharing is WhatsApp handoff only
- Prices are Rupiah only, formatted `Rp 1.250.000`, never converted
- No PDF export, no digital signature, no reusable checklist templates, no damage-location diagram — do not reserve UI space for them
- Photos come from device camera or gallery upload only; no stock imagery in the product UI
- Never use raw color literals or arbitrary color classes — semantic tokens only

## Signature Detail

The plate chip (monospace, uppercase, `tracking-[0.18em]`, double border with a heavy bottom rule) turns every report into a recognizable work-order artifact — a material/typographic signature.
