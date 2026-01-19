# **LIBRARY PAGE - UPDATED TYPOGRAPHY \& UI SPECIFICATION**

## **Typography System (Updated Font Stack)**

### **Primary Typefaces**

**Instrument Serif** - Used for display and reading-focused elements

- Document titles
- Headings
- Empty state messages
- Document details

**Inter** - Used for UI elements and metadata

- Navigation labels
- Buttons and controls
- Author names
- File metadata (size, type, date)
- Progress indicators
- Search placeholder text
- Sort labels

***

## **SECTION 1: Top App Bar Typography**

### **Layout with Updated Fonts:**

```
┌─────────────────────────────────────────────────────┐
│ [Logo] Library                      [Search] [+]    │
│        ↑                                             │
│    Inter Bold, 20sp                                  │
└─────────────────────────────────────────────────────┘
```

**Specifications:**

- App name/title "Library": **Inter Bold, 20sp**, color: primary text
- Icon buttons: 24dp size, color: icon tint
- Background: surface color with slight elevation shadow

***

## **SECTION 2: Control Strip Typography**

```
┌─────────────────────────────────────────────────────┐
│  [Grid/List] Sort: Latest added ↓                   │
│                ↑                                     │
│           Inter Medium, 14sp                         │
└─────────────────────────────────────────────────────┘
```

**Specifications:**

- Sort chip text: **Inter Medium, 14sp**
- Icon labels: **Inter Regular, 12sp**
- Chip background: surface variant with border

***

## **SECTION 3: Document Cards (Grid View)**

### **Card Typography Hierarchy:**

```
┌──────────────────────────┐
│                          │
│     [Cover Image]        │
│                          │
├──────────────────────────┤
│ The Great Gatsby         │ ← Instrument Serif Bold, 16sp
│ F. Scott Fitzgerald      │ ← Inter Regular, 13sp, secondary color
│                          │
│ ▓▓▓▓▓▓▓░░░ 65%          │ ← Inter Medium, 11sp
│ PDF                      │ ← Inter Regular, 10sp, tertiary color
└──────────────────────────┘
```

**Specifications:**

**Title:**

- Font: **Instrument Serif Bold, 16sp**
- Line height: 1.3
- Max lines: 2
- Ellipsis on overflow
- Color: primary text (black in light mode, white in dark)

**Author:**

- Font: **Inter Regular, 13sp**
- Line height: 1.2
- Max lines: 1
- Color: secondary text (gray 60%)

**Progress percentage:**

- Font: **Inter Medium, 11sp**
- Color: accent color

**File type badge:**

- Font: **Inter Regular, 10sp**
- All caps: "PDF" or "EPUB"
- Color: tertiary text
- Optional background chip

***

## **SECTION 4: Document Rows (List View)**

### **Row Typography Layout:**

```
┌────────────────────────────────────────────────────────┐
│ [Thumb] The Great Gatsby                        [45%] │
│         ↑ Instrument Serif Bold, 18sp                  │
│         F. Scott Fitzgerald                            │
│         ↑ Inter Regular, 14sp                          │
│         PDF • 180 pages • Last read 2d ago            │
│         ↑ Inter Regular, 12sp, tertiary color          │
└────────────────────────────────────────────────────────┘
```

**Specifications:**

**Title:**

- Font: **Instrument Serif Bold, 18sp**
- Single line with ellipsis
- Color: primary text

**Author:**

- Font: **Inter Regular, 14sp**
- Color: secondary text

**Metadata line:**

- Font: **Inter Regular, 12sp**
- Color: tertiary text (gray 50%)
- Separator: " -  " (bullet)
- Items: Type, page count, last read time

**Progress indicator (right):**

- Font: **Inter Bold, 16sp** (numeric)
- Or circular progress with **Inter Medium, 12sp** center text

***

## **SECTION 5: Search Bar Typography**

```
┌─────────────────────────────────────────────────────┐
│  🔍 Search documents...                         [X] │
│      ↑ Inter Regular, 16sp, placeholder color       │
└─────────────────────────────────────────────────────┘
```

**Specifications:**

**Placeholder text:**

- Font: **Inter Regular, 16sp**
- Color: placeholder gray (40% opacity)

**Input text:**

- Font: **Inter Regular, 16sp**
- Color: primary text

**Results count:**

- Font: **Inter Medium, 13sp**
- Example: "24 results found"
- Color: secondary text

***

## **SECTION 6: Sort Menu/Bottom Sheet Typography**

