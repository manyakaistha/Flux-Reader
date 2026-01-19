import { RSVPToken } from '../types';

/**
 * Calculate base display duration for a given WPM
 * @param wpm - Words per minute
 * @returns Milliseconds per word
 */
export function getBaseDisplayDuration(wpm: number): number {
    return 60000 / wpm;
}

/**
 * Calculate display duration for a token with natural pacing
 * @param token - The token to calculate duration for
 * @param wpm - Current words per minute
 * @param naturalPacingEnabled - Whether to apply micro-pauses
 * @param commaPauseMs - Pause duration for commas (default 50ms)
 * @param periodPauseMs - Pause duration for periods/sentence endings (default 200ms)
 * @returns Display duration in milliseconds
 */
export function calculateDisplayDuration(
    token: RSVPToken,
    wpm: number,
    naturalPacingEnabled: boolean = true,
    commaPauseMs: number = 50,
    periodPauseMs: number = 200
): number {
    let baseTime = getBaseDisplayDuration(wpm);

    if (!naturalPacingEnabled) {
        return baseTime;
    }

    const text = token.text;
    const lastChar = text[text.length - 1];

    // Add micro-pauses for punctuation (sentence-ending)
    if (/[.!?]$/.test(text)) {
        baseTime += periodPauseMs; // Configurable pause for sentence end
    } else if (/[;:]$/.test(text)) {
        baseTime += Math.floor(periodPauseMs * 0.75); // 75% of period pause for semicolon/colon
    } else if (/,$/.test(text)) {
        baseTime += commaPauseMs; // Configurable pause for comma
    } else if (/[—–-]$/.test(text)) {
        baseTime += Math.floor(commaPauseMs * 2); // 2x comma pause for dashes
    }

    // Add penalty for long words (only for word tokens)
    if (token.type === 'word') {
        if (text.length >= 13) {
            baseTime += 100;
        } else if (text.length >= 8) {
            baseTime += 50;
        }
    }

    return baseTime;
}

/**
 * Estimate time remaining for reading
 * @param remainingTokens - Number of tokens left to read
 * @param wpm - Current words per minute
 * @returns Formatted time string
 */
export function estimateTimeRemaining(remainingTokens: number, wpm: number): string {
    const msPerWord = 60000 / wpm;
    const estimatedTimeMs = remainingTokens * msPerWord;

    if (estimatedTimeMs < 60000) {
        return `${Math.ceil(estimatedTimeMs / 1000)}s`;
    } else if (estimatedTimeMs < 3600000) {
        return `${Math.ceil(estimatedTimeMs / 60000)} min`;
    } else {
        return `${(Math.ceil((estimatedTimeMs / 3600000) * 10) / 10)} hrs`;
    }
}

/**
 * Calculate estimated reading time for entire document
 * @param totalTokens - Total number of tokens
 * @param wpm - Reading speed in words per minute
 * @returns Formatted time string
 */
export function estimateTotalReadingTime(totalTokens: number, wpm: number): string {
    return estimateTimeRemaining(totalTokens, wpm);
}

/**
 * Get timing accuracy tolerance (±10ms as per spec)
 */
export const TIMING_TOLERANCE_MS = 10;

/**
 * Check if it's time to advance to the next token
 * @param tokenElapsedMs - Time elapsed showing current token
 * @param displayDurationMs - Expected display duration
 * @returns True if should advance
 */
export function shouldAdvanceToken(tokenElapsedMs: number, displayDurationMs: number): boolean {
    // Allow ±10ms tolerance before advancing
    return tokenElapsedMs >= (displayDurationMs - TIMING_TOLERANCE_MS);
}
