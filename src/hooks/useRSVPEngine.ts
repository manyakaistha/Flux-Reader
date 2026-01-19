import { useCallback, useEffect, useRef } from 'react';
import { useRSVPStore } from '../store/rsvpStore';
import { getCurrentWPMDuringRamp, isRampingComplete } from '../utils/easing';
import { calculateDisplayDuration, shouldAdvanceToken } from '../utils/timing';

/**
 * Custom hook that manages the RSVP playback engine
 * Uses requestAnimationFrame for accurate timing (±10ms)
 */
export function useRSVPEngine() {
    const store = useRSVPStore();

    // Refs for timing without causing re-renders
    const animationIdRef = useRef<number | null>(null);
    const tokenStartTimeRef = useRef<number>(Date.now());
    const lastFrameTimeRef = useRef<number>(Date.now());

    // Destructure store state for dependency tracking
    const {
        state,
        tokens,
        currentTokenIndex,
        currentToken,
        currentWPM,
        targetWPM,
        rampStartTime,
        rampDuration,
        easingCurveType,
        naturalPacingEnabled,
        commaPauseMs,
        periodPauseMs,
        advanceToken,
        setCurrentWPM,
        updateState,
    } = store;

    /**
     * Main animation frame callback
     */
    const animate = useCallback((timestamp: number) => {
        const currentState = useRSVPStore.getState();
        const now = timestamp;

        // Only process if playing
        if (currentState.state !== 'RAMPING' &&
            currentState.state !== 'PLAYING_CONTINUOUS' &&
            currentState.state !== 'PLAYING_TEMPORARY') {
            animationIdRef.current = null;
            return;
        }

        // Handle ramping
        if (currentState.state === 'RAMPING' && currentState.rampStartTime) {
            const elapsed = now - currentState.rampStartTime;

            if (isRampingComplete(elapsed, currentState.rampDuration)) {
                // Ramping complete, switch to continuous playback
                currentState.updateState('PLAYING_CONTINUOUS');
                currentState.setCurrentWPM(currentState.targetWPM);
            } else {
                // Calculate current WPM during ramp
                const startWPM = currentState.targetWPM * 0.6;
                const wpm = getCurrentWPMDuringRamp(
                    startWPM,
                    currentState.targetWPM,
                    elapsed,
                    currentState.rampDuration,
                    currentState.easingCurveType
                );
                currentState.setCurrentWPM(wpm);
            }
        }

        // Calculate display duration for current token
        const token = currentState.currentToken;
        if (!token) {
            animationIdRef.current = requestAnimationFrame(animate);
            return;
        }

        const displayDuration = calculateDisplayDuration(
            token,
            currentState.currentWPM,
            currentState.naturalPacingEnabled,
            currentState.commaPauseMs,
            currentState.periodPauseMs
        );

        // Check if time to advance
        const tokenElapsed = now - tokenStartTimeRef.current;

        if (shouldAdvanceToken(tokenElapsed, displayDuration)) {
            // Check if we're at the end
            if (currentState.currentTokenIndex >= currentState.tokens.length - 1) {
                currentState.updateState('IDLE');
                animationIdRef.current = null;
                return;
            }

            // Advance to next token
            currentState.advanceToken();
            tokenStartTimeRef.current = now;
        }

        lastFrameTimeRef.current = now;

        // Schedule next frame
        animationIdRef.current = requestAnimationFrame(animate);
    }, []);

    /**
     * Start the animation loop when state changes to playing
     */
    useEffect(() => {
        const shouldPlay = state === 'RAMPING' ||
            state === 'PLAYING_CONTINUOUS' ||
            state === 'PLAYING_TEMPORARY';

        if (shouldPlay && !animationIdRef.current) {
            // Reset token timing when starting
            tokenStartTimeRef.current = performance.now();
            lastFrameTimeRef.current = performance.now();
            animationIdRef.current = requestAnimationFrame(animate);
        }

        // Cleanup on unmount or when stopping
        return () => {
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current);
                animationIdRef.current = null;
            }
        };
    }, [state, animate]);

    /**
     * Reset token start time when seeking to new position
     */
    useEffect(() => {
        tokenStartTimeRef.current = performance.now();
    }, [currentTokenIndex]);

    // Return current state and helper methods
    return {
        // State
        isPlaying: state === 'RAMPING' || state === 'PLAYING_CONTINUOUS' || state === 'PLAYING_TEMPORARY',
        isPaused: state === 'PAUSED',
        isIdle: state === 'IDLE',
        isRamping: state === 'RAMPING',
        currentToken,
        currentTokenIndex,
        currentWPM,
        progress: store.getProgress(),
        timeRemaining: store.getTimeRemaining(),

        // Actions
        play: store.startPlayback,
        pause: store.pausePlayback,
        resume: store.resumePlayback,
        togglePlayback: () => {
            const currentState = useRSVPStore.getState().state;
            if (currentState === 'IDLE' || currentState === 'PAUSED') {
                if (currentState === 'PAUSED') {
                    store.resumePlayback();
                } else {
                    store.startPlayback();
                }
            } else {
                store.pausePlayback();
            }
        },
        seekTo: store.seekToToken,
        skipForward: store.skipForward,
        skipBackward: store.skipBackward,
        setWPM: store.setTargetWPM,
    };
}
