import { ReaderFooter, ReaderTopBar } from '@/src/components/reader';
import { updateLastOpenedAt, updateLastReadPage } from '@/src/database/db';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Pdf from 'react-native-pdf';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const AUTO_HIDE_DELAY = 3000;
const PROGRESS_SAVE_DEBOUNCE = 2000;

export default function ReaderScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{
        uri: string;
        name: string;
        id: string;
        lastReadPage: string;
    }>();

    const { uri, name, id, lastReadPage: lastReadPageParam } = params;
    const docId = parseInt(id || '0', 10);
    const initialPage = parseInt(lastReadPageParam || '1', 10);

    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(0);
    const [chromeVisible, setChromeVisible] = useState(true);
    const [showRSVP, setShowRSVP] = useState(false);

    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pdfRef = useRef<any>(null);

    // Auto-hide chrome after delay
    const resetHideTimer = useCallback(() => {
        if (hideTimer.current) {
            clearTimeout(hideTimer.current);
        }
        hideTimer.current = setTimeout(() => {
            setChromeVisible(false);
        }, AUTO_HIDE_DELAY);
    }, []);

    // Toggle chrome on tap
    const toggleChrome = useCallback(() => {
        setChromeVisible((prev) => {
            if (!prev) {
                resetHideTimer();
            }
            return !prev;
        });
    }, [resetHideTimer]);

    // Show chrome and reset timer
    const showChrome = useCallback(() => {
        setChromeVisible(true);
        resetHideTimer();
    }, [resetHideTimer]);

    // Save progress (debounced)
    const saveProgress = useCallback((page: number) => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }
        saveTimer.current = setTimeout(async () => {
            try {
                await updateLastReadPage(docId, page);
            } catch (error) {
                console.error('Error saving progress:', error);
            }
        }, PROGRESS_SAVE_DEBOUNCE);
    }, [docId]);

    // Handle page change
    const handlePageChanged = useCallback((page: number) => {
        setCurrentPage(page);
        saveProgress(page);
    }, [saveProgress]);

    // Handle back navigation
    const handleBack = useCallback(async () => {
        // Save progress immediately on exit
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }
        try {
            await updateLastReadPage(docId, currentPage);
        } catch (error) {
            console.error('Error saving final progress:', error);
        }
        router.back();
    }, [docId, currentPage, router]);

    // Handle RSVP button tap
    const handleRSVPPress = useCallback(() => {
        setChromeVisible(false);
        setShowRSVP(true);
        // TODO: Open RSVP overlay in paused state
        console.log('RSVP tap - open paused');
    }, []);

    // Handle RSVP button long-press
    const handleRSVPLongPress = useCallback(() => {
        setChromeVisible(false);
        setShowRSVP(true);
        // TODO: Open RSVP overlay and start playback immediately
        console.log('RSVP long-press - start playback');
    }, []);

    // Update lastOpenedAt on mount
    useEffect(() => {
        updateLastOpenedAt(docId).catch(console.error);
        return () => {
            if (hideTimer.current) clearTimeout(hideTimer.current);
            if (saveTimer.current) clearTimeout(saveTimer.current);
        };
    }, [docId]);

    // Initial auto-hide timer
    useEffect(() => {
        resetHideTimer();
    }, [resetHideTimer]);

    const source = { uri: uri, cache: true };

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <StatusBar style="light" hidden={!chromeVisible} />

                {/* PDF Content */}
                <TouchableWithoutFeedback onPress={toggleChrome}>
                    <View style={styles.pdfContainer}>
                        <Pdf
                            ref={pdfRef}
                            source={source}
                            page={initialPage}
                            horizontal={false}
                            enablePaging={false}
                            onLoadComplete={(numberOfPages) => {
                                setTotalPages(numberOfPages);
                            }}
                            onPageChanged={handlePageChanged}
                            onError={(error) => {
                                console.error('PDF Error:', error);
                            }}
                            style={styles.pdf}
                            trustAllCerts={false}
                            enableAnnotationRendering={false}
                            fitPolicy={0} // Fit width
                            minScale={1.0}
                            maxScale={3.0}
                            spacing={24}
                        />
                    </View>
                </TouchableWithoutFeedback>

                {/* Top Bar */}
                <ReaderTopBar
                    title={name || 'Document'}
                    visible={chromeVisible}
                    onBack={handleBack}
                    onRSVPPress={handleRSVPPress}
                    onRSVPLongPress={handleRSVPLongPress}
                />

                {/* Footer */}
                <ReaderFooter
                    currentPage={currentPage}
                    totalPages={totalPages}
                    visible={chromeVisible}
                />
            </View>
        </SafeAreaProvider>
    );
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a14',
    },
    pdfContainer: {
        flex: 1,
    },
    pdf: {
        flex: 1,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#0a0a14',
    },
});
