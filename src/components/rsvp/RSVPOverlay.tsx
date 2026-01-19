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
import { PDF_WORKER_HTML, processExtractedText, simpleHash, validateExtraction } from '../../utils/pdfExtractor';
import { RSVPControls } from './RSVPControls';
import { WordDisplay } from './WordDisplay';

interface RSVPOverlayProps {
    visible: boolean;
    docId: number;
    pdfUri: string;
    onClose: () => void;
}

/**
 * RSVP Overlay Component
 * Full-screen overlay for RSVP reading mode with text extraction
 */
export function RSVPOverlay({ visible, docId, pdfUri, onClose }: RSVPOverlayProps) {
    const webViewRef = useRef<WebView>(null);
    const [extractionError, setExtractionError] = useState<string | null>(null);

    const store = useRSVPStore();
    const engine = useRSVPEngine();
    const progress = useProgress(docId);

    const {
        isExtracting,
        extractionProgress,
        tokens,
        currentToken,
        baseFontSize,
        minimumFontSize,
        targetWPM,
        commaPauseMs,
        periodPauseMs,
        setCommaPauseMs,
        setPeriodPauseMs,
    } = store;

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
                store.initializeRSVP(docId.toString(), extractedTokens, savedPosition || 0);
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
    }, [docId, pdfUri, store, progress]);

    /**
     * Start text extraction when overlay becomes visible
     */
    useEffect(() => {
        if (!visible) return;

        const extractText = async () => {
            // First, try to load cached tokens
            const cachedTokens = await progress.loadCachedTokens();

            if (cachedTokens && cachedTokens.length > 0) {
                // Use cached tokens
                const savedPosition = await progress.loadProgress();
                store.initializeRSVP(docId.toString(), cachedTokens, savedPosition || 0);
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
    }, [visible, docId, pdfUri]);

    /**
     * Handle close - save progress
     */
    const handleClose = useCallback(() => {
        if (engine.isPlaying) {
            engine.pause();
        }
        progress.saveProgress();
        store.reset();
        onClose();
    }, [engine, progress, store, onClose]);

    /**
     * Handle press on word display area (temporary playback)
     */
    const handlePressIn = useCallback(() => {
        if (!engine.isPlaying && tokens.length > 0) {
            store.startTemporaryPlayback();
        }
    }, [engine.isPlaying, tokens.length, store]);

    const handlePressOut = useCallback(() => {
        if (store.state === 'PLAYING_TEMPORARY') {
            store.stopTemporaryPlayback();
        }
    }, [store]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="fade"
            presentationStyle="fullScreen"
            onRequestClose={handleClose}
        >
            <SafeAreaView style={styles.container}>
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
                        <ActivityIndicator size="large" color="#ff4444" />
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

                {/* Word Display Area */}
                {!isExtracting && !extractionError && tokens.length > 0 && (
                    <Pressable
                        style={styles.wordDisplayArea}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                    >
                        <WordDisplay
                            token={currentToken}
                            baseFontSize={baseFontSize}
                            minimumFontSize={minimumFontSize}
                        />
                    </Pressable>
                )}

                {/* Controls */}
                {!isExtracting && !extractionError && tokens.length > 0 && (
                    <RSVPControls
                        currentWPM={engine.currentWPM}
                        targetWPM={targetWPM}
                        progress={engine.progress}
                        timeRemaining={engine.timeRemaining}
                        isPlaying={engine.isPlaying}
                        commaPauseMs={commaPauseMs}
                        periodPauseMs={periodPauseMs}
                        onPlayPause={engine.togglePlayback}
                        onWPMChange={engine.setWPM}
                        onCommaPauseChange={setCommaPauseMs}
                        onPeriodPauseChange={setPeriodPauseMs}
                        onSkipForward={() => engine.skipForward(10)}
                        onSkipBackward={() => engine.skipBackward(10)}
                        onClose={handleClose}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
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
        color: '#888',
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
        color: '#ff4444',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#333',
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
