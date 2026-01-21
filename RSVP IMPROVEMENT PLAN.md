# **RSVP MODE - COMPLETE SPECIFICATION (UPDATED UI \& FEATURES)**

## **SECTION 1: CORE CHANGES \& NEW FEATURES**

### **1.1 What's New**

**Speed Range:**

- Maximum WPM: **2000 WPM** (previously 1000)
- Speed presets: 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000 WPM

**Pause State Context:**

- Shows **17 words total**: Last 8 + Current + Next 8
- All words visible with visual hierarchy

**ORP Highlighting:**

- ORP letter (at 37% position) highlighted in **RED**
- Letter position **FIXED on screen** (words form around it)

**Scrubber System:**

- Interactive progress/scrub bar
- Shows page numbers and text chunks while scrubbing
- Highlight preview moves word-by-word during scrub
- Visual feedback for page boundaries

***

## **SECTION 2: MODERN UI DESIGN**

### **2.1 RSVP Screen Layout**

```
┌────────────────────────────────────────────────┐
│  [×]           45%  •  12 min left          ⚙  │ ← Header (minimal)
│                                                │
│                                                │
│                                                │
│                                                │
│                                                │
│              el  e  phant                      │ ← ORP Word Display
│              ──  █  ──────                     │    (RED letter fixed)
│                  ↑                             │
│            Fixed red "e" (37% position)        │
│                                                │
│                                                │
│                                                │
├────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░         │ ← Scrubber
│        Page 24        |        Page 25         │    (shows pages)
├────────────────────────────────────────────────┤
│                                                │
│  ◀◀  [▶ / ⏸]  ▶▶              600 WPM ▲▼     │ ← Controls
│  Skip  Play   Skip             Speed           │
│                                                │
└────────────────────────────────────────────────┘
```


### **2.2 Paused State with Context**

```
┌────────────────────────────────────────────────┐
│  [×]           45%  •  12 min left          ⚙  │
│                                                │
│     do eiusmod tempor incididunt ut labore     │ ← Last 8 words
│     et dolore magna aliqua Ut enim ad          │    (gray, small)
│                                                │
│              mi  n  im                         │ ← Current word
│              ──  █  ──                         │    (white, large, red ORP)
│                  ↑                             │
│                                                │
│     veniam quis nostrud exercitation ullamco   │ ← Next 8 words
│     laboris nisi ut aliquip ex ea              │    (gray, small)
│                                                │
├────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░         │
│        Page 24        |        Page 25         │
├────────────────────────────────────────────────┤
│  ◀◀  [▶]  ▶▶                   600 WPM ▲▼     │
└────────────────────────────────────────────────┘
```


***

## **SECTION 3: HEADER SPECIFICATION**

### **3.1 Layout**

```
┌────────────────────────────────────────────────┐
│  [×]           45%  •  12 min left          ⚙  │
│   ↑            ↑         ↑                  ↑  │
│ Close      Progress   Est.time          Settings│
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 56dp
- Background: `#0A0E1A` with 98% opacity
- Bottom border: 1dp, `#1A1F2E`
- Padding: 12dp horizontal

**Close Button (left):**

- Icon: X or chevron-down (24dp)
- Color: `#FFFFFF`
- Touch target: 48dp × 48dp
- Action: Exit RSVP, save progress, return to reader

**Progress Text (center-left):**

- Font: **Inter Bold, 16sp**
- Color: `#00BCD4` (teal accent)
- Format: "45%"

**Separator:**

- Character: "- "
- Color: `#6B7280` (gray)
- Font: **Inter Regular, 14sp**

**Time Remaining (center-right):**

- Font: **Inter Medium, 14sp**
- Color: `#B0B0B0` (light gray)
- Format: "12 min left"

**Settings Button (right):**

- Icon: Gear/cog (24dp)
- Color: `#FFFFFF`
- Touch target: 48dp × 48dp
- Action: Open settings sheet (curves, natural pacing, etc.)

***

## **SECTION 4: WORD DISPLAY AREA (CORE RSVP)**

### **4.1 Fixed ORP Letter System**

**Core Principle:** The RED ORP letter stays in EXACTLY the same screen position. Words render around it.

