# Calico: UX Prototype Brief for Claude Design

Android app prototype for a personal books, movies and TV tracker, built for a bilingual (Sinhala + English) reader in Sri Lanka.

---

## 0. How to use this brief

**What to build:** a clickable, flow-complete prototype of the Calico Android app. Layout, hierarchy, interaction, motion and copy should be close to final. Visual styling should stay deliberately plain, because a design system will be built separately and applied on top of this prototype later.

**Frame:** Android phone, 412 × 915 dp, with status bar and gesture navigation bar. Design light mode only for now; dark mode comes with the design system.

**Styling constraint:** do not invent a color palette, type scale, or visual identity. Follow the placeholder rules in section 5. Every reusable element should be built as a named component using the names in section 14, so the future design system maps onto it cleanly.

**Priority order:** flows and interactions first, then screen states (empty, loading, error, offline), then micro-interactions and motion.

**Content:** use the sample data in section 15 everywhere. Never use lorem ipsum. Sinhala text must be rendered in real Sinhala script.

---

## 1. The product in one paragraph

Calico tracks three kinds of media in one place: books (bought, wishlisted, or borrowed from a public library), movies, and TV shows. Books are added by scanning a barcode or photographing the cover, with AI filling in the details. Movies and shows are added by searching TMDB. Everything can be grouped into mixed collections (a "Stephen King" collection holding his novels, the films and the TV series), and queued in a single Up Next list with a "Pick for me" button for indecisive evenings. Library due dates are tracked with reminders so books go back on time.

---

## 2. Who it's for

**Primary persona: Dilan, 27, Colombo.** Reads Sinhala novels borrowed from the Colombo Public Library and English thrillers bought from local bookshops. Watches two or three series at a time on streaming services. Uses a mid-range Android phone, often on mobile data.

**Where and how Calico gets used:**

| Moment | Context | What it means for design |
|---|---|---|
| Library aisle | Standing, one hand holding books, weak signal | Capture must work one-handed, fast, and tolerate being offline |
| Bus commute | Reading, then logging the page before getting off | Page logging in two taps, reachable with the thumb |
| Bed at night | Low light, winding down | Calm screens, no clutter, big touch targets |
| Weekend evening | Can't decide what to read or watch | Up Next and "Pick for me" should feel playful |
| Due date approaching | Reminder notification | One tap from notification to Renew or Returned |

---

## 3. Experience principles

1. **Two taps to log anything.** Logging a page, marking an episode, or confirming a return never takes more than two taps from Home.
2. **Home answers "what now?"** Home shows what's urgent (due books), what's in progress, and what's next. It is not a dashboard of totals.
3. **Both scripts are first-class.** Sinhala and romanized text are shown together, searchable either way, and the user chooses which script leads.
4. **The thumb owns the bottom half.** Primary actions live in the lower half of the screen, in bottom sheets and bottom bars. The top of the screen is for reading, not doing.
5. **Physical objects, digital speed.** Each medium borrows one real-world object people already understand (see section 4), so interactions feel familiar without explanation.

---

## 4. Creative concept: "three patches, one cat"

A calico cat has a coat of three colored patches. Calico has three media types. This is the idea everything hangs on.

### 4.1 The three patches (media identity through shape, not color)

Because there is no palette yet, each media type is identified by **shape**. This also keeps the app accessible to color-blind users once color arrives.

| Media | Shape silhouette (`MediaShapeIcon`) | Cover card treatment |
|---|---|---|
| Book | Portrait rectangle with a thicker left edge (the spine) | Card has a visible spine strip on the left |
| Movie | Rectangle with two semicircle notches on the sides (a ticket) | Card corners have ticket notches |
| TV show | Rounded rectangle with a row of three small dots under it (episodes) | Card has an episode-dot strip along the bottom edge |

These shapes appear on cover cards, list rows, search results, collection counts and the Up Next queue. A user should be able to tell media types apart in a grayscale screenshot.

### 4.2 The physical objects (one signature interaction per medium)

This is where the prototype spends its boldness. Everything else stays quiet and simple.

| Medium | Real-world object | Where it appears |
|---|---|---|
| Book reading | **A page ruler**: a horizontal tape-measure scrubber for entering the current page | Page logging sheet |
| Library loan | **A library due-date slip**: the stamped card glued inside library books | Home "Due soon" row, book detail |
| Movie watch | **A ticket stub**: one torn stub per viewing, stacked for rewatches | Movie detail |
| TV progress | **An episode grid**: rows of small squares, one per episode, one row per season | Show detail |

### 4.3 Kiri, the house cat

"Kiri" is a common name for a cat in Sri Lanka ("kiri" means milk in Sinhala). Kiri is a simple line-drawn calico cat who appears **only** in these moments:

- Empty states (curled up on an empty shelf)
- The "Pick for me" reveal (a paw bats a card out of the deck)
- Finishing a book (a small stretch-and-yawn, once)
- Offline banner (asleep)

Kiri never appears on busy screens and never talks in long sentences. In the prototype, draw Kiri as a simple placeholder line illustration.

---

## 5. Prototype styling rules (placeholder only)

These rules exist so the prototype looks intentionally neutral and can be re-skinned later. Treat every value below as temporary.

### 5.1 Color

Use grayscale only, plus one clearly temporary accent for the primary action. Name them semantically so they can be swapped later.

| Placeholder role | Value | Use |
|---|---|---|
| `surface` | #FFFFFF | Screen background |
| `surface-raised` | #F2F2F2 | Cards, sheets, input fields |
| `line` | #D6D6D6 | Dividers, outlines, unfilled episode squares |
| `ink-muted` | #767676 | Secondary text, captions |
| `ink` | #1A1A1A | Primary text, icons |
| `accent-placeholder` | #5A5A5A with a dashed outline | Primary buttons and the selected state |

Status meaning (overdue, success, AI low confidence) must be shown with **icons, labels and patterns** (for example a diagonal hatch for overdue, a dotted underline for low confidence), not color.

### 5.2 Type

- Latin text: Roboto (Android system font).
- Sinhala text: Noto Sans Sinhala.
- Use four named roles only: `display`, `title`, `body`, `caption`. Pick sensible sizes; they will be replaced.
- **Sinhala needs more line height** than Latin text because vowel signs sit above and below the base line. Use at least 1.5× line height for any text block that may contain Sinhala, and never clip text containers vertically.
- Sentence case everywhere. No all-caps labels.