```
┌─────────────────────────────────┐
│ Sort Documents                  │ ← Inter Bold, 20sp
├─────────────────────────────────┤
│ ✓ Latest added                  │ ← Inter Medium, 16sp (selected)
│   Alphabetical (A → Z)          │ ← Inter Regular, 16sp
│   Alphabetical (Z → A)          │
│   Last read (newest first)      │
│   Last read (oldest first)      │
│   Progress (least read)         │
│   Progress (most read)          │
└─────────────────────────────────┘
```

**Specifications:**

**Sheet title:**

- Font: **Inter Bold, 20sp**
- Color: primary text

**Options:**

- Selected: **Inter Medium, 16sp**, accent color
- Unselected: **Inter Regular, 16sp**, primary text
- Checkmark icon: 20dp, accent color

***

## **SECTION 7: Empty State Typography**

```
        ┌──────────────┐
        │ Illustration │
        └──────────────┘
        
     No documents yet
     ↑ Instrument Serif Bold, 24sp
     
  Tap the + button to add PDFs
  or EPUBs from your device.
  ↑ Inter Regular, 16sp
  
     [Add Document]
     ↑ Inter Medium, 16sp (button text)
```

**Specifications:**

**Primary heading:**

- Font: **Instrument Serif Bold, 24sp**
- Color: primary text
- Center aligned

**Body text:**

- Font: **Inter Regular, 16sp**
- Color: secondary text
- Line height: 1.5
- Center aligned
- Max width: 280dp

**CTA button:**

- Font: **Inter Medium, 16sp**
- Color: white (on accent background)
- Button height: 48dp
- Padding: 24dp horizontal

***

## **SECTION 8: Context Menu / Document Details Typography**

### **Long-press Menu:**

```
┌─────────────────────────┐
│ Open                    │ ← Inter Regular, 16sp
│ Document details        │
│ Remove from library     │
└─────────────────────────┘
```


### **Details Sheet:**

```
┌─────────────────────────────────┐
│ Document Details                │ ← Inter Bold, 20sp
├─────────────────────────────────┤
│ Title                           │ ← Inter Medium, 12sp (label)
│ The Great Gatsby                │ ← Instrument Serif Regular, 16sp
│                                 │
│ Author                          │ ← Inter Medium, 12sp (label)
│ F. Scott Fitzgerald             │ ← Inter Regular, 16sp
│                                 │
│ Type                            │
│ PDF • 2.1 MB                    │ ← Inter Regular, 14sp
│                                 │
│ Progress                        │
│ 65% complete (117/180 pages)   │ ← Inter Regular, 14sp
│                                 │
│ Added                           │
│ January 12, 2026                │ ← Inter Regular, 14sp
│                                 │
│ Last opened                     │
│ 2 days ago                      │ ← Inter Regular, 14sp
└─────────────────────────────────┘
```

**Specifications:**

**Section labels:**

- Font: **Inter Medium, 12sp**
- All caps or title case
- Color: tertiary text
- Letter spacing: +0.5sp

**Values (document title):**

- Font: **Instrument Serif Regular, 16sp**
- Color: primary text

**Values (other data):**

- Font: **Inter Regular, 14-16sp**
- Color: primary or secondary text

***

## **SECTION 9: Loading \& Error States Typography**

### **Loading Toast:**

```
┌──────────────────────────────┐
│ ⟳ Importing document...      │ ← Inter Medium, 14sp
└──────────────────────────────┘
```


### **Error Banner:**

```
┌────────────────────────────────────────────┐
│ ⚠ Unable to import this document           │ ← Inter Medium, 15sp
│   The file may be corrupted or unsupported │ ← Inter Regular, 13sp
└────────────────────────────────────────────┘
```


### **Success Toast:**

```
┌──────────────────────────────┐
│ ✓ Document added             │ ← Inter Medium, 14sp
└──────────────────────────────┘
```

**Specifications:**

**Primary message:**

- Font: **Inter Medium, 14-15sp**
- Color: based on state (error red, success green, info gray)

**Secondary message:**

- Font: **Inter Regular, 13sp**
- Color: secondary text

***

## **SECTION 10: Typography Scale Reference**

### **Complete Type Scale for Library:**