```
Screen vertical center, horizontal center:

┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│                    |                           │ ← Fixed red guide
│              el    e    phant                  │
│              ──    █    ──────                 │
│                    ↑                           │
│            This point never moves              │
│                                                │
│                                                │
└────────────────────────────────────────────────┘

Next word: "hello"
ORP at 37%: index 1 (h|e|llo)

┌────────────────────────────────────────────────┐
│                                                │
│                                                │
│                    |                           │
│               h    e    llo                    │
│               ─    █    ───                    │
│                    ↑                           │
│            Same fixed position                 │
│                                                │
│                                                │
└────────────────────────────────────────────────┘
```


### **4.2 Word Rendering Layout**

**Three Segments:**

**Left Segment (before ORP):**

- Alignment: Right-aligned to the red guide
- Font: **Instrument Serif Regular, 48sp** (user adjustable 32-72sp)
- Color: `#FFFFFF`
- Position: Ends at red guide minus 4dp gap

**ORP Letter (the red one):**

- Font: **Instrument Serif Bold, 48sp**
- Color: `#FF3B30` (bright red, high contrast)
- Position: FIXED at screen center (exact X coordinate never changes)
- Background: Optional subtle glow for emphasis (red shadow 2dp blur)

**Right Segment (after ORP):**

- Alignment: Left-aligned from the red guide
- Font: **Instrument Serif Regular, 48sp**
- Color: `#FFFFFF`
- Position: Starts at red guide plus 4dp gap

**Visual Guide Line (optional toggle):**

- Thin vertical line (1dp) through screen center at ORP position
- Color: `#FF3B30` with 20% opacity
- Extends full screen height behind word
- Setting: "Show ORP Guide" (on/off)


### **4.3 Typography \& Sizing**

**Base Font Size:**

- Default: 48sp
- Range: 32sp - 72sp
- Adjusted in settings

**Auto-Shrink for Long Words:**

```javascript
maxWidth = screenWidth * 0.88  // Leave 12% margin total

if (measuredWidth > maxWidth) {
  shrinkFactor = maxWidth / measuredWidth
  fontSize = baseFontSize * shrinkFactor
  fontSize = max(fontSize, 28sp)  // Minimum for readability
}
```

**Font Family:**

- **Instrument Serif** for all word display (reading focus)
- Monospace alternative available in settings

***

## **SECTION 5: PAUSE STATE CONTEXT DISPLAY**

### **5.1 Layout with 17 Words**

```
┌────────────────────────────────────────────────┐
│                                                │
│  previous_8  previous_7  previous_6  previous_5│ ← Row 1 (4 words)
│  previous_4  previous_3  previous_2  previous_1│ ← Row 2 (4 words)
│                                                │
│              cu  r  rent                       │ ← Current (large)
│              ──  █  ────                       │
│                                                │
│  next_1  next_2  next_3  next_4               │ ← Row 3 (4 words)
│  next_5  next_6  next_7  next_8               │ ← Row 4 (4 words)
│                                                │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Previous 8 Words (above current):**

- Display in 2 rows of 4 words each
- Font: **Inter Regular, 13sp**
- Color: `#6B7280` (medium gray, de-emphasized)
- Spacing: 8dp between words, 6dp between rows
- Alignment: Center-aligned block above current word
- Position: 120dp above current word centerline

**Current Word:**

- Font: **Instrument Serif Regular, 48sp**
- ORP letter: **Bold, RED** (`#FF3B30`)
- Color (other letters): `#FFFFFF`
- Position: Screen vertical center (40% from top)

**Next 8 Words (below current):**

- Display in 2 rows of 4 words each
- Font: **Inter Regular, 13sp**
- Color: `#6B7280` (medium gray)
- Spacing: Same as previous words
- Alignment: Center-aligned block below current word
- Position: 120dp below current word centerline

**Visual Hierarchy:**

```
Previous words:  ░░░░  (60% opacity, small, gray)
                 ░░░░

Current word:    ████  (100% opacity, large, white + red)

Next words:      ░░░░  (60% opacity, small, gray)
                 ░░░░
```


### **5.2 Transition: Playing → Paused**

**Animation:**

1. Current word stays in place
2. Previous/next words fade in (300ms ease-out)
3. Context words slide in:
    - Previous: From above (20dp slide down)
    - Next: From below (20dp slide up)
4. All simultaneously for smooth effect

***

## **SECTION 6: SCRUBBER/PROGRESS BAR SYSTEM**

### **6.1 Scrubber Layout**

