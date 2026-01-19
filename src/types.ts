// RSVP Engine Types

/**
 * Playback state machine states
 */
export type RSVPState =
    | 'IDLE'
    | 'RAMPING'
    | 'PLAYING_CONTINUOUS'
    | 'PLAYING_TEMPORARY'
    | 'PAUSED';

/**
 * Easing curve types for speed ramping
 */
export type EasingCurve =
    | 'linear'
    | 'easeOutQuad'
    | 'easeInOutCubic'
    | 'sigmoid';

/**
 * Token classification
 */
export type TokenType = 'word' | 'punctuation' | 'number' | 'whitespace' | 'break' | 'other';

/**
 * Source reference for resume capability
 */
export interface SourceRef {
    pageNum: number;
    lineIndex: number;
    wordIndexOnLine: number;
    wordIndexInPage: number;
    wordIndexInDoc: number;
}

/**
 * RSVP Token - a displayable unit
 */
export interface RSVPToken {
    id: string;
    text: string;
    type: TokenType;
    sourceRef: SourceRef;
    displayDuration: number;

    // ORP (Optimal Recognition Point) data
    orpIndex: number;
    orpChar: string;
    leftPart: string;
    rightPart: string;
}

/**
 * Token with context for pause preview
 */
export interface RSVPTokenWithContext extends RSVPToken {
    context: {
        prevWords: RSVPToken[];
        nextWords: RSVPToken[];
    };
}

/**
 * Raw text item from pdf.js extraction
 */
export interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    fontSize: number;
    transform: number[];
}

/**
 * Extracted line from PDF
 */
export interface ExtractedLine {
    pageNum: number;
    lineIndex: number;
    text: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    items: TextItem[];
    columnIndex: number;
}

/**
 * Extracted page data
 */
export interface ExtractedPage {
    text: string;
    lines: ExtractedLine[];
    columns: number;
    height: number;
    width: number;
}

/**
 * Complete extracted document
 */
export interface ExtractedDocument {
    fileName: string;
    totalPages: number;
    pages: { [pageNum: number]: ExtractedPage };
}

/**
 * RSVP Settings (user preferences)
 */
export interface RSVPSettings {
    targetWPM: number;
    naturalPacingEnabled: boolean;
    baseFontSize: number;
    minimumFontSize: number;
    rampDuration: number;
    easingCurveType: EasingCurve;
    sidebarPosition: 'left' | 'right';
}

/**
 * Reading progress for persistence
 */
export interface ReadingProgress {
    docId: string;
    currentTokenIndex: number;
    currentPageNum: number;
    snippet: string;
    totalWordsRead: number;
    sessionStartTime: number;
    lastUpdateTime: number;
    estimatedTimeRemaining: number;
}

/**
 * Cached token stream
 */
export interface CachedTokens {
    docId: string;
    tokens: RSVPToken[];
    totalTokens: number;
    totalPages: number;
    cacheDate: number;
    fileHash: string;
}

/**
 * RSVP Store State
 */
export interface RSVPStoreState {
    // Document state
    currentDocId: string | null;
    currentPageNum: number;
    totalTokens: number;
    tokens: RSVPToken[];

    // Playback state
    state: RSVPState;
    currentTokenIndex: number;
    currentToken: RSVPToken | null;

    // Speed control
    targetWPM: number;
    currentWPM: number;

    // Ramping state
    rampStartTime: number | null;
    rampDuration: number;
    easingCurveType: EasingCurve;

    // Progress
    startedReadingAt: number | null;
    pausedAt: number | null;

    // Settings
    naturalPacingEnabled: boolean;
    minimumFontSize: number;
    baseFontSize: number;
    commaPauseMs: number;
    periodPauseMs: number;

    // UI state
    showPausePreview: boolean;
    isExtracting: boolean;
    extractionProgress: number;
    error: string | null;
}

/**
 * RSVP Store Actions
 */
export interface RSVPStoreActions {
    // Initialization
    initializeRSVP: (docId: string, tokens: RSVPToken[], startTokenIndex?: number) => void;
    reset: () => void;

    // Playback control
    startPlayback: () => void;
    pausePlayback: () => void;
    resumePlayback: () => void;
    startTemporaryPlayback: () => void;
    stopTemporaryPlayback: () => void;

    // Navigation
    seekToToken: (tokenIndex: number) => void;
    skipForward: (count: number) => void;
    skipBackward: (count: number) => void;
    advanceToken: () => void;

    // Speed control
    setTargetWPM: (wpm: number) => void;
    setCurrentWPM: (wpm: number) => void;
    setEasingCurve: (curveType: EasingCurve) => void;
    setRampDuration: (ms: number) => void;

    // Settings
    toggleNaturalPacing: () => void;
    setBaseFontSize: (size: number) => void;
    setCommaPauseMs: (ms: number) => void;
    setPeriodPauseMs: (ms: number) => void;

    // State updates
    updateState: (newState: RSVPState) => void;
    setExtracting: (isExtracting: boolean, progress?: number) => void;
    setError: (error: string | null) => void;

    // Computed
    getProgress: () => number;
    getTimeRemaining: () => string;
}

export type RSVPStore = RSVPStoreState & RSVPStoreActions;
