import { RSVPToken, SourceRef, TokenType } from '../types';

/**
 * Classify a token text into a type
 */
/**
 * Classify a token text into a type
 */
export function classifyToken(text: string): TokenType {
    // Check for whitespace
    if (/^\s+$/.test(text)) {
        return 'whitespace';
    }
    // Check for punctuation only (no alphanumeric chars)
    if (/^[.,;:!?—–\-\"'`()\[\]{}…]+$/.test(text)) {
        return 'punctuation';
    }
    // Check for numbers (including decimals and negatives)
    if (/^-?\d+([.,]\d+)?([.,;:!?—–\-\"'`()\[\]{}…]+)?$/.test(text)) {
        return 'number';
    }
    // Check for word (contains at least one letter)
    // Allows attached punctuation
    if (/[a-zA-Z]/.test(text)) {
        return 'word';
    }
    return 'other';
}

/**
 * Calculate Optimal Recognition Point (ORP) index
 * ORP is approximately 37% into the word for fastest recognition
 */
/**
 * Calculate Optimal Recognition Point (ORP) index
 * ORP is approximately 35% into the word for fastest recognition
 * Ignores leading/trailing punctuation for calculation
 */
export function calculateORPIndex(text: string): number {
    // Strip leading/trailing punctuation to find core word
    const match = text.match(/^([.,;:!?—–\-\"'`()\[\]{}…]*)(.*?)([.,;:!?—–\-\"'`()\[\]{}…]*)$/);
    if (!match) return 0;

    const [, leading, core, trailing] = match;

    if (core.length <= 1) return leading.length;

    // ORP is relative to the core word
    const coreORP = Math.floor(core.length * 0.35);
    return leading.length + coreORP;
}

/**
 * Split word into ORP components
 */
export function splitByORP(text: string): { orpIndex: number; orpChar: string; leftPart: string; rightPart: string } {
    const orpIndex = calculateORPIndex(text);
    return {
        orpIndex,
        orpChar: text[orpIndex] || '',
        leftPart: text.substring(0, orpIndex),
        rightPart: text.substring(orpIndex + 1),
    };
}

/**
 * Tokenize text into displayable units
 * Uses Penn Treebank-style tokenization with modifications for RSVP
 */
/**
 * Tokenize text into displayable units
 * Splits by whitespace only, keeping punctuation attached to words
 */
export function tokenizeText(text: string): { text: string; type: TokenType }[] {
    const tokens: { text: string; type: TokenType }[] = [];

    // Split by whitespace but keep the whitespace tokens if needed (regex capture group)
    // \s+ matches one or more whitespace characters
    const parts = text.split(/(\s+)/);

    for (const part of parts) {
        if (!part) continue;

        const type = classifyToken(part);
        tokens.push({ text: part, type });
    }

    return tokens;
}

/**
 * Generate a unique token ID
 */
function generateTokenId(docId: string, pageNum: number, globalIndex: number): string {
    return `${docId}-p${pageNum}-w${globalIndex}`;
}

/**
 * Generate complete token stream from extracted text
 * @param pages - Object mapping page numbers to their text content
 * @param docId - Document identifier
 * @returns Array of RSVPTokens with full source references
 */
export function generateTokenStream(
    pages: { [pageNum: number]: { text: string; lines: { text: string; lineIndex: number }[] } },
    docId: string
): RSVPToken[] {
    const allTokens: RSVPToken[] = [];
    let globalWordIndex = 0;

    const pageNumbers = Object.keys(pages).map(Number).sort((a, b) => a - b);

    for (const pageNum of pageNumbers) {
        const pageData = pages[pageNum];
        let wordIndexInPage = 0;

        if (pageData.lines && pageData.lines.length > 0) {
            // Process line by line for accurate source references
            for (const line of pageData.lines) {
                const lineTokens = tokenizeText(line.text);
                let wordIndexOnLine = 0;

                for (const tokenData of lineTokens) {
                    // Skip whitespace tokens
                    if (tokenData.type === 'whitespace') continue;

                    const sourceRef: SourceRef = {
                        pageNum,
                        lineIndex: line.lineIndex,
                        wordIndexOnLine,
                        wordIndexInPage,
                        wordIndexInDoc: globalWordIndex,
                    };

                    const orpData = splitByORP(tokenData.text);

                    const token: RSVPToken = {
                        id: generateTokenId(docId, pageNum, globalWordIndex),
                        text: tokenData.text,
                        type: tokenData.type,
                        sourceRef,
                        displayDuration: 0, // Will be calculated during playback
                        ...orpData,
                    };

                    allTokens.push(token);

                    if (tokenData.type === 'word' || tokenData.type === 'number') {
                        wordIndexOnLine++;
                        wordIndexInPage++;
                        globalWordIndex++;
                    }
                }
            }
        } else if (pageData.text) {
            // Fallback: process full page text
            const pageTokens = tokenizeText(pageData.text);

            for (const tokenData of pageTokens) {
                if (tokenData.type === 'whitespace') continue;

                const sourceRef: SourceRef = {
                    pageNum,
                    lineIndex: 0,
                    wordIndexOnLine: wordIndexInPage,
                    wordIndexInPage,
                    wordIndexInDoc: globalWordIndex,
                };

                const orpData = splitByORP(tokenData.text);

                const token: RSVPToken = {
                    id: generateTokenId(docId, pageNum, globalWordIndex),
                    text: tokenData.text,
                    type: tokenData.type,
                    sourceRef,
                    displayDuration: 0,
                    ...orpData,
                };

                allTokens.push(token);

                if (tokenData.type === 'word' || tokenData.type === 'number') {
                    wordIndexInPage++;
                    globalWordIndex++;
                }
            }
        }
    }

    return allTokens;
}

/**
 * Get context words around a token index
 * @param tokens - Full token array
 * @param index - Current token index
 * @param count - Number of words before/after to include
 * @returns Context snippet as string
 */
export function getContextSnippet(tokens: RSVPToken[], index: number, count: number = 3): string {
    const start = Math.max(0, index - count);
    const end = Math.min(tokens.length, index + count + 1);

    return tokens
        .slice(start, end)
        .map((t) => t.text)
        .join(' ');
}

/**
 * Check if a token should use ORP alignment
 * Only apply ORP to actual words with length > 1
 */
export function shouldApplyORP(token: RSVPToken): boolean {
    return token.type === 'word' && token.text.length > 1;
}
