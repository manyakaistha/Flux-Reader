Now I'll create a comprehensive, implementation-focused specification for the RSVP Engine focused on PDF-only reading with detailed code architecture, data structures, and algorithms—without actual code modules.

***

# **RSVP ENGINE IMPLEMENTATION SPECIFICATION (PDF-Only)**

## **SECTION 1: CORE OVERVIEW**

### **1.1 What We're Building**

A standalone RSVP (Rapid Serial Visual Presentation) engine that:

1. **Extracts text** from a PDF file with precise word positioning
2. **Tokenizes** the extracted text into displayable units
3. **Renders** words one at a time with Optimal Recognition Point (ORP) alignment
4. **Maintains precise timing** (±10ms accuracy) across 60fps displays
5. **Tracks playback state** (play, pause, speed, position)
6. **Saves/restores** reading progress to database
7. **Handles edge cases** (long words, punctuation, images, font sizing)

### **1.2 Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    PDF RSVP Application                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ PDF Renderer │◄────────┤ React Native │                 │
│  │ (React PDF)  │         │   Screen     │                 │
│  └──────────────┘         └──────────────┘                 │
│         ▲                          ▲                         │
│         │                          │                         │
│  ┌──────┴──────────────┐   ┌──────┴─────────────┐          │
│  │  Text Extraction    │   │  RSVP UI Components│          │
│  │  Engine             │   │  - WordDisplay     │          │
│  │  (pdf.js)           │   │  - Sidebar         │          │
│  └──────┬──────────────┘   │  - Controls        │          │
│         │                  └──────▲─────────────┘          │
│         │                         │                         │
│  ┌──────▼──────────────┐   ┌──────┴────────────┐           │
│  │ RSVP Engine         │   │ State Management   │           │
│  │ - Token Stream      │◄──┤ (Zustand)         │           │
│  │ - Playback Loop     │   │ - WPM, Position   │           │
│  │ - Timing Accuracy   │   │ - Pause/Resume    │           │
│  └──────┬──────────────┘   └───────────────────┘           │
│         │                                                    │
│  ┌──────▼──────────────┐                                   │
│  │ Database            │                                   │
│  │ (SQLite)            │                                   │
│  │ - Progress          │                                   │
│  │ - Extracted Text    │                                   │
│  │ - Settings          │                                   │
│  └─────────────────────┘                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```


***

## **SECTION 2: PDF TEXT EXTRACTION PIPELINE**

### **2.1 Extraction Architecture**

**Challenge:** PDF text is not always in reading order. Multi-column layouts, special formatting, and coordinate systems make extraction complex.[^1][^2]

**Solution:** Use pdf.js WebView worker to extract text with precise coordinates, then sort by spatial layout.

### **2.2 Extraction Data Structure**

**Raw PDF Output (from pdf.js):**

```
TextItem {
  str: string                    // The text character(s)
  x: number                      // X-coordinate on page
  y: number                      // Y-coordinate on page
  width: number                  // Character width
  height: number                 // Character height
  fontName: string               // Font identifier
  fontSize: number               // Font size in points
  transform: number[]            // Transformation matrix (for rotation/scaling)
}
```

**Extracted Line Structure (after processing):**

```
ExtractedLine {
  pageNum: number                // Page number (0-indexed)
  lineIndex: number              // Line number on page
  text: string                   // Full line text
  boundingBox: {
    x: number                    // Left X coordinate
    y: number                    // Top Y coordinate
    width: number                // Total line width
    height: number               // Line height
  }
  items: TextItem[]              // Individual character items
  columnIndex: number            // Column number (0 for single column, 0-N for multi-column)
}
```

**Extracted Document Structure (final):**

```
ExtractedDocument {
  fileName: string
  totalPages: number
  pages: {
    [pageNum]: {
      text: string               // Full page text in reading order
      lines: ExtractedLine[]
      words: ExtractedWord[]     // Tokenized words (see below)
      columns: number            // Number of detected columns
      height: number             // Page height in points
      width: number              // Page width in points
    }
  }
}
```


### **2.3 Extraction Algorithm**

**Step 1: Raw Text Extraction**

- Load PDF using pdf.js WebView worker
- For each page:
    - Call `pdfPage.getTextContent()`
    - Collect all TextItems
    - Preserve x, y coordinates

**Step 2: Spatial Sorting**

- Group items into lines based on Y-coordinate proximity:
    - Tolerance: ±3 points (accounts for baseline variance)
    - Items within Y-range belong to same line
- For each line, sort items by X-coordinate (left to right)
- Reconstruct text by concatenating sorted items

**Step 3: Multi-Column Detection**

- Analyze X-coordinate distribution of lines
- Detect column boundaries using clustering:
    - If X-coordinates show gap > (page width / 3), assume two columns
    - Calculate boundary: X-position with largest gap
- Reorder lines for proper reading sequence:
    - For single column: Top to bottom
    - For two columns: Top-to-bottom of column 1, then column 2
    - For three+ columns: Left-to-right by column, then top-to-bottom within

**Step 4: Word Extraction from Lines**

- Tokenize each line into words (see Section 3)
- Calculate word-level bounding boxes:
    - Start X: Sum of widths of previous items in line
    - Y: Line's Y coordinate
    - Width: Sum of word's character widths
    - Height: Line height

**Step 5: Caching**

- Store extracted text in SQLite `extracted_text` table
- Cache structure: `{docId, pageNum, wordsJson, metadataJson}`
- Expiry: 30 days
- Invalidation: File timestamp comparison


### **2.4 Extraction Implementation Pseudocode**

```
function extractTextFromPDF(pdfUri) {
  // Step 1: Load PDF
  const pdf = await pdfjs.getDocument(pdfUri);
  const totalPages = pdf.numPages;
  
  const extractedDoc = {
    totalPages,
    pages: {}
  };
  
  // Step 2: Process each page
  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    
    // Step 2a: Get raw text content
    const textContent = await page.getTextContent();
    const textItems = textContent.items;  // Array of TextItem
    
    // Step 2b: Group into lines (spatial sorting)
    const lines = groupItemsIntoLines(textItems);  // Y-proximity clustering
    const sortedLines = lines.map(line => ({
      ...line,
      items: sortByXCoordinate(line.items)
    }));
    
    // Step 2c: Reconstruct line text
    const linesWithText = sortedLines.map(line => ({
      ...line,
      text: line.items.map(item => item.str).join('')
    }));
    
    // Step 2d: Multi-column detection
    const columnCount = detectColumns(sortedLines);
    const reorderedLines = reorderForMultiColumn(linesWithText, columnCount);
    
    // Step 2e: Tokenize and create words
    const words = tokenizeLines(reorderedLines, pageNum);
    
    // Store in extracted doc
    extractedDoc.pages[pageNum] = {
      text: reorderedLines.map(l => l.text).join('\n'),
      lines: reorderedLines,
      words,
      columns: columnCount
    };
  }
  
  // Step 3: Cache to database
  cacheExtractedText(docId, extractedDoc);
  
  return extractedDoc;
}