```
┌────────────────────────────────────────────────┐
│                                                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░        │ ← Progress bar
│           ●                                    │    Draggable handle
│           ↑                                    │
│      Current position                          │
│                                                │
│    Page 24            |          Page 25       │ ← Page labels
│  "consectetur adipiscing" | "sed do eiusmod"   │    Text preview
│                                                │
└────────────────────────────────────────────────┘
```

**Components:**

### **6.2 Progress Bar**

**Container:**

- Height: 6dp (idle), 12dp (active/dragging)
- Width: 94% of screen width, centered
- Background (unfilled): `#1A1F2E` (dark gray)
- Filled portion: `#00BCD4` (teal gradient)
- Border radius: 3dp (6dp when active)
- Transition: Height expands smoothly on touch (200ms)

**Progress Handle:**

- Shape: Circle
- Diameter: 20dp (idle), 28dp (dragging)
- Color: `#00BCD4` (teal)
- Border: 3dp white stroke with 40% opacity
- Shadow: `0 2px 8px rgba(0,188,212,0.4)` (teal glow)
- Position: Moves along bar based on current word index


### **6.3 Page Labels \& Text Preview**

**Page Number Indicators:**

- Display: Below progress bar
- Font: **Inter Bold, 11sp**
- Color: `#B0B0B0` (light gray)
- Format: "Page 24"
- Position: Aligned to page boundaries on bar
- Spacing: Calculated dynamically based on page word count

**Page Boundary Markers:**

- Visual: Thin vertical line (1dp) above bar
- Color: `#6B7280` with 50% opacity
- Height: 12dp
- Position: At each page start/end position on bar

**Text Preview (on scrub):**

- Displays below page number during scrubbing
- Font: **Inter Regular, 10sp**
- Color: `#9CA3AF` (medium gray)
- Format: First 3-4 words from that page chunk
- Truncated with "..." if needed
- Background: `#141824` (elevated surface), rounded 4dp, padding 6dp
- Appears only when actively scrubbing


### **6.4 Scrubbing Interaction**

**User Experience Flow:**

1. **User touches scrubber handle:**
    - Handle scales to 28dp (grow animation 100ms)
    - Bar height expands to 12dp
    - Haptic: Light impact
2. **User drags left/right:**
    - Handle follows finger horizontally
    - Calculate word index from position: `wordIndex = (handleX / barWidth) * totalWords`
    - Word display updates in real-time (showing word at that index)
    - ORP letter stays fixed, word forms around it
    - Page labels update if crossing page boundary
    - Text preview tooltip appears showing nearby words
    - Haptic: Selection feedback every 10 words (light ticks)
3. **User releases handle:**
    - Handle snaps to nearest word position (100ms ease-out)
    - Bar height returns to 6dp
    - Text preview fades out (200ms)
    - Haptic: Medium impact
    - RSVP paused at selected word
    - Context (8-1-8 words) loads for new position

**Visual Feedback During Scrub:**

```
While dragging handle:

┌────────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓●░░░░░░░░░░░░░░░░░░░░░░         │
│              ↑                                 │
│         "adipiscing"  ← Current word preview   │
│                                                │
│    Page 24            |          Page 25       │
│ ┌──────────────────┐                          │
│ │ consectetur      │  ← Text preview popup     │
│ │ adipiscing elit  │                           │
│ └──────────────────┘                          │
└────────────────────────────────────────────────┘
```


### **6.5 Page Boundary Visualization**

**How Pages Are Shown:**

```
Progress bar with 3 pages example:

|──────────────|─────────────|──────────────────|
Page 1         Page 2         Page 3
(2000 words)   (1800 words)   (2200 words)
     ↑              ↑              ↑
  Markers show proportional width based on word count
```

**Implementation:**

- Calculate page boundaries: `pageStartPosition = (pageStartWordIndex / totalWords) * barWidth`
- Draw markers at each boundary
- Label alternates above/below bar if pages are dense

***

## **SECTION 7: CONTROL PANEL**

### **7.1 Layout**

```
┌────────────────────────────────────────────────┐
│                                                │
│   ◀◀     [▶]     ▶▶              600  ▲      │
│   Skip   Play   Skip             WPM   ▼      │
│                                                │
└────────────────────────────────────────────────┘
```

**Specifications:**

**Container:**

- Height: 100dp
- Background: `#0A0E1A` (matches app background)
- Top border: 1dp, `#1A1F2E`
- Padding: 16dp horizontal, 20dp vertical


### **7.2 Skip Back Button**

**Visual:**