| Element | Font | Size | Weight | Color |
| :-- | :-- | :-- | :-- | :-- |
| **Display/Titles** |  |  |  |  |
| Empty state heading | Instrument Serif | 24sp | Bold | Primary |
| Document title (list) | Instrument Serif | 18sp | Bold | Primary |
| Document title (card) | Instrument Serif | 16sp | Bold | Primary |
| Detail sheet title | Instrument Serif | 16sp | Regular | Primary |
| **UI Elements** |  |  |  |  |
| App bar title | Inter | 20sp | Bold | Primary |
| Sheet header | Inter | 20sp | Bold | Primary |
| Button text | Inter | 16sp | Medium | On-surface |
| Search input | Inter | 16sp | Regular | Primary |
| Menu items | Inter | 16sp | Regular | Primary |
| Empty state body | Inter | 16sp | Regular | Secondary |
| **Metadata** |  |  |  |  |
| Author (list) | Inter | 14sp | Regular | Secondary |
| Metadata values | Inter | 14sp | Regular | Secondary |
| Sort chip | Inter | 14sp | Medium | Secondary |
| Author (card) | Inter | 13sp | Regular | Secondary |
| Subtext | Inter | 12-13sp | Regular | Tertiary |
| Progress percentage | Inter | 11sp | Medium | Accent |
| File type badge | Inter | 10sp | Regular | Tertiary |


***

## **SECTION 11: Font Loading \& Fallback**

### **Implementation Notes:**

**Font Loading:**

```javascript
// Load custom fonts on app initialization
import { useFonts } from 'expo-font';

const fonts = {
  'InstrumentSerif-Regular': require('./assets/fonts/InstrumentSerif-Regular.ttf'),
  'InstrumentSerif-Bold': require('./assets/fonts/InstrumentSerif-Bold.ttf'),
  'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
  'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
  'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
};
```

**Fallback Stack:**

- **Instrument Serif** → Georgia → Times New Roman → serif
- **Inter** → System UI → -apple-system → Roboto → sans-serif

**Cross-Platform Adjustments:**

- iOS: No additional adjustments needed (system renders fonts well)
- Android: May need `fontVariant: ['small-caps']` disabled and explicit `includeFontPadding: false` for precise alignment

***

## **SECTION 12: Accessibility \& Dynamic Type**

### **Font Size Scaling:**

Support system font size preferences while maintaining hierarchy:


| Base Size | Small | Default | Large | XL |
| :-- | :-- | :-- | :-- | :-- |
| 24sp (H1) | 22sp | 24sp | 28sp | 32sp |
| 18sp (H2) | 16sp | 18sp | 21sp | 24sp |
| 16sp (Body) | 14sp | 16sp | 19sp | 22sp |
| 14sp (Meta) | 13sp | 14sp | 16sp | 18sp |
| 12sp (Small) | 11sp | 12sp | 14sp | 16sp |

**Implementation:**

```javascript
// Use scaled font size utility
const scaledFontSize = (baseSize) => {
  const scale = PixelRatio.getFontScale();
  return baseSize * scale;
};
```

**Minimum Touch Targets:**

- All interactive elements: 44dp × 44dp minimum (iOS HIG)
- Android: 48dp × 48dp minimum (Material Design)

***

## **SECTION 13: Dark Mode Typography Adjustments**

### **Color Tokens:**

**Light Mode:**

- Primary text (Instrument Serif, Inter): `#000000` (pure black)
- Secondary text: `#616161` (gray 60%)
- Tertiary text: `#9E9E9E` (gray 50%)
- Placeholder text: `#BDBDBD` (gray 40%)

**Dark Mode:**

- Primary text: `#FFFFFF` (pure white)
- Secondary text: `#B0B0B0` (light gray)
- Tertiary text: `#808080` (medium gray)
- Placeholder text: `#606060` (dark gray)

**Font Weight Adjustment:**

- In dark mode, reduce Instrument Serif Bold → Instrument Serif Semibold (if available)
- Reason: Bold fonts appear heavier on dark backgrounds, causing visual fatigue

***

## **SECTION 14: Performance Optimization**

### **Font Rendering Performance:**

**Text Measurement Caching:**

- Cache measured text widths for common strings
- Reuse measurements for repeated titles/authors

**List/Grid Optimization:**

- Use `getItemLayout` for FlatList with consistent card heights
- Title text: Set `numberOfLines={2}` and `ellipsizeMode="tail"`
- Disable text scaling on Android: `allowFontScaling={false}` for fixed UI elements (icons, badges)

**Font Subsetting:**

- Include only Latin + common punctuation if app is English-only
- Reduces font file size by ~70%
- Instrument Serif: ~80KB → ~25KB
- Inter: ~150KB → ~50KB

***

This updated specification uses **Instrument Serif** for all document titles and reading-focused content, and **Inter** for all UI chrome, metadata, and controls, creating a sophisticated, readable library experience that matches modern ebook reader aesthetics.[^1][^2][^3]

<div align="center">⁂</div>

[^1]: https://www.behance.net/gallery/161381689/Erabook-Ebook-Store-Ebook-Reader-App-UI-Kit

[^2]: https://www.figma.com/community/file/1218468615473770991/erabook-ebook-store-reader-app-ui-kit

[^3]: https://uizard.io/templates/mobile-app-templates/book-reading-mobile-app/

