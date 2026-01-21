import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useProgress } from '../../hooks/useProgress';
import { useRSVPEngine } from '../../hooks/useRSVPEngine';
import { useRSVPStore } from '../../store/rsvpStore';
import { RSVPToken } from '../../types';
import { PDF_WORKER_HTML, processExtractedText, simpleHash, validateExtraction } from '../../utils/pdfExtractor';
import { RSVPControls } from './RSVPControls';
import { RSVPHeader } from './RSVPHeader';
import { RSVPScrubber } from './RSVPScrubber';
import { WordDisplay } from './WordDisplay';

// Design system colors
const COLORS = {
    background: '#0a0a14',
    accent: '#4ECDC4',
    danger: '#FF6B6B',
    textSecondary: '#B0B0B0',
    surface: '#1a1a2e',
};

interface RSVPOverlayProps {
    visible: boolean;
    docId: number;
    pdfUri: string;
    startFromPage?: number;
    onClose: () => void;
}

function findFirstTokenIndexForPage(tokens: any[], pageNum: number): number {
    const index = tokens.findIndex(t => t.sourceRef?.pageNum === pageNum);
    return index >= 0 ? index : 0;
}

/**
 * Get context words (8 before and 8 after)
 */
function getContextWords(tokens: RSVPToken[], currentIndex: number, count: number = 8): { before: string; after: string } {
    const before: string[] = [];
    const after: string[] = [];

    // Get words before (filter out whitespace tokens)
    for (let i = currentIndex - 1; i >= 0 && before.length < count; i--) {
        if (tokens[i]?.type !== 'whitespace') {
            before.unshift(tokens[i].text);
        }
    }

    // Get words after
    for (let i = currentIndex + 1; i < tokens.length && after.length < count; i++) {
        if (tokens[i]?.type !== 'whitespace') {
            after.push(tokens[i].text);
        }
    }

    return {
        before: before.join(' '),
        after: after.join(' ')
    };
}

