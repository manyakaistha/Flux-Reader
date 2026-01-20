# **READER MODE - UPDATED SPECIFICATION (SIMPLIFIED UI)**
## **SECTION 1: LAYOUT \& VISUAL STRUCTURE**

### **1.1 Screen Anatomy (Simplified)**

```
┌────────────────────────────────────────────────┐
│ [←] The Great Gatsby            [⚡ RSVP]      │ ← Top Bar (auto-hide)
├────────────────────────────────────────────────┤
│                                                │
│    PDF Content (Vertical Scroll)               │
│                                                │
│    Lorem ipsum dolor sit amet,                 │
│    consectetur adipiscing elit.                │
│    Sed do eiusmod tempor                       │
│    incididunt ut labore et                     │
│    [yellow highlight] magna aliqua.            │ ← Resume highlight
│                                                │
│    Ut enim ad minim veniam, quis               │
│    nostrud exercitation ullamco                │
│    laboris nisi ut aliquip ex ea               │
│                                                │
├────────────────────────────────────────────────┤
│        Page 24 of 156 • 15%                    │ ← Footer Bar (auto-hide)
└────────────────────────────────────────────────┘
```

**Changes from previous spec:**

- **Removed:** Menu button (3-dot overflow)
- **Removed:** Options sheet (brightness, themes, etc.)
- **Simplified:** Only essential controls remain

***

## **SECTION 2: TOP BAR SPECIFICATION**

### **2.1 Layout \& Components**

```
┌────────────────────────────────────────────────┐
│ [←]  The Great Gatsby              [⚡ RSVP]   │
│  ↑         ↑                           ↑       │
│ Back    Title                      RSVP btn    │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 56dp
- Background: `#0A0E1A` (dark navy/black) with 95% opacity + blur
- Bottom border: 1dp, color: `#1A1F2E` (subtle dark divider)
- Padding: 8dp horizontal
- Position: Fixed to top, overlays content

**Back Button:**

- Icon: Arrow left (24dp)
- Touch target: 48dp × 48dp
- Color: `#FFFFFF` (white)
- Action: Navigate back to library, save progress

**Document Title:**

- Font: **Instrument Serif Medium, 18sp**
- Color: `#FFFFFF` (white)
- Max width: 60% of screen
- Single line, ellipsis on overflow
- Centered vertically

**RSVP Button:**

- Container: Rounded rectangle pill
- Background: `#00BCD4` (cyan/teal, matching your UI accent)
- Height: 40dp
- Padding: 16dp horizontal
- **Icon:** Lightning bolt (16dp), white
- **Text:** "RSVP"
- Font: **Inter Bold, 14sp**
- Color: `#FFFFFF` (white)
- Touch target: Entire button (40dp tall)

**Interaction:**

- **Tap:** Opens RSVP Mode overlay (paused state)
- **Long-press (hold 500ms):**
    - Instantly activates RSVP playback at saved speed
    - Visual: Button glows with radial pulse animation
    - Haptic: Medium impact at 300ms, heavy at 500ms activation

***

## **SECTION 3: FOOTER BAR SPECIFICATION**

### **3.1 Layout**

```
┌────────────────────────────────────────────────┐
│        Page 24 of 156 • 15% • ~12 min left    │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 44dp
- Background: `#0A0E1A` with 95% opacity + blur
- Top border: 1dp, color: `#1A1F2E`
- Position: Fixed to bottom

**Progress Text:**

- Font: **Inter Medium, 14sp**
- Color: `#B0B0B0` (light gray)
- Format: "Page X of Y -  Z% -  ~N min left"
- Center aligned

**Progress Percentage (optional highlight):**

- The "15%" can be in accent color: `#00BCD4` (cyan/teal)

***

## **SECTION 4: DARK THEME COLOR PALETTE**

### **4.1 Matching Your UI Style**

Based on your screenshots, here's the exact color scheme:

**Background \& Surfaces:**

- App background: `#0A0E1A` (very dark navy/black)
- Surface elevated: `#141824` (slightly lighter for cards/bars)
- Divider: `#1A1F2E` (subtle dark lines)

**Text:**

- Primary text: `#FFFFFF` (pure white)
- Secondary text: `#B0B0B0` (light gray)
- Tertiary text: `#6B7280` (medium gray)
- PDF type badge: `#9CA3AF` (muted gray)

**Accent \& Interactive:**

- Primary accent: `#00BCD4` (cyan/teal) - for progress %, RSVP button, icons
- Highlight overlay: `#FFEB3B` @ 30% opacity (yellow for resume word)

**Icons:**

- Active icons: `#00BCD4` (teal)
- Inactive icons: `#6B7280` (gray)
- PDF document icon: `#6B7280` (gray)

***

## **SECTION 5: PDF CONTENT RENDERING**