### 5.3 Shape, spacing, imagery

- One 8 dp spacing grid. Minimum touch target 48 × 48 dp.
- Covers and posters: gray boxes with the title written inside, at 2:3 ratio. Show stills: 16:9 gray boxes.
- Corners: leave radius decisions minimal and consistent; they will be set by the design system.
- Icons: simple outline icons (Material Symbols outline is fine as a placeholder).

---

## 6. Information architecture and navigation

### 6.1 Bottom navigation

Four tabs with a raised capture button in the center:

```
┌──────────────────────────────────────────┐
│  Home    Library    (＋)    Up next   Collections │
└──────────────────────────────────────────┘
```

- **(＋) Capture button:** tap opens the Add sheet. **Long-press** jumps straight into the book camera (power-user shortcut; show a one-time tooltip about it after the third book is added).
- Settings and profile are reached from the avatar on Home's top bar.
- Search is reached from the search pill on Home and the search icon on Library.

### 6.2 Screen map

```
Sign-in
 └─ Home
     ├─ Search (global)
     ├─ Profile & settings
     │   └─ Your year (stats)
     ├─ Due soon slip ─────────────► Book detail
     ├─ Continue reading card ─────► Page ruler sheet / Book detail
     ├─ Continue watching card ────► Show detail
     └─ Up next preview ───────────► Up next / Pick for me

Library (Books | Movies | Shows)
 ├─ Book detail
 │   ├─ Page ruler sheet
 │   ├─ Finish sheet / Stop reading sheet
 │   ├─ Loan sheet (borrow, renew, return)
 │   ├─ Add to collection sheet
 │   └─ Edit book
 ├─ Movie detail
 │   └─ Log a watch sheet
 └─ Show detail
     └─ Episode sheet

Capture (＋)
 ├─ Book: Scan barcode | Snap cover | Type it in
 │   └─ Camera → Crop → Reading the cover → Review form → Saved
 ├─ Movie: TMDB search → Preview → Add
 └─ Show: TMDB search → Preview → Add

Up next
 └─ Pick for me (full-screen moment)

Collections
 ├─ New collection sheet
 └─ Collection detail
```

### 6.3 Navigation rules

- Detail screens push in from the right; sheets rise from the bottom; the Pick for me moment is a full-screen overlay.
- Android back gesture always closes the top sheet first, then pops the screen.
- Tapping the active tab scrolls that tab to the top; tapping again resets its filters.

---
## 7. Screens

Each screen lists its purpose, a wireframe, content, interactions and states. Wireframes show structure only; proportions are approximate.

### 7.1 Welcome and sign-in

**Purpose:** get the user signed in with minimum friction and set the tone.

```
┌──────────────────────────────┐
│                              │
│   [book]  [ticket]  [show]   │  three patch shapes drift
│         together into        │  together and settle into
│        a cat silhouette      │  Kiri's outline (one-time)
│                              │
│          Calico              │
│  Your books, films and shows │
│        in one place          │
│                              │
│                              │
│ [ G  Continue with Google  ] │
│                              │
│  Privacy policy   Terms      │
└──────────────────────────────┘
```

- One screen, one button. No carousel of feature slides.
- After sign-in, go straight to Home in its empty state (7.2). Do **not** ask for notification permission here; ask at the moment it's needed (first library loan, see 7.9).
- Error state: "Google sign-in didn't finish. Try again." with the button still available.

### 7.2 Home

**Purpose:** answer "what should I do now?" Sections appear only when they have content, in this fixed priority order.

```
┌──────────────────────────────┐
│ Good evening, Dilan     (DK) │
│ ┌──────────────────────────┐ │
│ │ 🔍 Search your library   │ │
│ └──────────────────────────┘ │
│                              │
│ Due soon                     │
│ ┌────────────┐ ┌───────────┐ │  LoanSlip cards,
│ │ Colombo    │ │           │ │  horizontal scroll
│ │ Public Lib.│ │           │ │
│ │ මඩොල් දූව  │ │           │ │
│ │ [DUE 26    │ │           │ │  stamp-style date
│ │  SEP] 3 d  │ │           │ │
│ └────────────┘ └───────────┘ │
│                              │
│ Continue reading             │
│ ┌──────────────────────────┐ │
│ │[cov] IT                  │ │
│ │      Stephen King        │ │
│ │      ▓▓▓▓▓▓░░░░ 412/1138 │ │
│ │      Finish around 14 Oct│ │
│ │              [ Log page ]│ │
│ └──────────────────────────┘ │
│                              │
│ Continue watching            │
│ ┌──────────────────────────┐ │
│ │ [still 16:9]             │ │
│ │ House of the Dragon      │ │
│ │ S2 E5  Regent            │ │
│ │                     ( ✓ )│ │
│ └──────────────────────────┘ │
│                              │
│ Up next              See all │
│ 1 [book] Fire & Blood        │
│ 2 [ticket] IT Chapter Two    │
│ 3 [show] Welcome to Derry    │
│ [   Pick for me   ]          │
│                              │
│ 1,240 pages read this month  │  quiet stats line,
│                              │  taps to Your year
├──────────────────────────────┤
│ Home  Library (＋) Up next Coll│
└──────────────────────────────┘
```

**Sections and behavior:**

- **Greeting:** time-based ("Good morning", "Good afternoon", "Good evening") with first name. Avatar opens Profile & settings.
- **Search pill:** opens global search (7.15) with the keyboard up.
- **Due soon:** `LoanSlip` cards for loans due within 7 days, plus any overdue loans. Overdue slips come first and carry a hatched "Overdue" stamp. Tap opens book detail scrolled to the loan. Long-press shows quick actions: Renew, Returned.
- **Continue reading:** books in Reading status, most recently logged first. If more than one, the cards become a horizontal pager with dots. The **Log page** button opens the Page ruler sheet (7.7) directly over Home.
- **Continue watching:** shows in Watching status that have an unwatched aired episode. The round check marks the shown episode as watched (see motion in section 10). Shows that are caught up drop out of this row and show a small line underneath: "Welcome to Derry: caught up. Next episode date not announced."
- **Up next:** top three items from the queue with their media shape icons and position numbers, plus the Pick for me button.
- **Stats line:** one sentence, rotating between a few facts (pages this month, books finished this year, episodes this week).