function groupItemsIntoLines(items) {
  const lineGroups = [];
  let currentLine = [];
  let lastY = null;
  
  items.forEach(item => {
    const y = item.y;
    
    // If Y-coordinate similar to last line, add to current line
    if (lastY === null || Math.abs(y - lastY) < 3) {
      currentLine.push(item);
    } else {
      // Start new line
      if (currentLine.length > 0) {
        lineGroups.push(currentLine);
      }
      currentLine = [item];
    }
    lastY = y;
  });
  
  if (currentLine.length > 0) {
    lineGroups.push(currentLine);
  }
  
  return lineGroups;
}

function detectColumns(lines) {
  // Calculate X-coordinate histogram
  const xPositions = [];
  lines.forEach(line => {
    line.items.forEach(item => {
      xPositions.push(item.x);
    });
  });
  
  // Find gap in X distribution
  const sorted = xPositions.sort((a, b) => a - b);
  let maxGap = 0;
  let gapIndex = 0;
  
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > maxGap) {
      maxGap = gap;
      gapIndex = i;
    }
  }
  
  // If gap exists and is significant, assume 2 columns
  if (maxGap > 50) {
    return 2;
  }
  return 1;
}

function reorderForMultiColumn(lines, columnCount) {
  if (columnCount === 1) {
    return lines;  // Already in order
  }
  
  // For 2+ columns, separate and reorder
  const pageWidth = Math.max(...lines.flatMap(l => 
    l.items.map(item => item.x + item.width)
  ));
  const columnBoundary = pageWidth / 2;
  
  const column1 = lines.filter(line => 
    line.items.some(item => item.x < columnBoundary)
  );
  const column2 = lines.filter(line => 
    line.items.some(item => item.x >= columnBoundary)
  );
  
  // Interleave by Y-position
  const reordered = [];
  let i = 0, j = 0;
  while (i < column1.length || j < column2.length) {
    if (i < column1.length && (j >= column2.length || column1[i].y < column2[j].y)) {
      reordered.push(column1[i++]);
    } else if (j < column2.length) {
      reordered.push(column2[j++]);
    }
  }
  
  return reordered;
}
```


***

## **SECTION 3: TOKENIZATION SYSTEM**

### **3.1 Token Structure**

Each token represents a displayable unit in RSVP mode.

```
RSVPToken {
  id: string                     // Unique identifier (e.g., "page1-word45")
  text: string                   // The text to display ("hello")
  type: 'word' | 'punctuation'   // Token classification
  | 'whitespace' | 'break'
  
  // Source reference (for resume capability)
  sourceRef: {
    pageNum: number              // PDF page number
    lineIndex: number            // Line on page
    wordIndexOnLine: number      // Word position in line
    wordIndexInPage: number      // Word position in page
    wordIndexInDoc: number       // Word position in document (global)
  }
  
  // Display information
  displayDuration: number        // Milliseconds to show this token (calculated)
  
  // Context (for pause preview)
  context: {
    prevWords: RSVPToken[]       // Previous 2 tokens
    nextWords: RSVPToken[]       // Next 2 tokens
  }
  
  // Optimization (for rendering)
  orpIndex: number               // ORP character index
  orpChar: string                // Character at ORP position
  leftPart: string               // Text before ORP
  rightPart: string              // Text after ORP
}
```


### **3.2 Tokenization Algorithm**

**Goal:** Split text into tokens while preserving punctuation semantics and enabling accurate word counting.

**Approach:** Penn Treebank-style tokenization[^3]

**Rules:**

1. Separate punctuation from words: `"hello,"` → `["hello", ","]`
2. Keep contractions attached: `"don't"` → `["don't"]`
3. Preserve em-dashes: `"word—other"` → `["word", "—", "other"]`
4. Handle quotes: `"'hello'"` → `["'", "hello", "'"]` or `[``hello'']` (eyelashes)
5. Preserve numbers: `"123.45"` → `["123.45"]` or `["123", ".", "45"]` (context-dependent)
6. Handle URLs/emails: Treat as single tokens if detected

**Implementation Strategy:**

```
function tokenizeText(text) {
  // Regex-based tokenization
  const tokens = [];
  
  // Pattern: word + optional attached punctuation, or standalone punctuation
  const pattern = /(\w+(?:'\w+)?|[.,;:!?—–-]+|[()[\]{}\"'`]+)/g;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    const tokenText = match[^1];
    const type = classifyToken(tokenText);
    
    tokens.push({
      text: tokenText,
      type,
      displayDuration: calculateDisplayDuration(tokenText)
    });
  }
  
  return tokens;
}

function classifyToken(text) {
  if (/^[.,;:!?—–\-"'`()[\]{}]+$/.test(text)) {
    return 'punctuation';
  }
  if (/^\d+/.test(text)) {
    return 'number';
  }
  if (/^\w+/.test(text)) {
    return 'word';
  }
  return 'other';
}
```


### **3.3 Display Duration Calculation**

Base formula: `displayDuration = 60,000 / WPM` (milliseconds per word)

**Example:** 300 WPM = 60,000 / 300 = 200ms per word

**Micro-Pauses (Natural Pacing):**

```
function calculateDisplayDuration(token, wpm, naturalPacingEnabled) {
  let baseTime = 60000 / wpm;  // Milliseconds per word
  
  if (!naturalPacingEnabled) {
    return baseTime;
  }
  
  // Add micro-pauses for punctuation
  if (token.match(/[.!?]$/)) {
    baseTime += 200;  // Long pause for sentence end
  } else if (token.match(/[;:]$/)) {
    baseTime += 150;  // Medium pause for semicolon/colon
  } else if (token.match(/,$/)) {
    baseTime += 50;   // Short pause for comma
  } else if (token.match(/—$/)) {
    baseTime += 100;  // Dash pause
  }
  
  // Add penalty for long words
  if (token.length >= 8 && token.length < 13) {
    baseTime += 50;
  } else if (token.length >= 13) {
    baseTime += 100;
  }
  
  return baseTime;
}
```


### **3.4 Token Stream Generation**

**Pseudocode:**

```
function generateTokenStream(extractedDoc, docId) {
  const allTokens = [];
  let globalWordIndex = 0;
  
  Object.entries(extractedDoc.pages).forEach(([pageNum, pageData]) => {
    pageData.lines.forEach((line, lineIndex) => {
      const lineTokens = tokenizeText(line.text);
      
      lineTokens.forEach((token, tokenIndex) => {
        const fullToken = {
          ...token,
          id: `${docId}-p${pageNum}-w${globalWordIndex}`,
          sourceRef: {
            pageNum: parseInt(pageNum),
            lineIndex,
            wordIndexOnLine: tokenIndex,
            wordIndexInPage: globalWordIndex,
            wordIndexInDoc: globalWordIndex
          }
        };
        
        // Calculate ORP components
        if (token.type === 'word') {
          fullToken.orpIndex = Math.floor(token.text.length * 0.37);
          fullToken.orpChar = token.text[fullToken.orpIndex];
          fullToken.leftPart = token.text.substring(0, fullToken.orpIndex);
          fullToken.rightPart = token.text.substring(fullToken.orpIndex + 1);
        }
        
        allTokens.push(fullToken);
        
        if (token.type === 'word') {
          globalWordIndex++;
        }
      });
    });
  });
  
  // Add context (previous/next words) to each token
  allTokens.forEach((token, index) => {
    token.context = {
      prevWords: allTokens.slice(Math.max(0, index - 2), index),
      nextWords: allTokens.slice(index + 1, Math.min(allTokens.length, index + 3))
    };
  });
  
  // Cache to database
  cacheTokenStream(docId, allTokens);
  
  return allTokens;
}
```


***

## **SECTION 4: RSVP ENGINE CORE**

### **4.1 State Management Architecture**

**Zustand Store Structure:**

```
RSVPStore {
  // Document state
  currentDocId: string | null
  currentPageNum: number
  totalTokens: number
  
  // Playback state
  state: 'IDLE' | 'RAMPING' | 'PLAYING_CONTINUOUS' | 'PLAYING_TEMPORARY' | 'PAUSED'
  currentTokenIndex: number
  currentToken: RSVPToken | null
  
  // Speed control
  targetWPM: number             // User-selected speed
  currentWPM: number            // Current speed during ramping
  
  // Ramping state
  rampStartTime: number | null
  rampDuration: number          // Milliseconds to ramp to target
  easingCurveType: 'linear' | 'easeOutQuad' | 'sigmoid' | 'custom'
  
  // Progress
  startedReadingAt: number      // Timestamp when started
  pausedAt: number | null       // Timestamp when paused
  
  // Settings
  naturalPacingEnabled: boolean
  minimumFontSize: number       // sp (scale-independent pixels)
  baseFontSize: number          // sp
  
  // UI state
  showPausePreview: boolean
  sidebarPosition: 'left' | 'right'
}
```

**Zustand Actions:**

```
Actions {
  // Initialization
  initializeRSVP(docId, startTokenIndex)
  
  // Playback control
  startPlayback()               // Begin continuous playback with ramping
  pausePlayback()               // Pause continuous playback
  resumePlayback()              // Resume from paused state
  startTemporaryPlayback()      // Start press-and-hold playback
  stopTemporaryPlayback()       // Stop press-and-hold playback
  
  // Navigation
  seekToToken(tokenIndex)       // Jump to specific token
  skipForward(count)            // Skip N words forward
  skipBackward(count)           // Skip N words backward
  
  // Speed control
  setTargetWPM(wpm)             // Change reading speed
  setEasingCurve(curveType)     // Change acceleration curve
  setRampDuration(ms)           // Change ramp duration
  
  // Settings
  toggleNaturalPacing()
  setBaseFontSize(size)
  setSidebarPosition(side)
  
  // Progress tracking
  saveProgress()                // Save to database
  completeDocument()            // Mark document as finished
  
  // Internal
  updateCurrentWPM(wpm)
  updateCurrentToken(token)
  updateState(newState)
}
```


### **4.2 RSVP Playback Loop**

**Core Loop Logic:**

```
Main Playback Loop {
  updateInterval = 16ms (for 60fps target)
  
  while (RSVP is playing) {
    // Step 1: Calculate current speed (apply easing if ramping)
    if (state === RAMPING) {
      elapsedTime = now - rampStartTime
      if (elapsedTime >= rampDuration) {
        state = PLAYING_CONTINUOUS
        currentWPM = targetWPM
      } else {
        progress = elapsedTime / rampDuration
        easedProgress = applyEasingCurve(progress, curveType)
        currentWPM = startWPM + (targetWPM - startWPM) * easedProgress
      }
    }
    
    // Step 2: Calculate display duration for current token
    displayDuration = calculateDisplayTime(currentToken, currentWPM)
    
    // Step 3: Check if time to advance token
    tokenElapsedTime = now - tokenStartTime
    if (tokenElapsedTime >= displayDuration) {
      // Advance to next token
      currentTokenIndex++
      currentToken = tokens[currentTokenIndex]
      tokenStartTime = now
      
      // Save progress periodically (every 10 words)
      if (currentTokenIndex % 10 === 0) {
        saveProgress()
      }
    }
    
    // Step 4: Render current token (ORP alignment)
    renderWord(currentToken, currentWPM, baseFontSize)
    
    // Step 5: Sleep until next frame
    sleep(updateInterval)
    
    // Step 6: Check for user interruptions
    if (pauseRequested || stopRequested) {
      break
    }
  }
}
```

**Pseudocode for Main RSVP Component:**

```
function useRSVPEngine() {
  const store = useRSVPStore();
  const tokens = useTokens();
  const [tokenStartTime, setTokenStartTime] = useState(null);
  const [frameTime, setFrameTime] = useState(Date.now());
  
  // Main animation loop using requestAnimationFrame
  useEffect(() => {
    let animationId;
    
    function updateFrame() {
      const now = Date.now();
      
      if (store.state === 'RAMPING' || store.state.includes('PLAYING')) {
        // Calculate current WPM if ramping
        if (store.state === 'RAMPING') {
          const elapsed = now - store.rampStartTime;
          if (elapsed >= store.rampDuration) {
            store.updateState('PLAYING_CONTINUOUS');
            store.updateCurrentWPM(store.targetWPM);
          } else {
            const progress = elapsed / store.rampDuration;
            const eased = applyEasing(progress, store.easingCurveType);
            const wpm = 0.6 * store.targetWPM + 
                       (store.targetWPM - 0.6 * store.targetWPM) * eased;
            store.updateCurrentWPM(wpm);
          }
        }
        
        // Check if time to display next token
        const displayTime = calculateDisplayTime(
          store.currentToken, 
          store.currentWPM
        );
        const elapsed = now - tokenStartTime;
        
        if (elapsed >= displayTime) {
          // Advance token
          store.currentTokenIndex++;
          store.updateCurrentToken(tokens[store.currentTokenIndex]);
          setTokenStartTime(now);
          
          // Save progress
          if (store.currentTokenIndex % 10 === 0) {
            store.saveProgress();
          }
        }
      }
      
      animationId = requestAnimationFrame(updateFrame);
    }
    
    if (store.state !== 'IDLE') {
      animationId = requestAnimationFrame(updateFrame);
    }
    
    return () => cancelAnimationFrame(animationId);
  }, [store.state, store.currentWPM, tokenStartTime]);
  
  return {
    currentToken: store.currentToken,
    currentWPM: store.currentWPM,
    state: store.state,
    currentTokenIndex: store.currentTokenIndex,
    totalTokens: tokens.length,
    progress: (store.currentTokenIndex / tokens.length) * 100
  };
}
```


### **4.3 Easing Curve Functions**

**Mathematical Definitions:**

**Linear:**

```
f(t) = t
where t ∈ [0, 1]
```

**Ease Out Quad (Recommended):**

```
f(t) = 1 - (1 - t)²
where t ∈ [0, 1]
Characteristics: Fast acceleration, gentle deceleration
```

**Ease In-Out Cubic:**

```
f(t) = t < 0.5 ? 4t³ : 1 - (-2t + 2)³/2
where t ∈ [0, 1]
Characteristics: Smooth S-curve, gradual start and end
```

**Sigmoid:**

```
f(t) = 1 / (1 + e^(-k(t - 0.5)))
where k = 10 (steepness parameter)
Characteristics: Biological-like curve, smooth throughout
```

**Implementation:**

```
function applyEasingCurve(progress, curveType) {
  // progress: value from 0 to 1
  // returns: eased value from 0 to 1
  
  switch (curveType) {
    case 'linear':
      return progress;
    
    case 'easeOutQuad':
      return 1 - (1 - progress) ** 2;
    
    case 'easeInOutCubic':
      if (progress < 0.5) {
        return 4 * progress ** 3;
      } else {
        return 1 - Math.pow(-2 * progress + 2, 3) / 2;
      }
    
    case 'sigmoid':
      const k = 10;
      return 1 / (1 + Math.exp(-k * (progress - 0.5)));
    
    default:
      return progress;
  }
}

