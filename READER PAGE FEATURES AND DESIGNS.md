# **READER MODE - COMPLETE SPECIFICATION \& UI DESIGN**

## **PURPOSE \& CORE BEHAVIOR**

The Reader Mode is a **vertical-scrolling PDF viewer** that:

- Displays PDF content in continuous scroll (not paginated)
- Shows the last-read word highlighted on document open
- Provides minimal, auto-hiding UI chrome for distraction-free reading
- Offers quick access to RSVP mode via top bar button
- Supports **long-press RSVP button** to instantly activate speed reading
- Maintains reading progress automatically

***

## **SECTION 1: LAYOUT \& VISUAL STRUCTURE**

### **1.1 Screen Anatomy**

```
┌────────────────────────────────────────────────┐
│ [←] The Great Gatsby            [RSVP] [⋮]    │ ← Top Bar (auto-hide)
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


### **1.2 UI Layers**

**Layer 1: PDF Canvas (Base)**

- Full-screen scrollable PDF renderer
- Vertical scroll only
- Pinch-to-zoom enabled (1x - 3x)
- Double-tap to reset zoom to fit-width

**Layer 2: Highlight Overlay**

- Semi-transparent yellow rectangle on last-read word
- Positioned using absolute coordinates
- Auto-fades after 3 seconds

**Layer 3: Top Bar (Translucent)**

- Appears on tap or scroll-to-top
- Auto-hides after 3 seconds of inactivity
- Blurred background (frosted glass effect)

**Layer 4: Footer Bar (Translucent)**

- Appears with top bar
- Shows progress indicator
- Auto-hides with top bar

***

## **SECTION 2: TOP BAR SPECIFICATION**

### **2.1 Layout \& Components**

```
┌────────────────────────────────────────────────┐
│ [←]  The Great Gatsby       [⚡ RSVP]  [⋮]    │
│  ↑         ↑                    ↑        ↑     │
│ Back    Title               RSVP btn   Menu    │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 56dp
- Background: Surface with 95% opacity + 20dp blur (iOS frosted glass, Android translucent)
- Bottom border: 1dp, color: divider (subtle)
- Padding: 8dp horizontal, 0dp vertical
- Position: Fixed to top, overlays content

**Back Button:**

- Icon: Arrow left (24dp)
- Touch target: 48dp × 48dp
- Color: primary icon
- Action: Navigate back to library, save progress

**Document Title:**

- Font: **Instrument Serif Medium, 18sp**
- Color: primary text
- Max width: 60% of screen
- Single line, ellipsis on overflow
- Centered vertically

**RSVP Button:**