- Icon: Double chevron left "◀◀" (28dp)
- Color: `#FFFFFF`
- Touch target: 56dp × 56dp
- Background: `#1A1F2E` (elevated surface), circular

**Action:**

- Tap: Skip backward 10 words
- Long-press: Skip backward 50 words (with haptic at 500ms)


### **7.3 Play/Pause Button**

**Visual:**

- Shape: Circle
- Diameter: 72dp (largest, primary action)
- Background: `#00BCD4` (teal accent)
- Icon:
    - Play triangle "▶" (32dp) when paused
    - Pause bars "⏸" (32dp) when playing
- Color: `#FFFFFF`
- Shadow: `0 4px 12px rgba(0,188,212,0.3)` (teal glow)

**States:**

- Idle: Default appearance
- Pressed: Scale 0.95 (100ms)
- Playing: Rotating subtle pulse animation on border (2s loop)

**Action:**

- Tap: Toggle play/pause
- Haptic: Medium impact on toggle


### **7.4 Skip Forward Button**

**Visual:**

- Icon: Double chevron right "▶▶" (28dp)
- Color: `#FFFFFF`
- Touch target: 56dp × 56dp
- Background: `#1A1F2E` (elevated surface), circular

**Action:**

- Tap: Skip forward 10 words
- Long-press: Skip forward 50 words


### **7.5 Speed Display \& Controls**

**Layout:**

```
┌──────────┐
│   600    │ ← WPM value
│   WPM    │ ← Label
│    ▲     │ ← Increment
│    ▼     │ ← Decrement
└──────────┘
```

**WPM Value Display:**

- Font: **Inter Bold, 28sp**
- Color: `#00BCD4` (teal)
- Center aligned

**"WPM" Label:**

- Font: **Inter Medium, 11sp**
- Color: `#6B7280` (gray)
- Letter spacing: +1sp

**Increment Button (▲):**

- Icon: Chevron up (20dp)
- Color: `#FFFFFF`
- Touch target: 40dp × 40dp
- Background: `#1A1F2E`, top corners rounded 8dp
- Action: Increase speed by 1 step in preset list
    - Preset steps: 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000
- Long-press: Rapid increment (100ms per step)

**Decrement Button (▼):**

- Icon: Chevron down (20dp)
- Color: `#FFFFFF`
- Touch target: 40dp × 40dp
- Background: `#1A1F2E`, bottom corners rounded 8dp
- Action: Decrease speed
- Long-press: Rapid decrement

**Speed Container:**

- Width: 80dp
- Background: `#141824` (elevated surface)
- Border: 1dp `#1A1F2E`
- Border radius: 8dp
- Position: Right side of control panel

***

## **SECTION 8: SETTINGS SHEET**

### **8.1 Layout**

Accessed via gear icon in header.

```
┌─────────────────────────────────────┐
│ RSVP Settings                       │ ← Inter Bold, 20sp
├─────────────────────────────────────┤
│                                     │
│ Font Size                           │ ← Inter Medium, 14sp
│ [━━━━━●━━━━━━] 48sp                │ ← Slider
│                                     │
│ Natural Pacing                 [✓]  │ ← Toggle
│ Add micro-pauses at punctuation     │ ← Description
│                                     │
│ Show ORP Guide Line            [ ]  │ ← Toggle
│ Vertical line at red letter         │
│                                     │
│ Easing Curve                        │
│ [Ease Out ▼]                       │ ← Dropdown
│                                     │
│ Ease Duration                       │
│ [━━━●━━━━━━━━] 2.0s               │ ← Slider
│                                     │
│ [Reset to Defaults]                 │ ← Button
└─────────────────────────────────────┘
```

**Typography:**

- Sheet title: **Inter Bold, 20sp**, `#FFFFFF`
- Section labels: **Inter Medium, 14sp**, `#FFFFFF`
- Descriptions: **Inter Regular, 12sp**, `#9CA3AF` (gray)
- Values: **Inter Bold, 14sp**, `#00BCD4` (teal)

***

## **SECTION 9: COLOR PALETTE (RSVP Mode)**

### **9.1 Complete Color System**

**Backgrounds:**

- Screen: `#0A0E1A` (dark navy)
- Elevated surfaces: `#141824` (cards, controls)
- Borders/dividers: `#1A1F2E`

**Text:**

- Primary (current word): `#FFFFFF` (white)
- ORP letter: `#FF3B30` (bright red)
- Context words: `#6B7280` (60% opacity gray)
- Labels: `#B0B0B0` (light gray)
- Secondary: `#9CA3AF` (medium gray)

