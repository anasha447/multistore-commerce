# BRAND.md — Matessa

> **Authority:** this doc owns the brand identity — what Matessa looks, sounds, and feels like, and why. How to *execute* it in the frontend (tokens, components, breakpoints, motion specs) is `DESIGN-SYSTEM.md`. Translating the designed pages into Next.js is `FRONTEND-BUILD.md`. Sources of truth behind this doc: the design handoff in `design-source/` (canonical landing: `project/Matessa Landing v4.dc.html`) and its `_ds/` token package.
>
> **Where tokens live:** the values below are implemented ONCE as CSS custom properties (see `DESIGN-SYSTEM.md §2` → `frontend/app/globals.css`); components reference tokens only — never hard-code hexes.

---

## 1. Brand essence

**Matessa** is a premium yerba mate brand for the Indian market — **"A Sip From Nature, A Taste Of Cultures."** It sells loose-leaf yerba mate blends and traditional drinking gear (gourds, bombillas/straws) at **matessa.in**.

- **The bridge:** South American mate tradition × Indian spice culture. Masala, cinnamon, clove, cardamom, ginger — the blends and the artwork both live on this bridge.
- **The position:** natural, healthy, focused energy — mate as the calmer, cleaner alternative to coffee ("focus without jitters", antioxidants, ritual over rush).
- **The products (3 core blends):** **Masala Mate**, **Lemon & Ginger Mate**, **Raw Mate** — plus **Accessories** (gourd, bombilla/straw, etc.). The catalog lives in the store's dashboard; never hardcode products or categories in the frontend.
- **The feel:** warm, botanical, crafted, a little poetic — never clinical, never hype.

## 2. Color — deep greens, warm cream, one hot accent

Palette (from `design-source/project/_ds/tokens/colors.css`, extracted from the design):

| Token | Hex | Role |
|---|---|---|
| `--color-darkgreen` | `#2F3B28` | chrome (header, footer, marquee), headings, dark surfaces |
| `--color-green` | `#3E5F2D` | **primary** — commerce CTAs, prices, links-on-light |
| `--color-lightgreen` | `#7A9D3E` | accent green — stars, secondary buttons |
| `--color-orange` | `#F26323` | **the single action/hover accent** (hover shade `#E85D1F`) |
| `--color-craemy` | `#EADBA2` | cream — nav text on dark, logo gold companion |
| `--color-yellow` | `#F3CB57` | highlights — footer headings, badges, marquee keywords |
| `--color-white` | `#F9F7F3` | warm off-white page background |
| `--color-black` | `#121212` | near-black (rare; prefer darkgreen for text) |