// Calculate WPM at any point during ramping
function getCurrentWPMDuringRamp(
  startWPM, 
  targetWPM, 
  elapsedTime, 
  totalDuration, 
  easingCurve
) {
  if (elapsedTime >= totalDuration) {
    return targetWPM;
  }
  
  const progress = elapsedTime / totalDuration;
  const eased = applyEasingCurve(progress, easingCurve);
  
  return startWPM + (targetWPM - startWPM) * eased;
}
```


***

## **SECTION 5: WORD DISPLAY RENDERING**

### **5.1 ORP Alignment Algorithm**

**Principle:** Eyes recognize words fastest when fixating slightly left of center (around 35-40% into word).[^3]

**ORP Character Index Calculation:**

```
orpIndex = Math.floor(word.length * 0.37)

Examples:
- "hello" (5 chars): ORP at index 1 → 'e' → "h|ello"
- "elephant" (8 chars): ORP at index 2 → 'e' → "el|ephant"  
- "the" (3 chars): ORP at index 1 → 'h' → "t|he"
- "a" (1 char): ORP at index 0 → 'a' → "|a"
```


### **5.2 Three-Segment Layout**

**Structure:**

```
[Left Segment (45%)] | [ORP Marker] | [Right Segment (45%)]
  "el"               |      "e"      |      "phant"
  Right-aligned      |    Centered   |   Left-aligned