**Accents:**

- Primary: `#00BCD4` (teal/cyan)
- Progress filled: `#00BCD4`
- Play button: `#00BCD4`
- Speed value: `#00BCD4`

**Interactive:**

- Button idle: `#1A1F2E`
- Button pressed: `#252A39`
- Handle/slider: `#00BCD4`

***

## **SECTION 10: COMPLETE FEATURE SPECIFICATIONS**

### **10.1 Speed System**

**Range:**

- Minimum: 150 WPM
- Maximum: 2000 WPM
- Preset steps: 150, 200, 250, 300, 400, 500, 600, 800, 1000, 1200, 1500, 2000

**Display Time Calculation:**

```javascript
function calculateDisplayTime(word, wpm, naturalPacing) {
  let baseTime = 60000 / wpm;  // ms per word
  
  if (naturalPacing) {
    // Punctuation pauses
    if (word.match(/[.!?]$/)) baseTime += 150;  // Reduced for high speeds
    else if (word.match(/[;:]$/)) baseTime += 100;
    else if (word.match(/,$/)) baseTime += 30;
    
    // Long word penalty
    if (word.length > 10) baseTime += 40;
    if (word.length > 15) baseTime += 80;
  }
  
  return Math.max(baseTime, 30);  // Minimum 30ms per word (for 2000 WPM)
}
```

**At 2000 WPM:**

- Base time: 30ms per word
- Visibility threshold: Human can process ~20-25ms stimuli
- With punctuation pauses: Average ~35-50ms
- Comprehension: Low (skimming mode)


### **10.2 ORP (Optimal Recognition Point) Calculation**

**Formula:**

```javascript
function calculateORP(word) {
  const length = word.length;
  const orpIndex = Math.floor(length * 0.37);
  
  // Get actual character (handle multi-byte UTF-8)
  const chars = Array.from(word);
  const orpChar = chars[orpIndex];
  
  // Split word
  const leftPart = chars.slice(0, orpIndex).join('');
  const rightPart = chars.slice(orpIndex + 1).join('');
  
  return {
    orpIndex,
    orpChar,
    leftPart,
    rightPart
  };
}

// Examples:
calculateORP("elephant")
// { orpIndex: 2, orpChar: "e", leftPart: "el", rightPart: "phant" }

calculateORP("the")
// { orpIndex: 1, orpChar: "h", leftPart: "t", rightPart: "e" }

calculateORP("I")
// { orpIndex: 0, orpChar: "I", leftPart: "", rightPart: "" }
```


### **10.3 Fixed Position Rendering**

**Screen Coordinate System:**

```javascript
// Define fixed ORP X-coordinate (screen center)
const ORP_X = screenWidth / 2;  // e.g., 412dp / 2 = 206dp

// For each word:
function renderWord(word, orp) {
  const leftWidth = measureText(orp.leftPart, fontSize);
  const orpWidth = measureText(orp.orpChar, fontSize);
  const rightWidth = measureText(orp.rightPart, fontSize);
  
  // Calculate positions
  const leftSegmentX = ORP_X - leftWidth - 4;  // 4dp gap
  const orpCharX = ORP_X;  // FIXED
  const rightSegmentX = ORP_X + orpWidth + 4;
  
  // Render each segment at calculated X
  drawText(orp.leftPart, leftSegmentX, centerY, { align: 'right' });
  drawText(orp.orpChar, orpCharX, centerY, { align: 'center', color: RED, bold: true });
  drawText(orp.rightPart, rightSegmentX, centerY, { align: 'left' });
}
```

**Result:** The ORP letter appears to "stay still" while words flow through it.

### **10.4 Scrubber Word Calculation**

```javascript
function onScrubberDrag(touchX) {
  // Convert touch position to word index
  const barStartX = screenPadding;
  const barWidth = screenWidth - (screenPadding * 2);
  
  const relativeX = touchX - barStartX;
  const progress = relativeX / barWidth;
  
  // Clamp between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Calculate word index
  const wordIndex = Math.floor(clampedProgress * totalWords);
  
  // Update display
  setCurrentWordIndex(wordIndex);
  
  // Calculate which page
  const pageNum = getPageNumberForWord(wordIndex);
  
  // Update page label
  updatePageLabel(pageNum);
  
  // Show text preview
  const nearbyWords = getWordsInRange(wordIndex, wordIndex + 3);
  showTextPreview(nearbyWords.join(' ') + '...');
  
  // Haptic feedback every 10 words
  if (wordIndex % 10 === 0) {
    haptic.selection();
  }
}
```


