# OFFSHIFT — Website Color + Style Guide

## Goals

- Define the visual tone so every page feels like the same brand: dark, luxe, confident.
- Keep the palette small and purposeful — black canvas, white type, one signature red.
- Every design decision should feel premium, editorial, and human.

---

## Brand Adjectives

Luxe · Confident · Editorial · Nightlife-meets-craft · Modern · Human · Exclusive

---

## Color Palette

| Role              | Token             | Value                          | Usage                                           |
|-------------------|-------------------|--------------------------------|--------------------------------------------------|
| **Background**    | `--black`         | `#0a0a0a`                      | Page body, default canvas                        |
| **Surface**       | `--dark`          | `#111111`                      | Section backgrounds, elevated layers             |
| **Card**          | `--dark-card`     | `#161616`                      | Pro cards, content cards, modals                 |
| **Border**        | `--dark-border`   | `#2a2a2a`                      | Subtle dividers, card borders                    |
| **Primary text**  | `--white`         | `#f5f5f5`                      | Body copy, headings                              |
| **Pure white**    | `--white-pure`    | `#ffffff`                      | Button labels on red, high-contrast moments      |
| **Accent**        | `--red`           | `#c8102e`                      | CTAs, logo swirl, active states, badges          |
| **Accent glow**   | `--red-glow`      | `rgba(200, 16, 46, 0.3)`      | Button shadows, hover halos                      |
| **Accent subtle** | `--red-subtle`    | `rgba(200, 16, 46, 0.08)`     | Active filter backgrounds, tinted surfaces       |
| **Muted text**    | `--gray`          | `#888888`                      | Secondary copy, timestamps, descriptions         |
| **Light gray**    | `--gray-light`    | `#aaaaaa`                      | Filter labels, placeholder-adjacent text         |
| **Dark gray**     | `--gray-dark`     | `#333333`                      | Placeholders, faint dividers                     |

### Usage Rules

- **Red (`--red`)** is reserved for actions and brand moments — buttons, the logo swirl, active category chips, rating stars. Limit to one dominant red element per viewport.
- **Background is always `--black`**. Never use white or light backgrounds.
- **Cards** use `--dark-card` with 1px borders at `rgba(255,255,255,0.05)` — barely there, just enough to define the edge.
- **Text** defaults to `--white` (`#f5f5f5`), not pure white, for a softer read on dark backgrounds.
- Aim for **WCAG AA contrast** on all body text. `#f5f5f5` on `#0a0a0a` exceeds 18:1.

---

## Typography

| Role         | Font                                         | Weight     | Size              | Tracking        |
|--------------|----------------------------------------------|------------|-------------------|-----------------|
| **Headings** | `Playfair Display` (serif)                   | 400 / 700  | clamp(2rem–5.5rem)| Normal           |
| **Body**     | `Inter` (sans-serif)                         | 300–700    | 0.85rem–1.05rem   | Normal           |
| **Nav logo** | `Inter`                                      | 700        | 1.15rem           | 0.12em           |
| **Buttons**  | `Inter`                                      | 600        | 0.85rem           | 0.08em uppercase |
| **Labels**   | `Inter`                                      | 600        | 0.68–0.72rem      | 0.15em uppercase |
| **Cards**    | `Inter`                                      | 400–600    | 0.82–1.0rem       | Normal           |

- **Base size**: `0.85rem` for body, scales with clamp() for headings.
- **Line height**: 1.5–1.7 for body copy, 1.1–1.2 for headings.
- Headings use `Playfair Display` italic (`<em>`) for accent words — e.g. "Browse *Pros*".
- All caps + letter-spacing for labels and badges only. Body text is sentence case.

---

## UI Style

### Corner Radius

| Element     | Radius   |
|-------------|----------|
| Buttons     | `8px`    |
| Cards       | `16–20px`|
| Pills/chips | `100px`  |
| Inputs      | `12px`   |
| Modals      | `20–24px`|
| Badges      | `100px`  |

### Shadows

- No traditional box-shadows on cards — rely on border + background contrast.
- **Red glow** on primary buttons: `0 0 30px var(--red-glow)`, intensifies on hover to `0 8px 40px`.
- **Backdrop blur** on nav (`blur(20px)`) and overlays (`blur(8px)`) for depth.