### **5.1 Vertical Scroll Implementation**

**Rendering Strategy:**

- Use `react-native-pdf` with `enablePaging={false}`
- Continuous vertical scroll across all pages
- Pages rendered as single vertical stack
- No horizontal swipe

**PDF Display:**

- Background: `#0A0E1A` (matches app background)
- PDF content: Rendered with original colors
- Page separation: 2dp divider in `#1A1F2E`, 24dp margin between pages

**Zoom Levels:**

- Default: Fit-to-width (100%)
- Minimum: 100%
- Maximum: 300% (3x zoom)
- Pinch-to-zoom enabled
- Double-tap to toggle between 100% and 200%

***

## **SECTION 6: HIGHLIGHT \& RESUME SYSTEM**

### **6.1 Resume Highlight Visual Design**

**Highlight Appearance:**

```
... consectetur adipiscing elit. Sed do eiusmod
tempor incididunt ut labore et [▓▓▓▓▓▓▓] aliqua.
                                  ↑
                    Yellow/amber highlight box
```

**Specifications:**

- Color: `#FCD34D` (amber/yellow) with 25% opacity (adjusted for dark mode)
- Alternative: `#FBBF24` @ 30% opacity
- Shape: Rounded rectangle, 4dp corner radius
- Border: 1dp solid `#FCD34D` @ 40% opacity (for definition on dark background)
- Padding: 3dp vertical, 4dp horizontal
- Animation:
    - Fade in: 300ms ease-out
    - Persist: 3 seconds
    - Pulse once: Scale 1.0 → 1.05 → 1.0 over 600ms
    - Fade out: 1200ms ease-out

***

## **SECTION 7: UI STATES \& INTERACTIONS**

### **7.1 Chrome Auto-Hide Behavior**

**Show Top/Footer Bar:**

- On screen tap (anywhere on PDF)
- On scroll to top edge
- On long-press RSVP button

**Hide Top/Footer Bar:**

- After 3 seconds of inactivity
- On scroll down gesture
- On RSVP mode activation

**Transition:**

- Slide animation: 250ms ease-out
- Fade opacity: 100% → 0% simultaneously


### **7.2 RSVP Activation Flows**

**Method 1: Tap RSVP Button**

Flow:

1. User taps "RSVP" button
2. Button animates: Scale 0.95 with haptic light
3. RSVP overlay fades in (400ms) with blur background
4. RSVP shows in **paused state** at current word
5. User can adjust speed, then tap play

**Method 2: Long-Press RSVP Button (Power User Mode)**

Flow:

1. User holds RSVP button
2. At 300ms:
    - Haptic medium impact
    - Button begins glow animation (teal radial pulse)
3. At 500ms (activation):
    - Haptic heavy impact
    - Button scale 1.1 briefly
    - RSVP overlay fades in (300ms, faster)
    - **Playback starts immediately** with speed ramping

**Long-Press Visual Feedback:**

```
┌──────────────┐
│   ⚡ RSVP    │ ← Normal state
└──────────────┘

      ↓ (Hold 300ms)

┌──────────────┐
│ ◉ ⚡ RSVP ◉  │ ← Glowing, radial pulse
└──────────────┘

      ↓ (Hold 500ms - ACTIVATED)

┌──────────────┐
│ ● ⚡ RSVP ●  │ ← Flash bright, then transition to RSVP
└──────────────┘
```


***

## **SECTION 8: COMPLETE TYPOGRAPHY SPECIFICATION**

### **8.1 Reader Mode Typography**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| **Top Bar** |  |  |  |  |
| Document title | Instrument Serif | 18sp | Medium | `#FFFFFF` |
| RSVP button text | Inter | 14sp | Bold | `#FFFFFF` |
| **Footer** |  |  |  |  |
| Progress text | Inter | 14sp | Medium | `#B0B0B0` |
| Progress percentage | Inter | 14sp | Medium | `#00BCD4` (accent) |
| **Overlays** |  |  |  |  |
| Page indicator (scroll) | Inter | 16sp | Bold | `#FFFFFF` |
| Toast messages | Inter | 14sp | Medium | `#FFFFFF` |


***

## **SECTION 9: REMOVED FEATURES**

The following have been removed per your request:

### **9.1 Deleted: Menu Button**

- ~~3-dot overflow menu button~~
- ~~Menu sheet with options~~


### **9.2 Deleted: Settings Controls**

- ~~Brightness slider~~
- ~~Theme switcher (Light/Dark/Sepia)~~
- ~~Go to page~~
- ~~Bookmarks~~

**Rationale:**

- Keeps reader UI minimal and focused
- Theme is always dark (matching library)
- Brightness controlled by system settings
- Page navigation via scroll only

***

## **SECTION 10: SIMPLIFIED FEATURE LIST**

