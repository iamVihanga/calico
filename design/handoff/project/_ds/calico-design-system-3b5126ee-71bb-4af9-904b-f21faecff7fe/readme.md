# Calico — Design System

**Calico** is a cozy, girly book-reading app for people who read a few pages at a
time and want that to count. The product is a single surface today: a **native
mobile app** (iOS-first, 390×844 reference frame). There is no marketing site,
docs site or slide template in the supplied material, so this system contains
one UI kit and no slide templates.

The name is the brand: a calico cat's coat — cream, marmalade, cocoa, ink —
is the colour system, and "cozy" is the whole product thesis. Calico is warm
paper, a lamp left on, a stack of books tilted against each other.

## Sources given to me

All source material was image uploads; there was **no codebase, Figma file or
repository**. Everything below was derived from these five files, which are
preserved in `assets/references/`:

| File in `assets/references/` | What it gave me |
|---|---|
| `onboarding-screens.jpg` | The only real product reference: two app screens (welcome + friends/notifications). Source of the layout language, the cream ground, the ink CTA bars, the marker-hand accents, the display-serif headlines, the forest-green panel, and the typographic book covers. |
| `palette-orange-cream-brown.jpg` | Named swatches: Orange #EC6426, Yellow #F8A91F, Cream #FDE3CF, Brown #632713. |
| `palette-paprika-honeycomb.jpg` | Hot Paprika #B53324, Honeycomb #E5A657, Biscuit #DFBC94, Crumpet #F5E2CE. |
| `palette-calico-cat.jpg` | Calico-coat neutrals: slate grey, taupe brown, olive/sage, two ambers. |
| `palette-calico-stripes.jpg` | Coat stripes: #9E5B45, #55352F, #6B473A, #D5BE9C, #D09C64, #C67B52. |

Plus the written brief: *"cozy, calm, calico cat inspired colour palette with
rounded corners… overall UI must be illustrative, creative and calm cozy."*

**Because there is no code or Figma, this system defines the component inventory
rather than recreating one.** Every primitive here is grounded in something
visible in `onboarding-screens.jpg` or required by the reading-app flows it
implies; see "Intentional additions" below.

## Substitutions to confirm

1. **Fonts.** No font files were supplied. The nearest Google Fonts matches to
   the reference screens are loaded from CDN in `tokens/fonts.css`:
   **Playfair Display** (display serif headlines), **Caveat** (marker
   handwriting), **Nunito** (rounded UI sans). If Calico owns licensed faces,
   send the files and I'll swap the `@font-face` rules — the tokens
   (`--font-display`, `--font-hand`, `--font-ui`, `--font-reader`) are the only
   place families are named.
2. **Icons.** No icon set was supplied. The system uses **Lucide** (ISC licence,
   CDN-available) at 22px / 1.75 stroke, wrapped in `ui_kits/calico-app/Icons.jsx`.
   Flagged for confirmation.
3. **No logo.** Nothing logo-like exists in the sources, so **no mark was drawn**.
   Wherever a logo would go, the wordmark "Calico" is set in Playfair Display 900
   with −0.03em tracking (see the "Wordmark" brand card). Send the real mark and
   it drops into `assets/logo.svg`.
4. **No illustrations.** The reference art is a third party's hand-drawn
   illustration; it was **not** copied, traced or re-drawn. Illustrative warmth in
   this system comes from typographic book covers, tilted stacks, marker-hand
   type and paper texture. Real illustration assets are the single biggest thing
   this system is missing.

---

# CONTENT FUNDAMENTALS

**Voice: a friend who reads, not a coach who tracks.** Calico never gamifies
guilt. Copy is short, warm, lower-stakes than the reader expects.

- **Person.** "You" for the reader, "we" for the app, sparingly: *"Add a book and
  we'll keep your place, always."* Never "I". Friends are named, not labelled:
  *"Omar loved it"*, not *"1 friend rated this 5 stars"*.