```

**Width Calculation:**

```
const screenWidth = Dimensions.get('window').width;
const padding = 16;  // dp on each side
const usableWidth = screenWidth - (padding * 2);

const leftSegmentWidth = usableWidth * 0.45;
const orpMarkerWidth = calculateTextWidth(orpChar, fontSize);
const rightSegmentWidth = usableWidth * 0.45;

// Center area available
const centerWidth = usableWidth - leftSegmentWidth - rightSegmentWidth;
```


### **5.3 Rendering Component Structure**

**Component Tree:**

```
<RSVPWordDisplay>
  ├── <ContainerView>
  │   ├── <LeftSegmentText>
  │   │   └── Text: word.leftPart
  │   ├── <ORPMarkerView>
  │   │   ├── <RedGuideLineView> (optional)
  │   │   └── <ORPCharText>
  │   │       └── Text: word.orpChar (red, bold)
  │   └── <RightSegmentText>
  │       └── Text: word.rightPart
  │
  └── <MetricsDisplay> (debug only)
      ├── Current token: word.text
      ├── Index: currentTokenIndex / totalTokens
      └── Time remaining: estimatedTime
```


### **5.4 Font Size Management**

**Auto-Shrink Algorithm:**

```
function calculateFontSizeForWord(word, baseFontSize, screenWidth) {
  const maxWidth = screenWidth * 0.85;  // Leave 15% margin
  
  // Measure text at base size
  const baseMetrics = measureText(word, baseFontSize);
  
  if (baseMetrics.width <= maxWidth) {
    return baseFontSize;  // Fits at base size
  }
  
  // Need to shrink
  const shrinkFactor = maxWidth / baseMetrics.width;
  const appliedSize = baseFontSize * shrinkFactor;
  const minimumSize = 24;  // Never go below this
  
  return Math.max(appliedSize, minimumSize);
}