### **10.1 What Reader Mode Does**

**Core Features:**

1. ✅ Display PDF in vertical scroll
2. ✅ Auto-hiding top/footer bars
3. ✅ Resume with highlighted last word
4. ✅ RSVP button (tap or long-press)
5. ✅ Progress tracking (page, %, time)
6. ✅ Pinch-to-zoom (100-300%)
7. ✅ Double-tap zoom toggle
8. ✅ Auto-scroll to resume position
9. ✅ Save progress on exit

**UI Elements:**

- Back button → Library
- Document title (truncated if long)
- RSVP button (dual interaction)
- Progress footer

**Interactions:**

- Tap screen → Show/hide chrome
- Tap back → Return to library
- Tap RSVP → Open RSVP paused
- Long-press RSVP → Instant playback
- Pinch → Zoom
- Double-tap → Toggle zoom
- Scroll → Read, auto-save progress

***

## **SECTION 11: DEVELOPMENT CHECKLIST (SIMPLIFIED)**

### **11.1 Core Features**

- [ ] Vertical scroll PDF rendering
- [ ] Dark theme UI (`#0A0E1A` background)
- [ ] Auto-hiding top/footer bars (3s timeout)
- [ ] RSVP button with teal accent (`#00BCD4`)
- [ ] Tap RSVP → Open paused
- [ ] Long-press RSVP → Instant playback (500ms threshold)
- [ ] Document title in Instrument Serif
- [ ] Progress indicator with teal accent
- [ ] Pinch-to-zoom (1x-3x)
- [ ] Double-tap zoom toggle
- [ ] Resume highlight (amber/yellow on dark)
- [ ] Auto-scroll to highlight
- [ ] Progress auto-save (debounced 2s)


### **11.2 Polish**

- [ ] Glow animation on RSVP long-press
- [ ] Haptic feedback (light/medium/heavy)
- [ ] Chrome slide transitions (250ms)
- [ ] Highlight pulse animation (1x on open)
- [ ] Typography renders correctly
- [ ] 60fps scroll performance
- [ ] Memory <200MB for large PDFs

***

## **SECTION 12: VISUAL DESIGN MOCKUP**

### **12.1 Reader in Normal State (Chrome Hidden)**

```
┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│    Chapter 1                                   │
│                                                │
│    In my younger and more vulnerable           │
│    years my father gave me some advice         │
│    that I've been turning over in my mind      │
│    ever since.                                 │
│                                                │
│    "Whenever you feel like criticizing         │
│    anyone," he told me, "just remember         │
│    that all the people in this world           │
│    haven't had the [advantages] that you've    │
│                      ↑                         │
│              (highlighted resume word)          │
│    had."                                       │
│                                                │
│    He didn't say any more, but we've           │
│    always been unusually communicative         │
│                                                │
│            (scroll continues...)                │
│                                                │
└────────────────────────────────────────────────┘
```


### **12.2 Reader with Chrome Visible (After Tap)**

```
┌────────────────────────────────────────────────┐
│ [←] The Great Gatsby              [⚡ RSVP]   │ ← Teal button
├────────────────────────────────────────────────┤
│                                                │
│    Chapter 1                                   │
│                                                │
│    In my younger and more vulnerable           │
│    years my father gave me some advice         │
│    that I've been turning over in my mind      │
│    ever since.                                 │
│                                                │
│    "Whenever you feel like criticizing         │
│    anyone," he told me, "just remember         │
│    that all the people in this world           │
│    haven't had the [advantages] that you've    │
│                      ↑                         │
│              (fading highlight)                 │
│    had."                                       │
│                                                │
├────────────────────────────────────────────────┤
│      Page 1 of 180 • 1% • ~2 hours left       │
└────────────────────────────────────────────────┘
```


***

## **FINAL SUMMARY**

**Updated Reader Mode:**

1. ✅ **Minimalist UI** - Only back, title, RSVP button
2. ✅ **Dark theme** - Matches library style (`#0A0E1A` background, `#00BCD4` teal accents)
3. ✅ **Removed settings menu** - No brightness/theme controls
4. ✅ **Simplified chrome** - Auto-hide top/footer only
5. ✅ **Dual RSVP activation**:
    - Tap → Opens RSVP paused
    - Long-press 500ms → Instant playback
6. ✅ **Typography**: Instrument Serif (title) + Inter (UI)
7. ✅ **Resume with highlight** - Yellow/amber overlay on last word
8. ✅ **Vertical scroll only** - No pagination

**Matches your UI aesthetic perfectly** - clean, dark, focused on reading with teal accent highlights.
<span style="display:none">[^1][^2]</span>

<div align="center">⁂</div>

[^1]: Screenshot-2026-01-20-at-00.35.04.jpg

[^2]: Screenshot-2026-01-20-at-00.34.53.jpg