- Container: Rounded rectangle pill
- Background: Accent color (\#2196F3 or custom)
- Height: 40dp
- Padding: 16dp horizontal
- **Icon:** Lightning bolt (16dp), white
- **Text:** "RSVP"
- Font: **Inter Bold, 14sp**
- Color: White
- Touch target: Entire button (40dp tall)

**Interaction:**

- **Tap:** Opens RSVP Mode overlay (with transition animation)
- **Long-press (hold for 500ms):**
    - **Instantly activates RSVP playback** at saved speed
    - Visual feedback: Button scales to 0.95 + haptic medium
    - On activation: Full-screen RSVP overlay fades in, playback starts immediately

**Menu Button (3-dot):**

- Icon: Vertical ellipsis (24dp)
- Touch target: 48dp × 48dp
- Color: primary icon
- Opens: Options sheet (see Section 2.2)


### **2.2 Menu Options Sheet**

```
┌─────────────────────────────┐
│ Reading Options             │ ← Inter Bold, 20sp
├─────────────────────────────┤
│ ☀ Brightness                │ ← Inter Regular, 16sp
│ [░░░░▓▓░░░░] 60%           │ ← Slider
│                             │
│ 🌓 Theme                    │
│ ◉ Auto  ○ Light  ○ Dark    │ ← Radio buttons
│                             │
│ 📄 Go to page...            │
│ 🔖 Bookmarks (future)       │
│ ⚙ Settings                  │
└─────────────────────────────┘
```

**Typography:**

- Sheet title: **Inter Bold, 20sp**
- Options: **Inter Regular, 16sp**
- Slider labels: **Inter Medium, 13sp**

***

## **SECTION 3: FOOTER BAR SPECIFICATION**

### **3.1 Layout**

```
┌────────────────────────────────────────────────┐
│        Page 24 of 156 • 15% • ~12 min left    │
│              ↑            ↑          ↑         │
│           Position    Progress   Est. time     │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 44dp
- Background: Same as top bar (translucent + blur)
- Top border: 1dp divider
- Position: Fixed to bottom

**Progress Text:**

- Font: **Inter Medium, 14sp**
- Color: Secondary text
- Format: "Page X of Y -  Z% -  ~N min left"
- Center aligned

**Optional: Mini Progress Bar**

- Above text, thin 2dp line
- Width: 80% of screen width, centered
- Filled portion: Accent color
- Unfilled: Divider color with 30% opacity

***

## **SECTION 4: PDF CONTENT RENDERING**

### **4.1 Vertical Scroll Implementation**

**Rendering Strategy:**

- Use `react-native-pdf` with `enablePaging={false}`
- Continuous vertical scroll across all pages
- Pages rendered as single vertical stack
- No horizontal swipe (disabled)

**Page Separation:**

- Visual separator between pages: 1dp divider with 16dp margin top/bottom
- Optional page number overlay: "Page 24" in corner (subtle, Inter Regular 11sp, tertiary text)


### **4.2 Typography \& Layout**

**Note:** PDF typography is controlled by the document itself. The app only controls:

**Zoom Levels:**

- Default: Fit-to-width (100%)
- Minimum: 100% (no shrinking below page width)
- Maximum: 300% (3x zoom)
- User can pinch-zoom between these bounds

**Margins:**

- Content padding: 16dp horizontal (keeps text away from screen edges)
- Top margin: 72dp (space for top bar when visible)
- Bottom margin: 60dp (space for footer when visible)

**Reading Mode Enhancements:**

- Auto-adjust brightness (optional): Slight increase when entering reader
- Disable screen rotation lock (optional setting)
- Keep screen awake while actively reading (wake lock when scrolling)

***

## **SECTION 5: HIGHLIGHT \& RESUME SYSTEM**

### **5.1 Resume Highlight Visual Design**

**When Document Opens:**

1. Navigate to saved page
2. Scroll to position where last word is visible (centered vertically if possible)
3. Draw highlight overlay on saved word

**Highlight Appearance:**

```
... consectetur adipiscing elit. Sed do eiusmod
tempor incididunt ut labore et [▓▓▓▓▓▓▓] aliqua.
                                  ↑
                        Yellow highlight box
```

**Specifications:**

- Color: `#FFEB3B` (Material Yellow 500) with 35% opacity
- Shape: Rounded rectangle, 4dp corner radius
- Padding: 2dp vertical, 4dp horizontal around word
- Border: None (or 1dp solid yellow at 60% opacity for definition)
- Animation:
    - Fade in: 300ms ease-out
    - Persist: 3 seconds
    - Fade out: 1000ms ease-out
    - Optional pulse: Subtle scale 1.0 → 1.05 → 1.0 over 800ms once


### **5.2 Calculating Highlight Position**

**Challenge:** PDFs don't have word-level coordinates by default.

**Solution (Extraction-Based):**

During text extraction (see RSVP spec Section 2):

- Store word bounding boxes: `{x, y, width, height}` per word per page
- When resuming:
    - Query saved `wordIndex` from database
    - Lookup corresponding page and bounding box
    - Convert PDF coordinates to screen coordinates accounting for:
        - Current zoom level
        - Scroll offset
        - Screen density (dp → px)

**Fallback (Approximation):**
If precise coordinates unavailable:

- Calculate approximate Y position: `(wordIndex / totalWordsOnPage) * pageHeight`
- Highlight entire line containing the word (line-level precision)
- Show banner: "Resumed near last position" (Inter Medium 13sp)


### **5.3 Auto-Scroll to Highlight**

**Behavior:**

- On document open, if highlight is off-screen:
    - Animate scroll to bring highlighted word to vertical center (40% from top)
    - Duration: 500ms
    - Easing: Ease-out-cubic
- If highlight is already visible: No scroll, just show highlight

***

## **SECTION 6: UI STATES \& INTERACTIONS**

### **6.1 Chrome Auto-Hide Behavior**

**Show Top/Footer Bar:**

- On screen tap (anywhere)
- On scroll to top edge (overscroll bounce)
- On long-press RSVP button

**Hide Top/Footer Bar:**

- After 3 seconds of inactivity
- On scroll down (auto-hide while reading)
- On RSVP mode activation

**Transition:**

- Slide down (top bar) / slide up (footer) with 250ms ease-out
- Fade opacity 100% → 0% simultaneously


### **6.2 Scroll Behavior**

**Momentum Scrolling:**

- Enabled (native feel)
- Deceleration: Normal (iOS default, Android fast)
- Bounce: Enabled on iOS, disabled on Android (platform convention)

**Scroll Position Tracking:**

- On scroll stop (debounced 2 seconds):
    - Calculate current visible word using viewport position
    - Save to database as `lastWordIndex`
    - Update progress percentage

**Visual Feedback During Scroll:**

- Optional: Page number indicator fades in during scroll, fades out 1 second after stop
    - Position: Top-right corner overlay
    - Font: **Inter Bold, 16sp**
    - Color: White with 80% opacity
    - Background: Black with 60% opacity, rounded 8dp


### **6.3 Zoom Behavior**

**Pinch-to-Zoom:**

- Enabled, gesture handled by PDF renderer
- Zoom center: Pinch gesture center point
- Smooth scaling with momentum

**Double-Tap-to-Zoom:**

- First tap: Zoom to 200% (2x) centered on tap point
- Second tap: Reset to 100% (fit-width)

**Zoom Persistence:**

- Save zoom level per document (optional)
- Or reset to 100% on each open (simpler, recommended)

***

## **SECTION 7: RSVP ACTIVATION FLOWS**

### **7.1 Method 1: Tap RSVP Button**

**Flow:**

1. User taps "RSVP" button in top bar
2. Button animates: Scale 1.0 → 0.95 → 1.0 (200ms)
3. Haptic feedback: Light impact
4. RSVP overlay fades in (400ms) from current scroll position
5. RSVP shows in **paused state** at current word
6. User can adjust speed, then tap play

**Visual Transition:**

```
PDF Reader → RSVP Overlay Fade In → RSVP Mode (Paused)
                                     ↓
                              User taps Play
                                     ↓
                              RSVP Playback Starts
```


### **7.2 Method 2: Long-Press RSVP Button**

**Flow:**

1. User presses and holds "RSVP" button for 500ms
2. At 300ms: Haptic feedback (medium impact) + visual feedback (button glow)
3. At 500ms (activation):
    - Haptic feedback: Heavy impact
    - Button scales to 1.1 briefly
    - RSVP overlay fades in (300ms, faster than tap)
    - **RSVP immediately starts playing** at saved speed
    - Applies speed ramping (see RSVP spec Section 4.3)

**Visual Feedback During Hold:**

- Button background: Radial glow animation expanding from center
- Color: White with increasing opacity (0% → 30%)
- Progress ring: Optional thin arc drawing around button (0° → 360° over 500ms)

**Cancellation:**

- If user releases before 500ms: Cancel activation, no RSVP mode

**Why Long-Press?**

- Fast activation for power users who want instant RSVP
- No extra UI steps, direct to playback
- Tactile feedback confirms activation
- Prevents accidental triggers (500ms threshold)

***

## **SECTION 8: COMPLETE TYPOGRAPHY SPECIFICATION**

### **8.1 Top Bar Typography**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| Document title | Instrument Serif | 18sp | Medium | Primary |
| RSVP button text | Inter | 14sp | Bold | White (on accent) |
| Menu items | Inter | 16sp | Regular | Primary |

### **8.2 Footer Typography**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| Progress text | Inter | 14sp | Medium | Secondary |
| Page number | Inter | 13sp | Regular | Secondary |

### **8.3 Overlays \& Indicators**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| Scroll page indicator | Inter | 16sp | Bold | White (on dark bg) |
| Toast messages | Inter | 14sp | Medium | White (on surface) |
| Brightness label | Inter | 13sp | Medium | Secondary |
| Theme options | Inter | 16sp | Regular | Primary |

### **8.4 Options Sheet**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| Sheet title | Inter | 20sp | Bold | Primary |
| Option labels | Inter | 16sp | Regular | Primary |
| Slider values | Inter | 13sp | Medium | Accent |


***

## **SECTION 9: THEME \& VISUAL DESIGN**

### **9.1 Color Palette**

**Light Mode:**

- Background: `#FFFFFF` (pure white)
- Surface: `#FAFAFA` (slight gray for bars)
- Primary text: `#000000` (black)
- Secondary text: `#616161` (gray 700)
- Accent: `#2196F3` (blue 500) or custom brand
- Divider: `#E0E0E0` (gray 300)
- Highlight: `#FFEB3B` @ 35% opacity (yellow 500)

**Dark Mode:**

- Background: `#121212` (Material dark surface)
- Surface: `#1E1E1E` (elevated surface)
- Primary text: `#FFFFFF` (white)
- Secondary text: `#B0B0B0` (light gray)
- Accent: `#64B5F6` (blue 300, lighter for dark mode)
- Divider: `#373737` (dark gray)
- Highlight: `#FFF176` @ 25% opacity (yellow 300, adjusted for dark)

**Sepia Mode (Optional Reading Theme):**

- Background: `#F4ECD8` (warm cream)
- Surface: `#EBE0C8`
- Primary text: `#3E2723` (dark brown)
- Secondary text: `#6D4C41` (medium brown)
- Accent: `#D84315` (deep orange)
- Highlight: `#FFD54F` @ 40% opacity (amber)


### **9.2 Elevation \& Shadows**

**Top Bar:**

- Elevation: 4dp
- Shadow: `0 2px 4px rgba(0,0,0,0.1)`

**Footer Bar:**

- Elevation: 4dp
- Shadow: `0 -2px 4px rgba(0,0,0,0.1)` (upward)

**RSVP Button:**

- Elevation: 2dp (idle)
- Shadow: `0 2px 3px rgba(0,0,0,0.15)`
- On press: Elevation 0dp (flattens)

***

## **SECTION 10: PROGRESS TRACKING \& PERSISTENCE**

### **10.1 What Gets Saved**

**On Every Scroll Stop (debounced 2s):**

- Current page number
- Current word index (calculated from viewport position)
- Scroll Y offset (for precise restoration)
- Timestamp

**On Document Exit:**

- Final reading position
- Total time spent reading (session duration)
- Update `lastReadAt` timestamp in library


### **10.2 Database Schema (Reading Progress)**

```sql
CREATE TABLE reading_progress (
  doc_id TEXT PRIMARY KEY,
  current_page INTEGER NOT NULL,           -- PDF page number
  current_word_index INTEGER,              -- Word index in document
  scroll_offset REAL,                      -- Y scroll position in points
  last_update_time INTEGER,                -- Unix timestamp
  session_duration INTEGER DEFAULT 0,      -- Total seconds spent reading
  
  FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);
```


### **10.3 Resume Flow**

**On Document Open:**

1. Query `reading_progress` table for `doc_id`
2. If record exists:
    - Navigate to `current_page`
    - Restore `scroll_offset`
    - Calculate highlight position from `current_word_index`
    - Show highlight with animation
3. If no record (first open):
    - Start from page 1, word 0
    - Show brief tooltip: "Long-press RSVP for speed reading" (once per app session)

***

## **SECTION 11: ACCESSIBILITY \& USABILITY**

### **11.1 Touch Targets**

**Minimum Sizes (iOS HIG / Material Design):**

- All buttons: 48dp × 48dp minimum
- RSVP button: 40dp tall × 80dp wide (exceeds minimum)
- Back/menu buttons: 48dp × 48dp

**Touch Zones:**

- Tap anywhere on content: Toggle chrome visibility
- No accidental tap conflicts with zoom gestures


### **11.2 Screen Reader Support**

**Accessibility Labels:**

- Back button: "Back to library"
- RSVP button: "Activate speed reading mode. Long-press to start immediately."
- Menu button: "Reading options"
- Progress text: "Page 24 of 156, 15% complete, approximately 12 minutes remaining"

**Focus Order:**

1. Back button
2. Document title (non-interactive, but announced)
3. RSVP button
4. Menu button

### **11.3 Dynamic Type Support**

**PDF Content:**

- Respect system text size for UI chrome only
- PDF content zoom controlled manually (pinch/double-tap)

**UI Chrome Scaling:**


| Base Size | Small (-1) | Default | Large (+1) | XL (+2) |
| :-- | :-- | :-- | :-- | :-- |
| 18sp | 16sp | 18sp | 21sp | 24sp |
| 16sp | 14sp | 16sp | 19sp | 22sp |
| 14sp | 13sp | 14sp | 16sp | 18sp |


***

## **SECTION 12: PERFORMANCE REQUIREMENTS**

### **12.1 Rendering Performance**

**PDF Rendering:**

- Initial page load: <500ms
- Scroll smoothness: 60fps minimum
- Zoom operations: 60fps minimum
- Memory usage: <200MB for 200-page document

**Optimization Strategies:**

- Viewport-based rendering: Only render pages within ±1 page of viewport
- Recycle off-screen page views
- Cache rendered page bitmaps (LRU cache, max 10 pages)


### **12.2 Scroll Position Calculation**

**Precision Requirements:**

- Word index calculation accuracy: ±3 words
- Scroll restoration accuracy: ±20dp (acceptable, user won't notice)
- Highlight position accuracy: ±5dp (must be visually aligned)

**Performance Targets:**

- Calculate word index on scroll: <50ms
- Database save operation: <100ms (background thread)

***

## **SECTION 13: ERROR STATES \& EDGE CASES**

### **13.1 PDF Loading Failures**

**Scenarios:**

- File corrupted or unreadable
- File moved/deleted from device
- Unsupported PDF features (DRM, encryption)

**User Experience:**

- Show error sheet:

```
┌─────────────────────────────────┐
│ Unable to Open Document         │ ← Inter Bold, 20sp
├─────────────────────────────────┤
│ This PDF file cannot be opened. │ ← Inter Regular, 16sp
│ It may be corrupted or protected│
│ by DRM.                         │
│                                 │
│ [Return to Library]             │ ← Inter Medium, 16sp
└─────────────────────────────────┘
```


### **13.2 Missing Resume Position**

**Scenario:** Word index saved but extraction data missing.

**Fallback:**

1. Navigate to saved page
2. Show banner: "Resuming from page 24" (can't highlight specific word)
3. User continues reading normally

### **13.3 Very Large PDFs**

**Scenario:** 500+ page document, memory concerns.

**Mitigation:**

- Aggressive page recycling (only ±1 page in memory)
- Lower bitmap resolution for cached pages
- Show loading spinner when jumping far (e.g., page 1 → page 400)

***

## **SECTION 14: DEVELOPMENT CHECKLIST**

### **14.1 Core Features**

- [ ] Vertical scroll PDF rendering with `react-native-pdf`
- [ ] Auto-hiding top and footer bars
- [ ] RSVP button with tap and long-press detection
- [ ] Document title display in top bar
- [ ] Progress indicator in footer
- [ ] Brightness and theme controls in menu
- [ ] Pinch-to-zoom and double-tap-to-zoom
- [ ] Scroll position tracking and persistence
- [ ] Resume with highlight overlay
- [ ] Highlight auto-fade animation
- [ ] Auto-scroll to highlight on open


### **14.2 RSVP Integration**

- [ ] Tap RSVP → Open RSVP in paused state
- [ ] Long-press RSVP → Instant playback start
- [ ] Pass current word index to RSVP engine
- [ ] Return from RSVP → Update reader scroll position
- [ ] Sync progress between reader and RSVP modes


### **14.3 Polish \& UX**

- [ ] Chrome show/hide transitions smooth
- [ ] Haptic feedback on all interactions
- [ ] Loading states (spinner on document open)
- [ ] Error states with helpful messages
- [ ] Theme switching (light/dark/sepia) without flicker
- [ ] Typography renders correctly (Instrument Serif, Inter)
- [ ] Accessibility labels for all interactive elements


### **14.4 Performance**

- [ ] 60fps scroll on 200+ page documents
- [ ] Memory usage <200MB
- [ ] Resume calculation <100ms
- [ ] No memory leaks over 30-minute session
- [ ] Battery impact <5% per 30 minutes of reading

***

## **SECTION 15: PHASED IMPLEMENTATION PLAN**

### **Phase 1: Basic PDF Reader (Week 1)**

**Deliverables:**

- PDF rendering with vertical scroll
- Basic top bar (back button, title)
- No RSVP integration yet
- Manual scroll position saving on exit

**Acceptance:**

- PDF opens and scrolls smoothly
- Back button returns to library
- Progress saves on exit


### **Phase 2: Chrome \& Progress (Week 2)**

**Deliverables:**

- Auto-hiding top/footer bars
- Progress indicator in footer
- Menu sheet with brightness/theme
- Zoom gestures (pinch, double-tap)

**Acceptance:**

- Chrome hides on scroll, shows on tap
- Brightness slider works
- Theme switching applies correctly
- Zoom feels natural


### **Phase 3: Resume \& Highlight (Week 3)**

**Deliverables:**

- Word extraction and position mapping
- Highlight overlay rendering
- Auto-scroll to highlight
- Precise scroll position saving

**Acceptance:**

- Opens to last-read position
- Highlight appears on correct word (±3 words)
- Auto-scroll smooth and centered
- Highlight fades correctly


### **Phase 4: RSVP Integration (Week 4)**

**Deliverables:**

- RSVP button in top bar (tap + long-press)
- Pass word index to RSVP engine
- Handle RSVP → Reader return
- Sync progress bidirectionally

**Acceptance:**

- Tap RSVP opens overlay, paused state
- Long-press RSVP starts playback immediately
- Returning from RSVP updates reader position
- Progress syncs correctly


### **Phase 5: Polish (Week 5)**

**Deliverables:**

- All typography finalized
- Haptic feedback tuned
- Accessibility labels complete
- Error states designed
- Performance optimizations

**Acceptance:**

- Fonts load correctly on all devices
- All interactions feel polished
- Screen reader announces correctly
- No crashes on edge cases
- Performance targets met

***

## **FINAL SUMMARY**

This reader mode specification provides:

1. **Vertical-scroll PDF viewing** (no pagination, continuous reading)
2. **Minimal, auto-hiding UI** (distraction-free focus)
3. **RSVP button with dual activation**:
    - Tap → Open RSVP paused
    - Long-press → Instant playback
4. **Precise resume capability** with visual highlight
5. **Typography** using Instrument Serif (titles) and Inter (UI chrome)
6. **Cross-platform** design (iOS + Android conventions)
7. **Performance-optimized** for large documents

**Ready for implementation** with clear phases, acceptance criteria, and UI specs.

