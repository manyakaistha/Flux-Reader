# **RSVP DOC READER — DESIGN SYSTEM**

A comprehensive design language guide ensuring visual coherence across all screens.

---

## **DESIGN PHILOSOPHY**

### Core Principles

1. **Distraction-Free Focus** — Minimal chrome, maximum content. UI elements should recede when not needed.

2. **Dark & Premium** — Deep, muted backgrounds create a premium reading environment that's gentle on the eyes during extended sessions.

3. **Typographic Elegance** — Instrument Serif for page titles brings a literary, bookish feel. Inter for everything else ensures clarity and readability.

4. **Purposeful Motion** — Animations are subtle and functional, never decorative. They guide attention and provide feedback.

5. **Tactile Feedback** — Haptics confirm interactions. The app should feel responsive and physical.

---

## **COLOR PALETTE**

### Dark Theme (Primary)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0a0a14` | Main app background |
| `surface` | `#1a1a2e` | Cards, sheets, elevated surfaces |
| `surfaceLight` | `rgba(255,255,255,0.05)` | Subtle card backgrounds |
| `surfaceBorder` | `rgba(255,255,255,0.1)` | Card borders, dividers |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#FFFFFF` | Headlines, titles, body text |
| `textSecondary` | `#B0B0B0` | Authors, metadata, captions |
| `textTertiary` | `#808080` | Hints, disabled, file types |
| `textPlaceholder` | `rgba(255,255,255,0.4)` | Input placeholders |

### Accent Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `accent` | `#4ECDC4` | Primary action, progress, CTAs |
| `accentSubtle` | `rgba(78,205,196,0.15)` | Icon backgrounds, highlights |
| `danger` | `#FF6B6B` | Delete, remove, errors |
| `dangerSubtle` | `rgba(255,107,107,0.1)` | Danger button backgrounds |
| `warning` | `#FFEB3B` | Highlights, resume markers |
| `success` | `#4CAF50` | Success states |

### Light Theme (Optional)

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#FFFFFF` | Main background |
| `surface` | `#FAFAFA` | Cards, sheets |
| `textPrimary` | `#000000` | Headlines, body |
| `textSecondary` | `#616161` | Metadata |
| `accent` | `#2196F3` | Primary actions |

---

## **TYPOGRAPHY**

### Font Families

| Font | Weight | Variable Name | Usage |
|------|--------|---------------|-------|
| **Instrument Serif** | 400 Regular | `InstrumentSerif_400Regular` | Page titles only ("Library", "Settings") |
| **Inter** | 400 Regular | `Inter_400Regular` | Body text, metadata, captions |
| **Inter** | 500 Medium | `Inter_500Medium` | Labels, buttons, progress text |
| **Inter** | 600 SemiBold | `Inter_600SemiBold` | Document titles, subheadings, sheet titles |
| **Inter** | 700 Bold | `Inter_700Bold` | Emphasis, empty state headings |

### Type Scale

| Element | Font | Size | Line Height |
|---------|------|------|-------------|
| Page title | Instrument Serif | 24sp | 1.2 |
| Sheet title | Inter SemiBold | 20sp | 1.3 |
| Document title (card) | Inter SemiBold | 15sp | 1.3 |
| Document title (row) | Inter SemiBold | 17sp | 1.3 |
| Body text | Inter Regular | 16sp | 1.5 |
| Metadata | Inter Regular | 14sp | 1.4 |
| Author | Inter Regular | 13sp | 1.3 |
| Caption | Inter Regular | 12sp | 1.3 |
| Badge/File type | Inter Regular | 10sp | 1.2 |

### Text Behavior

- **Ellipsis**: Use `numberOfLines` + `ellipsizeMode="tail"` for overflow
- **Max lines**: Titles = 2, Authors = 1, Metadata = 1

---

## **SPACING SYSTEM**

### Base Unit: 4dp

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4dp | Icon gaps, tight padding |
| `sm` | 8dp | Internal component spacing |
| `md` | 12dp | Card padding, list item gaps |
| `lg` | 16dp | Screen margins, section spacing |
| `xl` | 20dp | Header padding |
| `xxl` | 24dp | Sheet padding, large gaps |
| `xxxl` | 32dp | Empty state spacing |

### Screen Margins

- Horizontal padding: **16dp**
- Content safe area respected on all edges

### Component Spacing

- Card gap (grid): **12dp**
- List item gap: **12dp**
- Between sections: **16dp**

---

## **BORDER RADIUS**

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0dp | No rounding |
| `sm` | 6dp | Thumbnails, small elements |
| `md` | 12dp | Cards, inputs, buttons |
| `lg` | 20dp | Chips, pills |
| `xl` | 24dp | Bottom sheets (top corners) |
| `full` | 9999dp | Circular buttons |

---

## **ELEVATION & SHADOWS**

### Layer System

