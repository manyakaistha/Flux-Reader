import { File, Paths } from 'expo-file-system';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

import { updateThumbnailUri } from '@/src/database/db';
import { EPUB_THUMBNAIL_GENERATOR_HTML, generateThumbnailFilename, THUMBNAIL_GENERATOR_HTML } from '@/src/utils/thumbnailGenerator';

interface ThumbnailGeneratorProps {
    docId: number;
    pdfUri: string;
    fileType: 'pdf' | 'epub';
    onComplete: (thumbnailUri: string | null) => void;
    onError?: (error: string) => void;
}

/**
 * Hidden WebView component that generates a thumbnail from the first page of a PDF.
 * Renders off-screen and processes one PDF at a time.
 */
export function ThumbnailGenerator({
    docId,
    pdfUri,
    fileType,
    onComplete,
    onError,
}: ThumbnailGeneratorProps) {
    const webViewRef = useRef<WebView>(null);
    const [isReady, setIsReady] = useState(false);
    const [pdfBase64, setPdfBase64] = useState<string | null>(null);

    // Load PDF as base64 when component mounts
    useEffect(() => {
        const loadPdf = async () => {
            try {
                const file = new File(pdfUri);
                if (!file.exists) {
                    onError?.('PDF file not found');
                    onComplete(null);
                    return;
                }

                const base64 = await file.base64();
                setPdfBase64(base64);
            } catch (error) {
                console.error('[ThumbnailGenerator] Error loading PDF:', error);
                onError?.(`Error loading PDF: ${error}`);
                onComplete(null);
            }
        };

        loadPdf();
    }, [pdfUri]);

    // Send message to WebView when both ready and have base64 data
    useEffect(() => {
        if (isReady && pdfBase64 && webViewRef.current) {
            webViewRef.current.postMessage(
                JSON.stringify({
                    type: 'generate',
                    pdfBase64: fileType === 'pdf' ? pdfBase64 : undefined,
                    epubBase64: fileType === 'epub' ? pdfBase64 : undefined,
                    targetWidth: 300, // Slightly larger for better quality
                })
            );
        }
    }, [isReady, pdfBase64]);

    const handleMessage = useCallback(async (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === 'debug') {
                console.log('[ThumbnailGenerator]', data.message);
            } else if (data.type === 'complete') {
                // Save base64 image to file
                const filename = generateThumbnailFilename(docId);
                const thumbnailFile = new File(Paths.document, filename);

                await thumbnailFile.create();
                await thumbnailFile.write(data.base64Image, { encoding: 'base64' });

                const thumbnailUri = thumbnailFile.uri;

                // Update database
                await updateThumbnailUri(docId, thumbnailUri);

                console.log('[ThumbnailGenerator] Thumbnail saved:', thumbnailUri);
                onComplete(thumbnailUri);
            } else if (data.type === 'error') {
                console.error('[ThumbnailGenerator] Error:', data.message);
                onError?.(data.message);
                onComplete(null);
            }
        } catch (error) {
            console.error('[ThumbnailGenerator] Parse error:', error);
            onError?.(`Parse error: ${error}`);
            onComplete(null);
        }
    }, [docId, onComplete, onError]);

    const handleLoad = useCallback(() => {
        setIsReady(true);
    }, []);

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: fileType === 'epub' ? EPUB_THUMBNAIL_GENERATOR_HTML : THUMBNAIL_GENERATOR_HTML }}
                style={styles.webview}
                onLoad={handleLoad}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 1,
        height: 1,
        opacity: 0,
        overflow: 'hidden',
    },
    webview: {
        width: 1,
        height: 1,
    },
});