### Buttons

| Type        | Background                     | Border                          | Text            | Shadow                     |
|-------------|--------------------------------|---------------------------------|-----------------|----------------------------|
| **Primary** | `--red` solid                  | None                            | `--white-pure`  | Red glow                   |
| **Secondary**| `rgba(255,255,255,0.06)`      | `1px solid rgba(255,255,255,0.12)` | `--white`    | None, blur backdrop        |
| **Ghost/Nav**| Transparent                   | `1px solid rgba(255,255,255,0.12)` | `--white`    | Red glow on hover          |

- All buttons: `padding: 16px 36px`, uppercase, `font-weight: 600`, `letter-spacing: 0.08em`.
- Hover: `translateY(-2px)` lift with enhanced glow.

### Icons

- SVG inline, 14–20px, stroke-based.
- Default opacity `0.6`, full opacity on hover/active.
- Rounded line caps, consistent 1.5–2px stroke weight.

---

## Imagery

### Photography

- **Dark, moody, high-contrast** — subjects lit dramatically against dark or blurred backgrounds.
- Warm skin tones, shallow depth of field, editorial quality.
- Sourced from Unsplash with professional composition — no stock-photo smiles.
- Pro card photos: 3:4 aspect ratio, `object-fit: cover`.

### Logo

- The OS monogram (white O, red S swirl) on black.
- **Loading screen**: Logo at 80px height, stacked above "OFFSHIFT" text.
- **Footer**: Logo only at 52px, no accompanying text.
- **Nav header**: Text "OFFSHIFT" only — logo and text never sit side by side.
- File: `logo.png` in repo root.

### Textures & Patterns

- **Cursor glow**: Subtle radial gradient (`rgba(200,16,46,0.06)`) follows the mouse.
- **Ambient orbs**: Large blurred circles of red at low opacity for atmospheric depth.
- **Grain/noise**: None currently — the dark flatness is intentional.

---

## Components

### Header / Nav

- Fixed top, transparent → `rgba(10,10,10,0.92)` on scroll.
- `backdrop-filter: blur(20px)`, 1px bottom border fading in.
- Logo text left, links center-right, CTA pill far right.
- Mobile: hamburger toggle, full-screen links.

### Cards (Pro Cards)

- `--dark-card` background, `border-radius: 20px`, 1px border `rgba(255,255,255,0.05)`.
- Photo top (3:4), gradient overlay bottom.
- Hover: `translateY(-8px)` lift, border brightens to `rgba(255,255,255,0.12)`.
- Content: name, craft badge, rating stars, rate, availability tags.

### Category Chips

- Pill shape (`border-radius: 100px`), ghost style by default.
- Active: red-subtle background, red border, white text.
- Include count badges (small red circle).

### Filter Bar

- Glass morphism: `rgba(20,20,20,0.8)` + `backdrop-filter: blur(20px)`.
- `border-radius: 16px`, search input + dropdown buttons inline.
- Dropdown menus: `#1a1a1a` background, 8px padding, same border radius.

### Forms

- Dark inputs: transparent or `rgba(255,255,255,0.05)` background.
- 1px border `rgba(255,255,255,0.1)`, brightens on focus.
- `border-radius: 12px`, padding `14–16px`.
- Labels: small caps, `--gray-light`, above the field.

### Footer

- `--dark` background, padded generously (60px+).
- Logo image (no text) top-left, tagline below.
- Link columns: light gray, brighten to white on hover.
- Bottom bar: copyright + social icon circles (`border-radius: 50%`, ghost style).

---

## Motion

- **Transitions**: `all 0.3–0.4s ease` on interactive elements.
- **Card entrance**: staggered fade-up (`translateY(30px) → 0`, `opacity 0 → 1`).
- **Scroll reveal**: `IntersectionObserver` triggers `.revealed` class (fade + slide up).
- **Loading screen**: Logo fades in, progress bar fills, then screen fades out.
- **Hover lifts**: `translateY(-2px)` for buttons, `translateY(-8px)` for cards.
- Keep motion subtle and quick — nothing should feel slow or bouncy.