- **Casing.** Sentence case everywhere. Title case only in real book titles.
  Uppercase is reserved for micro-caps metadata labels (`CONTINUE READING`,
  `24 BOOKS · 3 SHELVES`) at 11–12px with 0.12em tracking.
- **Headlines** are declarative and a little literary, split across two type
  styles — serif statement, handwritten turn:
  *"**People who read** / *live different lives.*"* ·
  *"**Don't miss what your friends are reading.**"*
- **Handwriting carries the feelings**, the serif carries the facts. Greetings
  (*"good evening,"*), reactions (*"nice pick!"*), encouragements
  (*"12 day streak"*, *"nearly there"*) and CTA labels (*"Let's go"*,
  *"Keep reading"*) go in Caveat. Never body copy in the hand.
- **No blame, no streak-shaming.** Empty states apologise for nothing:
  *"nothing here yet — / Your shelf is waiting."* Never *"You haven't added any
  books."* Missed days are never mentioned.
- **Numbers are soft.** Time remaining beats percentage: *"2h 40m left"*,
  *"9 min left in chapter"*, *"6 minutes to your goal"*. Percentages appear only
  next to a progress bar.
- **Punctuation.** Em dashes for asides, a lowercase handwritten fragment ending
  in an em dash or comma is a house move (*"nothing here yet —"*). Exclamation
  marks: at most one per screen, only in the hand.
- **No emoji.** Ever. Warmth comes from type, colour and Lucide glyphs. The only
  non-alphabetic marks in use are the display serif's quote glyph (`&ldquo;`) and
  arrows (→) inside CTA labels.
- **Length.** Buttons 1–3 words. Body paragraphs ≤ 2 sentences, ≤ 160 characters.
  Screen titles ≤ 4 words unless they are a full statement headline.

Word bank: *cozy, quiet, slow, keep your place, tonight, evening, shelf, passage,
highlight, together.* Avoid: *unlock, boost, crush it, streak broken, don't miss
out, reading challenge, gamify, XP.*

---

# VISUAL FOUNDATIONS