***

## **SECTION 11: ANIMATIONS \& TRANSITIONS**

### **11.1 Word Transition (Playing Mode)**

**Requirements:**

- 60fps minimum
- No visible flicker
- Smooth at 2000 WPM (30ms per word)

**Strategy:**

```
Use double-buffering:
1. Pre-calculate next word ORP and segments
2. Keep two text views in memory
3. Swap views on transition (immediate, no fade)
4. Pre-render next word during current word display

At 2000 WPM:
- Display time: 30ms
- Render time budget: <10ms
- Use native text rendering (not web views)
```

**Implementation:**

```javascript
// Pseudo-code
let currentView = textView1;
let nextView = textView2;

function displayNextWord() {
  // Pre-render next word in hidden view
  const nextWord = tokens[currentIndex + 1];
  renderWordInView(nextView, nextWord);
  
  // Swap views instantly
  currentView.hide();
  nextView.show();
  
  // Swap references
  [currentView, nextView] = [nextView, currentView];
}
```


### **11.2 Pause State Transition**

**Playing → Paused:**

```
Timeline:
0ms:    Current word still visible at center
100ms:  Context words fade in (opacity 0 → 100%)
200ms:  Context words slide into position
300ms:  Animation complete

Easing: Ease-out-cubic for smooth deceleration feel
```

**Paused → Playing:**

```
Timeline:
0ms:    Context words visible
100ms:  Context words fade out (opacity 100% → 0%)
150ms:  Context words removed from DOM
200ms:  RSVP playback begins

Easing: Ease-in-cubic for acceleration feel
```


### **11.3 Scrubber Interaction Animations**

**Handle Expansion:**

```
Touch down:
- Duration: 100ms
- Scale: 1.0 → 1.4
- Elevation: 2dp → 6dp shadow
- Easing: Ease-out-back (slight overshoot)
```

**Bar Height Expansion:**

```
Touch down:
- Duration: 150ms
- Height: 6dp → 12dp
- Border radius: 3dp → 6dp
- Easing: Ease-out-quad
```

**Page Label Update:**

```
On page boundary cross:
- Duration: 200ms
- Old label: Fade out
- New label: Fade in + slight scale (0.9 → 1.0)
```


***

## **SECTION 12: PERFORMANCE REQUIREMENTS**

### **12.1 Rendering Performance**

**Targets:**

- Frame rate: 60fps constant (even at 2000 WPM)
- Word render time: <8ms per word
- ORP calculation: <1ms (cached results)
- Scrubber drag response: <16ms (1 frame)
- Memory: <150MB total for RSVP session

**Optimization Strategies:**

1. **Pre-calculate all ORPs** during token generation
2. **Cache text measurements** for common words
3. **Use native text rendering** (not WebView)
4. **Double-buffering** for word swaps
5. **Throttle scrubber updates** to every 50ms during drag

### **12.2 Token Streaming**

**For Large Documents:**

```javascript
// Don't load all 100K tokens into memory
// Use sliding window

const WINDOW_SIZE = 2000;  // 2000 words in memory

function loadTokenWindow(currentIndex) {
  const start = Math.max(0, currentIndex - 1000);
  const end = Math.min(totalWords, currentIndex + 1000);
  
  // Load window from database/cache
  const tokens = loadTokensFromDB(docId, start, end);
  
  // Release old tokens
  clearTokensOutsideWindow(start, end);
  
  return tokens;
}
```


***

## **SECTION 13: DEVELOPMENT CHECKLIST**

### **13.1 Core RSVP Features**

- [ ] Word display with fixed ORP letter (red)
- [ ] ORP calculation at 37% position
- [ ] Three-segment rendering (left, ORP, right)
- [ ] Word transitions at 60fps up to 2000 WPM
- [ ] Speed presets up to 2000 WPM
- [ ] Display time calculation with micro-pauses


### **13.2 Pause State Context**

- [ ] Show last 8 words above current
- [ ] Show next 8 words below current
- [ ] 17 words total visible when paused
- [ ] Gray styling for context words (60% opacity)
- [ ] Smooth fade-in/out transitions


### **13.3 Scrubber System**

