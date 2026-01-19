import { create } from 'zustand';
import {
    EasingCurve,
    RSVPState,
    RSVPStore,
    RSVPStoreState,
    RSVPToken,
} from '../types';

/**
 * Default RSVP settings
 */
const DEFAULT_STATE: RSVPStoreState = {
    // Document state
    currentDocId: null,
    currentPageNum: 1,
    totalTokens: 0,
    tokens: [],

    // Playback state
    state: 'IDLE',
    currentTokenIndex: 0,
    currentToken: null,

    // Speed control
    targetWPM: 300,
    currentWPM: 180, // 60% of target for ramp start

    // Ramping state
    rampStartTime: null,
    rampDuration: 2000, // 2 seconds to ramp to target
    easingCurveType: 'easeOutQuad',

    // Progress
    startedReadingAt: null,
    pausedAt: null,

    // Settings
    naturalPacingEnabled: true,
    minimumFontSize: 24,
    baseFontSize: 48,
    commaPauseMs: 50,
    periodPauseMs: 200,

    // UI state
    showPausePreview: true,
    isExtracting: false,
    extractionProgress: 0,
    error: null,
};

/**
 * RSVP Zustand Store
 * Manages all RSVP playback state and actions
 */
export const useRSVPStore = create<RSVPStore>((set, get) => ({
    ...DEFAULT_STATE,

    // === Initialization ===

    initializeRSVP: (docId: string, tokens: RSVPToken[], startTokenIndex = 0) => {
        const startToken = tokens[startTokenIndex] || null;
        set({
            currentDocId: docId,
            tokens,
            totalTokens: tokens.length,
            currentTokenIndex: startTokenIndex,
            currentToken: startToken,
            currentPageNum: startToken?.sourceRef.pageNum || 1,
            state: 'IDLE',
            error: null,
            isExtracting: false,
        });
    },

    reset: () => {
        set(DEFAULT_STATE);
    },

    // === Playback Control ===

    startPlayback: () => {
        const { tokens, currentTokenIndex, targetWPM } = get();
        if (tokens.length === 0) return;

        set({
            state: 'RAMPING',
            rampStartTime: Date.now(),
            currentWPM: targetWPM * 0.6, // Start at 60% of target
            startedReadingAt: get().startedReadingAt || Date.now(),
            pausedAt: null,
            currentToken: tokens[currentTokenIndex],
        });
    },

    pausePlayback: () => {
        set({
            state: 'PAUSED',
            pausedAt: Date.now(),
        });
    },

    resumePlayback: () => {
        const { targetWPM } = get();
        set({
            state: 'RAMPING',
            rampStartTime: Date.now(),
            currentWPM: targetWPM * 0.6,
            pausedAt: null,
        });
    },

    startTemporaryPlayback: () => {
        const { tokens, currentTokenIndex, targetWPM } = get();
        if (tokens.length === 0) return;

        set({
            state: 'PLAYING_TEMPORARY',
            currentWPM: targetWPM * 0.7, // Slightly slower for temporary
            currentToken: tokens[currentTokenIndex],
        });
    },

    stopTemporaryPlayback: () => {
        set({
            state: 'IDLE',
        });
    },

    // === Navigation ===

    seekToToken: (tokenIndex: number) => {
        const { tokens } = get();
        const clampedIndex = Math.max(0, Math.min(tokenIndex, tokens.length - 1));
        const token = tokens[clampedIndex];

        set({
            currentTokenIndex: clampedIndex,
            currentToken: token,
            currentPageNum: token?.sourceRef.pageNum || 1,
        });
    },

    skipForward: (count: number) => {
        const { currentTokenIndex, tokens } = get();
        const newIndex = Math.min(currentTokenIndex + count, tokens.length - 1);
        get().seekToToken(newIndex);
    },

    skipBackward: (count: number) => {
        const { currentTokenIndex } = get();
        const newIndex = Math.max(currentTokenIndex - count, 0);
        get().seekToToken(newIndex);
    },

    advanceToken: () => {
        const { currentTokenIndex, tokens, state } = get();
        const nextIndex = currentTokenIndex + 1;

        if (nextIndex >= tokens.length) {
            // End of document
            set({
                state: 'IDLE',
                currentTokenIndex: tokens.length - 1,
                currentToken: tokens[tokens.length - 1],
            });
            return;
        }

        const nextToken = tokens[nextIndex];
        set({
            currentTokenIndex: nextIndex,
            currentToken: nextToken,
            currentPageNum: nextToken?.sourceRef.pageNum || get().currentPageNum,
        });
    },

    // === Speed Control ===

    setTargetWPM: (wpm: number) => {
        const clampedWPM = Math.max(100, Math.min(1000, wpm));
        set({ targetWPM: clampedWPM });
    },

    setCurrentWPM: (wpm: number) => {
        set({ currentWPM: wpm });
    },

    setEasingCurve: (curveType: EasingCurve) => {
        set({ easingCurveType: curveType });
    },

    setRampDuration: (ms: number) => {
        set({ rampDuration: Math.max(500, Math.min(5000, ms)) });
    },

    // === Settings ===

    toggleNaturalPacing: () => {
        set((state) => ({ naturalPacingEnabled: !state.naturalPacingEnabled }));
    },

    setBaseFontSize: (size: number) => {
        set({ baseFontSize: Math.max(24, Math.min(72, size)) });
    },

    setCommaPauseMs: (ms: number) => {
        set({ commaPauseMs: Math.max(0, Math.min(500, ms)) });
    },

    setPeriodPauseMs: (ms: number) => {
        set({ periodPauseMs: Math.max(0, Math.min(1000, ms)) });
    },

    // === State Updates ===

    updateState: (newState: RSVPState) => {
        set({ state: newState });
    },

    setExtracting: (isExtracting: boolean, progress = 0) => {
        set({ isExtracting, extractionProgress: progress });
    },

    setError: (error: string | null) => {
        set({ error, isExtracting: false });
    },

    // === Computed ===

    getProgress: () => {
        const { currentTokenIndex, totalTokens } = get();
        if (totalTokens === 0) return 0;
        return (currentTokenIndex / totalTokens) * 100;
    },

    getTimeRemaining: () => {
        const { currentTokenIndex, totalTokens, currentWPM } = get();
        const remainingTokens = totalTokens - currentTokenIndex;
        const msPerWord = 60000 / currentWPM;
        const estimatedTimeMs = remainingTokens * msPerWord;

        if (estimatedTimeMs < 60000) {
            return `${Math.ceil(estimatedTimeMs / 1000)}s`;
        } else if (estimatedTimeMs < 3600000) {
            return `${Math.ceil(estimatedTimeMs / 60000)} min`;
        } else {
            return `${(Math.ceil((estimatedTimeMs / 3600000) * 10) / 10)} hrs`;
        }
    },
}));
