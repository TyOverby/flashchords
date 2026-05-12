# FlashChords

A mobile-optimized flashcard app for learning guitar chord fingerings. Built as a single-page app with plain HTML/JS/CSS and React via CDN — no build system.

## Working on This Project

- **Keep CLAUDE.md up to date.** When you add, remove, or change features, pages, components, data models, or architectural patterns, update the relevant sections of this file to reflect the current state of the project. This includes the file tree in "Project Structure", the UX descriptions, and the architecture notes.
- **Commit after each unit of work.** Make a git commit after completing each logical piece of work (a new feature, a bug fix, a refactor, etc.). Don't batch unrelated changes into a single commit. Do this proactively — don't wait for the user to ask you to commit.

## User Experience

### Home Page (`#/`)

The home page is the hub. It has two sections (no card wrappers — visual hierarchy comes from font size/weight):

- **Chords section** — shows the chord count, a pencil icon button to edit chords, and a plus icon button that navigates to the chord editor with the add form pre-opened (`#/chords?add`).
- **Decks section** — lists all decks. Each deck row shows the deck name (clickable — navigates to quiz) and chord count, with a trash icon button for deletion. A plus icon button at the top navigates to deck creation.

A download icon button at the bottom exports all chords and decks as a JSON file. The FlashChords title in the header is clickable and always navigates back to home.

### Chord Management (`#/chords`)

Lists all chords, each shown as a row with a mini fretboard thumbnail and the chord name. Each row has a trash icon button for deletion.

The plus icon button toggles open an inline form with a text input for the chord name and a full-size interactive fretboard. When navigated to via `#/chords?add`, the form opens automatically. The fretboard interaction works as follows:

- **Tapping a fret intersection** places a dot on that string/fret. Tapping the same position again removes it (toggles back to open).
- **Tapping above the nut** toggles between open (circle marker) and muted ("X" marker). There is no intermediate state — it cycles open → X → open.
- **Only one dot per string** — placing a dot on a new fret for the same string moves it there.

A "Clear" button resets the fretboard to all-open. The "Save Chord" button is disabled until a name is entered. After saving, the form resets and closes.

Multiple chords can share the same name (different fingerings of the same chord). Deletion prompts a confirmation dialog.

### Deck Creation (`#/deck/create`)

Shows a searchable list of all chords. Each row has a checkbox, a mini fretboard, and the chord name. Tapping anywhere on the row toggles selection.

The search input filters chords by name (case-insensitive substring match).

The deck name input has a dynamic placeholder that auto-generates from the selected chord names, joined by commas. If the user leaves the name blank, this auto-generated name is used on save.

The "Create Deck" button is sticky at the bottom and shows the selection count. It's disabled until at least one chord is selected. Saving navigates back to home.

### Quiz (`#/quiz/:deckId`)

The quiz page has a compact top bar with the back button, deck name, and a single mode-cycle button all horizontally aligned. The FlashChords header is hidden on this page. Clicking the mode button cycles through three modes:

- **A → ●** (Name to Fingering) — shows the chord name, the user places dots on a blank interactive fretboard, then taps "Guess".
- **A ← ●** (Fingering to Name) — shows a non-interactive fretboard with the correct fingering, the user picks from chord-name buttons.
- **A ↔ ●** (Both) — randomly picks one of the above two modes for each card.

The deck's chords are shuffled into a queue. When the queue is exhausted, it reshuffles and starts over (infinite loop).

#### Name → Fingering feedback

On guess, each string is compared independently:
- **Solid green dot** — user's fret matches the answer.
- **Solid red dot** — the correct fret the user missed.
- **Red outline dot** (non-filled) — where the user placed a wrong guess.

Open and muted strings are compared but don't produce visible dots (only fretted positions show dots). If correct, "Correct!" flashes for 600ms then auto-advances. If wrong, the feedback fretboard stays visible with a "Not quite!" message and a "Next" button.

#### Fingering → Name feedback

The user sees buttons for every unique chord name in the deck. On a wrong guess, that button is disabled (grayed out) and "Try again!" appears as a centered overlay for 500ms then fades — the user keeps guessing until correct. On correct, "Correct!" flashes for 600ms and auto-advances.

Switching modes mid-quiz resets to a fresh card.

### First Launch

On first load (or if localStorage is empty), 8 common open chords are seeded: C, D, E, G, A, Am, Em, Dm. This only happens once — the seed flag is stored in localStorage under `flashchords_seeded`.

## Project Structure

