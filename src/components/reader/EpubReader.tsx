import * as FileSystem from 'expo-file-system/legacy';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface EpubReaderProps {
    uri: string;
    onPageChanged: (page: number, totalPages: number) => void;
    onLoadComplete: (totalPages: number) => void;
    onPress: () => void;
    initialPage?: number;
}

const EPUB_READER_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.5/jszip.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      background: #0a0a14; 
      color: #e0e0e0; 
      height: 100vh; 
      width: 100vw; 
      overflow: hidden;
    }
    #viewer {
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <div id="viewer"></div>
  <script>
    let book = null;
    let rendition = null;
    let locations = null;

    document.addEventListener('message', handleMessage);
    window.addEventListener('message', handleMessage);

    function handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'open') {
                openBook(data.base64, data.cnf);
            } else if (data.type === 'next') {
                rendition?.next();
            } else if (data.type === 'prev') {
                rendition?.prev();
            } else if (data.type === 'go') {
                // If numeric, it's a percentage location roughly equivalent to page
                // But epub.js uses distinct CFIs. For now, we assume strict chapter/spine based progression 
                // isn't perfect for mapping "page 5" to a location unless we have generated locations.
                
                // For this implementation, we will try to jump to a cfi if provided, or percentage.
                if (data.target) rendition?.display(data.target);
            }
        } catch (e) {
            log('Error handling message: ' + e.message);
        }
    }

    function log(msg) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'debug', message: msg }));
    }

    async function openBook(base64Data, config) {
        try {
            log('Initializing EPUB...');
            book = ePub(base64Data, { encoding: 'base64' });
            
            rendition = book.renderTo("viewer", {
                width: "100%",
                height: "100%",
                flow: "paginated",
                manager: "default",
                // Theme settings can go here
                stylesheet: config?.css
            });

            // Apply default theme for dark mode
            rendition.themes.register("dark", {
                body: { color: "#e0e0e0", background: "#0a0a14" },
                p: { "font-family": "Helvetica, sans-serif", "font-size": "18px", "line-height": "1.6" }
            });
            rendition.themes.select("dark");

            await rendition.display(config?.initialLocation);
            log('Rendered initial page');

            // Generate locations for page mapping
            await book.ready;
            
            // Notify ready
            // We use spine length as a proxy for "total pages" initially until locations are generated
            // properly generating locations takes time, so we might do it in background
            const spineCount = book.spine.length; 
            
            // Let's generate locations (chars per page approx 1000?)
            // This is slow for large books. We'll do a quick check.
            
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'load_complete',
                totalPages: spineCount // Only a rough proxy, actually chapters
            }));

            // Events
            rendition.on("relocated", function(location) {
                // Determine "current page"
                // For simplicity, we'll map current spine index to page number if locations aren't ready
                // or use formatted cfi.
                
                const cfi = location.start.cfi;
                // const percentage = location.start.percentage; 
                
                // Find spine index
                const spineItem = book.spine.get(cfi);
                const index = book.spine.spineItems.indexOf(spineItem);
                
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'relocated',
                    location: cfi,
                    page: index + 1, // 1-based index of chapter/section
                    percentage: location.start.percentage
                }));
            });
            
            rendition.on("selected", function(cfiRange, contents) {
                rendition.annotations.add("highlight", cfiRange, {}, (e) => {}, "hl");
                contents.window.getSelection().removeAllRanges();
            });
            
            // Tap listener
            rendition.on("click", () => {
                 window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'press' }));
            });

        } catch (e) {
            log('Render error: ' + e.message);
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.message }));
        }
    }
  </script>
</body>
</html>
`;

export function EpubReader({ uri, onPageChanged, onLoadComplete, onPress, initialPage = 1 }: EpubReaderProps) {
    const webViewRef = useRef<WebView>(null);
    const [loading, setLoading] = useState(true);

    const loadBook = useCallback(async () => {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

            // Find initial location? 
            // For now, we don't have a map of Page Number -> CFI. 
            // We will just start at the beginning or let epub.js handle it.
            // If `initialPage` corresponds to a spine item index, we can use it.

            webViewRef.current?.postMessage(JSON.stringify({
                type: 'open',
                base64,
                cnf: {
                    initialLocation: undefined // TODO: Map initialPage to CFI if possible
                }
            }));
        } catch (error) {
            console.error('Failed to load EPUB:', error);
        }
    }, [uri, initialPage]);

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            switch (data.type) {
                case 'debug':
                    console.log('[EpubReader]', data.message);
                    break;
                case 'load_complete':
                    setLoading(false);
                    onLoadComplete(data.totalPages);
                    break;
                case 'relocated':
                    // We treat spine items as "pages" for now which is imperfect but works for chapter nav
                    onPageChanged(data.page, data.percentage);
                    break;
                case 'press':
                    onPress();
                    break;
                case 'error':
                    console.error('[EpubReader Error]', data.message);
                    break;
            }
        } catch (e) {
            console.error('Parse error:', e);
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html: EPUB_READER_HTML }}
                onMessage={handleMessage}
                onLoadEnd={loadBook}
                style={styles.webview}
                scrollEnabled={false}
            />
            {loading && (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#4ECDC4" />
                </View>
            )}

            {/* Overlay for tap detection if WebView doesn't propagate correctly
                Usually needed for pure PDF, but HTML/EPUB might handle clicks fine.
                We relying on rendition.on('click') inside the WebView.
             */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a14',
    },
});