**Adaptive order:** if anything is overdue, Due soon is pinned directly under the search pill with a slightly larger slip.

**Empty state (new user):** Kiri curled on an empty shelf. "Your shelf is empty. Add the book you're reading right now." Button: "Add a book". Secondary link: "Or search for a movie or show".

### 7.3 Library

**Purpose:** browse and filter everything by type and status.

```
┌──────────────────────────────┐
│ Library              🔍  අ/A │  ScriptToggle
│ [ Books | Movies | Shows ]   │  segmented control
│ (All)(Reading)(To read)(Wish │  status chips, scroll
│ list)(Read)(Abandoned)       │
│ Sort: Recently updated ▾  ▦ ≡ ▥│ view: grid / list / shelf
│                              │
│ ┌────┐ ┌────┐ ┌────┐         │
│ │cov │ │cov │ │cov │         │  CoverCard grid (3 col)
│ │    │ │    │ │    │         │
│ └────┘ └────┘ └────┘         │
│ IT      මඩොල් ගම්පෙරළිය         │
│ ▓▓░░    දූව   ★★★★½           │
└──────────────────────────────┘
```

**Three views for books** (movies and shows get grid and list only):

- **Grid:** 3-column `CoverCard`s with title, and a thin progress bar (Reading), a star rating (Read), or a due tag (on loan).
- **List:** `MediaRow` with cover thumbnail, title in both scripts, author, status and progress.
- **Shelf:** the signature browsing view. Books are shown as vertical `SpineTile`s standing side by side on wooden-shelf lines, spine width proportional to page count, title written vertically on the spine. Tap a spine and it tilts out and slides up into the book detail. In the prototype, spines are gray tones of different values; later they will take the dominant color of each cover.

**Script toggle (අ/A):** switches which script leads in titles across the Library. The other script is still shown underneath in `caption` size. The choice persists.

**Status chips** show counts: "Reading 2", "Wishlist 14". Chips are specific to the media type (shows get Watchlist, Watching, Watched, Dropped; movies get Watchlist, Watched, Dropped).

**Swipe gestures on list rows:** swipe right advances to the next logical status ("Start reading", "Mark watched"); swipe left reveals Add to up next, Add to collection, Delete.

**Long-press any item:** lifts the card and raises the Collections tray from the bottom (see 7.14) so the item can be dropped into a collection.

**Empty filter state:** "No abandoned books. Nice." (tone varies per status, always one short line).

### 7.4 Add sheet (the ＋ button)

```
┌──────────────────────────────┐
│          ───                 │
│ What are you adding?         │
│                              │
│ ┌────────┐┌────────┐┌───────┐│
│ │ [book] ││[ticket]││[show] ││  three large patch tiles
│ │  Book  ││ Movie  ││  Show ││
│ └────────┘└────────┘└───────┘│
│                              │
│ ── after tapping Book ──     │
│ [▥ Scan barcode           ]  │  fastest, most accurate
│ [📷 Snap the cover         ] │  AI reads it
│ [✎ Type it in             ]  │
└──────────────────────────────┘
```

- Tapping Book expands the sheet in place to show the three book methods (no new screen).
- Tapping Movie or Show goes straight to TMDB search (7.10) with the right type preselected.
- The last-used book method is highlighted to speed up repeat use.

### 7.5 Book capture flow

#### 7.5.1 Camera

```
┌──────────────────────────────┐
│ ✕                      ⚡     │
│                              │
│    ┌────────────────────┐    │
│    │                    │    │  book-shaped guide
│    │   Fit the cover    │    │  frame (2:3)
│    │   inside the frame │    │
│    │                    │    │
│    └────────────────────┘    │
│                              │
│  Barcode   [Cover]   Back    │  mode switcher
│              (◯)             │  shutter
│  🖼 From gallery              │
└──────────────────────────────┘
```

- **Barcode mode:** the frame becomes a wide rectangle. Capture is automatic when a barcode is read, with a haptic click. Then a lookup card slides up: "Found: Fire & Blood by George R. R. Martin" with "Use this" and "Not it". If nothing is found: "No match for this ISBN. Snap the cover instead?" with a button that switches to Cover mode, keeping the ISBN.
- **Cover mode:** manual shutter. After capture, go to Crop.
- **Back mode:** optional second photo (back cover or copyright page) for page count, publisher and ISBN. Reached from the review form too ("Add back cover to fill more").
- Gallery import is always available.

#### 7.5.2 Crop

Photo with four draggable corner handles auto-placed on the detected cover edges. Buttons: "Retake" and "Use photo". Rotate icon in the corner.

#### 7.5.3 Reading the cover (the AI moment)

This is one of the few orchestrated animations in the app.

1. The cropped cover shrinks and moves to the top-left of the screen.
2. A soft scan line passes over the cover once.
3. The form fields appear below as empty outlines, then fill **one at a time** (title, author, language...), each value visually lifting off the cover thumbnail and settling into its field.
4. Status text underneath changes through: "Reading the cover", "Finding the author", "Writing the English title".

If the network is slow, keep looping step 2 with the status text, and after 8 seconds show "Taking longer than usual. You can fill it in yourself." with a "Fill in myself" button that shows the form with whatever is ready.

#### 7.5.4 Review form

```
┌──────────────────────────────┐
│ ←  Check the details    Save │
│ ┌────┐  Tap a field to edit. │
│ │cov │  Dotted = please check│
│ └────┘  [+ Add back cover]   │
│                              │
│ Title (Sinhala)              │
│ [ මඩොල් දූව              ✦ ] │  ✦ = filled by AI
│ Title (English / romanized)  │
│ [ Madol Doova             ✦ ]│
│ Author (Sinhala)             │
│ [ මාර්ටින් වික්‍රමසිංහ      ✦ ] │
│ Author (English / romanized) │
│ [ Martin Wickramasinghe  ✦ ] │
│ Language   [Sinhala ▾]       │
│ Pages      [ 214 ]  ⋯ check  │  dotted underline
│ Format  (Physical)(E-book)(Audio)│
│                              │
│ Where's it from?             │
│ (Bought)(Library)(Friend)(Wishlist)│
│ ── Library selected ──       │
│ Library  [Colombo Public Lib ▾]│
│ Borrowed [Today, 23 Sep]     │
│ Due      [7 Oct]  (+7)(+14)(+21)│
│                              │
│ Status  (To read)(Reading)   │
│                              │
│ [      Add to Calico       ] │
└──────────────────────────────┘
```

