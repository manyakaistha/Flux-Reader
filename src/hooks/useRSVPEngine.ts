import { useCallback, useEffect, useRef } from 'react';
import { useRSVPStore } from '../store/rsvpStore';
import { getCurrentWPMDuringRamp, isRampingComplete } from '../utils/easing';
import { calculateDisplayDuration } from '../utils/timing';

/**
 * RSVP Engine Hook - v3 Complete Rewrite
 * 
 * Key fixes:
 * 1. Uses Zustand selector for explicit state subscription
 * 2. Uses a ref-based tick function to avoid closure issues
 * 3. Interval-based timing for React Native reliability
 */

// Tick interval in milliseconds (~60fps equivalent)
const TICK_INTERVAL_MS = 16;

// Debug mode - set to true to see logs
const DEBUG = true;

function log(...args: unknown[]) {
    if (DEBUG) {
        console.log('[RSVP Engine]', ...args);
    }
}

export function useRSVPEngine() {
    // === Refs for stable timing ===
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tokenStartTimeRef = useRef<number>(Date.now());
    const isLoopRunningRef = useRef<boolean>(false);

    // === Explicit Zustand subscriptions using selectors ===
    // This ensures React re-renders when these specific values change
    const playbackState = useRSVPStore((s) => s.state);
    const tokens = useRSVPStore((s) => s.tokens);
    const currentTokenIndex = useRSVPStore((s) => s.currentTokenIndex);
    const targetWPM = useRSVPStore((s) => s.targetWPM);

    // Derive isPlaying from subscribed state
    const isPlaying = playbackState === 'RAMPING' ||
        playbackState === 'PLAYING_CONTINUOUS' ||
        playbackState === 'PLAYING_TEMPORARY';

    // === Tick function using ref to avoid stale closures ===
    const tickRef = useRef<() => void>(() => { });

    // Update the tick function on each render with fresh closure
    tickRef.current = () => {
        try {
            // Get fresh state directly from store
            const state = useRSVPStore.getState();

            // Guard: check if still playing
            const stillPlaying = state.state === 'RAMPING' ||
                state.state === 'PLAYING_CONTINUOUS' ||
                state.state === 'PLAYING_TEMPORARY';

            if (!stillPlaying) {
                log('Stopping: state is no longer playing:', state.state);
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
                isLoopRunningRef.current = false;
                return;
            }

            // Guard: no tokens or no current token
            if (state.tokens.length === 0) {
                log('Stopping: no tokens');
                state.pausePlayback();
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
                isLoopRunningRef.current = false;
                return;
            }

            const currentToken = state.tokens[state.currentTokenIndex];
            if (!currentToken) {
                log('Stopping: no current token at index', state.currentTokenIndex);
                state.pausePlayback();
                clearInterval(intervalRef.current!);
                intervalRef.current = null;
                isLoopRunningRef.current = false;
                return;
            }

            const now = Date.now();

            // === Handle Speed Ramping ===
            if (state.state === 'RAMPING' && state.rampStartTime) {
                const elapsed = now - state.rampStartTime;

                if (isRampingComplete(elapsed, state.rampDuration)) {
                    // Ramp complete - transition to continuous
                    state.setCurrentWPM(state.targetWPM);
                    state.updateState('PLAYING_CONTINUOUS');
                    log('Ramp complete, now continuous at', state.targetWPM, 'WPM');
                } else {
                    // Interpolate WPM during ramp
                    const startWPM = state.targetWPM * 0.6;
                    const newWPM = getCurrentWPMDuringRamp(
                        startWPM,
                        state.targetWPM,
                        elapsed,
                        state.rampDuration,
                        state.easingCurveType
                    );
                    state.setCurrentWPM(newWPM);
                }
            }

            // === Calculate how long this token should display ===
            const displayDuration = calculateDisplayDuration(
                currentToken,
                state.currentWPM,
                state.naturalPacingEnabled,
                state.commaPauseMs,
                state.periodPauseMs
            );

            // === Check if time to advance ===
            const tokenElapsed = now - tokenStartTimeRef.current;

            if (tokenElapsed >= displayDuration) {
                // Check if at end
                if (state.currentTokenIndex >= state.tokens.length - 1) {
                    log('Reached end of document');
                    state.pausePlayback();
                    clearInterval(intervalRef.current!);
                    intervalRef.current = null;
                    isLoopRunningRef.current = false;
                    return;
                }

                // Advance to next token
                state.advanceToken();
                tokenStartTimeRef.current = now;
            }

        } catch (error) {
            console.error('[RSVP Engine] Tick error:', error);
            const state = useRSVPStore.getState();
            state.pausePlayback();
            clearInterval(intervalRef.current!);
            intervalRef.current = null;
            isLoopRunningRef.current = false;
        }
    };

    // === Effect: Start/stop the interval loop based on playback state ===
    useEffect(() => {
        log('Effect triggered. isPlaying:', isPlaying, 'playbackState:', playbackState);

        if (isPlaying && !isLoopRunningRef.current) {
            // Start the loop
            log('Starting playback loop');
            isLoopRunningRef.current = true;
            tokenStartTimeRef.current = Date.now();

            // Use a wrapper that calls the current tickRef
            intervalRef.current = setInterval(() => {
                tickRef.current();
            }, TICK_INTERVAL_MS);

        } else if (!isPlaying && isLoopRunningRef.current) {
            // Stop the loop
            log('Stopping playback loop');
            isLoopRunningRef.current = false;
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        }

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            isLoopRunningRef.current = false;
        };
    }, [isPlaying, playbackState]);

    // === Effect: Reset token timing when seeking ===
    useEffect(() => {
        tokenStartTimeRef.current = Date.now();
    }, [currentTokenIndex]);

    // === Public API ===

    const togglePlayback = useCallback(() => {
        const state = useRSVPStore.getState();
        log('togglePlayback called. Current state:', state.state, 'Tokens:', state.tokens.length);

        const playing = state.state === 'RAMPING' ||
            state.state === 'PLAYING_CONTINUOUS' ||
            state.state === 'PLAYING_TEMPORARY';

        if (playing) {
            log('Calling pausePlayback');
            state.pausePlayback();
        } else if (state.state === 'PAUSED') {
            log('Calling resumePlayback');
            state.resumePlayback();
        } else {
            log('Calling startPlayback');
            state.startPlayback();
        }
    }, []);

    const skipForward = useCallback((count = 10) => {
        useRSVPStore.getState().skipForward(count);
        tokenStartTimeRef.current = Date.now();
    }, []);

    const skipBackward = useCallback((count = 10) => {
        useRSVPStore.getState().skipBackward(count);
        tokenStartTimeRef.current = Date.now();
    }, []);

    const seekTo = useCallback((tokenIndex: number) => {
        useRSVPStore.getState().seekToToken(tokenIndex);
        tokenStartTimeRef.current = Date.now();
    }, []);

    const setWPM = useCallback((wpm: number) => {
        useRSVPStore.getState().setTargetWPM(wpm);
    }, []);

    // Compute derived values
    const store = useRSVPStore.getState();

    return {
        // State
        isPlaying,
        isPaused: playbackState === 'PAUSED',
        progress: tokens.length > 0 ? (currentTokenIndex / tokens.length) * 100 : 0,
        timeRemaining: store.getTimeRemaining(),

        // Playback controls
        play: useCallback(() => useRSVPStore.getState().startPlayback(), []),
        pause: useCallback(() => useRSVPStore.getState().pausePlayback(), []),
        resume: useCallback(() => useRSVPStore.getState().resumePlayback(), []),
        togglePlayback,

        // Speed control
        setWPM,

        // Navigation
        skipForward,
        skipBackward,
        seekTo,
    };
}
