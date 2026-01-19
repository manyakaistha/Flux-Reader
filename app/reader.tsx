import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { RSVPOverlay } from '@/src/components/rsvp/RSVPOverlay';
import { updateLastReadPage } from '@/src/database/db';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReaderScreen() {
    const params = useLocalSearchParams<{
        uri: string;
        name: string;
        id: string;
        lastReadPage: string;
    }>();

    const router = useRouter();

    const [currentPage, setCurrentPage] = useState(parseInt(params.lastReadPage || '1', 10));
    const [totalPages, setTotalPages] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showRSVP, setShowRSVP] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const docId = parseInt(params.id || '0', 10);
    const pdfUri = params.uri || '';
    const docName = params.name || 'Document';

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
                    background: #1a1a1a;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }
                #pages-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    padding: 20px 10px;
                    gap: 20px;
                }
                .page-wrapper {
                    background: #fff;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
                    border-radius: 4px;
                    overflow: hidden;
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
                    padding: 40px;
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
                const container = document.getElementById('pages-container');
                
                async function loadPDF(base64) {
                    try {
                        const loadingTask = pdfjsLib.getDocument({ data: atob(base64) });
                        pdfDoc = await loadingTask.promise;
                        
                        // Clear loading message
                        container.innerHTML = '';
                        
                        // Notify RN of total pages
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                            type: 'loaded',
                            totalPages: pdfDoc.numPages
                        }));
                        
                        // Render all pages
                        for (let i = 1; i <= pdfDoc.numPages; i++) {
                            await renderPage(i);
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
                    
                    // Calculate scale to fit width
                    const containerWidth = window.innerWidth - 40;
                    const viewport = page.getViewport({ scale: 1 });
                    const scale = containerWidth / viewport.width;
                    const scaledViewport = page.getViewport({ scale: scale * 1.5 });
                    
                    // Create wrapper and canvas
                    const wrapper = document.createElement('div');
                    wrapper.className = 'page-wrapper';
                    wrapper.id = 'page-' + num;
                    
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = scaledViewport.width;
                    canvas.height = scaledViewport.height;
                    
                    wrapper.appendChild(canvas);
                    container.appendChild(wrapper);
                    
                    await page.render({
                        canvasContext: ctx,
                        viewport: scaledViewport
                    }).promise;
                }
                
                // Track scroll for page updates
                let lastReportedPage = 1;
                document.addEventListener('scroll', function() {
                    if (!pdfDoc) return;
                    
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
                });
                
                document.addEventListener('message', function(e) {
                    const data = JSON.parse(e.data);
                    if (data.type === 'loadPDF') {
                        loadPDF(data.base64);
                    }
                });
                
                window.addEventListener('message', function(e) {
                    const data = JSON.parse(e.data);
                    if (data.type === 'loadPDF') {
                        loadPDF(data.base64);
                    }
                });
            </script>
        </body>
        </html>
    `;

    const webViewRef = React.useRef<WebView>(null);

    /**
     * Load PDF on mount
     */
    React.useEffect(() => {
        const loadPDF = async () => {
            try {
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
    }, [pdfUri]);

    /**
     * Handle WebView messages
     */
    const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'loaded') {
                setTotalPages(data.totalPages);
                setIsLoading(false);
            } else if (data.type === 'pageChanged') {
                setCurrentPage(data.page);
                if (docId > 0) {
                    updateLastReadPage(docId, data.page).catch(console.error);
                }
            } else if (data.type === 'error') {
                setError(data.message);
                setIsLoading(false);
            }
        } catch (err) {
            console.error('WebView message error:', err);
        }
    }, [docId]);

    /**
     * Navigate to specific page
     */
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            webViewRef.current?.postMessage(JSON.stringify({
                type: 'setPage',
                page
            }));
        }
    }, [totalPages]);

    /**
     * Toggle RSVP mode
     */
    const toggleRSVP = useCallback(() => {
        setShowRSVP(prev => !prev);
    }, []);

    /**
     * Go back to library
     */
    const goBack = useCallback(() => {
        router.back();
    }, [router]);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar style="light" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={goBack}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>

                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {docName}
                    </Text>
                    <Text style={styles.headerSubtitle}>
                        {currentPage} / {totalPages}
                    </Text>
                </View>

                <TouchableOpacity style={styles.rsvpButton} onPress={toggleRSVP}>
                    <Ionicons name="flash" size={20} color="#000" />
                    <Text style={styles.rsvpButtonText}>RSVP</Text>
                </TouchableOpacity>
            </View>

            {/* PDF Viewer */}
            <View style={styles.pdfContainer}>
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#fff" />
                        <Text style={styles.loadingText}>Loading PDF...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={48} color="#ff4444" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={goBack}>
                            <Text style={styles.retryButtonText}>Go Back</Text>
                        </TouchableOpacity>
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
                    />
                )}
            </View>

            {/* RSVP Overlay */}
            <RSVPOverlay
                visible={showRSVP}
                docId={docId}
                pdfUri={pdfUri}
                onClose={() => setShowRSVP(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        fontFamily: 'Inter_500Medium',
        fontSize: 16,
        color: '#fff',
    },
    headerSubtitle: {
        fontFamily: 'Inter_400Regular',
        fontSize: 12,
        color: '#888',
        marginTop: 2,
    },
    rsvpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ff4444',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 4,
    },
    rsvpButtonText: {
        fontFamily: 'Inter_600SemiBold',
        fontSize: 12,
        color: '#000',
    },
    pdfContainer: {
        flex: 1,
        backgroundColor: '#111',
    },
    webview: {
        flex: 1,
        backgroundColor: '#111',
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
        color: '#888',
        marginTop: 12,
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
        marginTop: 16,
        marginBottom: 24,
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
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#111',
        borderTopWidth: 1,
        borderTopColor: '#222',
    },
    navButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#222',
        justifyContent: 'center',
        alignItems: 'center',
    },
    navButtonDisabled: {
        backgroundColor: '#111',
    },
    pageIndicator: {
        flex: 1,
        alignItems: 'center',
    },
    pageText: {
        fontFamily: 'Inter_500Medium',
        fontSize: 14,
        color: '#888',
    },
});