- Field order leads with whichever script the cover was printed in.
- **Confidence:** AI-filled fields show a small ✦ marker. Low-confidence fields add a dotted underline and a "Check" hint. Tapping the cover thumbnail opens it full-screen so the user can compare.
- **Where's it from?** drives the rest of the form:
  - Bought: status options To read, Reading, Read.
  - Library: reveals library, borrowed date (default today) and due date (default +14 days, quick chips +7/+14/+21). Library name remembers previous entries.
  - Friend: reveals "Borrowed from" name and an optional return-by date.
  - Wishlist: hides status and shows Priority (Someday, Soon, Must read), Price (LKR, optional) and "Where to find it".
- Duplicate check: if a book with the same title already exists, show an inline notice: "You already have Gamperaliya (Read, 2024). Add another copy or open the existing one?"
- **Save** result: the cover card flies down into the Library tab icon, which bumps once. Snackbar: "Added Madol Doova" with "Open".

**Errors:**
- AI failed: "Couldn't read this cover. Fill in the details, or try a sharper photo." Form stays usable.
- Daily AI limit: "You've used today's 30 cover reads. They reset at midnight. Barcode scanning still works."
- Offline: "You're offline. The photo is saved and details will be read when you're back online." The book is saved as a draft with a small clock badge on its card.

### 7.6 Book detail

```
┌──────────────────────────────┐
│ ←                  අ/A   ⋮   │
│        ┌────────┐            │
│        │ cover  │            │  cover over blurred
│        │        │            │  copy of itself (gray)
│        └────────┘            │
│             IT               │
│        Stephen King          │
│   English  Physical  1138 pp │
│                              │
│ StatusRail                   │
│ Wishlist─To read─●Reading─Read│
│                    ╲         │
│                  Abandoned   │
│                              │
│ ▓▓▓▓▓▓▓░░░░░░░ 412 of 1138   │
│ About 35 pages a day         │
│ Finish around Wed 14 Oct     │
│ ▁▂▅▃▆▂▇ last 14 days          │  PaceSparkline
│ [        Log page         ]  │
│                              │
│ On loan (if borrowed)        │
│ ┌ LoanSlip ────────────────┐ │
│ └──────────────────────────┘ │
│                              │
│ Collections                  │
│ (Stephen King)(Horror)(+ Add)│
│                              │
│ Reading history              │
│ Read 1: started 2 Sep        │
│                              │
│ Notes                        │
│ [ Add a note               ] │
└──────────────────────────────┘
```

**Status rail (`StatusRail`):** a horizontal track with stops for Wishlist, To read, Reading, Read. Abandoned sits below the track as a branch off Reading. The current status is a filled marker. Tap any stop to move there, or drag the marker along the track.
- Moving to Reading asks for the start date (default today) in a small inline popover.
- Moving to Read opens the Finish sheet (7.8).
- Moving to Abandoned opens the Stop reading sheet (7.8).
- Moving backwards (for example Read to Reading) asks: "Start a re-read?" and creates a new reading session.

**Pace block:** hidden until three page logs exist. Before that: "Log a few sessions to see your pace."

**Overflow menu (⋮):** Edit details, Add to up next, Change cover photo, Share, Delete.

### 7.7 Page ruler sheet (signature interaction)

**Purpose:** log the current page in about two seconds, one-handed.

```
┌──────────────────────────────┐
│          ───                 │
│ IT                           │
│                              │
│            412               │  big number (tap to type)
│       +37 since yesterday    │
│                              │
│ ···|····|····|····▼····|····|│  horizontal ruler,
│   380  390  400  410  420 430│  needle fixed in center
│                              │
│  (+10)  (+25)  (+50)  (End)  │  quick chips
│                              │
│ At this pace: Wed 14 Oct     │  updates live as you scrub
│                              │
│ [       Log page 412       ] │
└──────────────────────────────┘
```

- The ruler opens positioned at the last logged page. Swiping it scrolls pages past a fixed center needle, with momentum. Small ticks per page, labels every 10.
- A light haptic tick on every page, and a firmer tick every 10.
- The estimated finish date updates live while scrubbing, so the user can see how a long session changes things.
- Tapping the big number opens the numeric keyboard for exact entry.
- **End** jumps to the last page and changes the button to "Finish the book", which opens the Finish sheet.
- Entering a page lower than the last log asks: "Go back to page 390? This replaces today's log."
- For audiobooks and e-books tracked by percentage, the ruler shows 0–100%.

### 7.8 Finish and Stop reading sheets

**Finish sheet:**

```
┌──────────────────────────────┐
│          ───                 │
│   (Kiri stretches, once)     │
│ You finished Madol Doova     │
│ 14 days, 214 pages           │
│                              │
│   ☆ ☆ ☆ ☆ ☆                  │  drag across for half stars
│                              │
│ [ A line you'll remember... ]│  rotating prompt
│ Finished [Today, 23 Sep]     │
│                              │
│ ☑ Return to Colombo Public   │  only if on loan
│   Library too                │
│                              │
│ [       Mark as read       ] │
└──────────────────────────────┘
```

- The note placeholder rotates between prompts: "A line you'll remember", "Who would you lend it to?", "One word for this book".
- After saving, the book's progress bar fills to the end and the card settles with a single gentle pulse. No confetti.

**Stop reading sheet (Abandoned):**
- "Stop reading IT at page 412?"
- Optional reason chips: Not for me, Too slow, Library wanted it back, Maybe later.
- Choosing "Maybe later" changes the primary button to "Move to To read instead", because the user is pausing, not abandoning.
- Buttons: "Stop reading" and "Keep reading".

### 7.9 Library loan

**LoanSlip component (signature object):**