## Colour
Cream paper, one hot accent, deep warm darks. **Marmalade #EC6426 is the only
loud colour** and it appears once or twice per screen — a CTA, a progress fill,
a handwritten line. Ink #1C1714 does the heavy lifting for buttons and text
(brown-black, never #000). Deep forest #1F3A32 is the one "feature panel"
ground; one forest panel per screen, never two. Sage #949A6B, slate #666B6E and
petal #F2C4C7 are quiet supporting notes: sage and petal appear mostly as book
covers and avatar rings, not as UI colour.

Status colours are muted so nothing feels like an error in a reading app:
success #4F7A5C, warning = honeycomb, danger = paprika #B53324 (never fire-red),
info = coat slate. Each has a soft tint companion for backgrounds.

Text: ink on paper; cocoa #6E4738 for secondary; #8A7565 for muted meta. Cream
on forest and ink grounds, with mint-cream #C3CFC6 for muted text there. On
marmalade, text is **deep brown #2A1206** — never white, never cream.

**Night Reading** is a class scope (`.calico-night`), not a media query: warm
near-black paper #16120F with #F2E8DA ink. It is a reading feature the user
turns on, so it lives on a switch in the reader settings sheet.

## Typography
Three voices, strictly separated.
- **Playfair Display** — every headline, screen title, book title and big number.
  Bold 700 (900 for the wordmark), tracking −0.02em, leading 1.04–1.16. Big and
  left-aligned; Calico never centres a title bar.
- **Caveat** — the marker hand, 17–32px, bold, in marmalade or cocoa. Accents,
  greetings, CTA labels, ring captions.
- **Nunito** — all body copy, metadata, labels, form text. 13–17px, leading 1.45–1.6.
- **Reader type** is its own role: Playfair at 17px / 1.72 leading, ~62-character
  measure, with a marmalade drop cap opening each chapter.

Minimum sizes: 11px only for uppercase micro-caps; 13px for any sentence-case text.

## Layout
20px screen gutter (`--gutter-screen`), 12px stacks, 32px between sections.
Cards are 16px-padded. Content scrolls under a **fixed 72px bottom tab bar**; the
status bar and home indicator are the only other fixed chrome. Horizontal
carousels bleed past the right gutter to signal more (14px gaps, no peek
shadows). Screens are single-column; the only grids are 2-up stat tiles and
avatar rows.

## Backgrounds & texture
Flat cream, not gradients. **No aggressive gradients anywhere.** The one texture
is `.calico-paper`: a 4px radial fleck at 4% ink, which gives paper grain
without an image. Feature panels are flat forest or flat marmalade with 28–36px
radii. Section corners bleed into the screen edges (`border-radius: 0 0 36px 36px`
on header grounds). No full-bleed photography is defined — the brand's imagery is
illustration, and none was supplied.

## Corner radii
6 / 10 / **14 (buttons, inputs)** / **20 (cards)** / **28 (sheets, feature panels)** /
36 (bleeding header grounds) / pill (tags, search, avatars, progress). Book
covers are the one asymmetric shape: `4px 12px 12px 4px` — tight spine, soft
fore-edge. Nothing in Calico has a square corner.

## Cards
Cream-white #FFFDF9 fill, 20px radius, a 1px sand hairline (#E7DACA), and a soft
warm shadow `0 2px 8px rgba(84,51,46,.08)`. **No coloured left borders.** No
inner shadows except the pressed-button inset. Tappable cards lift −2px on hover
into `--shadow-md`.

## Shadows
Every shadow is brown (`rgba(84,51,46,·)`), never neutral black: xs 6% → lg 14%.
Book covers get a deeper, tighter shadow (22%) so they read as objects. Bottom
sheets cast upward (`--shadow-sheet`). Focus is a 3px marmalade glow at 32%.

## Motion
Default easing is `--ease-cozy` cubic-bezier(.32,.72,.28,1) — a soft settle,
never a bounce. 160ms hovers, 240ms state changes, 420ms progress fills, 520ms
screen transitions (cross-fade + 8px rise). `--ease-purr` (a 1.42 overshoot) is
allowed on exactly two things: the switch thumb and the tab-bar underline. No
spinning, no parallax, no confetti. Everything respects
`prefers-reduced-motion`.

## Interaction states
- **Hover** (web/tablet): darken the fill one step — ink → espresso, marmalade →
  #D2541B; ghost buttons pick up the quiet surface. Never opacity fades.
- **Press**: `scale(.97)` plus a faint inset shadow. Tactile, immediate, 90ms.
- **Selected**: tags and segmented items fill (ink for tags, raised cream thumb
  for segments). Toggled icon buttons tint marmalade-soft.
- **Disabled**: 42% opacity, shadow removed, cursor not-allowed.
- **Focus**: `--ring-focus`, the marmalade glow — never a browser outline.

## Borders, transparency & blur
Borders are sand, not grey: `--border-soft #E7DACA` on cards, `--border-strong`
(biscuit) on secondary buttons and dashed placeholders. Transparency is used
sparingly and only over dark grounds: 72%-cream activity rows on forest, 16%-cream
icon buttons. The **only** blur in the system is a 2px backdrop blur behind the
bottom-sheet scrim (`rgba(28,23,20,.56)`). No frosted-glass navigation.

## Imagery vibe
Warm, low-contrast, slightly faded — as if printed on cream stock. Any photo
should be warm-toned with visible grain; cool or high-saturation imagery is
off-brand. Book covers are typographic blocks from a fixed six-colour rotation
(`--cover-1…6`), title in Playfair, author in micro-caps, with a spine gradient
on the left edge. Loose stacks may tilt ±6–14°; grid shelves never tilt.

---

# ICONOGRAPHY

- **Set:** Lucide, at **22px** in navigation and 18–20px inline, stroke **1.75**,
  round caps and joins, `currentColor`. This is a *substitution* — no icon assets
  were supplied. Lucide's rounded, even-weight line matches the brand's softness
  better than filled or sharp-corner sets.
- **How it's shipped:** there is no icon font and no SVG sprite in the sources.
  The kit wraps Lucide path geometry in a tiny React helper
  (`ui_kits/calico-app/Icons.jsx`, mirrored as a snippet at
  `assets/icons/lucide-jsx-helpers.txt`) so nothing is hand-drawn. For production,
  load Lucide from CDN (`unpkg.com/lucide-static`) or install `lucide-react`.
- **Icons in use:** home · books (shelf) · compass (discover) · users (friends) ·
  user · search · bookmark · heart · plus · arrow-left/right · more-horizontal ·
  x · check · moon · sun · type · clock · quote · share · bell · settings.
- **Filled vs stroke:** stroke only. The single exception is the display serif's
  typographic quote mark on `QuoteCard`, which is type, not an icon.
- **Never:** emoji, unicode symbols as UI icons (the `×` in a Tag's remove
  affordance and the `▾` in Select are the two tolerated exceptions, both
  typographic), two-tone icons, or hand-rolled SVG illustration.
- **Colour:** icons inherit text colour — muted for inactive tabs, marmalade when
  active, cream on dark grounds. Icons are never the loudest thing on a screen.

---

# Intentional additions

No source defined a component library, so the inventory below was authored from
the reference screens plus the flows a reading app needs. Each addition is
justified by something visible in `onboarding-screens.jpg`:

- `BookCover` / `BookCard` / `ProgressBar` — the tilted typographic covers and
  progress language are the reference's most distinctive element.
- `ActivityRow` — directly recreates the reference's notification rows.
- `ScreenHeader` with a handwritten line — recreates the *"Good Books, Good
  People"* + serif-title stack.
- `Button hand` variant — recreates the *"Let's go →"* / *"Turn on
  notifications ←"* marker CTA bars.
- `StreakRing`, `QuoteCard`, `Sheet`, `Toast`, `EmptyState`, `Switch`, `Select`,
  `Checkbox`, `SearchField`, `SegmentedControl`, `Tag`, `Badge`, `Avatar`,
  `IconButton`, `Card`, `Input`, `TabBar` — standard app furniture, styled to the
  brand. None of these appear in the reference; they exist because the app cannot
  be assembled without them.

---

# Index

**Root**
- `styles.css` — the only file consumers link. `@import`s everything below.
- `thumbnail.html` — homepage tile.
- `readme.md` — this file.
- `SKILL.md` — Agent Skills front-matter for use in Claude Code.

**`tokens/`** — `fonts.css` · `colors.css` · `typography.css` · `spacing.css` ·
`radii.css` · `shadows.css` · `motion.css` · `base.css` (resets + `.calico-paper`,
`.calico-underline`, `.calico-label`, `.calico-hand`, `.calico-night`).

**`components/`** — each directory has `<Name>.jsx`, `<Name>.d.ts`,
`<Name>.prompt.md`, and one specimen card.
- `core/` — Button · IconButton · Badge · Tag · Card · Avatar
- `forms/` — Input · SearchField · Checkbox · Switch · Select
- `reading/` — BookCover · BookCard · ProgressBar · StreakRing · QuoteCard · ActivityRow
- `navigation/` — TabBar · ScreenHeader · SegmentedControl
- `feedback/` — Sheet · Toast · EmptyState

**`ui_kits/calico-app/`** — the mobile app. `index.html` is the click-through
(onboarding → home → shelf → book → reader → friends); `screens.html` shows all
six side by side. See its own README for file-by-file notes.

**`templates/calico-app-screen/`** — `CalicoAppScreen.dc.html`, a ready-to-edit
390×844 app screen (header, continue-reading panel, shelf row, highlight,
friends, tab bar) for consuming projects to start from.

**`guidelines/`** — 19 specimen cards feeding the Design System tab, grouped
Colors · Type · Spacing · Brand.

**`assets/`** — `references/` (the five uploaded sources) ·
`icons/lucide-jsx-helpers.txt`. **No logo file and no illustrations** — see
"Substitutions to confirm".
