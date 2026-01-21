import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
    cacheExtractedTokens,
    deleteCachedTokens,
    getCachedTokens,
    getReadingProgress,
    saveReadingProgress,
} from '../database/db';
import { useRSVPStore } from '../store/rsvpStore';
import { RSVPToken } from '../types';
import { getContextSnippet } from '../utils/tokenizer';

/**
 * Hook for managing RSVP reading progress persistence
 * Implements debounced saving strategy from specification
 */
export function useProgress(docId: number | null) {
    const store = useRSVPStore();
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastSaveIndexRef = useRef<number>(0);

    const { currentTokenIndex, currentPageNum, tokens, state } = store;

    /**
     * Save progress to database
     */
    const saveProgress = useCallback(async () => {
        if (!docId || tokens.length === 0) return;

        const snippet = getContextSnippet(tokens, currentTokenIndex, 3);
        const wordsRead = currentTokenIndex - lastSaveIndexRef.current;

        try {
            await saveReadingProgress(
                docId,
                currentTokenIndex,
                currentPageNum,
                snippet,
                wordsRead > 0 ? wordsRead : 0
            );
        } catch (error) {
            console.error('Failed to save reading progress:', error);
        }
    }, [docId, tokens, currentTokenIndex, currentPageNum]);

    /**
     * Debounced save - collects updates for 5 seconds before writing
     */
    const debouncedSave = useCallback(() => {
        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }
        saveTimerRef.current = setTimeout(() => {
            saveProgress();
        }, 5000); // 5 second debounce
    }, [saveProgress]);

    /**
     * Save every 10 words during playback
     */
    useEffect(() => {
        if (state !== 'PLAYING_CONTINUOUS' && state !== 'PLAYING_TEMPORARY' && state !== 'RAMPING') {
            return;
        }

        if (currentTokenIndex - lastSaveIndexRef.current >= 10) {
            debouncedSave();
            lastSaveIndexRef.current = currentTokenIndex;
        }
    }, [currentTokenIndex, state, debouncedSave]);

    /**
     * Immediate save on pause
     */
    useEffect(() => {
        if (state === 'PAUSED') {
            // Clear any pending debounced save
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                saveTimerRef.current = null;
            }
            // Save immediately
            saveProgress();
        }
    }, [state, saveProgress]);

    /**
     * Cleanup on unmount - save final progress
     */
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
            // Final save
            saveProgress();
        };
    }, [saveProgress]);

    /**
     * Load saved progress for a document
     */
    const loadProgress = useCallback(async (): Promise<number | null> => {
        if (!docId) return null;

        try {
            const progress = await getReadingProgress(docId);
            if (progress && progress.currentTokenIndex > 0) {
                return progress.currentTokenIndex;
            }
        } catch (error) {
            console.error('Failed to load reading progress:', error);
        }
        return null;
    }, [docId]);

    /**
     * Cache tokens for faster subsequent loads
     */
    const cacheTokens = useCallback(async (tokens: RSVPToken[], totalPages: number, fileHash: string) => {
        if (!docId) return;

        try {
            await cacheExtractedTokens(
                docId,
                JSON.stringify(tokens),
                tokens.length,
                totalPages,
                fileHash
            );
        } catch (error) {
            console.error('Failed to cache tokens:', error);
        }
    }, [docId]);

    /**
     * Load cached tokens if available
     */
    const loadCachedTokens = useCallback(async (): Promise<RSVPToken[] | null> => {
        if (!docId) return null;

        try {
            const cached = await getCachedTokens(docId);
            if (cached && cached.tokenStream) {
                return JSON.parse(cached.tokenStream) as RSVPToken[];
            }
        } catch (error) {
            console.error('Failed to load cached tokens:', error);

            // If it's an OOM error, delete the corrupted cache
            const errorMessage = String(error);
            if (errorMessage.includes('OutOfMemory') || errorMessage.includes('allocate')) {
                console.warn('Clearing corrupted token cache due to OOM error');
                try {
                    await deleteCachedTokens(docId);
                } catch (deleteError) {
                    console.error('Failed to delete cached tokens:', deleteError);
                }
            }
        }
        return null;
    }, [docId]);

    // Memoize return object to prevent unnecessary effect re-triggers in consumers
    return useMemo(() => ({
        saveProgress,
        loadProgress,
        cacheTokens,
        loadCachedTokens,
    }), [saveProgress, loadProgress, cacheTokens, loadCachedTokens]);
}