```
┌──────────────────────────────┐
│ Colombo Public Library       │
│ ─────────────────────────────│
│  Borrowed  │ Due        │    │
│ ┌────────┐ │ ┌────────┐ │    │  date stamps, slightly
│ │ 23 SEP │ │ │ 07 OCT │ │    │  rotated like ink
│ └────────┘ │ └────────┘ │    │
│            │ ┌────────┐ │    │  each renewal adds a
│            │ │ 21 OCT │ │    │  new stamp below
│            │ └────────┘ │    │
│ ─────────────────────────────│
│ Due in 3 days    Renewed 1×  │
│ [ Renew ]        [ Returned ]│
└──────────────────────────────┘
```

- The slip is a ruled card with columns like a real library slip. Dates are shown as stamps.
- **Renew:** opens a small date picker defaulting to the old due date + 14 days. On confirm, a new stamp lands on the slip with a firm haptic "thunk", the old due stamp gets a strike line, and the renewal count increases.
- **Returned:** the slip slides down and tucks into a "pocket" shape, then collapses. Snackbar: "Returned to Colombo Public Library" with "Undo". The book's ownership becomes history; if it wasn't finished, ask "Move to To read so you remember it?"
- **Overdue:** a large hatched "Overdue" stamp crosses the slip at an angle; the due-in line says "Overdue by 2 days".
- **Lent out** (a book the user lent to a friend) uses the same slip with "Lent to Kasun" in the header.

**First-loan notification permission:** the first time a library loan is saved, a sheet explains before the Android system prompt: "Calico can remind you 3 days and 1 day before a book is due. Allow notifications?" Buttons: "Allow reminders", "Not now".

### 7.10 TMDB search (movies and shows)

```
┌──────────────────────────────┐
│ ←  [ Search movies       ✕ ] │
│    (Movies)(Shows)           │
│                              │
│ ┌──┐ IT                      │
│ │  │ 2017  Movie  2h 15m     │
│ └──┘                  [ ＋ ] │  quick add = Watchlist
│ ┌──┐ IT Chapter Two          │
│ │  │ 2019  Movie             │
│ └──┘              [✓ Added]  │
└──────────────────────────────┘
```

- Results appear as the user types (after 2 characters, with a short delay).
- **＋** adds to Watchlist instantly, and the button flips to "Added". Long-press ＋ to choose a different status (Watched, Watching).
- Tapping a result opens a preview sheet: poster, year, overview (3 lines, expandable), runtime or season count, and buttons "Add to watchlist" and "Already watched".
- **Franchise suggestion:** when a movie belonging to a TMDB collection is added, a card slides up: "IT is part of a 2-film series. Add the other one too?" with "Add all" and a checkbox to also create a collection named after the series.
- TMDB attribution line at the bottom of results: "Movie and show data from TMDB".
- Empty result: "Nothing found for 'Derri'. Check the spelling or try the original title."

### 7.11 Show detail (episode grid)

```
┌──────────────────────────────┐
│ ←  [backdrop 16:9, gray]  ⋮  │
│ House of the Dragon          │
│ 2022  HBO  Returning series  │
│ StatusRail: Watchlist─●Watching│
│             ─Watched  ╲Dropped│
│                              │
│ ┌ Next up ─────────────────┐ │
│ │ S2 E5  Regent            │ │
│ │ [still]            ( ✓ ) │ │
│ └──────────────────────────┘ │
│                              │
│ 14 of 18 episodes            │
│ Season 1  ■■■■■■■■■■ 10/10   │  EpisodeSquare rows
│ Season 2  ■■■■◎□□□    4/8    │  ◎ = next up (pulsing ring)
│ Season 3  ┆┆┆┆┆┆┆┆  Coming   │  dashed = not aired
│                              │
│ Include specials  ○          │
└──────────────────────────────┘
```

- **Episode grid:** each season is one row of small `EpisodeSquare`s numbered inside. Watched squares are filled; the next-up square has a ring; unaired squares are dashed with no number fill.
- **Tap a square:** toggles watched. A tiny popover shows the episode name and air date for one second.
- **Long-press a square:** marks the whole season watched. The fill sweeps left to right across the row with a rolling haptic, and a snackbar offers "Undo".
- **Drag across squares (paint):** press, hold briefly, and drag along a row to mark a range. Useful after a binge.
- **Tap the season label:** expands the row into a list of episodes with titles, air dates and stills.
- Marking episodes out of order is allowed; "Next up" is always the first unwatched aired episode.

**Caught up state:** the Next up card becomes: "You're caught up. Next episode Mon 12 Oct." or "You're caught up. Next season not announced yet."

**Finished show:** when the last episode of an ended show is marked, a sheet asks: "That was the last episode of Game of Thrones. Mark the show as watched?" with rating and note fields.

### 7.12 Movie detail (ticket stubs)

```
┌──────────────────────────────┐
│ ←   [poster]            ⋮    │
│     IT                       │
│     2017  2h 15m  Horror     │
│ StatusRail: Watchlist─●Watched│
│                      ╲Dropped │
│                              │
│ Your viewings                │
│  ┌─┬──────────────────────┐  │
│  │ │ 12 Sep 2026  ★★★★    │  │  top stub (latest)
│  │ │ "Still scary."       │  │  perforated left edge
│  └─┴──────────────────────┘  │
│   └─ 2 older stubs stacked ─┘│  stack depth = rewatches
│ Watched 3 times              │
│ [     Watched it again     ] │
└──────────────────────────────┘
```

- Each viewing is a `TicketStub` with date, rating and a one-line note. Stubs stack with a slight offset; tapping the stack fans them out into a list.
- **Watched it again:** the new stub tears off a ticket shape with a quick rip motion and haptic, then a sheet asks for date, rating and note (all optional).

### 7.13 Up next and Pick for me

**Up next screen:**

```
┌──────────────────────────────┐
│ Up next                   ⋮  │
│ One queue for everything.    │
│ Drag to reorder.             │
│                              │
│ ≡ 1 [book]   Fire & Blood    │
│             736 pages        │
│ ≡ 2 [ticket] IT Chapter Two  │
│             2h 49m           │
│ ≡ 3 [show]   Welcome to Derry│
│             Season 1         │
│ ...                          │
│ ≡ 10 [book]  Gamperaliya     │
│ ┄┄┄┄ Pick for me draws from  │
│      the 10 above this line ┄│
│ ≡ 11 [ticket] ...            │
│                              │
│ [      Pick for me 🐾      ] │  sticky bottom button
└──────────────────────────────┘
```