export function RSVPOverlay({ visible, docId, pdfUri, startFromPage, onClose }: RSVPOverlayProps) {
    const webViewRef = useRef<WebView>(null);
    const [extractionError, setExtractionError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const hasInitializedRef = useRef<boolean>(false);

    const store = useRSVPStore();
    const engine = useRSVPEngine();
    const progress = useProgress(docId);

    const {
        isExtracting,
        extractionProgress,
        tokens,
        currentToken,
        currentTokenIndex,
        currentPageNum,
        totalTokens,
        targetWPM,
    } = store;

    // Calculate total pages (safe for large arrays)
    const totalPages = tokens.length > 0
        ? tokens.reduce((max, t) => Math.max(max, t.sourceRef?.pageNum || 1), 1)
        : 1;

    /**
     * Handle messages from WebView (pdf.js extraction)
     */
    const handleWebViewMessage = useCallback(async (event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'progress') {
                store.setExtracting(true, (data.current / data.total) * 100);
            } else if (data.type === 'complete') {
                // Process extracted text into tokens
                const extractedTokens = processExtractedText(data, docId.toString());

                // Validate extraction
                const validation = validateExtraction(extractedTokens);
                if (!validation.valid) {
                    store.setError(validation.error || 'Failed to extract text');
                    setExtractionError(validation.error || 'Failed to extract text');
                    return;
                }

                // Calculate file hash for caching
                const fileHash = simpleHash(pdfUri + data.totalPages);

                // Cache tokens
                await progress.cacheTokens(extractedTokens, data.totalPages, fileHash);

                // Try to load previous progress
                const savedPosition = await progress.loadProgress();

                // Initialize RSVP with tokens
                let startPosition = 0;

                if (startFromPage !== undefined) {
                    startPosition = findFirstTokenIndexForPage(extractedTokens, startFromPage);
                } else {
                    startPosition = savedPosition || 0;
                }

                console.log('[RSVPOverlay] Initializing with extracted tokens:', extractedTokens.length);
                store.initializeRSVP(docId.toString(), extractedTokens, startPosition);
                hasInitializedRef.current = true;
                store.setExtracting(false);
            } else if (data.type === 'error') {
                store.setError(data.message);
                setExtractionError(data.message);
            }
        } catch (error) {
            console.error('Error processing WebView message:', error);
            store.setError('Failed to process PDF');
            setExtractionError('Failed to process PDF');
        }
    }, [docId, pdfUri, store, progress, startFromPage]);

    /**
     * Start text extraction when overlay becomes visible
     */
    useEffect(() => {
        if (!visible) return;

        // Guard: Don't re-initialize if already loaded
        if (hasInitializedRef.current) {
            console.log('[RSVPOverlay] Skipping re-initialization - already loaded');
            return;
        }

        const extractText = async () => {
            // First, try to load cached tokens
            const cachedTokens = await progress.loadCachedTokens();

            if (cachedTokens && cachedTokens.length > 0) {
                let startPosition = 0;

                if (startFromPage !== undefined) {
                    startPosition = findFirstTokenIndexForPage(cachedTokens, startFromPage);
                } else {
                    startPosition = await progress.loadProgress() || 0;
                }

                console.log('[RSVPOverlay] Initializing with cached tokens:', cachedTokens.length);
                store.initializeRSVP(docId.toString(), cachedTokens, startPosition);
                hasInitializedRef.current = true;
                return;
            }

            // No cache, need to extract
            store.setExtracting(true, 0);

            try {
                // Read PDF file as base64
                const base64 = await FileSystem.readAsStringAsync(pdfUri, {
                    encoding: 'base64',
                });

                // Send to WebView for extraction
                if (webViewRef.current) {
                    webViewRef.current.postMessage(JSON.stringify({
                        type: 'extract',
                        pdfBase64: base64,
                    }));
                }
            } catch (error) {
                console.error('Failed to read PDF:', error);
                store.setError('Failed to read PDF file');
                setExtractionError('Failed to read PDF file');
            }
        };

        extractText();
    }, [visible, docId, pdfUri, startFromPage, progress, store]);

    /**
     * Handle close - save progress
     */
    const handleClose = useCallback(() => {
        if (engine.isPlaying) {
            engine.pause();
        }
        progress.saveProgress();
        store.reset();
        hasInitializedRef.current = false; // Reset so next open can initialize
        onClose();
    }, [engine, progress, store, onClose]);

    /**
     * Handle seek from scrubber
     */
    const handleSeek = useCallback((tokenIndex: number) => {
        store.seekToToken(tokenIndex);
    }, [store]);

    /**
     * Handle settings button
     */
    const handleSettings = useCallback(() => {
        setShowSettings(true);
    }, []);

    // Calculate context only when paused to avoid heavy computation during playback
    const context = React.useMemo(() => {
        if (engine.isPlaying || tokens.length === 0) return { before: '', after: '' };
        return getContextWords(tokens, currentTokenIndex);
    }, [engine.isPlaying, tokens, currentTokenIndex]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container} edges={['left', 'right']}>
                {/* Hidden WebView for PDF extraction */}
                <WebView
                    ref={webViewRef}
                    source={{ html: PDF_WORKER_HTML }}
                    onMessage={handleWebViewMessage}
                    style={styles.hiddenWebView}
                    javaScriptEnabled
                    originWhitelist={['*']}
                />

                {/* Loading State */}
                {isExtracting && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.accent} />
                        <Text style={styles.loadingText}>
                            Extracting text... {Math.round(extractionProgress)}%
                        </Text>
                    </View>
                )}

                {/* Error State */}
                {extractionError && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{extractionError}</Text>
                        <Pressable style={styles.retryButton} onPress={handleClose}>
                            <Text style={styles.retryButtonText}>Close</Text>
                        </Pressable>
                    </View>
                )}

                {/* Main RSVP Content */}
                {!isExtracting && !extractionError && tokens.length > 0 && (
                    <>
                        {/* Header */}
                        <RSVPHeader
                            progress={engine.progress}
                            timeRemaining={engine.timeRemaining}
                            onClose={handleClose}
                            onSettings={handleSettings}
                        />

                        {/* Word Display Area */}
                        <View style={styles.wordDisplayArea}>
                            <WordDisplay
                                token={currentToken}
                                contextBefore={context.before}
                                contextAfter={context.after}
                                isPaused={!engine.isPlaying}
                            />
                        </View>

                        {/* Scrubber */}
                        <RSVPScrubber
                            currentIndex={currentTokenIndex}
                            totalTokens={totalTokens}
                            currentPage={currentPageNum}
                            totalPages={totalPages}
                            onSeek={handleSeek}
                        />

                        {/* Controls */}
                        <RSVPControls
                            targetWPM={targetWPM}
                            isPlaying={engine.isPlaying}
                            onPlayPause={engine.togglePlayback}
                            onWPMChange={engine.setWPM}
                            onSkipForward={() => engine.skipForward(10)}
                            onSkipBackward={() => engine.skipBackward(10)}
                        />
                    </>
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    hiddenWebView: {
        width: 0,
        height: 0,
        position: 'absolute',
        opacity: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: COLORS.textSecondary,
        marginTop: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: COLORS.danger,
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: COLORS.surface,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#fff',
    },
    wordDisplayArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default RSVPOverlay;