// Measure text width helper
function measureText(text, fontSize) {
  // Native implementation per platform
  // iOS: CTFont measurement
  // Android: Paint.getTextBounds()
  
  return {
    width: number,
    height: number,
    ascender: number,
    descender: number
  };
}
```

**Implementation Note:** Text must NEVER wrap. If word is still too wide at minimum font size (24sp), display truncated with ellipsis and show full word in pause preview.

### **5.5 Rendering Performance Optimization**

**Memoization Strategy:**

```
- Memoize ORP calculation: word → (orpIndex, orpChar, leftPart, rightPart)
- Memoize font size calculation per word
- Use useCallback for rendering functions
- Cache measureText results per word/fontSize combination
- Update only changed parts (current word, not full tree)
```

**Frame Budget:**

- Target: 16ms per frame (60fps)
- Component render: <3ms
- Text measurement: <2ms
- Layout calculation: <3ms
- Reanimated animation: <5ms
- Remaining: <3ms buffer

***

## **SECTION 6: PLAYBACK STATE MACHINE**

### **6.1 State Diagram**

```
                    ┌─────────────┐
                    │    IDLE     │
                    └─────┬───────┘
                          │
                 (User taps play / press)
                          │
                    ┌─────▼───────┐
                    │   RAMPING   │ ◄──────────┐
                    └─────┬───────┘            │
                          │                    │
              (Ramp duration expires)     (User taps play)
                          │                    │
                    ┌─────▼──────────────┐     │
                    │ PLAYING_CONTINUOUS ├─────┘
                    └─────┬──────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
      (Tap play)   (Hold release)   (Doc end)
          │               │               │
    ┌─────▼─────┐   ┌─────▼─────┐   ┌────▼─────┐
    │  PAUSED   │   │   IDLE    │   │COMPLETED │
    └─┬────┬────┘   └───────────┘   └──────────┘
      │    │
(Resume)(Skip to)
      │    │
      │    └────────────────┐
      │                     │
    ┌─▼─────────────────────▼──┐
    │      PLAYING_TEMPORARY    │ ◄──────────┐
    │  (Press-and-hold mode)    │            │
    └─┬──────────────────────┬──┘            │
      │                      │               │
  (Release)          (Release & hold again)──┘
      │                      │
      └──────┬───────────────┘
             │
        ┌────▼────┐
        │  IDLE   │
        └─────────┘

Note: PLAYING_TEMPORARY independent from PLAYING_CONTINUOUS
Both can transition to IDLE but not to each other directly
```


### **6.2 State Transition Logic**

**IDLE → RAMPING:**

- Trigger: `startPlayback()` action
- Setup:
    - `rampStartTime = now`
    - `startWPM = targetWPM * 0.6`
    - Load token stream if not loaded
    - Clear `tokenStartTime` to start immediately

**RAMPING → PLAYING_CONTINUOUS:**

- Trigger: `rampDuration` elapsed
- Condition: `(now - rampStartTime) >= rampDuration`
- Action: Update state, set `currentWPM = targetWPM`

**PLAYING_CONTINUOUS → PAUSED:**

- Trigger: User taps play button again
- Action:
    - Save `pausedAt = now`
    - Store current position in database
    - Clear animation frame loop

**PAUSED → RAMPING:**

- Trigger: User taps play button (resume)
- Action:
    - Restart ramp (don't jump to target WPM)
    - `rampStartTime = now`
    - Resume from stored token position

**IDLE ↔ PLAYING_TEMPORARY:**

- Trigger:
    - Enter: `startTemporaryPlayback()` (press)
    - Exit: `stopTemporaryPlayback()` (release)
- Behavior:
    - Independent from continuous playback state
    - Doesn't save position (temporary interaction)
    - Stops immediately (<50ms response time)

**Any State → IDLE:**

- Trigger: User closes RSVP overlay, document complete, or error
- Action:
    - Cancel animation frame
    - Save final progress
    - Clear state

***

## **SECTION 7: PROGRESS TRACKING \& PERSISTENCE**

### **7.1 Progress Data Structure**

**Database Schema:**

```sql
CREATE TABLE reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id TEXT NOT NULL UNIQUE,
  current_token_index INTEGER NOT NULL,      -- Global word index
  current_page_num INTEGER,                   -- PDF page
  snippet TEXT,                               -- Last 5 words (context)
  total_words_read INTEGER,
  session_start_time INTEGER,                 -- Unix timestamp
  last_update_time INTEGER,
  estimated_time_remaining INTEGER,           -- Milliseconds
  comprehension_score REAL DEFAULT 0.0,       -- Optional: 0-100
  
  FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_progress_doc_id ON reading_progress(doc_id);
CREATE INDEX idx_progress_updated ON reading_progress(last_update_time DESC);
```


### **7.2 Progress Save Logic**

**Frequent Saves (Debounced):**

```
Save Strategy:
- Save every 10 words during playback (debounced)
- Save on every pause
- Save on app background
- Save on RSVP mode exit
- Save on document completion