- Drag handle on the left; the lifted row gets a shadow placeholder and the others part smoothly. A haptic tick fires each time the row passes another.
- The **dashed divider after position 10** makes the Pick for me rule visible, so reordering has a clear purpose.
- Swipe left to remove from the queue (with undo). Swipe right to start ("Start reading" / "Start watching").
- Filter chips at the top (All, Books, Movies, Shows) only filter the view; they don't reorder the queue.
- Items that become Read, Watched or Dropped leave the queue automatically with a snackbar and undo.
- Empty state: Kiri batting at nothing. "Nothing queued. Add things from any detail page with 'Add to up next'."

**Pick for me (full-screen moment):**

1. The screen dims and the top 10 items appear as a face-down deck of cards in the center.
2. The deck shuffles (about 1 second): cards riffle and fan out in an arc.
3. Kiri's paw reaches in from the bottom edge and bats one card out of the arc.
4. The card flips to reveal the pick with its cover, title, media shape and a short reason line such as "Queued 12 days ago" or "The shortest thing in your queue".
5. Buttons: "Start this" (sets status to Reading or Watching and opens the detail) and "Pick again" (reshuffles, excluding this item).

Shaking the phone on the Up next screen also triggers Pick for me. With reduced motion enabled, the deck is skipped and the pick fades in.

### 7.14 Collections

**Collections list:**

```
┌──────────────────────────────┐
│ Collections          [ ＋ ]  │
│ ┌───────────┐ ┌───────────┐  │
│ │ ▢ ▢       │ │ ▢ ▢       │  │  CollectionMosaic:
│ │ ▢ ▢       │ │ ▢ ▢       │  │  2×2 patchwork of covers
│ └───────────┘ └───────────┘  │
│ Stephen King   GRRM          │
│ [b]3 [t]2 [s]1 [b]2 [s]2     │  counts by media shape
└──────────────────────────────┘
```

- Mosaics use the first four items' covers as a patchwork (a nod to calico patches). Fewer than four items leaves gray patches.
- Long-press a collection to pin it to the top, rename it or delete it.

**Collection detail:**
- Header mosaic, name, optional one-line description ("Everything from the King of horror").
- Chips: All, Books, Movies, Shows.
- Items in a mixed grid, each card showing its media shape so types are clear.
- Sort: Custom (drag), Release year, Recently added.
- **Suggestions row** (quiet, at the bottom): "More in this series: IT Chapter Two" for TMDB franchise items not yet added.
- Buttons: "Add items" (opens a search across the library and TMDB) and "Add all to up next".

**New collection sheet:** name field, optional description, then "Add items now" or "Create empty".

**Collections tray (drag to collect):** long-pressing any item anywhere in the app lifts its card and raises a tray of collection chips from the bottom of the screen, plus a "New collection" chip. Dropping the card onto a chip adds it; the chip pulses and shows "+1". Releasing elsewhere cancels. This is an accelerator; the "Add to collection" sheet on detail pages remains the main method.

### 7.15 Global search

- Opens with recent searches and quick filters (Books, Movies, Shows, On loan).
- Matches titles and authors in **both scripts**. Typing "madol" finds මඩොල් දූව, and typing Sinhala finds romanized entries.
- Results grouped by media type, with the media shape on each row.
- If nothing is in the library, offer: "Search TMDB for 'Derry'" and "Add 'Derry' as a book".

### 7.16 Your year (stats)

Reached from the Home stats line and Profile. Keep it calm, like a year-end summary page rather than a dashboard.

- Books finished this year, pages read, and an optional reading goal shown as a row of small book spines filling a shelf (12 spines for a goal of 12).
- Language split: Sinhala vs English books as a simple two-part bar.
- Hours watched and episodes watched this year.
- Longest book, fastest read, most rewatched movie.
- Year selector at the top.

### 7.17 Profile and settings

- Account: name, email, avatar, Sign out.
- Reading: yearly goal, default loan length (14 days), default library.
- Reminders: reminder time (default 9:00 AM), 3-day reminder on/off, 1-day reminder on/off.
- Display: lead script (Sinhala first / English first), include TV specials.
- Data: Export my data (JSON or CSV).
- About: TMDB attribution with logo placeholder, privacy policy, terms, app version.
- Danger zone at the bottom: "Delete account". Confirmation screen requires typing DELETE and explains what gets removed.

---
## 8. Key flows to link in the prototype

Each flow should be clickable end to end.

**F1. Add a library book by photo**
Home (empty) → ＋ → Book → Snap the cover → Camera → Crop → Reading the cover → Review form (Library selected, due date +14) → Add to Calico → Notification permission sheet → Home with a new Due soon slip.

**F2. Add a bought book by barcode**
＋ → Book → Scan barcode → auto-capture → "Found: Fire & Blood" card → Use this → Review form (Bought, To read) → Add to Calico → snackbar "Added Fire & Blood".

**F3. Log pages, then finish**
Home → Continue reading card → Log page → Page ruler (scrub from 412 to 449) → Log page 449 → card updates. Then: Book detail → Log page → End → Finish the book → Finish sheet (rate 4.5, note) → Mark as read.

**F4. Library due date: renew, then return**
Notification "Madol Doova is due in 3 days" → Book detail at the LoanSlip → Renew (+14) → stamp animation. Later: Home Due soon slip → long-press → Returned → slip tucks away → "Move to To read?" (if unfinished).

**F5. Add a show and watch the next episode**
＋ → Show → search "house of the dragon" → preview → Already watched some? → Show detail → long-press Season 1 (sweep fills) → tap S2 E1–E4 → Home Continue watching shows S2 E5 → tap ✓ → card advances to S2 E6.

**F6. Movie rewatch**
Library → Movies → IT → Watched it again → stub tears off → sheet (date, 4 stars, "Still scary.") → stack now shows 3.

**F7. Build the "Stephen King" collection**
Collections → ＋ → name "Stephen King" → Add items now → select IT (book), IT (2017), IT Chapter Two, IT: Welcome to Derry → Done. Then in Library, long-press "The Shining" → tray rises → drop on "Stephen King" chip → "+1".

**F8. Reorder Up next and pick**
Up next → drag Gamperaliya from position 12 above the dashed line to position 4 → Pick for me → deck shuffles → Kiri's paw picks → "Start this" → opens detail with status set to Reading.