```
index.html              Entry point, loads React/htm via CDN importmap
css/styles.css          All styles, light theme (off-grey/dark-brown) with CSS custom properties
js/
  deps.js               Shared imports: React, ReactDOM, htm → html tagged template
  app.js                Root component, hash-based router, seed trigger
  components/
    Fretboard.js        SVG fretboard (interactive + static + feedback + mini)
    Icons.js            Inline SVG icon components (Lucide-style)
  data/
    util.js             randomId() helper (avoids crypto.randomUUID secure-context requirement)
    chordStore.js       Chord CRUD against localStorage
    deckStore.js        Deck CRUD against localStorage
    seedData.js         Default chord definitions, one-time seed logic
    exportImport.js     JSON export (file download) and import (parse + overwrite)
  pages/
    HomePage.js         Deck list, chord count, export button
    ChordListPage.js    Chord CRUD UI with interactive fretboard for adding
    DeckCreatePage.js   Searchable chord picker with checkboxes
    QuizPage.js         Both quiz modes + mode selector + feedback logic
```

## Architecture Decisions

### No build system

The app uses native ES modules with an importmap in index.html pointing to esm.sh CDN for React 18, ReactDOM, and htm. This means:
- No bundler, no transpiler, no node_modules.
- `htm` replaces JSX — it's a tagged template literal that produces React.createElement calls at runtime. Use `className` (not `class`) since htm passes attributes directly to React.
- All imports between local files use explicit `.js` extensions.
- `js/deps.js` centralizes the CDN imports so every other file just imports from `../deps.js`.

### Hash-based routing

`app.js` implements a minimal router: it parses `window.location.hash` and maps it to a page component. All pages are eagerly imported at startup so the app works fully offline with no async loading. Route params (like `deckId`) are spread as props onto the page component.

Routes: `#/` (home), `#/chords` (supports `?add` query param), `#/deck/create`, `#/quiz/:deckId`. The router parses query parameters from the hash fragment and passes them as props.

### SVG Fretboard

`Fretboard.js` renders the entire fretboard as SVG. Layout is driven by constants at the top of the file (padding, spacing, fret/string counts). Key design points:

- **Click handling** uses a single `onClick` on the SVG element. It computes the closest string (by x-distance) and either the mute zone (above the nut) or closest fret (by y-distance). This avoids needing invisible hit-target elements.
- **Scaling** for thumbnails works by setting `size="small"` which applies a 0.45x scale factor to the SVG width/height while keeping the viewBox the same — so the fretboard shrinks proportionally.
- **Feedback mode** (`displayMode="feedback"`) replaces normal finger dots with colored dots from `feedbackData`, an array of 6 arrays (one per string) of `{ fret, color }` objects. A single string can show multiple dots (e.g., both the wrong guess in red and the correct answer in black).
- **FretboardMini** is a convenience wrapper that forces `size="small"` and `interactive=false`.

### Fingering data model

A fingering is an array of 6 values, indexed by string (0 = low E, 5 = high E):
- `null` — open string (shown as a small circle above the nut)
- `"X"` — muted string (shown as a red X above the nut)
- `1`–`4` — fret number (shown as a colored dot)

The `normalizePos()` function in QuizPage treats `null`, `undefined`, and `0` as equivalent (all mean "open") when comparing guesses to answers.

### Data layer

`chordStore.js` and `deckStore.js` follow the same pattern: a private `load`/`save` pair that reads/writes a JSON array in localStorage, plus exported CRUD functions. Each entity gets an ID from `randomId()` (a hex string from Math.random, since `crypto.randomUUID()` requires HTTPS).

The stores read from localStorage on every call rather than caching in memory. This keeps things simple and avoids stale-state bugs between components — at the cost of JSON.parse on each read, which is negligible for the data sizes involved.

`exportImport.js` handles JSON export (creates a Blob, triggers a download via a temporary `<a>` element) and import (parses JSON and overwrites both stores).

### Quiz state machine

QuizPage manages a shuffled queue of chord objects. The `feedback` state drives the UI:
- `null` — awaiting guess (show interactive fretboard or name buttons)
- `'correct'` — show "Correct!" message, auto-advance after 600ms timeout
- `'wrong'` — show feedback fretboard with colored dots, wait for manual "Next"
- (fingering→name wrong guesses no longer set feedback state — instead `showTryAgain` triggers a temporary overlay)

The `effectiveMode` state handles the "both" mode by randomly picking `name2fret` or `fret2name` on each new card. The actual quiz UI is split into two child components (`NameToFretQuiz` and `FretToNameQuiz`) to keep the render logic readable.

All hooks are called unconditionally before any early returns to satisfy React's rules of hooks.

## Running Locally

Serve the directory with any static file server:

```sh
python3 -m http.server 8880
# or
npx serve .
```

Then open `http://localhost:8880` in a browser.

The importmap currently points to `?dev` builds of React for better error messages. Switch to non-`?dev` URLs in `index.html` for production use.
