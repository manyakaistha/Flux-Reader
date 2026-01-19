/**
 * Reader Screen
 * PDF Reader with vertical scroll, auto-hiding chrome, and RSVP integration
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import {
    PageIndicator,
    ReaderFooter,
    ReaderTopBar,
    ReadingOptionsSheet,
} from '@/src/components/reader';
import { RSVPOverlay } from '@/src/components/rsvp/RSVPOverlay';
import { animations, getTheme, ReaderTheme } from '@/src/constants/readerTheme';
import { updateLastOpenedAt, updateLastReadPage } from '@/src/database/db';
import { useRSVPStore } from '@/src/store/rsvpStore';

const _Dimensions = Dimensions.get('window');

export default function ReaderScreen() {
    const params = useLocalSearchParams<{
        uri: string;
        name: string;
        id: string;
        lastReadPage: string;
    }>();

    const router = useRouter();
    const systemColorScheme = useColorScheme();

    // Document state
    const [currentPage, setCurrentPage] = useState(parseInt(params.lastReadPage || '1', 10));
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // RSVP state
    const [showRSVP, setShowRSVP] = useState(false);
    const rsvpStore = useRSVPStore();

    // Chrome visibility state
    const [chromeVisible, setChromeVisible] = useState(true);
    const chromeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Scroll indicator
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reading options
    const [showOptionsSheet, setShowOptionsSheet] = useState(false);
    const [readerTheme, setReaderTheme] = useState<ReaderTheme>('dark');
    const [brightness, setBrightness] = useState(100);

    // Scroll position save
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const docId = parseInt(params.id || '0', 10);
    const pdfUri = params.uri || '';
    const docName = params.name || 'Document';

    const themeColors = getTheme(readerTheme, systemColorScheme === 'dark');

    /**
     * PDF viewer HTML with pdf.js - Vertical Scroll Mode
     */
    const pdfViewerHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    background: ${themeColors.background};
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
                #pages-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 72px 16px 60px 16px;
                    gap: 16px;
                }
                .page-wrapper {
                    background: #fff;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    border-radius: 4px;
                    overflow: hidden;
                    position: relative;
                }
                .page-number {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                    font-size: 11px;
                    color: rgba(0,0,0,0.4);
                    background: rgba(255,255,255,0.8);
                    padding: 2px 6px;
                    border-radius: 4px;
                }
                canvas {
                    display: block;
                    width: 100%;
                    height: auto;
                }
                #loading {
                    color: #888;
                    font-family: system-ui, sans-serif;
                    text-align: center;
                    padding: 100px 40px;
                }
                .page-divider {
                    width: 80%;
                    height: 1px;
                    background: rgba(128,128,128,0.2);
                    margin: 8px 0;
                }
            </style>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        </head>
        <body>
            <div id="pages-container">
                <div id="loading">Loading PDF...</div>
            </div>
            <script>
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                let pdfDoc = null;
                let currentZoom = 1;
                const container = document.getElementById('pages-container');
                
                async function loadPDF(base64) {
                    try {
                        const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
                        pdfDoc = await loadingTask.promise;
                        
                        container.innerHTML = '';
                        
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loaded',
                            totalPages: pdfDoc.numPages
                        }));
                        
                        for (let i = 1; i <= pdfDoc.numPages; i++) {
                            await renderPage(i);
                            if (i < pdfDoc.numPages) {
                                const divider = document.createElement('div');
                                divider.className = 'page-divider';
                                container.appendChild(divider);
                            }
                        }
                    } catch (error) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'error',
                            message: error.message
                        }));
                    }
                }
                
                async function renderPage(num) {
                    const page = await pdfDoc.getPage(num);
                    
                    const containerWidth = window.innerWidth - 32;
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = (containerWidth / viewport.width) * 1.5;
                    const scaledViewport = page.getViewport({ scale });
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = 'page-wrapper';
                    wrapper.id = 'page-' + num;
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;
                    
                    // Page number label
                    const pageLabel = document.createElement('div');
                    pageLabel.className = 'page-number';
                    pageLabel.textContent = 'Page ' + num;
                    
                    wrapper.appendChild(canvas);
                    wrapper.appendChild(pageLabel);
                    container.appendChild(wrapper);
                    
                    await page.render({
                        canvasContext: ctx,
                        viewport: scaledViewport
                    }).promise;
                }
                
                // Scroll tracking with debounce
                let lastReportedPage = 1;
                let scrollTimeout = null;
                let isCurrentlyScrolling = false;
                
                document.addEventListener('scroll', function() {
                    if (!pdfDoc) return;
                    
                    // Notify scroll start
                    if (!isCurrentlyScrolling) {
                        isCurrentlyScrolling = true;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'scrollStart'
                        }));
                    }
                    
                    clearTimeout(scrollTimeout);
                    
                    const pages = document.querySelectorAll('.page-wrapper');
                    const viewportMiddle = window.innerHeight / 2;
                    
                    for (let i = 0; i < pages.length; i++) {
                        const rect = pages[i].getBoundingClientRect();
                        if (rect.top <= viewportMiddle && rect.bottom >= viewportMiddle) {
                            const pageNum = i + 1;
                            if (pageNum !== lastReportedPage) {
                                lastReportedPage = pageNum;
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'pageChanged',
                                    page: pageNum
                                }));
                            }
                            break;
                        }
                    }
                    
                    // Debounced scroll end and save
                    scrollTimeout = setTimeout(function() {
                        isCurrentlyScrolling = false;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'scrollEnd',
                            page: lastReportedPage,
                            scrollY: window.scrollY
                        }));
                    }, 150);
                });
                
                // Handle screen tap for chrome toggle
                let lastTapTime = 0;
                document.addEventListener('click', function(e) {
                    const now = Date.now();
                    
                    // Double-tap detection for zoom
                    if (now - lastTapTime < 300) {
                        // Double tap - toggle zoom
                        currentZoom = currentZoom === 1 ? 2 : 1;
                        document.body.style.zoom = currentZoom;
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'zoomChanged',
                            zoom: currentZoom
                        }));
                    } else {
                        // Single tap - toggle chrome
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'tap'
                        }));
                    }
                    
                    lastTapTime = now;
                });
                
                // Message handlers
                function handleMessage(data) {
                    if (data.type === 'loadPDF') {
                        loadPDF(data.base64);
                    } else if (data.type === 'scrollToPage') {
                        const page = document.getElementById('page-' + data.page);
                        if (page) {
                            page.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }
                
                document.addEventListener('message', function(e) {
                    handleMessage(JSON.parse(e.data));
                });
                
                window.addEventListener('message', function(e) {
                    handleMessage(JSON.parse(e.data));
                });
            </script>
        </body>
        </html>
    `;

    const webViewRef = useRef<WebView>(null);

    /**
     * Load PDF on mount
     */
    useEffect(() => {
        const loadPDF = async () => {
            try {
                // Update last opened time
                if (docId > 0) {
                    updateLastOpenedAt(docId).catch(console.error);
                }

                const FileSystem = await import('expo-file-system/legacy');
                const base64 = await FileSystem.readAsStringAsync(pdfUri, {
                    encoding: 'base64',
                });

                webViewRef.current?.postMessage(JSON.stringify({
                    type: 'loadPDF',
                    base64
                }));
            } catch (err) {
                console.error('Failed to load PDF:', err);
                setError('Failed to load PDF file');
                setIsLoading(false);
            }
        };

        if (pdfUri) {
            loadPDF();
        }

        return () => {
            // Cleanup timers
            if (chromeTimer.current) clearTimeout(chromeTimer.current);
            if (scrollTimer.current) clearTimeout(scrollTimer.current);
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [pdfUri, docId]);

    /**
     * Auto-hide chrome after delay
     */
    const startChromeTimer = useCallback(() => {
        if (chromeTimer.current) {
            clearTimeout(chromeTimer.current);
        }
        chromeTimer.current = setTimeout(() => {
            setChromeVisible(false);
        }, animations.autoHideDelay);
    }, []);

    /**
     * Show chrome and start auto-hide timer
     */
    const showChrome = useCallback(() => {
        setChromeVisible(true);
        startChromeTimer();
    }, [startChromeTimer]);

    /**
     * Toggle chrome visibility
     */
    const toggleChrome = useCallback(() => {
        if (chromeVisible) {
            setChromeVisible(false);
            if (chromeTimer.current) {
                clearTimeout(chromeTimer.current);
            }
        } else {
            showChrome();
        }
    }, [chromeVisible, showChrome]);

    /**
     * Handle WebView messages
     */
    const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            switch (data.type) {
                case 'loaded':
                    setTotalPages(data.totalPages);
                    setIsLoading(false);
                    // Scroll to saved page
                    const savedPage = parseInt(params.lastReadPage || '1', 10);
                    if (savedPage > 1) {
                        setTimeout(() => {
                            webViewRef.current?.postMessage(JSON.stringify({
                                type: 'scrollToPage',
                                page: savedPage
                            }));
                        }, 500);
                    }
                    break;

                case 'pageChanged':
                    setCurrentPage(data.page);
                    break;

                case 'scrollStart':
                    setIsScrolling(true);
                    // Hide chrome on scroll
                    setChromeVisible(false);
                    if (chromeTimer.current) {
                        clearTimeout(chromeTimer.current);
                    }
                    break;

                case 'scrollEnd':
                    setIsScrolling(false);
                    // Debounced save
                    if (saveTimer.current) {
                        clearTimeout(saveTimer.current);
                    }
                    saveTimer.current = setTimeout(() => {
                        if (docId > 0) {
                            updateLastReadPage(docId, data.page).catch(console.error);
                        }
                    }, animations.scrollDebounce);
                    break;

                case 'tap':
                    toggleChrome();
                    break;

                case 'error':
                    setError(data.message);
                    setIsLoading(false);
                    break;
            }
        } catch (err) {
            console.error('WebView message error:', err);
        }
    }, [docId, params.lastReadPage, toggleChrome]);

    /**
     * Go back to library
     */
    const goBack = useCallback(() => {
        // Save progress before leaving
        if (docId > 0) {
            updateLastReadPage(docId, currentPage).catch(console.error);
        }
        router.back();
    }, [router, docId, currentPage]);

    /**
     * Handle RSVP tap (opens paused)
     */
    const handleRSVPTap = useCallback(() => {
        setChromeVisible(false);
        setShowRSVP(true);
    }, []);

    /**
     * Handle RSVP long press (instant play)
     */
    const handleRSVPLongPress = useCallback(() => {
        setChromeVisible(false);
        setShowRSVP(true);
    }, []);

    /**
     * Close RSVP overlay
     */
    const handleRSVPClose = useCallback(() => {
        setShowRSVP(false);

        // Sync position from RSVP if available
        const rsvpState = rsvpStore;
        if (rsvpState.currentPageNum > 0) {
            setCurrentPage(rsvpState.currentPageNum);
            if (docId > 0) {
                updateLastReadPage(docId, rsvpState.currentPageNum).catch(console.error);
            }
            // Scroll to the current page
            webViewRef.current?.postMessage(JSON.stringify({
                type: 'scrollToPage',
                page: rsvpState.currentPageNum
            }));
        }
    }, [docId, rsvpStore]);

    /**
     * Handle menu press
     */
    const handleMenuPress = useCallback(() => {
        setShowOptionsSheet(true);
    }, []);

    /**
     * Go to specific page
     */
    const handleGoToPage = useCallback(() => {
        // TODO: Implement go-to-page dialog
        setShowOptionsSheet(false);
    }, []);

    // Determine effective theme
    const effectiveTheme = readerTheme === 'auto'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : readerTheme;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
            <StatusBar style={effectiveTheme === 'dark' ? 'light' : 'dark'} />

            {/* PDF Viewer */}
            <View style={styles.pdfContainer}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={themeColors.accent} />
                        <Text style={[styles.loadingText, { color: themeColors.secondaryText }]}>
                            Loading PDF...
                        </Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <View style={styles.errorSheet}>
                            <Ionicons name="alert-circle" size={48} color="#ff4444" />
                            <Text style={styles.errorTitle}>Unable to Open Document</Text>
                            <Text style={styles.errorText}>
                                This PDF file cannot be opened. It may be corrupted or protected by DRM.
                            </Text>
                            <TouchableOpacity style={styles.errorButton} onPress={goBack}>
                                <Text style={styles.errorButtonText}>Return to Library</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {!error && (
                    <WebView
                        ref={webViewRef}
                        source={{ html: pdfViewerHtml }}
                        onMessage={handleWebViewMessage}
                        style={styles.webview}
                        javaScriptEnabled
                        originWhitelist={['*']}
                        scrollEnabled={true}
                        bounces={true}
                    />
                )}
            </View>

            {/* Page Indicator (during scroll) */}
            <PageIndicator visible={isScrolling} currentPage={currentPage} />

            {/* Top Bar (auto-hiding) */}
            <ReaderTopBar
                visible={chromeVisible}
                title={docName}
                onBack={goBack}
                onRSVPTap={handleRSVPTap}
                onRSVPLongPress={handleRSVPLongPress}
                onMenuPress={handleMenuPress}
                theme={effectiveTheme as 'light' | 'dark' | 'sepia'}
            />

            {/* Footer (auto-hiding) */}
            <ReaderFooter
                visible={chromeVisible}
                currentPage={currentPage}
                totalPages={totalPages}
                theme={effectiveTheme as 'light' | 'dark' | 'sepia'}
            />

            {/* Reading Options Sheet */}
            <ReadingOptionsSheet
                visible={showOptionsSheet}
                onClose={() => setShowOptionsSheet(false)}
                currentTheme={readerTheme}
                onThemeChange={setReaderTheme}
                brightness={brightness}
                onBrightnessChange={setBrightness}
                onGoToPage={handleGoToPage}
            />

            {/* RSVP Overlay */}
            <RSVPOverlay
                visible={showRSVP}
                docId={docId}
                pdfUri={pdfUri}
                onClose={handleRSVPClose}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    pdfContainer: {
        flex: 1,
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 14,
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#000',
    },
    errorSheet: {
        backgroundColor: '#1E1E1E',
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        maxWidth: 320,
    },
    errorTitle: {
        fontFamily: 'Inter_700Bold',
        fontSize: 20,
        color: '#FFFFFF',
        marginTop: 16,
        textAlign: 'center',
    },
    errorText: {
        fontFamily: 'Inter_400Regular',
        fontSize: 16,
        color: '#888',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 22,
    },
    errorButton: {
        backgroundColor: '#333',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    errorButtonText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#fff',
    },
});