---

## 9. Gesture map

| Where | Gesture | Result |
|---|---|---|
| ＋ capture button | Tap / long-press | Add sheet / straight to book camera |
| Library list row | Swipe right | Advance to next logical status |
| Library list row | Swipe left | Up next, Collection, Delete |
| Any item card | Long-press | Lift card, show Collections tray for drag-and-drop |
| Shelf view spine | Tap | Spine tilts out into book detail |
| Page ruler | Horizontal swipe | Scrub pages with haptic ticks |
| Episode square | Tap | Toggle watched |
| Episode square | Long-press | Mark whole season watched |
| Episode row | Press-hold then drag | Paint a range of episodes watched |
| Up next row | Drag handle | Reorder |
| Up next row | Swipe left / right | Remove / Start |
| Up next screen | Shake phone | Pick for me |
| Due soon slip | Long-press | Renew / Returned quick actions |
| Ticket stub stack | Tap | Fan out into viewing list |
| Status rail | Tap stop or drag marker | Change status |

Every gesture must have a visible button alternative somewhere on the same screen or in the item's menu. Gestures are shortcuts, never the only path.

---

## 10. Motion and haptics

Motion answers the user's actions. Apart from the Welcome screen, the only unprompted animation is the pulsing ring on the next-up episode.

| Moment | Motion | Haptic |
|---|---|---|
| Welcome | Three patch shapes drift together into Kiri's outline (plays once, first launch only) | None |
| Reading the cover | Scan line, then fields fill one by one from the cover | Light tick as each field fills |
| Book saved | Card flies into the Library tab icon; icon bumps | Light |
| Page ruler | Momentum scrolling, needle fixed | Tick per page, firmer per 10 |
| Renew | New date stamp drops onto the slip; old due date gets a strike line | Firm "thunk" |
| Returned | Slip slides into a pocket and collapses | Medium |
| Mark episode (Home) | Check fills, card slides left, next episode slides in from the right | Light |
| Mark season | Fill sweeps left to right across squares | Rolling ticks |
| Watched again | Stub tears off with a short rip | Sharp tick |
| Drag to reorder | Lifted row, others part | Tick when passing each row |
| Pick for me | Deck shuffle, paw bat, card flip | Soft ticks during shuffle, firm on reveal |
| Finish a book | Progress bar fills to end, one gentle pulse, Kiri stretches once | Success pattern |

**Reduced motion:** when the system setting is on, replace all of the above with simple cross-fades and keep haptics.

**Durations:** feedback 100–200 ms, transitions 250–350 ms, Pick for me total under 2.5 seconds.

---

## 11. Screen states

Every data screen needs four extra states in the prototype.

| State | Treatment |
|---|---|
| Loading | Skeleton shapes matching the final layout (gray blocks where covers and text will be). No spinners on full screens. |
| Empty | Kiri illustration (only on main tabs), one line saying what's missing, one button to fix it. |
| Error | Plain explanation and a fix: "Couldn't load episodes for this show. Check your connection and pull to refresh." |
| Offline | A slim banner under the top bar with sleeping Kiri: "Offline. Changes will sync when you're back online." Items changed offline show a small clock badge until synced. |

**Empty state copy by screen:**

- Home: "Your shelf is empty. Add the book you're reading right now."
- Library, Books: "No books yet. Scan a barcode or snap a cover to add one."
- Library, Shows: "No shows yet. Search for one you're watching."
- Up next: "Nothing queued. Add things from any detail page with 'Add to up next'."
- Collections: "Group books, movies and shows your way, like everything by one author."
- Due soon: section hidden when empty (no empty state on Home).

---

## 12. Voice, copy and notifications

**Voice:** friendly, brief, plain. Like a well-organized friend who also works at the library. Sentence case everywhere. Buttons say exactly what happens, and the resulting message uses the same verb ("Renew" → "Renewed until 21 Oct").

**Consistent vocabulary:**

| Use | Not |
|---|---|
| Log page | Update progress, Save page |
| Mark as read | Complete, Done |
| Stop reading | Abandon (the status is still called Abandoned in filters) |
| Returned | Close loan |
| Add to up next | Queue, Enqueue |
| Collection | Folder, List, Board |
| Watched it again | Rewatch entry |

**Dates:** "Wed 14 Oct" for near dates, "14 Oct 2025" for past years. Relative phrasing for loans: "Due tomorrow", "Due in 3 days", "Overdue by 2 days".