Debouncing:
- Collect progress updates for 5 seconds
- Write to database only once
- Prevents excessive I/O
```

**Pseudocode:**

```
function trackProgress() {
  let lastSaveIndex = 0;
  let saveDebounceTimer = null;
  
  function debouncedSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      saveProgressToDB({
        docId: store.currentDocId,
        tokenIndex: store.currentTokenIndex,
        pageNum: store.currentPageNum,
        snippet: getContextSnippet(store.currentTokenIndex, 5),
        totalWordsRead: store.currentTokenIndex - store.startTokenIndex,
        lastUpdateTime: Date.now(),
        timeRemaining: estimateTimeRemaining()
      });
    }, 5000);  // 5 second debounce
  }
  
  // On token advance
  useEffect(() => {
    if (store.currentTokenIndex - lastSaveIndex >= 10) {
      debouncedSave();
      lastSaveIndex = store.currentTokenIndex;
    }
  }, [store.currentTokenIndex]);
  
  // On pause
  useEffect(() => {
    if (store.state === 'PAUSED') {
      saveProgressToDB(...);  // Immediate save, not debounced
    }
  }, [store.state]);
}
```


### **7.3 Resume from Saved Position**

**Resume Algorithm:**

```
function resumeDocument(docId) {
  // Step 1: Load saved progress
  const progress = loadProgressFromDB(docId);
  
  // Step 2: Validate progress
  if (!progress || progress.token_index >= totalTokens) {
    // Invalid or out-of-range, start from beginning
    return startFromToken(0);
  }
  
  // Step 3: Load token stream
  const tokenStream = loadTokenStream(docId);
  
  // Step 4: Seek to saved position
  const resumeToken = tokenStream[progress.token_index];
  
  // Step 5: Display context
  showResumeContextBanner(progress.snippet, progress.token_index);
  
  // Step 6: Initialize state
  store.initializeRSVP(docId, progress.token_index);
  
  // Step 7: (Optional) Auto-start RSVP
  if (userSettings.autoResumeRSVP) {
    store.startPlayback();
  } else {
    // Wait for user to tap play
    showReadyMessage("Ready to continue reading. Tap play.");
  }
}
```


### **7.4 Time Remaining Estimation**

**Formula:**

```
remainingTokens = totalTokens - currentTokenIndex
averageDisplayTime = 60000 / currentWPM  // milliseconds

estimatedTimeMs = remainingTokens * averageDisplayTime

// Convert to readable format
if (estimatedTimeMs < 60000) {
  return Math.ceil(estimatedTimeMs / 1000) + " seconds";
} else if (estimatedTimeMs < 3600000) {
  return Math.ceil(estimatedTimeMs / 60000) + " min";
} else {
  return (Math.ceil(estimatedTimeMs / 3600000 * 10) / 10) + " hours";
}

Example:
- 500 remaining tokens
- 300 WPM = 200ms per token
- 500 * 200 = 100,000 ms = 1.67 minutes = "~2 min"
```


***

## **SECTION 8: EDGE CASES \& ERROR HANDLING**

### **8.1 Long Word Handling**

**Problem:** Words like "antidisestablishmentarianism" don't fit on screen.

**Solutions (in priority order):**

1. **Shrink Font:** Apply auto-shrink algorithm to 24sp minimum
2. **Horizontal Scroll:** If word still too wide, allow single-line scroll
3. **Truncate:** Show "antidisestablishment..." + full word in pause preview
4. **Fallback:** Replace with placeholder "[LONG_WORD]" (last resort)

**Implementation:**

```
function handleLongWord(word, baseFontSize, screenWidth) {
  // Try shrinking
  const shrunkenSize = calculateFontSizeForWord(word, baseFontSize, screenWidth);
  
  if (shrunkenSize >= 24) {
    // Shrinking works
    return { fontSize: shrunkenSize, text: word, truncated: false };
  }
  
  // Shrinking not enough, try horizontal scroll
  const maxDisplayLength = Math.floor(screenWidth / 4);  // Rough estimate
  if (word.length > maxDisplayLength) {
    // Truncate
    return { 
      fontSize: 24, 
      text: word.substring(0, maxDisplayLength) + "...",
      truncated: true,
      fullText: word
    };
  }
  
  // Display at minimum size
  return { fontSize: 24, text: word, truncated: false };
}
```


### **8.2 Punctuation-Only Tokens**

**Problem:** Tokens like "," or "!" shouldn't display with ORP alignment.

**Solution:**

```
function shouldApplyORP(token) {
  // Only apply ORP to actual words
  return token.type === 'word' && token.text.length > 1;
}