- [ ] Interactive progress bar with draggable handle
- [ ] Real-time word preview during scrub
- [ ] Page number labels below bar
- [ ] Page boundary markers on bar
- [ ] Text preview tooltip on scrub
- [ ] Haptic feedback every 10 words
- [ ] Smooth animations (expand/contract)


### **13.4 Controls**

- [ ] Play/pause button (large, center)
- [ ] Skip back/forward buttons (10 words)
- [ ] Long-press skip (50 words)
- [ ] Speed display with WPM value
- [ ] Increment/decrement speed buttons
- [ ] Long-press rapid speed change


### **13.5 Header \& Settings**

- [ ] Progress percentage display
- [ ] Time remaining estimate
- [ ] Close button (exit RSVP)
- [ ] Settings button (gear icon)
- [ ] Settings sheet with font size, natural pacing, ORP guide, easing curve


### **13.6 Polish \& UX**

- [ ] Typography: Instrument Serif (words), Inter (UI)
- [ ] Dark theme colors matching library
- [ ] All animations smooth (60fps)
- [ ] Haptic feedback on all interactions
- [ ] Loading states for large documents
- [ ] Error handling (token stream exhaustion)

***

## **SECTION 14: VISUAL DESIGN MOCKUPS**

### **14.1 Playing State**

```
┌────────────────────────────────────────────────┐
│  [×]           45%  •  12 min left          ⚙  │
│                                                │
│                                                │
│                                                │
│                      |← Fixed red guide        │
│              ex  a  mple                       │
│              ──  █  ─────                      │
│                  ↑                             │
│              RED letter                        │
│                                                │
│                                                │
│                                                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░        │
│    Page 24        |        Page 25    |  26    │
│                                                │
│  ◀◀     [⏸]     ▶▶              600  ▲       │
│                                  WPM  ▼       │
└────────────────────────────────────────────────┘
```


### **14.2 Paused State with Full Context**

```
┌────────────────────────────────────────────────┐
│  [×]           45%  •  12 min left          ⚙  │
│                                                │
│    consectetur adipiscing elit Sed             │ ← Last 8 words
│    do eiusmod tempor incididunt                │   (gray, 2 rows)
│                                                │
│              mi  n  im                         │ ← Current word
│              ──  █  ──                         │   (white + red)
│                  ↑                             │
│                                                │
│    veniam quis nostrud exercitation            │ ← Next 8 words
│    ullamco laboris nisi ut                     │   (gray, 2 rows)
│                                                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░        │
│    Page 24        |        Page 25    |  26    │
│                                                │
│  ◀◀     [▶]     ▶▶              600  ▲       │
│                                  WPM  ▼       │
└────────────────────────────────────────────────┘
```


### **14.3 Scrubbing Active State**

```
┌────────────────────────────────────────────────┐
│  [×]           58%  •  8 min left           ⚙  │
│                                                │
│                                                │
│              ad  i  piscing                    │ ← Preview word
│              ──  █  ────────                   │
│                                                │
│                                                │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓●░░░░░░░░░░░░░░░░          │ ← Expanded bar
│    Page 24        |  ↑    Page 25    |  26    │
│              ┌────────────┐                    │
│              │ adipiscing │ ← Text preview     │
│              │ elit sed   │   popup            │
│              └────────────┘                    │
│  ◀◀     [▶]     ▶▶              600  ▲       │
└────────────────────────────────────────────────┘
```


***

## **FINAL SUMMARY**

This updated RSVP specification includes:

1. ✅ **Speed up to 2000 WPM** with optimized performance
2. ✅ **Pause state shows 17 words** (8 before + current + 8 after)
3. ✅ **RED ORP letter** at 37% position, highlighted and bolded
4. ✅ **Fixed ORP position** - words form around static red letter
5. ✅ **Interactive scrubber** with:
    - Real-time word preview
    - Page labels and boundaries
    - Text chunk preview on drag
    - Haptic feedback
6. ✅ **Modern dark UI** matching library aesthetic
7. ✅ **Complete control panel** with skip, play/pause, speed controls
8. ✅ **Typography**: Instrument Serif (words) + Inter (UI)

**Ready for implementation** with detailed UI mockups, interaction specs, and performance targets.
<span style="display:none">[^1][^2]</span>

<div align="center">⁂</div>

[^1]: Screenshot-2026-01-20-at-00.34.53.jpg

[^2]: Screenshot-2026-01-20-at-00.35.04.jpg