**Notification copy (local reminders at the user's chosen time):**

| Trigger | Title | Body | Actions |
|---|---|---|---|
| 3 days before due | Madol Doova is due in 3 days | Due at Colombo Public Library on Sat 26 Sep. | Renew, Open |
| 1 day before due | Madol Doova is due tomorrow | Renewed once so far. | Renew, Returned |
| New episode aired (optional, later) | New episode of House of the Dragon | S3 E1 is out. | Mark watched, Open |

---

## 13. Accessibility and Android specifics

- Minimum 48 × 48 dp touch targets; the round check buttons and episode squares must meet this (episode squares can visually be smaller with a larger hit area, or rows wrap to two lines on seasons with many episodes).
- Every media shape icon has a text label for screen readers ("Book", "Movie", "TV show").
- Episode squares announce "Season 2, episode 5, Regent, not watched".
- The page ruler supports the numeric keyboard as an alternative and announces the value as it changes.
- Status is never conveyed by color alone (important while the design system is pending, and after).
- Support system font scaling up to 200%: long Sinhala titles wrap rather than truncate on detail screens; truncate with ellipsis only in grids.
- Respect Android predictive back: sheets collapse with the back gesture.
- Edge-to-edge layout: content scrolls behind a translucent status bar; bottom nav sits above the gesture bar.
- Test the widest realistic strings: "The Seven Moons of Maali Almeida", "මාර්ටින් වික්‍රමසිංහ", and 40+ character library names.

---

## 14. Component inventory (for later design-system mapping)

Build each of these as a named, reusable component with variants. The design system will later restyle them without changing structure.

| Component | Variants / notes |
|---|---|
| `AppBar` | Large (Home greeting), standard with back, transparent over hero |
| `BottomNav` | With raised `CaptureButton` in the center |
| `CaptureButton` | Default, pressed, long-press hint |
| `SearchPill` | Idle, focused |
| `SegmentedControl` | 2 or 3 segments |
| `Chip` | Filter (with count), choice, input (collection tags), quick-add (+10) |
| `MediaShapeIcon` | Book, Movie, Show; sizes S / M / L |
| `CoverCard` | Book / Movie / Show; states: default, reading (progress), rated, on loan, offline-pending |
| `MediaRow` | List row with swipe actions |
| `SpineTile` | Width by page count; vertical title |
| `ScriptToggle` | Sinhala-first / English-first |
| `BilingualTitle` | Lead script + secondary script line |
| `StatusRail` | Book (5 statuses with branch), Movie (3), Show (4) |
| `ProgressBar` | Thin (cards), thick (detail) |
| `PaceSparkline` | 14-day bars |
| `PageRuler` | Pages mode, percent mode |
| `LoanSlip` | Due soon, overdue, renewed (multiple stamps), lent out, compact (Home) |
| `DateStamp` | Borrowed, due, struck-through |
| `TicketStub` | Single, stacked, fanned list |
| `EpisodeSquare` | Watched, unwatched, next-up, unaired |
| `SeasonRow` | Collapsed grid, expanded list |
| `NextEpisodeCard` | Next up, caught up with date, caught up no date |
| `ContinueCard` | Reading, Watching |
| `UpNextRow` | Draggable, with position number and media shape |
| `PickDivider` | Dashed "Pick for me draws from the 10 above" line |
| `PickDeck` | Deck, shuffle, reveal |
| `CollectionMosaic` | 1–4 covers, pinned badge |
| `CollectionsTray` | Drag-and-drop target chips |
| `RatingStars` | Display, interactive half-star |
| `ConfidenceField` | Manual, AI-filled, AI low-confidence |
| `Sheet` | Standard, expanding (Add sheet), full-height (review) |
| `Snackbar` | With Undo, with Open |
| `EmptyState` | With Kiri pose (curled, batting, asleep, stretching) |
| `OfflineBanner` | Offline, syncing |
| `KiriIllustration` | Curled, paw, stretch, asleep |

---

## 15. Sample data

Use this data consistently across all screens. Dates assume today is **Wed 23 Sep 2026**. Page counts and episode data are illustrative.

**User:** Dilan Kumara, avatar initials "DK". Default library: Colombo Public Library. Reading goal: 24 books in 2026 (17 done).

**Books:**

| Title (native) | Title (romanized) | Author | Lang | Status | Detail |
|---|---|---|---|---|---|
| මඩොල් දූව | Madol Doova | මාර්ටින් වික්‍රමසිංහ / Martin Wickramasinghe | Sinhala | Reading | Library loan, borrowed 9 Sep, due 26 Sep (3 days), renewed 0×, page 150 of 214 |
| ගම්පෙරළිය | Gamperaliya | මාර්ටින් වික්‍රමසිංහ / Martin Wickramasinghe | Sinhala | Read | Owned, ★★★★★, finished Mar 2024 |
| IT | — | Stephen King | English | Reading | Owned, page 412 of 1138, ~35 pages/day |
| Fire & Blood | — | George R. R. Martin | English | To read | Owned, 736 pages, Up next #1 |
| The Seven Moons of Maali Almeida | — | Shehan Karunatilaka | English | Wishlist | Priority: Soon |
| The Shining | — | Stephen King | English | Abandoned | Stopped at page 120, reason: Library wanted it back |
| හත් පණ | Hath Pana | කුමාරතුංග මුනිදාස / Kumaratunga Munidasa | Sinhala | To read | Library loan, **overdue by 2 days**, renewed 1× |

**Movies:**

| Title | Year | Status | Detail |
|---|---|---|---|
| IT | 2017 | Watched | 3 viewings, latest 12 Sep 2026, ★★★★, "Still scary." |
| IT Chapter Two | 2019 | Watchlist | Up next #2 |

**Shows:**

| Title | Status | Progress |
|---|---|---|
| Game of Thrones | Watched | All 8 seasons (10, 10, 10, 10, 10, 10, 7, 6 episodes) |
| House of the Dragon | Watching | S1 complete (10), S2 4 of 8 watched, next up S2 E5 "Regent" |
| IT: Welcome to Derry | Watching | Caught up on season 1, next season not announced (illustrative) |

**Collections:**

| Name | Items |
|---|---|
| Stephen King | IT (book), The Shining (book), IT (2017), IT Chapter Two, IT: Welcome to Derry |
| GRRM | Fire & Blood (book), Game of Thrones, House of the Dragon |
| Sinhala classics | Madol Doova, Gamperaliya, Hath Pana |

---

## 16. Prototype frame checklist

Build these frames, then link them per section 8.

- [ ] Welcome and sign-in, sign-in error
- [ ] Home: populated, with overdue pinned, empty (new user), offline
- [ ] Library: books grid, books list with swipe revealed, books shelf view, movies grid, shows list, empty filter
- [ ] Add sheet: collapsed, book methods expanded
- [ ] Camera: barcode mode, barcode found card, cover mode, back mode
- [ ] Crop
- [ ] Reading the cover: mid-animation, slow-network message
- [ ] Review form: AI-filled with low-confidence fields, Library source, Wishlist source, duplicate notice, AI error, daily limit
- [ ] Notification permission sheet
- [ ] Book detail: reading with loan, read with history, wishlist, abandoned
- [ ] Page ruler sheet: default, typed entry, End reached
- [ ] Finish sheet, Stop reading sheet (with "Maybe later")
- [ ] LoanSlip: due soon, renewed, overdue, lent out; Renew date picker; Returned snackbar
- [ ] TMDB search: results, preview sheet, franchise suggestion, no results
- [ ] Show detail: watching, caught up, season expanded to list, finished-show prompt
- [ ] Movie detail: single viewing, stacked stubs, fanned list, Watched it again sheet
- [ ] Up next: populated with divider, dragging state, empty
- [ ] Pick for me: deck, shuffle, paw, reveal
- [ ] Collections: list, detail, new collection sheet, collections tray during drag
- [ ] Global search: recent, bilingual results, no results with TMDB offer
- [ ] Your year
- [ ] Profile and settings, delete account confirmation
- [ ] Notification examples (3-day, 1-day)