| Layer | Content |
|-------|---------|
| 0 | Background content |
| 1 | Cards, list items |
| 2 | Floating buttons, headers |
| 3 | Bottom sheets, modals |
| 4 | Toasts, alerts |

### Shadow Styles

```css
/* Cards */
box-shadow: none; /* Dark theme uses border instead */
border: 1px solid rgba(255,255,255,0.1);

/* Bottom sheets */
border-top-left-radius: 24dp;
border-top-right-radius: 24dp;

/* Floating header (if translucent) */
background: rgba(26,26,46,0.95);
backdrop-filter: blur(20px);
```

---

## **ICONOGRAPHY**

### Icon Library
- **Ionicons** (via `@expo/vector-icons`)

### Icon Sizes

| Context | Size |
|---------|------|
| Tab bar | 24dp |
| Header actions | 22-24dp |
| List item | 24dp |
| Button inline | 18-20dp |
| Badge/small | 16dp |

### Icon Colors

- Primary actions: `#FFFFFF`
- Secondary: `#B0B0B0`
- Accent context: `#4ECDC4`
- Danger context: `#FF6B6B`

---

## **INTERACTIVE STATES**

### Touch Feedback

| Element | Behavior |
|---------|----------|
| Cards/Rows | `activeOpacity={0.7}` |
| Buttons | Scale 0.95 on press |
| Long-press | 400ms delay, haptic medium |

### Haptic Patterns

| Action | Haptic Type |
|--------|-------------|
| Tap button | Light impact |
| Long-press activate | Medium → Heavy |
| Success | Success |
| Error | Error |
| Selection change | Selection |

---

## **MOTION & ANIMATION**

### Timing

| Type | Duration | Easing |
|------|----------|--------|
| Micro-interaction | 150-200ms | ease-out |
| Sheet slide | 250-300ms | ease-out |
| Fade | 200-300ms | ease-in-out |
| Page transition | 300-400ms | ease-out |

### Principles

1. **Quick**: Animations under 300ms feel instant
2. **Natural**: Use ease-out for enter, ease-in for exit
3. **Purposeful**: Motion guides attention, not distracts

---

## **COMPONENT PATTERNS**

### Cards (Grid)

```
┌─────────────────────┐
│   [Cover Image]     │  aspect-ratio: 0.7
├─────────────────────┤
│ Title (2 lines)     │  Inter SemiBold 15sp
│ Author (1 line)     │  Inter Regular 13sp
│ ████░░░░░░ 45%     │  Progress bar + Inter Medium 11sp
│ PDF                 │  Inter Regular 10sp
└─────────────────────┘
```

### Rows (List)

```
┌──────┬──────────────────────────────┬────────┐
│ Thumb│ Title                        │  45%   │
│  48  │ Author                       │        │
│  ×64 │ PDF • 180 pages             │        │
└──────┴──────────────────────────────┴────────┘
```

### Bottom Sheets

- Top handle: 40dp × 4dp, centered, `rgba(255,255,255,0.2)`
- Corner radius: 24dp (top only)
- Background: `#1a1a2e`
- Backdrop: `rgba(0,0,0,0.6)`

### Buttons

| Type | Style |
|------|-------|
| Primary | Accent bg, black text, 12dp radius |
| Secondary | Transparent, accent text, accent border |
| Danger | dangerSubtle bg, danger text, danger border |
| Icon | 40dp circle, transparent bg |

---

## **NAVIGATION**

### Tab Bar (Future)

| Element | Specification |
|---------|---------------|
| Height | 60dp + safe area |
| Background | Surface with blur |
| Icon size | 24dp |
| Label | Inter Medium 10sp |
| Active | Accent color |
| Inactive | Tertiary text |

### Headers

| Element | Specification |
|---------|---------------|
| Height | 56dp |
| Title | Instrument Serif 24sp (page title) |
| Actions | 40dp touch target |
| Background | Translucent or solid surface |

---

## **ACCESSIBILITY**

### Touch Targets
- Minimum: **44dp × 44dp** (iOS) / **48dp × 48dp** (Android)

### Color Contrast
- Text on background: **4.5:1** minimum
- Large text: **3:1** minimum

### Labels
- All interactive elements have accessibility labels
- Dynamic content announced by screen readers

---

## **IMPLEMENTATION CHECKLIST**

When creating a new screen, ensure:

- [ ] Background is `#0a0a14`
- [ ] Page title uses `InstrumentSerif_400Regular` at 24sp
- [ ] All other text uses Inter family
- [ ] Cards use `rgba(255,255,255,0.05)` background with `rgba(255,255,255,0.1)` border
- [ ] Accent color is `#4ECDC4`
- [ ] Screen margins are 16dp horizontal
- [ ] Touch targets meet 44dp minimum
- [ ] Bottom sheets have 24dp radius and handle bar
- [ ] Haptic feedback on interactions
- [ ] Smooth transitions (250-300ms ease-out)

---

*Last updated: January 2026*