Semantic aliases (use these in code, not raw hexes): `--surface-page`, `--surface-card` (#FFFFFF), `--surface-dark`, `--text-heading` (darkgreen), `--text-body` (#374151), `--text-muted` (#6B7280), `--text-on-dark` (cream), `--text-price` (green), `--action-primary` (green), `--action-hover` (orange), `--accent-highlight` (yellow), `--border-subtle` (#E5E7EB).

**Rules**
- Orange is a *spice*, not a course: hover states, cart badge, active accents. Never large orange surfaces.
- Body text is gray-700 on light backgrounds; headings are darkgreen. Cream/yellow text only on dark green.
- Photographic banners get a dark overlay `rgba(15,35,20,.55)` before text goes on them.
- No new colors. Gradients limited to the soft page gradient (#F9F7F3→#f2f2f2) seen in the design.

## 3. Typography

- **Headings & product names:** **Asul** (serif), 400/700 — section titles 3xl–4xl bold, usually centered, Title Case.
- **Everything else:** **Quicksand** (300–700) — nav (bold), body, prices, buttons, forms.
- Load both via `next/font/google` (subset `latin`), exposed as `--font-heading` / `--font-body`. No other typefaces.
- Scale (from `_ds/tokens/typography.css`): 4xl 2.25rem / 3xl 1.875rem section titles, xl 1.25rem card names, lg 1.125rem nav + prices, base/sm/xs body ladder.

## 4. Shape & curves — the curved identity

Curves are a deliberate part of the Matessa identity; sharp rectangles are off-brand.

- Radius ladder: `--radius` 10px base → `--radius-2xl` 1rem (review cards) → `--radius-card` **2rem** (product image tiles) → `--radius-pill` 9999px (commerce buttons, badges).
- Commerce CTAs are **pills**. Cards and image tiles are generously rounded. Sections may use curved edges/dividers and blob-cropped imagery where the design shows them.
- Elevation: `shadow-lg` resting → `shadow-2xl` + scale 1.05 on hover (cards); header shadow when stuck.

## 5. Signature pattern & botanical art

- **`matessa-pattern.webp`** (uploads name: `matessa pattern (1).webp`) — the brand pattern. Use as a *texture*, not wallpaper: section backgrounds at low opacity, banners, dividers, packaging echoes. In-app copy: `frontend/public/brand/matessa-pattern.webp`.
- **Leaf patterns** (`leaf-pattern.webp`, `leaf-pattern-light.webp`) — lighter-duty texture for section backgrounds.
- **Spice illustrations** (`design-source/project/assets/ing-*.png|webp`: cinnamon, clove, cardamom, ginger, lemon, anise, mate leaf) — hand-drawn accents floated around sections and product imagery. Decorative only; never carry meaning alone.

## 6. Voice & tone

- **Brand voice:** warm, natural, slightly poetic when talking brand ("A Sip From Nature, A Taste Of Cultures"); plain and benefit-led when selling ("Great for work sessions, keeps me focused").
- **Casing:** Title Case for headings and promo lines ("Our Blends", "Why Drink Mate?", "Who Drinks Mate?"). Nav is conversational — **"What is mate?!" keeps the interrobang.**
- **Person:** the brand speaks to "you"; reviews are first-person from Indian customers (e.g. Amit Sharma, Rahul Mehta).
- **Currency: ₹ always, no decimals shown (₹499, never ₹499.00, never $).** Display formatting goes through `formatMoney` (INR / en-IN).
- **No emoji** in the UI. No exclamation-heavy hype — the marquee announcement bar is the only shouty surface (bold keywords + yellow highlights).
- **Recurring themes:** ritual, focus/energy without jitters, antioxidants, the India↔South America culture bridge, "Who Drinks Mate?" (footballers — Messi, Maradona, Suárez imagery in `design-source/project/assets/gal-*.webp`).

## 7. Imagery

- Warm, saturated lifestyle photography (mate cups, plantations, hands, rituals) — full-bleed banners with dark overlays for text protection.
- Product pack shots sit on light-gray tiles with `mix-blend-multiply` so the packs feel printed onto the page.
- Gallery/testimonial imagery: real people drinking mate; the footballer set anchors "Who Drinks Mate?".
- Story imagery (`story-*.webp`) for Our Story banners.

## 8. Motion — calm, botanical, framer-motion

- Entrances: fade + rise with stagger; springy card hovers; 300ms hovers → 500ms image zooms (scale-110) → up to 1500ms hero.
- The announcement **marquee** scrolls ~25s linear and **pauses on hover**.
- "Calm glow" — slow drop-shadow pulse on the logo.
- Parallax quote banners between sections.
- Easing easeInOut/easeOut. Always honor `prefers-reduced-motion` (freeze marquee, drop parallax, keep fades).

## 9. Logo

Files (in `frontend/public/brand/`, sources in `design-source/project/assets/`):
- `full-logo.webp` — gold gourd-and-bombilla mark (transparent).
- `logo-cream.webp` — cream mark, used in the dark header.
- `brandname.webp` — gold "Matessa" wordmark.

**Rules:** gold/cream marks live on dark green; never place the gold mark on bare white without contrast backing. Header uses the cream mark, centered.

## 10. Hard brand rules (guardrails)

1. Orange `#F26323` is the **only** action/hover accent — nothing else changes to a new hue on hover.
2. No colors, fonts, or radii outside §2–§4. No dark-mode variant for the storefront (the design is light; the admin shell keeps its own dark theme).
3. Commerce CTAs are pill-shaped, Quicksand bold, green fill → orange hover.
4. ₹ with no decimals, everywhere, via `formatMoney` — never a hardcoded `$` or `₹` template string.
5. Pattern is texture, not wallpaper — one pattern surface per viewport max.
6. Products/categories come from the backend (dashboard-managed): the storefront categories are **Mate** and **Accessories** as *data*, never hardcoded lists.
7. No emoji, no fake urgency, no dark patterns.
8. Photography always gets the dark overlay before text; never set body copy directly on a busy photo.