function displayToken(token) {
  if (shouldApplyORP(token)) {
    // Apply ORP alignment (3 segments)
    return <ORPAlignedWord token={token} />;
  } else {
    // Center-align punctuation/single chars
    return <CenteredWord token={token} />;
  }
}
```


### **8.3 Timing Accuracy**

**Problem:** `setTimeout` has ±15ms variance, causing audible/visible jitter in RSVP.[^3]

**Solution: High-Resolution Timing with `requestAnimationFrame`**

```
function useAccurateRSVPTimer() {
  const frameTimeRef = useRef(Date.now());
  const tokenStartTimeRef = useRef(Date.now());
  
  useEffect(() => {
    let animationId;
    
    function frame(timestamp) {
      // timestamp from requestAnimationFrame is high-resolution (microseconds)
      const frameDelta = timestamp - frameTimeRef.current;
      const tokenElapsed = timestamp - tokenStartTimeRef.current;
      
      const expectedDisplayTime = calculateDisplayTime(
        currentToken, 
        currentWPM
      );
      
      // Allow ±10ms tolerance before advancing
      if (tokenElapsed >= (expectedDisplayTime - 10)) {
        // Advance to next token
        advanceToken();
        tokenStartTimeRef.current = timestamp;
      }
      
      frameTimeRef.current = timestamp;
      animationId = requestAnimationFrame(frame);
    }
    
    animationId = requestAnimationFrame(frame);
    
    return () => cancelAnimationFrame(animationId);
  }, []);
}
```


### **8.4 Memory Leak Prevention**

**Critical Points:**

1. **Animation Frame Cleanup:**
    - Always cancel `requestAnimationFrame` on unmount
    - Store `animationId` in ref
2. **Token Stream Management:**
    - Don't hold entire document in memory
    - Implement windowing: Load current ± 1000 tokens only
    - Release previous tokens as you progress
3. **Timer/Interval Cleanup:**
    - Clear any `setTimeout` / `setInterval` on unmount
    - Clear debounce timers

**Implementation Pattern:**

```
function useRSVPEngine() {
  const animationIdRef = useRef(null);
  const debounceTimerRef = useRef(null);
  
  useEffect(() => {
    // Setup
    function animate() {
      // ... animation code
      animationIdRef.current = requestAnimationFrame(animate);
    }
    animationIdRef.current = requestAnimationFrame(animate);
    
    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
}
```


### **8.5 PDF Parsing Errors**

**Common Failures:**

1. **Corrupted PDF:** pdf.js throws error, can't parse
    - Handling: Show error message "PDF is corrupted"
    - Fallback: Disable RSVP, allow page-only viewing
2. **Text Not Extractable:** Scanned PDFs (image-only)
    - Detection: Extract 0 words
    - Handling: Show banner "No text found in this PDF"
    - Fallback: Suggest OCR (optional future feature)
3. **Encoding Issues:** Non-ASCII characters garbled
    - Handling: Attempt UTF-8 decoding, show warning if corrupted
    - Fallback: Render as-is (may be unreadable)

**Implementation:**

```
async function extractTextWithErrorHandling(pdfUri) {
  try {
    const extracted = await extractTextFromPDF(pdfUri);
    
    // Validate
    if (!extracted || extracted.pages.length === 0) {
      throw new Error('No pages extracted');
    }
    
    const totalWords = sumWordsAcrossPages(extracted);
    if (totalWords === 0) {
      throw new Error('No text found (possibly scanned PDF)');
    }
    
    return extracted;
    
  } catch (error) {
    if (error.message.includes('corrupted')) {
      showError('Unable to read this PDF. It may be corrupted.');
      disableRSVPMode();
    } else if (error.message.includes('No text')) {
      showWarning('This PDF contains no readable text.');
      disableRSVPMode();
      suggestOCR();
    } else {
      showError('Unknown error: ' + error.message);
    }
    return null;
  }
}
```


***

## **SECTION 9: PERFORMANCE BENCHMARKS \& TARGETS**

### **9.1 Text Extraction Performance**

| Document Type | Page Count | Extract Time | Target |
| :-- | :-- | :-- | :-- |
| Simple novel | 20 | 2 seconds | <5s |
| Academic paper (2-column) | 20 | 3 seconds | <5s |
| Complex layout | 20 | 4 seconds | <5s |
| Large document | 200 | 15 seconds | <30s |

**Optimization Points:**

- Cache extracted text (avoid re-extraction)
- Progressive extraction (extract visible pages first)
- Background thread for large documents


### **9.2 Rendering Performance**

| Metric | Target | Measurement Method |
| :-- | :-- | :-- |
| Frame rate | 60 fps constant | React DevTools Profiler |
| Timing accuracy | ±10ms | Compare expected vs actual display duration |
| Word render latency | <3ms | Frame time breakdown |
| Memory (1000+ words) | <150MB | React Native debugger memory profiler |
| Memory growth (100k tokens) | Stable after 1000 tokens | Monitor over 30-minute session |

### **9.3 Battery Impact**

| Test | Duration | Target Drain |
| :-- | :-- | :-- |
| RSVP playback (300 WPM) | 30 minutes | <10% battery |
| RSVP playback (600 WPM) | 30 minutes | <12% battery |
| Idle reader view | 30 minutes | <2% battery |

**Optimization Strategies:**

- Release wake lock when paused
- Throttle progress saves
- Use `useCallback` to reduce re-renders
- Implement view pooling (reuse token display views)

***

## **SECTION 10: DATABASE INTEGRATION**

### **10.1 Extracted Text Caching**

**Why Cache?** Text extraction takes 2-5 seconds. Caching allows instant RSVP startup on subsequent opens.

**Cache Schema:**

```sql
CREATE TABLE extracted_text_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doc_id TEXT NOT NULL UNIQUE,
  token_stream TEXT NOT NULL,        -- JSON array of all tokens
  total_tokens INTEGER,
  total_pages INTEGER,
  cache_date INTEGER,                -- Unix timestamp
  file_hash TEXT,                    -- MD5 of PDF file
  
  FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE
);
```

**Cache Validation:**

```
On RSVP startup:
1. Check if cache exists for doc_id
2. If exists, compare file_hash:
   - If hash matches: Use cached tokens
   - If hash differs: Re-extract (file was modified)
3. If not in cache: Extract, generate, save to cache

Cache expiry:
- Automatic: 30 days
- Manual: On "Refresh Cache" button
```


### **10.2 Progress Synchronization**

**When to Save:**

1. Every 10 words (debounced 5 seconds)
2. On pause/resume
3. On app background
4. On RSVP overlay close
5. On document completion

**Data Saved:**

```
{
  docId: string,
  currentTokenIndex: number,
  currentPage: number,
  snippet: string,  // Last 3-5 words
  totalWordsRead: number,
  lastUpdateTime: number,
  sessionDuration: number
}
```


### **10.3 Database Operations**

**Pseudocode:**

```
// Save extracted tokens
async function cacheTokens(docId, tokens) {
  const tokenJson = JSON.stringify(tokens);
  const fileHash = md5(pdfFileContent);
  
  await db.run(`
    INSERT OR REPLACE INTO extracted_text_cache
    (doc_id, token_stream, total_tokens, total_pages, cache_date, file_hash)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [docId, tokenJson, tokens.length, pageCount, Date.now(), fileHash]);
}

// Load cached tokens
async function loadCachedTokens(docId) {
  const row = await db.executeSql(`
    SELECT token_stream, file_hash FROM extracted_text_cache
    WHERE doc_id = ?
  `, [docId]);
  
  if (!row.length) return null;
  
  const { token_stream, file_hash } = row[^0];
  const currentHash = calculateFileHash(pdfUri);
  
  // Validate hash
  if (currentHash !== file_hash) {
    // File was modified, clear cache
    await db.run(`DELETE FROM extracted_text_cache WHERE doc_id = ?`, [docId]);
    return null;
  }
  
  return JSON.parse(token_stream);
}

// Save reading progress
async function saveReadingProgress(progress) {
  await db.run(`
    INSERT OR REPLACE INTO reading_progress
    (doc_id, current_token_index, current_page_num, snippet, 
     total_words_read, last_update_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    progress.docId,
    progress.currentTokenIndex,
    progress.currentPage,
    progress.snippet,
    progress.totalWordsRead,
    Date.now()
  ]);
}

// Load reading progress
async function loadReadingProgress(docId) {
  const row = await db.executeSql(`
    SELECT * FROM reading_progress WHERE doc_id = ?
  `, [docId]);
  
  return row.length ? row[^0] : null;
}
```


***

## **SECTION 11: TESTING STRATEGY (RSVP-SPECIFIC)**

### **11.1 Unit Tests**

**Text Extraction:**

- Test tokenization with 30+ edge cases (contractions, numbers, punctuation)
- Test multi-column detection
- Test ORP index calculation (verify formula)

**Timing:**

- Test display duration calculation (verify formula for different WPM)
- Test easing curves (verify monotonic increase, reach target)
- Test micro-pause logic

**State Machine:**

- Test all transitions (IDLE → RAMPING → PLAYING, etc.)
- Test edge cases (pause at end of document)


### **11.2 Integration Tests**

**Full Pipeline:**

1. Load PDF
2. Extract text
3. Generate tokens
4. Initialize RSVP
5. Play for 100 words
6. Pause
7. Save progress
8. Load progress
9. Resume

**Timing Accuracy:**

- Play 1000 words at 300 WPM, measure actual duration
- Compare expected (≈200 seconds) vs actual
- Target: ±5% accuracy


### **11.3 Performance Tests**

**Extraction:**

- 20-page PDF: Should extract in <5 seconds
- 200-page PDF: Should extract in <30 seconds

**Rendering:**

- 1000-word stream: Maintain 60fps throughout
- Memory growth: Should plateau after 1000 words
- No memory leaks over 30-minute session


### **11.4 Manual Testing Checklist**

- [ ] RSVP starts smoothly with ramping
- [ ] Speed changes apply correctly
- [ ] Press-and-hold stops immediately (<50ms)
- [ ] Pause preview shows correct context words
- [ ] Long words shrink without wrapping
- [ ] Punctuation displays without ORP splitting
- [ ] Images/complex content handled gracefully
- [ ] Progress saves on pause
- [ ] Resume from database loads correct position
- [ ] No visual jitter or timing hiccups
- [ ] App doesn't crash on corrupted PDF
- [ ] Memory usage stable over extended session

***

## **SECTION 12: IMPLEMENTATION ROADMAP (PHASED)**

### **Milestone 1: Core RSVP Engine (Week 1-2)**

**Deliverables:**

- Text extraction from simple PDF ✓
- Basic tokenization ✓
- Zustand state management ✓
- Word display component with ORP ✓
- Play/pause toggle ✓
- WPM adjustment ✓

**Acceptance Criteria:**

- 60fps rendering
- ±10ms timing accuracy
- Resume within ±5 words


### **Milestone 2: Advanced Controls \& Ramping (Week 3)**

**Deliverables:**

- Speed ramping engine ✓
- Easing curve system ✓
- Press-and-hold mode ✓
- Natural pacing (micro-pauses) ✓
- Progress tracking ✓

**Acceptance Criteria:**

- Ramping feels natural (user testing)
- Press-and-hold <50ms response
- Micro-pauses enhance reading rhythm


### **Milestone 3: Robustness \& Edge Cases (Week 4)**

**Deliverables:**

- Multi-column PDF support ✓
- Long word handling ✓
- Error handling ✓
- Cache/persistence ✓
- Memory leak prevention ✓

**Acceptance Criteria:**

- Handles 90% of PDF variations
- No memory leaks in 30-minute session
- Graceful error messages


### **Milestone 4: Polish \& Performance (Week 5)**

**Deliverables:**

- UI/animation polish ✓
- Performance optimization ✓
- Accessibility compliance ✓
- Documentation ✓

**Acceptance Criteria:**

- <150MB memory usage
- <10% battery drain (30 min)
- WCAG 2.1 AA compliance

***

## **FINAL SUMMARY**

This implementation specification provides the complete technical blueprint for building the **RSVP Engine for PDF Reading** without providing actual code modules. Every algorithm, data structure, and design decision is documented with:

1. **Mathematical Definitions** (ORP alignment, easing curves, timing)
2. **Pseudocode Examples** (Readable implementation guidance)
3. **Data Structure Specifications** (Database schema, token format)
4. **Algorithm Descriptions** (Text extraction, tokenization, playback loop)
5. **Edge Case Handling** (Long words, corrupted files, timing accuracy)
6. **Performance Benchmarks** (Targets and measurement methods)

**Ready for Implementation:** A developer using this specification should be able to build a production-quality RSVP engine for PDF files with:

- ±10ms timing accuracy
- 60fps rendering
- <150MB memory footprint
- <10% battery drain per 30 minutes
- Support for complex PDF layouts

---
<span style="display:none">[^10][^4][^5][^6][^7][^8][^9]</span>

<div align="center">⁂</div>

[^1]: https://stackoverflow.com/questions/75104923/react-pdf-displaying-text-found-inside-the-pdf-instead-of-the-pdf-itself

[^2]: https://github.com/wojtekmaj/react-pdf/discussions/1691

[^3]: https://www.youtube.com/watch?v=oxusMT8L8wY

[^4]: https://www.nutrient.io/guides/react-native/measurements/

[^5]: https://www.reddit.com/r/reactnative/comments/1ha211l/how_can_i_extract_or_read_text_from_a_pdf_i_spent/

[^6]: https://www.snowtide.com/performance

[^7]: http://dspace.mit.edu/bitstream/handle/1721.1/113457/1020180532-MIT.pdf?sequence=1

[^8]: https://strapi.io/blog/7-best-javascript-pdf-parsing-libraries-nodejs-2025

[^9]: https://users.soe.ucsc.edu/~sbrandt/courses/Winter00/290S/rsvp.pdf

[^10]: https://optimization-online.org/wp-content/uploads/2019/03/7140.pdf

